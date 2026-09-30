import type { Asset } from "@/domain/asset";
import type { QuoteResult } from "@/domain/quote";

export type QuoteService = Readonly<{
  getQuotes(assets: readonly Asset[]): Promise<readonly QuoteResult[]>;
}>;

/** Temporary composition seam completed by the QuoteService subtask. */
export function createNotConfiguredQuoteService(): QuoteService {
  return {
    async getQuotes(assets) {
      return assets.map((asset) => ({
        assetId: asset.id,
        status: "unavailable" as const,
        code: "NOT_CONFIGURED" as const,
      }));
    },
  };
}
