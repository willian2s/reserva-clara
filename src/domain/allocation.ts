import {
  addDecimalRationals,
  decimalToRational,
  divideDecimalRationals,
  materializeDecimalRational,
} from "./decimal-reducer";
import { PositionCompositionError } from "./errors";
import type { MarketPositionResult } from "./market-position";
import type { Position } from "./position-engine";
import type { CurrencyCode, DecimalString, DocumentId } from "./value-objects";
import { parseDocumentId } from "./value-objects";

export type AllocationEntry = Readonly<{
  assetId: DocumentId;
  marketValue: DecimalString;
  allocation: DecimalString | null;
}>;

export type AllocationUnavailable = Readonly<{
  assetId: DocumentId;
  reason:
    | "quote-unavailable"
    | "quote-currency-mismatch"
    | "base-currency-mismatch"
    | "composition-error";
}>;

export type AllocationResult = Readonly<{
  portfolioId: DocumentId;
  currency: CurrencyCode;
  status: "empty" | "complete" | "partial";
  totalMarketValue: DecimalString;
  entries: readonly AllocationEntry[];
  unavailable: readonly AllocationUnavailable[];
}>;

export type AllocationInput = Readonly<{
  portfolioId: DocumentId;
  currency: CurrencyCode;
  positions: readonly Position[];
  marketPositionResults: readonly MarketPositionResult[];
}>;

function compareAssetIds(left: { assetId: string }, right: { assetId: string }): number {
  if (left.assetId < right.assetId) return -1;
  if (left.assetId > right.assetId) return 1;
  return 0;
}

function unavailableFromResult(result: MarketPositionResult): AllocationUnavailable {
  if (result.status === "unavailable") {
    return {
      assetId: result.assetId,
      reason: result.reason,
    };
  }

  return {
    assetId: result.marketPosition.assetId,
    reason: "composition-error",
  };
}

export function calculateAllocation(input: AllocationInput): AllocationResult {
  const portfolioId = parseDocumentId(input.portfolioId);
  for (const position of input.positions) {
    if (position.portfolioId !== portfolioId) {
      throw new PositionCompositionError();
    }
  }

  const openPositions = input.positions.filter((position) => !position.closed);
  const positionsByAsset = new Map<string, Position>();

  for (const position of openPositions) {
    if (positionsByAsset.has(position.assetId)) {
      throw new PositionCompositionError();
    }
    positionsByAsset.set(position.assetId, position);
  }

  const resultsByAsset = new Map<string, MarketPositionResult>();
  for (const result of input.marketPositionResults) {
    const assetId = result.status === "unavailable"
      ? result.assetId
      : result.marketPosition.assetId;
    if (!positionsByAsset.has(assetId) || resultsByAsset.has(assetId)) {
      if (input.positions.some((position) => position.assetId === assetId && position.closed)) {
        continue;
      }
      throw new PositionCompositionError();
    }
    resultsByAsset.set(assetId, result);
  }

  const entries: AllocationEntry[] = [];
  const unavailable: AllocationUnavailable[] = [];
  let total = decimalToRational("0");

  for (const assetId of [...positionsByAsset.keys()].sort()) {
    const position = positionsByAsset.get(assetId) as Position;
    const result = resultsByAsset.get(assetId);

    if (result === undefined) {
      unavailable.push({ assetId: position.assetId, reason: "composition-error" });
      continue;
    }

    if (result.status === "unavailable") {
      unavailable.push(unavailableFromResult(result));
      continue;
    }

    const marketPosition = result.marketPosition;
    if (
      marketPosition.portfolioId !== portfolioId ||
      marketPosition.assetId !== position.assetId ||
      marketPosition.currency !== position.currency
    ) {
      unavailable.push({ assetId: position.assetId, reason: "composition-error" });
      continue;
    }

    if (marketPosition.currency !== input.currency) {
      unavailable.push({ assetId: position.assetId, reason: "base-currency-mismatch" });
      continue;
    }

    entries.push({
      assetId: position.assetId,
      marketValue: marketPosition.marketValue,
      allocation: null,
    });
    total = addDecimalRationals(total, decimalToRational(marketPosition.marketValue));
  }

  const totalMarketValue = materializeDecimalRational(total);
  const allocationEntries = entries.map((entry) => ({
    ...entry,
    allocation: total.numerator === BigInt(0)
      ? null
      : materializeDecimalRational(
          divideDecimalRationals(decimalToRational(entry.marketValue), total),
        ),
  }));
  const status = openPositions.length === 0
    ? "empty"
    : unavailable.length > 0
      ? "partial"
      : "complete";

  return {
    portfolioId,
    currency: input.currency,
    status,
    totalMarketValue,
    entries: allocationEntries.sort(compareAssetIds),
    unavailable: unavailable.sort(compareAssetIds),
  };
}
