import {
  InsufficientQuantityError,
  InvalidDecimalError,
  InvalidReferenceError,
} from "./errors";
import type { Transaction } from "./transaction";
import type { DecimalString, DocumentId } from "./value-objects";
import {
  parseDecimalString,
  parseDocumentId,
} from "./value-objects";

type ParsedDecimal = Readonly<{
  coefficient: bigint;
  scale: number;
}>;

function parseForCalculation(value: string): ParsedDecimal {
  const canonical = parseDecimalString(value);
  const unsigned = canonical.startsWith("-") ? canonical.slice(1) : canonical;
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const digits = `${integerPart}${fractionPart}`;
  const coefficient = BigInt(digits) * (canonical.startsWith("-") ? BigInt(-1) : BigInt(1));

  return { coefficient, scale: fractionPart.length };
}

function powerOfTen(exponent: number): bigint {
  return BigInt(10) ** BigInt(exponent);
}

function align(left: ParsedDecimal, right: ParsedDecimal): [bigint, bigint, number] {
  const scale = Math.max(left.scale, right.scale);
  return [
    left.coefficient * powerOfTen(scale - left.scale),
    right.coefficient * powerOfTen(scale - right.scale),
    scale,
  ];
}

function formatCalculationResult(coefficient: bigint, scale: number): DecimalString {
  if (coefficient === BigInt(0)) {
    return "0" as DecimalString;
  }

  const negative = coefficient < BigInt(0);
  const digits = (negative ? -coefficient : coefficient).toString();
  const padded = digits.padStart(scale + 1, "0");
  const integerEnd = padded.length - scale;
  const integerPart = padded.slice(0, integerEnd);
  const fractionPart = padded.slice(integerEnd).replace(/0+$/, "");
  const result = fractionPart
    ? `${negative ? "-" : ""}${integerPart}.${fractionPart}`
    : `${negative ? "-" : ""}${integerPart}`;

  try {
    return parseDecimalString(result);
  } catch {
    throw new InvalidDecimalError(
      "decimal",
      "calculation result exceeds 30 integer or 18 fractional digits",
    );
  }
}

function compareDocumentIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function normalizeDecimal(value: string): DecimalString {
  return parseDecimalString(value);
}

export function compareDecimalStrings(left: string, right: string): -1 | 0 | 1 {
  const [leftAligned, rightAligned] = align(
    parseForCalculation(left),
    parseForCalculation(right),
  );

  if (leftAligned < rightAligned) return -1;
  if (leftAligned > rightAligned) return 1;
  return 0;
}

export function addDecimalStrings(left: string, right: string): DecimalString {
  const parsedLeft = parseForCalculation(left);
  const parsedRight = parseForCalculation(right);
  const [leftAligned, rightAligned, scale] = align(parsedLeft, parsedRight);
  return formatCalculationResult(leftAligned + rightAligned, scale);
}

export function subtractDecimalStrings(left: string, right: string): DecimalString {
  const parsedLeft = parseForCalculation(left);
  const parsedRight = parseForCalculation(right);
  const [leftAligned, rightAligned, scale] = align(parsedLeft, parsedRight);

  if (leftAligned < rightAligned) {
    throw new InvalidDecimalError("decimal", "subtraction would produce a negative value");
  }

  return formatCalculationResult(leftAligned - rightAligned, scale);
}

export function compareTransactions(left: Transaction, right: Transaction): number {
  const effectiveDateComparison = left.effectiveDate.localeCompare(right.effectiveDate);
  if (effectiveDateComparison !== 0) return effectiveDateComparison;

  if (left.createdAt.seconds !== right.createdAt.seconds) {
    return left.createdAt.seconds - right.createdAt.seconds;
  }

  if (left.createdAt.nanoseconds !== right.createdAt.nanoseconds) {
    return left.createdAt.nanoseconds - right.createdAt.nanoseconds;
  }

  return compareDocumentIds(left.id, right.id);
}

export function sortTransactions(
  transactions: readonly Transaction[],
): Transaction[] {
  return [...transactions].sort(compareTransactions);
}

/** Reduces one Asset's ledger to a non-negative canonical decimal quantity. */
export function reduceTransactionQuantity(
  transactions: readonly Transaction[],
  assetId?: DocumentId,
): DecimalString {
  const selectedAssetId = assetId === undefined ? undefined : parseDocumentId(assetId);
  const assetIds = new Set(transactions.map((transaction) => transaction.assetId));
  if (selectedAssetId === undefined && assetIds.size > 1) {
    throw new InvalidReferenceError(
      "assetId",
      "all transactions must belong to the same Asset",
    );
  }

  const relevantTransactions = selectedAssetId
    ? transactions.filter((transaction) => transaction.assetId === selectedAssetId)
    : transactions;
  let quantity: DecimalString = "0" as DecimalString;

  for (const transaction of sortTransactions(relevantTransactions)) {
    if (transaction.kind === "buy") {
      quantity = addDecimalStrings(quantity, transaction.quantity);
      continue;
    }

    if (compareDecimalStrings(quantity, transaction.quantity) < 0) {
      throw new InsufficientQuantityError();
    }

    quantity = subtractDecimalStrings(quantity, transaction.quantity);
  }

  return quantity;
}

export const reduceAssetQuantity = reduceTransactionQuantity;
