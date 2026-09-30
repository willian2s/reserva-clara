import { InvalidDomainInputError, InvalidDomainValueError, InvalidDecimalError, InvalidDateError } from "./errors";
import type { Asset, AssetType } from "./asset";
import type { CurrencyCode, DocumentId, PositiveDecimalString } from "./value-objects";
import {
  parseCurrencyCode,
  parseDocumentId,
  parsePositiveDecimalString,
} from "./value-objects";

export const QUOTE_PROVIDER = "brapi" as const;
export const BRAPI_QUOTES_ENDPOINT = "https://brapi.dev/api/v2/stocks/quote" as const;
export const BRAPI_MAPPING_VERSION = "v1" as const;

export const QUOTE_ERROR_CODES = [
  "UNAUTHENTICATED",
  "INVALID_REQUEST",
  "BATCH_LIMIT",
  "UNSUPPORTED_ASSET",
  "CURRENCY_MISMATCH",
  "NOT_FOUND",
  "TIMEOUT",
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "INVALID_PROVIDER_RESPONSE",
  "NOT_CONFIGURED",
] as const;

export type QuoteErrorCode = (typeof QUOTE_ERROR_CODES)[number];

export const QUOTE_FRESHNESS = ["fresh", "stale"] as const;
export type QuoteFreshness = (typeof QUOTE_FRESHNESS)[number];
export type Freshness = QuoteFreshness;

export const QUOTE_CACHE_POLICY = Object.freeze({
  freshTtlMs: 60_000,
  staleIfErrorMs: 300_000,
  upstreamTimeoutMs: 3_000,
  maxRetries: 1,
  retryBackoffMinMs: 100,
  retryBackoffMaxMs: 250,
  maxBatchSize: 20,
  maxConcurrentUpstreamRequests: 1,
  maxCacheEntries: 500,
} as const);

export const QUOTE_FRESH_TTL_MS = QUOTE_CACHE_POLICY.freshTtlMs;
export const QUOTE_STALE_IF_ERROR_MS = QUOTE_CACHE_POLICY.staleIfErrorMs;
export const QUOTE_UPSTREAM_TIMEOUT_MS = QUOTE_CACHE_POLICY.upstreamTimeoutMs;
export const QUOTE_MAX_RETRIES = QUOTE_CACHE_POLICY.maxRetries;
export const QUOTE_RETRY_BACKOFF_MIN_MS = QUOTE_CACHE_POLICY.retryBackoffMinMs;
export const QUOTE_RETRY_BACKOFF_MAX_MS = QUOTE_CACHE_POLICY.retryBackoffMaxMs;
export const QUOTE_MAX_BATCH_SIZE = QUOTE_CACHE_POLICY.maxBatchSize;
export const QUOTE_MAX_CONCURRENT_UPSTREAM_REQUESTS =
  QUOTE_CACHE_POLICY.maxConcurrentUpstreamRequests;
export const QUOTE_MAX_CACHE_ENTRIES = QUOTE_CACHE_POLICY.maxCacheEntries;

export type QuotePrice = Readonly<{
  currency: CurrencyCode;
  decimal: PositiveDecimalString;
}>;

export type Quote = Readonly<{
  assetId: DocumentId;
  provider: typeof QUOTE_PROVIDER;
  requestedSymbol: string;
  providerSymbol: string;
  symbolChanged: boolean;
  price: QuotePrice;
  quotedAt: string;
  fetchedAt: string;
  freshness: QuoteFreshness;
}>;

export type AvailableQuoteResult = Readonly<{
  assetId: DocumentId;
  status: "available";
  quote: Quote;
}>;

export type UnavailableQuoteResult = Readonly<{
  assetId: DocumentId;
  status: "unavailable";
  code: QuoteErrorCode;
}>;

export type QuoteResult = AvailableQuoteResult | UnavailableQuoteResult;

export type BrapiAssetMapping = Readonly<{
  provider: typeof QUOTE_PROVIDER;
  endpoint: typeof BRAPI_QUOTES_ENDPOINT;
  symbol: string;
}>;

export type QuoteAsset = Pick<Asset, "symbol" | "market" | "assetType" | "currency">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  field: string,
): void {
  const actualKeys = Object.keys(value).sort();
  const allowedKeys = [...expectedKeys].sort();

  if (
    actualKeys.length !== allowedKeys.length ||
    actualKeys.some((key, index) => key !== allowedKeys[index])
  ) {
    throw new InvalidDomainInputError(
      field,
      `expected fields ${allowedKeys.join(", ")}`,
    );
  }
}

function parseQuoteSymbol(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    !/^[A-Z0-9._-]+$/.test(value)
  ) {
    throw new InvalidDomainValueError(
      field,
      "must be a non-empty normalized market symbol",
    );
  }

  return value;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Validates the UTC ISO-8601 representation used at the Quote boundary. */
export function parseQuoteTimestamp(value: unknown, field = "timestamp"): string {
  if (typeof value !== "string") {
    throw new InvalidDateError(field, "must be an ISO-8601 UTC timestamp");
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/.exec(value);
  if (!match) {
    throw new InvalidDateError(field, "must be an ISO-8601 UTC timestamp");
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    year === 0 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new InvalidDateError(field, "must be a real UTC instant");
  }

  return value;
}

export const parseIsoTimestamp = parseQuoteTimestamp;

/** Converts provider ingress to the decimal string used by Quote. */
export function parseQuotePrice(value: unknown): PositiveDecimalString {
  let decimalInput: unknown = value;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      throw new InvalidDecimalError("price.decimal", "must be finite and greater than zero");
    }

    decimalInput = String(value);
  }

  try {
    return parsePositiveDecimalString(decimalInput);
  } catch {
    throw new InvalidDecimalError(
      "price.decimal",
      "must be a positive decimal without exponent",
    );
  }
}

export const parseProviderPrice = parseQuotePrice;

export function parseQuoteFreshness(value: unknown): QuoteFreshness {
  if (value !== "fresh" && value !== "stale") {
    throw new InvalidDomainValueError("freshness", "must be fresh or stale");
  }

  return value;
}

export function mapAssetToBrapi(asset: QuoteAsset): BrapiAssetMapping | null {
  if (
    asset.market !== "B3" ||
    asset.currency !== "BRL" ||
    !(["stock", "etf", "fii"] as readonly AssetType[]).includes(asset.assetType)
  ) {
    return null;
  }

  return {
    provider: QUOTE_PROVIDER,
    endpoint: BRAPI_QUOTES_ENDPOINT,
    symbol: asset.symbol,
  };
}

export function createQuoteCacheKey(mapping: BrapiAssetMapping): string {
  return `${BRAPI_MAPPING_VERSION}:${mapping.provider}:${mapping.endpoint}:${mapping.symbol}`;
}

export function parseQuote(value: unknown): Quote {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("quote", "must be an object");
  }

  assertExactKeys(
    value,
    [
      "assetId",
      "provider",
      "requestedSymbol",
      "providerSymbol",
      "symbolChanged",
      "price",
      "quotedAt",
      "fetchedAt",
      "freshness",
    ],
    "quote",
  );

  if (value.provider !== QUOTE_PROVIDER) {
    throw new InvalidDomainValueError("provider", "must be brapi");
  }

  if (typeof value.symbolChanged !== "boolean") {
    throw new InvalidDomainValueError("symbolChanged", "must be a boolean");
  }

  if (!isRecord(value.price)) {
    throw new InvalidDomainInputError("price", "must be an object");
  }

  assertExactKeys(value.price, ["currency", "decimal"], "price");

  return {
    assetId: parseDocumentId(value.assetId),
    provider: QUOTE_PROVIDER,
    requestedSymbol: parseQuoteSymbol(value.requestedSymbol, "requestedSymbol"),
    providerSymbol: parseQuoteSymbol(value.providerSymbol, "providerSymbol"),
    symbolChanged: value.symbolChanged,
    price: {
      currency: parseCurrencyCode(value.price.currency),
      decimal: parseQuotePrice(value.price.decimal),
    },
    quotedAt: parseQuoteTimestamp(value.quotedAt, "quotedAt"),
    fetchedAt: parseQuoteTimestamp(value.fetchedAt, "fetchedAt"),
    freshness: parseQuoteFreshness(value.freshness),
  };
}

export function parseQuoteResult(value: unknown): QuoteResult {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("quoteResult", "must be an object");
  }

  if (value.status === "available") {
    assertExactKeys(value, ["assetId", "status", "quote"], "quoteResult");
    const assetId = parseDocumentId(value.assetId);
    const quote = parseQuote(value.quote);

    if (quote.assetId !== assetId) {
      throw new InvalidDomainValueError(
        "quote.assetId",
        "must match quoteResult.assetId",
      );
    }

    return {
      assetId,
      status: "available",
      quote,
    };
  }

  if (value.status === "unavailable") {
    assertExactKeys(value, ["assetId", "status", "code"], "quoteResult");
    if (!QUOTE_ERROR_CODES.includes(value.code as QuoteErrorCode)) {
      throw new InvalidDomainValueError("code", "must be a sanitized quote error code");
    }

    return {
      assetId: parseDocumentId(value.assetId),
      status: "unavailable",
      code: value.code as QuoteErrorCode,
    };
  }

  throw new InvalidDomainValueError(
    "status",
    "must be available or unavailable",
  );
}
