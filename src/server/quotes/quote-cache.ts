import { QUOTE_MAX_CACHE_ENTRIES, type Quote } from "../../domain/quote";

/**
 * Provider data kept by the process-local cache. Asset identity is deliberately
 * excluded because the cache key is shared by all owners requesting a symbol.
 */
export type CachedQuote = Omit<Quote, "assetId" | "freshness">;

export type QuoteCacheEntry = Readonly<{
  value: CachedQuote;
  /** ISO fetch time metadata, not a financial value. */
  fetchedAt: string;
}>;

export class QuoteCache {
  private readonly entries = new Map<string, QuoteCacheEntry>();
  private readonly inFlight = new Map<string, Promise<QuoteCacheEntry>>();

  constructor(private readonly maxEntries = QUOTE_MAX_CACHE_ENTRIES) {}

  get size(): number {
    return this.entries.size;
  }

  get(key: string): QuoteCacheEntry | undefined {
    return this.entries.get(key);
  }

  set(key: string, entry: QuoteCacheEntry): void {
    if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }

    this.entries.set(key, entry);
  }

  getInFlight(key: string): Promise<QuoteCacheEntry> | undefined {
    return this.inFlight.get(key);
  }

  setInFlight(key: string, promise: Promise<QuoteCacheEntry>): void {
    this.inFlight.set(key, promise);
  }

  deleteInFlight(key: string, promise: Promise<QuoteCacheEntry>): void {
    if (this.inFlight.get(key) === promise) {
      this.inFlight.delete(key);
    }
  }
}
