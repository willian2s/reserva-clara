import {
  decimalToRational,
  materializeDecimalRational,
  multiplyDecimalRationals,
  subtractDecimalRationals,
} from "./decimal-reducer";
import { PositionCompositionError } from "./errors";
import type { Position } from "./position-engine";
import type { QuoteErrorCode, QuoteResult } from "./quote";
import type { CurrencyCode, DecimalString, DocumentId } from "./value-objects";
import { parseDocumentId } from "./value-objects";

export type MarketPosition = Readonly<{
  portfolioId: DocumentId;
  assetId: DocumentId;
  currency: CurrencyCode;
  quantity: DecimalString;
  investedAmount: DecimalString;
  averageCost: DecimalString;
  marketValue: DecimalString;
  nominalDifference: DecimalString;
  freshness: "fresh" | "stale";
}>;

export type MarketPositionResult =
  | Readonly<{
      status: "available";
      marketPosition: MarketPosition;
    }>
  | Readonly<{
      status: "unavailable";
      assetId: DocumentId;
      reason: "quote-unavailable" | "quote-currency-mismatch";
      quoteCode?: QuoteErrorCode;
    }>;

/** Values a single open Position with a compatible QuoteResult. */
export function deriveMarketPosition(
  position: Position,
  quoteResult: QuoteResult,
): MarketPositionResult | null {
  if (position.closed) {
    return null;
  }

  const assetId = parseDocumentId(position.assetId);
  if (
    quoteResult.assetId !== assetId ||
    (quoteResult.status === "available" && quoteResult.quote.assetId !== assetId)
  ) {
    throw new PositionCompositionError();
  }

  if (quoteResult.status === "unavailable") {
    return {
      status: "unavailable",
      assetId,
      reason: "quote-unavailable",
      quoteCode: quoteResult.code,
    };
  }

  if (quoteResult.quote.price.currency !== position.currency) {
    return {
      status: "unavailable",
      assetId,
      reason: "quote-currency-mismatch",
    };
  }

  if (position.averageCost === null) {
    throw new PositionCompositionError();
  }

  const marketValueRational = multiplyDecimalRationals(
    decimalToRational(position.quantity),
    decimalToRational(quoteResult.quote.price.decimal),
  );
  const marketValue = materializeDecimalRational(marketValueRational);
  const nominalDifference = materializeDecimalRational(
    subtractDecimalRationals(
      marketValueRational,
      decimalToRational(position.investedAmount),
    ),
  );

  return {
    status: "available",
    marketPosition: {
      portfolioId: position.portfolioId,
      assetId,
      currency: position.currency,
      quantity: position.quantity,
      investedAmount: position.investedAmount,
      averageCost: position.averageCost,
      marketValue,
      nominalDifference,
      freshness: quoteResult.quote.freshness,
    },
  };
}
