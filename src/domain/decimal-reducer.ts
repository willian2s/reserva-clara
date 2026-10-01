import {
  DecimalArithmeticOverflowError,
  InsufficientQuantityError,
  InvalidDecimalError,
  InvalidDomainValueError,
  InvalidReferenceError,
} from "./errors";
import type { Transaction } from "./transaction";
import type { DecimalString, DocumentId } from "./value-objects";
import {
  parseDecimalString,
  DECIMAL_MAX_FRACTION_DIGITS,
  parseDocumentId,
} from "./value-objects";

type ParsedDecimal = Readonly<{
  coefficient: bigint;
  scale: number;
}>;

export type DecimalRational = Readonly<{
  numerator: bigint;
  denominator: bigint;
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

function absolute(value: bigint): bigint {
  return value < BigInt(0) ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);

  while (b !== BigInt(0)) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a === BigInt(0) ? BigInt(1) : a;
}

function normalizeRational(numerator: bigint, denominator: bigint): DecimalRational {
  if (denominator === BigInt(0)) {
    throw new InvalidDomainValueError("denominator", "must not be zero");
  }

  const signedNumerator = denominator < BigInt(0) ? -numerator : numerator;
  const positiveDenominator = denominator < BigInt(0) ? -denominator : denominator;
  const divisor = greatestCommonDivisor(signedNumerator, positiveDenominator);

  return {
    numerator: signedNumerator / divisor,
    denominator: positiveDenominator / divisor,
  };
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
    throw new DecimalArithmeticOverflowError();
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

/** Subtracts canonical decimals while allowing a signed derived result. */
export function subtractSignedDecimalStrings(
  left: string,
  right: string,
): DecimalString {
  const parsedLeft = parseForCalculation(left);
  const parsedRight = parseForCalculation(right);
  const [leftAligned, rightAligned, scale] = align(parsedLeft, parsedRight);
  return formatCalculationResult(leftAligned - rightAligned, scale);
}

/** Converts a canonical decimal to an exact reduced rational. */
export function decimalToRational(value: string): DecimalRational {
  const parsed = parseForCalculation(value);
  return normalizeRational(parsed.coefficient, powerOfTen(parsed.scale));
}

export function addDecimalRationals(
  left: DecimalRational,
  right: DecimalRational,
): DecimalRational {
  return normalizeRational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function subtractDecimalRationals(
  left: DecimalRational,
  right: DecimalRational,
): DecimalRational {
  return normalizeRational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function multiplyDecimalRationals(
  left: DecimalRational,
  right: DecimalRational,
): DecimalRational {
  return normalizeRational(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );
}

export function divideDecimalRationals(
  left: DecimalRational,
  right: DecimalRational,
): DecimalRational {
  if (right.numerator === BigInt(0)) {
    throw new InvalidDomainValueError("divisor", "must not be zero");
  }

  return normalizeRational(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
}

/** Materializes an exact rational at the domain's canonical 18-place scale. */
export function materializeDecimalRational(value: DecimalRational): DecimalString {
  const rational = normalizeRational(value.numerator, value.denominator);
  const scale = DECIMAL_MAX_FRACTION_DIGITS;
  const scaledNumerator = absolute(rational.numerator) * powerOfTen(scale);
  let quotient = scaledNumerator / rational.denominator;
  const remainder = scaledNumerator % rational.denominator;

  if (remainder * BigInt(2) >= rational.denominator) {
    quotient += BigInt(1);
  }

  if (rational.numerator < BigInt(0)) {
    quotient = -quotient;
  }

  return formatCalculationResult(quotient, scale);
}

/** Multiplies decimals exactly, then materializes the public decimal result. */
export function multiplyDecimalStrings(left: string, right: string): DecimalString {
  return materializeDecimalRational(
    multiplyDecimalRationals(decimalToRational(left), decimalToRational(right)),
  );
}

/** Divides decimals exactly, then materializes the public decimal result. */
export function divideDecimalStrings(left: string, right: string): DecimalString {
  return materializeDecimalRational(
    divideDecimalRationals(decimalToRational(left), decimalToRational(right)),
  );
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
