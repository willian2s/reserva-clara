import type { Asset } from "./asset";
import type { AllocationResult } from "./allocation";
import type { MarketPosition } from "./market-position";
import type { Portfolio } from "./portfolio";
import type { Position } from "./position-engine";
import type { QuoteErrorCode, Quote } from "./quote";
import type { BaseCurrencyCode, CurrencyCode, DecimalString, DocumentId } from "./value-objects";

export type KnownAmountStatus = "empty" | "complete" | "partial";

export type AssetAmountGapReason =
  | "quote-unavailable"
  | "quote-currency-mismatch"
  | "base-currency-mismatch";

export type PortfolioAmountGapReason =
  | "read-failed"
  | "invalid-ledger"
  | "composition-failed"
  | "base-currency-mismatch";

/** Sanitized diagnostic for one excluded Asset amount. */
export type AssetAmountGap = Readonly<{
  scope: "asset";
  portfolioId: DocumentId;
  assetId: DocumentId;
  reason: AssetAmountGapReason;
}>;

/** Sanitized diagnostic for one unavailable Portfolio amount. */
export type PortfolioAmountGap = Readonly<{
  scope: "portfolio";
  portfolioId: DocumentId;
  reason: PortfolioAmountGapReason;
}>;

export type AmountGap = AssetAmountGap | PortfolioAmountGap;

export type KnownAmount = Readonly<{
  currency: CurrencyCode;
  status: KnownAmountStatus;
  /** Exact value included in this amount; excluded value is never imputed. */
  knownAmount: DecimalString;
  unavailable: readonly AmountGap[];
}>;

export type PositionReadItem = Readonly<{
  /** Presentation metadata only; Asset is not merged into MarketPosition. */
  asset: Pick<Asset, "id" | "symbol" | "market" | "assetType" | "currency">;
  position: Position;
  currentValue:
    | Readonly<{
        status: "not-applicable";
        reason: "closed";
      }>
    | Readonly<{
        status: "available";
        marketPosition: MarketPosition;
        quote: Pick<Quote, "price" | "quotedAt" | "fetchedAt" | "freshness">;
        /** A valued non-base Position remains visible but is excluded from totals. */
        baseCurrency: "included" | "excluded";
      }>
    | Readonly<{
        status: "unavailable";
        reason: "quote-unavailable";
        quoteCode: QuoteErrorCode;
      }>
    | Readonly<{
        status: "unavailable";
        reason: "quote-currency-mismatch";
        quoteCode?: never;
      }>;
}>;

export type QuoteCoverageStatus = "none" | "fresh" | "stale" | "mixed";

/** Counts coverage units, not monetary coverage or a percentage. */
export type QuoteCoverage =
  | Readonly<{
      status: "none";
      requested: 0;
      fresh: 0;
      stale: 0;
      unavailable: 0;
    }>
  | Readonly<{
      status: "fresh";
      requested: number;
      fresh: number;
      stale: 0;
      unavailable: 0;
    }>
  | Readonly<{
      status: "stale";
      requested: number;
      fresh: 0;
      stale: number;
      unavailable: 0;
    }>
  | Readonly<{
      status: "mixed";
      requested: number;
      fresh: number;
      stale: number;
      unavailable: number;
    }>;

export type PortfolioDashboardRead = Readonly<{
  portfolio: Portfolio;
  items: readonly PositionReadItem[];
  allocation: AllocationResult;
  marketValue: KnownAmount;
  investedAmount: KnownAmount;
  quotes: QuoteCoverage;
}>;

/** Global composition seam; V1 repositories normally provide Portfolio. */
export type GlobalPortfolioCandidate = Readonly<
  Omit<Portfolio, "baseCurrency"> & {
    baseCurrency: BaseCurrencyCode | CurrencyCode;
  }
>;

export type GlobalPortfolioEntry =
  | Readonly<{
      status: "ready";
      portfolio: Portfolio;
      read: PortfolioDashboardRead;
      /** Null when the known market value denominator is zero. */
      shareOfKnownMarketValue: DecimalString | null;
    }>
  | Readonly<{
      status: "unavailable";
      portfolio: GlobalPortfolioCandidate;
      reason: PortfolioAmountGapReason;
    }>;

export type GlobalDashboardRead = Readonly<{
  /** Archived portfolios are never loaded into this scope. */
  scope: "active-portfolios";
  currency: BaseCurrencyCode;
  portfolios: readonly GlobalPortfolioEntry[];
  marketValue: KnownAmount;
  investedAmount: KnownAmount;
  quotes: QuoteCoverage;
}>;
