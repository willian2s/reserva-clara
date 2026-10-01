import type { Asset } from "../../domain/asset";
import {
  BRAPI_QUOTES_ENDPOINT,
  parseQuote,
  parseQuotePrice,
  parseQuoteTimestamp,
  type Quote,
} from "../../domain/quote";
import { QUOTE_UPSTREAM_TIMEOUT_MS } from "../../domain/quote";
import { mapAssetToBrapi } from "./brapi-mapping";
import { BrapiAdapterError } from "./errors";

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type BrapiAdapterOptions = Readonly<{
  apiKey?: string;
  fetch?: FetchImplementation;
  now?: () => Date;
  /** Test-only override; production defaults to the contract's 3 seconds. */
  timeoutMs?: number;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNormalizedSymbol(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    /^[A-Z0-9._-]+$/.test(value)
  );
}

function providerFailure(code: BrapiAdapterError["code"]): BrapiAdapterError {
  return new BrapiAdapterError(code);
}

function classifyHttpStatus(status: number): BrapiAdapterError {
  if (status === 404) {
    return providerFailure("NOT_FOUND");
  }

  if (status === 429) {
    return new BrapiAdapterError("RATE_LIMITED", true);
  }

  if (status >= 500 && status <= 599) {
    return new BrapiAdapterError("PROVIDER_UNAVAILABLE", true);
  }

  return providerFailure("INVALID_PROVIDER_RESPONSE");
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === "AbortError";
}

function isJsonSyntaxError(error: unknown): boolean {
  return error instanceof SyntaxError || (isRecord(error) && error.name === "SyntaxError");
}

function parseProviderResponse(
  value: unknown,
  asset: Asset,
  requestedSymbol: string,
  fetchedAt: string,
): Quote {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    throw providerFailure("INVALID_PROVIDER_RESPONSE");
  }

  if (value.results.length === 0) {
    throw providerFailure("INVALID_PROVIDER_RESPONSE");
  }

  const result = value.results.find(
    (candidate) =>
      isRecord(candidate) && candidate.requestedSymbol === requestedSymbol,
  );

  if (!isRecord(result)) {
    throw providerFailure("INVALID_PROVIDER_RESPONSE");
  }

  if (
    !isNormalizedSymbol(result.requestedSymbol) ||
    !isNormalizedSymbol(result.symbol) ||
    typeof result.changed !== "boolean" ||
    !isRecord(result.data)
  ) {
    throw providerFailure("INVALID_PROVIDER_RESPONSE");
  }

  const data = result.data;
  if (
    typeof data.currency !== "string" ||
    data.currency !== asset.currency ||
    typeof data.regularMarketPrice !== "number"
  ) {
    if (typeof data.currency === "string" && data.currency !== asset.currency) {
      throw providerFailure("CURRENCY_MISMATCH");
    }

    throw providerFailure("INVALID_PROVIDER_RESPONSE");
  }

  let decimal: ReturnType<typeof parseQuotePrice>;
  let quotedAt: string;
  try {
    decimal = parseQuotePrice(data.regularMarketPrice);
    quotedAt = parseQuoteTimestamp(data.regularMarketTime, "quotedAt");
  } catch {
    throw providerFailure("INVALID_PROVIDER_RESPONSE");
  }

  try {
    return parseQuote({
      assetId: asset.id,
      provider: "brapi",
      requestedSymbol,
      providerSymbol: result.symbol,
      symbolChanged: result.changed,
      price: { currency: asset.currency, decimal },
      quotedAt,
      fetchedAt,
      freshness: "fresh",
    });
  } catch {
    throw providerFailure("INVALID_PROVIDER_RESPONSE");
  }
}

export class BrapiAdapter {
  private readonly apiKey: string | undefined;
  private readonly fetchImplementation: FetchImplementation;
  private readonly now: () => Date;
  private readonly timeoutMs: number;

  constructor(options: BrapiAdapterOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.BRAPI_API_KEY;
    this.fetchImplementation = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.now = options.now ?? (() => new Date());
    this.timeoutMs = options.timeoutMs ?? QUOTE_UPSTREAM_TIMEOUT_MS;
  }

  async getQuote(asset: Asset): Promise<Quote> {
    const mapping = mapAssetToBrapi(asset);
    if (!mapping) {
      throw providerFailure("UNSUPPORTED_ASSET");
    }

    if (!this.apiKey) {
      throw providerFailure("NOT_CONFIGURED");
    }

    const url = new URL(BRAPI_QUOTES_ENDPOINT);
    url.searchParams.set("symbols", mapping.symbol);
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImplementation(url.toString(), {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal,
      });

      if (timedOut) {
        throw new BrapiAdapterError("TIMEOUT", true);
      }

      if (!response.ok) {
        throw classifyHttpStatus(response.status);
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error) {
        if (timedOut || isAbortError(error)) {
          throw new BrapiAdapterError("TIMEOUT", true);
        }

        if (isJsonSyntaxError(error)) {
          throw providerFailure("INVALID_PROVIDER_RESPONSE");
        }

        throw new BrapiAdapterError("PROVIDER_UNAVAILABLE", true);
      }

      if (timedOut) {
        throw new BrapiAdapterError("TIMEOUT", true);
      }

      let fetchedAt: string;
      try {
        fetchedAt = parseQuoteTimestamp(this.now().toISOString(), "fetchedAt");
      } catch {
        throw providerFailure("INVALID_PROVIDER_RESPONSE");
      }

      return parseProviderResponse(payload, asset, mapping.symbol, fetchedAt);
    } catch (error) {
      if (error instanceof BrapiAdapterError) {
        throw error;
      }

      if (timedOut || isAbortError(error)) {
        throw new BrapiAdapterError("TIMEOUT", true);
      }

      throw new BrapiAdapterError("PROVIDER_UNAVAILABLE", true);
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchQuote(asset: Asset): Promise<Quote> {
    return this.getQuote(asset);
  }
}

export { parseProviderResponse as parseBrapiResponse };
