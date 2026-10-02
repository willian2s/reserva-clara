import type { Asset } from "./asset";
import type { AllocationResult } from "./allocation";
import {
  addDecimalRationals,
  decimalToRational,
  materializeDecimalRational,
} from "./decimal-reducer";
import type { MarketPosition } from "./market-position";
import type { Portfolio } from "./portfolio";
import type { Position } from "./position-engine";
import type { QuoteErrorCode, Quote, QuoteResult } from "./quote";
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

export type KnownAmountInput = Readonly<{
  currency: CurrencyCode;
  values: readonly DecimalString[];
  unavailable: readonly AmountGap[];
  hasItems: boolean;
}>;

function compareAmountGaps(left: AmountGap, right: AmountGap): number {
  if (left.portfolioId !== right.portfolioId) {
    return left.portfolioId < right.portfolioId ? -1 : 1;
  }

  if (left.scope === "asset" && right.scope === "asset") {
    if (left.assetId === right.assetId) return 0;
    return left.assetId < right.assetId ? -1 : 1;
  }

  if (left.scope === right.scope) return 0;
  return left.scope === "portfolio" ? -1 : 1;
}

/** Builds an exact monetary summary without imputing excluded values as zero. */
export function createKnownAmount(input: KnownAmountInput): KnownAmount {
  let total = decimalToRational("0");
  for (const value of input.values) {
    total = addDecimalRationals(total, decimalToRational(value));
  }

  return {
    currency: input.currency,
    status: !input.hasItems
      ? "empty"
      : input.unavailable.length > 0
        ? "partial"
        : "complete",
    knownAmount: materializeDecimalRational(total),
    unavailable: [...input.unavailable].sort(compareAmountGaps),
  };
}

export type QuoteCoverageInput = Readonly<{
  positionCurrency: CurrencyCode;
  result: QuoteResult | undefined;
}>;

/** Counts quote states for open Positions; this is not a monetary coverage percentage. */
export function deriveQuoteCoverage(
  inputs: readonly QuoteCoverageInput[],
): QuoteCoverage {
  let fresh = 0;
  let stale = 0;
  let unavailable = 0;

  for (const input of inputs) {
    if (
      input.result === undefined ||
      input.result.status === "unavailable" ||
      input.result.quote.price.currency !== input.positionCurrency
    ) {
      unavailable += 1;
    } else if (input.result.quote.freshness === "fresh") {
      fresh += 1;
    } else {
      stale += 1;
    }
  }

  const requested = inputs.length;
  if (requested === 0) {
    return { status: "none", requested: 0, fresh: 0, stale: 0, unavailable: 0 };
  }

  if (fresh === requested) {
    return { status: "fresh", requested, fresh, stale: 0, unavailable: 0 };
  }

  if (stale === requested) {
    return { status: "stale", requested, fresh: 0, stale, unavailable: 0 };
  }

  return { status: "mixed", requested, fresh, stale, unavailable };
}

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
