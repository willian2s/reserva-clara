import type { Asset } from "../../domain/asset";
import {
  createQuoteCacheKey,
  mapAssetToBrapi,
  parseQuote,
  QUOTE_ERROR_CODES,
  QUOTE_FRESH_TTL_MS,
  QUOTE_MAX_BATCH_SIZE,
  QUOTE_MAX_CACHE_ENTRIES,
  QUOTE_MAX_RETRIES,
  QUOTE_RETRY_BACKOFF_MIN_MS,
  QUOTE_STALE_IF_ERROR_MS,
  type Quote,
  type QuoteErrorCode,
  type QuoteResult,
} from "../../domain/quote";
import { BrapiAdapter, type BrapiAdapterOptions } from "./brapi-adapter";
import { BrapiAdapterError, isBrapiAdapterError } from "./errors";
import { QuoteCache, type CachedQuote, type QuoteCacheEntry } from "./quote-cache";

type QuoteAdapter = Pick<BrapiAdapter, "getQuote">;
type Clock = () => Date;
type Sleeper = (milliseconds: number) => Promise<void>;

export type QuoteServiceOptions = Readonly<{
  adapter?: QuoteAdapter;
  cache?: QuoteCache;
  clock?: Clock;
  sleeper?: Sleeper;
  /** Adapter options are only used when the concrete BRAPI adapter is created. */
  adapterOptions?: Omit<BrapiAdapterOptions, "now">;
}>;

export type QuoteService = Readonly<{
  getQuote(asset: Asset): Promise<QuoteResult>;
  getQuotes(assets: readonly Asset[]): Promise<readonly QuoteResult[]>;
}>;

const TRANSIENT_CODES = new Set<QuoteErrorCode>([
  "TIMEOUT",
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
]);

let upstreamQueue = Promise.resolve();
const processCache = new QuoteCache(QUOTE_MAX_CACHE_ENTRIES);

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Serializes provider attempts across QuoteService instances in this process. */
async function withUpstreamSlot<T>(operation: () => Promise<T>): Promise<T> {
  const previous = upstreamQueue;
  let release!: () => void;
  upstreamQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

function dateMilliseconds(clock: Clock): number {
  const milliseconds = clock().getTime();
  if (!Number.isFinite(milliseconds)) {
    throw new Error("Invalid quote service clock");
  }

  return milliseconds;
}

function cacheAge(now: number, entry: QuoteCacheEntry): number {
  const fetchedAt = Date.parse(entry.fetchedAt);
  return Number.isFinite(fetchedAt)
    ? now - fetchedAt
    : Number.POSITIVE_INFINITY;
}

function materializeQuote(
  asset: Asset,
  cached: CachedQuote,
  freshness: "fresh" | "stale",
): Quote {
  return parseQuote({
    ...cached,
    assetId: asset.id,
    freshness,
  });
}

function toCachedQuote(asset: Asset, expectedSymbol: string, value: Quote): CachedQuote {
  let parsed: Quote;
  try {
    parsed = parseQuote(value);
  } catch {
    throw new BrapiAdapterError("INVALID_PROVIDER_RESPONSE");
  }

  if (parsed.requestedSymbol !== expectedSymbol) {
    throw new BrapiAdapterError("INVALID_PROVIDER_RESPONSE");
  }

  if (parsed.price.currency !== asset.currency) {
    throw new BrapiAdapterError("CURRENCY_MISMATCH");
  }

  return {
    provider: parsed.provider,
    requestedSymbol: parsed.requestedSymbol,
    providerSymbol: parsed.providerSymbol,
    symbolChanged: parsed.symbolChanged,
    price: parsed.price,
    quotedAt: parsed.quotedAt,
    fetchedAt: parsed.fetchedAt,
  };
}

function isRetryableFailure(error: unknown): boolean {
  if (isBrapiAdapterError(error)) {
    return error.retryable && TRANSIENT_CODES.has(error.code);
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { code?: unknown; retryable?: unknown };
  if (typeof candidate.code === "string") {
    return (
      candidate.retryable === true &&
      TRANSIENT_CODES.has(candidate.code as QuoteErrorCode)
    );
  }

  return false;
}

function sanitizeErrorCode(error: unknown): QuoteErrorCode {
  if (typeof error === "object" && error !== null) {
    const code = (error as { code?: unknown }).code;
    if (
      typeof code === "string" &&
      (QUOTE_ERROR_CODES as readonly string[]).includes(code)
    ) {
      return code as QuoteErrorCode;
    }
  }

  return "PROVIDER_UNAVAILABLE";
}

function unavailable(asset: Asset, code: QuoteErrorCode): QuoteResult {
  return { assetId: asset.id, status: "unavailable", code };
}

function available(asset: Asset, cached: CachedQuote, freshness: "fresh" | "stale"): QuoteResult {
  return {
    assetId: asset.id,
    status: "available",
    quote: materializeQuote(asset, cached, freshness),
  };
}

export function createQuoteService(options: QuoteServiceOptions = {}): QuoteService {
  const clock = options.clock ?? (() => new Date());
  const sleeper = options.sleeper ?? sleep;
  const cache = options.cache ?? processCache;
  const adapter =
    options.adapter ??
    new BrapiAdapter({
      ...options.adapterOptions,
      now: clock,
    });

  async function refresh(
    asset: Asset,
    expectedSymbol: string,
  ): Promise<QuoteCacheEntry> {
    let retries = 0;

    while (true) {
      try {
        const quote = await withUpstreamSlot(() => adapter.getQuote(asset));
        const cached = toCachedQuote(asset, expectedSymbol, quote);
        return {
          value: cached,
          fetchedAt: new Date(dateMilliseconds(clock)).toISOString(),
        };
      } catch (error) {
        if (retries >= QUOTE_MAX_RETRIES || !isRetryableFailure(error)) {
          throw error;
        }

        retries += 1;
        await sleeper(QUOTE_RETRY_BACKOFF_MIN_MS);
      }
    }
  }

  async function fetchOrJoin(
    asset: Asset,
    key: string,
    expectedSymbol: string,
  ): Promise<QuoteCacheEntry> {
    const existing = cache.getInFlight(key);
    if (existing) {
      return existing;
    }

    const refreshPromise = refresh(asset, expectedSymbol).then((entry) => {
      cache.set(key, entry);
      return entry;
    });
    cache.setInFlight(key, refreshPromise);
    refreshPromise.then(
      () => cache.deleteInFlight(key, refreshPromise),
      () => cache.deleteInFlight(key, refreshPromise),
    );
    return refreshPromise;
  }

  async function getOne(asset: Asset): Promise<QuoteResult> {
    const mapping = mapAssetToBrapi(asset);
    if (!mapping) {
      return unavailable(asset, "UNSUPPORTED_ASSET");
    }

    const key = createQuoteCacheKey(mapping);
    const now = dateMilliseconds(clock);
    const cached = cache.get(key);
    if (cached && cacheAge(now, cached) < QUOTE_FRESH_TTL_MS) {
      return available(asset, cached.value, "fresh");
    }

    try {
      const refreshed = await fetchOrJoin(asset, key, mapping.symbol);
      return available(asset, refreshed.value, "fresh");
    } catch (error) {
      const age = cached
        ? cacheAge(dateMilliseconds(clock), cached)
        : Number.POSITIVE_INFINITY;
      if (cached && isRetryableFailure(error) && age <= QUOTE_STALE_IF_ERROR_MS) {
        return available(asset, cached.value, "stale");
      }

      return unavailable(asset, sanitizeErrorCode(error));
    }
  }

  return {
    async getQuote(asset) {
      const [result] = await this.getQuotes([asset]);
      return result;
    },

    async getQuotes(assets) {
      if (assets.length > QUOTE_MAX_BATCH_SIZE) {
        return assets.map((asset) => unavailable(asset, "BATCH_LIMIT"));
      }

      return Promise.all(assets.map((asset) => getOne(asset)));
    },
  };
}

/** Compatibility seam for callers that explicitly need the unconfigured state. */
export function createNotConfiguredQuoteService(): QuoteService {
  return {
    async getQuote(asset) {
      return unavailable(asset, "NOT_CONFIGURED");
    },
    async getQuotes(assets) {
      return assets.map((asset) => unavailable(asset, "NOT_CONFIGURED"));
    },
  };
}
