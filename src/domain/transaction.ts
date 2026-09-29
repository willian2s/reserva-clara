import {
  InvalidDomainInputError,
  InvalidReferenceError,
} from "./errors";
import type {
  CivilDate,
  DocumentId,
  Quantity,
  TimestampParts,
  Fee,
  UnitPrice,
} from "./value-objects";
import {
  parseCivilDate,
  parseDocumentId,
  parsePersistedQuantity,
  parsePersistedFee,
  parsePersistedUnitPrice,
  parseQuantity,
  parseFee,
  parseTimestampParts,
  parseUnitPrice,
} from "./value-objects";

export type TransactionKind = "buy" | "sell";

/** Reserved names for future phases; no persistence or Rules are opened here. */
export type FutureTransactionKind =
  | "income"
  | "dividend"
  | "fee"
  | "tax"
  | "transfer"
  | "reversal"
  | "adjustment";

export type Transaction = Readonly<{
  id: DocumentId;
  kind: TransactionKind;
  assetId: DocumentId;
  quantity: Quantity;
  unitPrice: UnitPrice;
  fee: Fee | null;
  effectiveDate: CivilDate;
  createdAt: TimestampParts;
}>;

export type TradeTransaction = Transaction;

export type TransactionData = Omit<Transaction, "id">;

export type TransactionInput = Readonly<
  Pick<TransactionData, "kind" | "assetId" | "quantity" | "unitPrice" | "effectiveDate"> & {
    fee?: Fee | null;
  }
>;

export type TransactionMetadata = Readonly<{
  id: unknown;
}>;

export function transactionPayloadEquals(
  transaction: Transaction,
  input: TransactionInput,
): boolean {
  return (
    transaction.kind === input.kind &&
    transaction.assetId === input.assetId &&
    transaction.quantity === input.quantity &&
    transaction.unitPrice.currency === input.unitPrice.currency &&
    transaction.unitPrice.decimal === input.unitPrice.decimal &&
    transaction.fee?.currency === input.fee?.currency &&
    transaction.fee?.decimal === input.fee?.decimal &&
    transaction.effectiveDate === input.effectiveDate
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
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

function assertTransactionKeys(
  value: Record<string, unknown>,
  requiredKeys: readonly string[],
): void {
  assertExactKeys(
    value,
    [...requiredKeys, ...(hasOwn(value, "fee") ? ["fee"] : [])],
    "transaction",
  );
}

export function parseTransactionKind(value: unknown): TransactionKind {
  if (value !== "buy" && value !== "sell") {
    throw new InvalidDomainInputError(
      "kind",
      "must be buy or sell; future transaction kinds are not accepted in V1",
    );
  }

  return value;
}

export function parseTransactionInput(value: unknown): TransactionInput {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("transaction", "must be an object");
  }

  assertTransactionKeys(value, ["kind", "assetId", "quantity", "unitPrice", "effectiveDate"]);

  let assetId: DocumentId;
  try {
    assetId = parseDocumentId(value.assetId);
  } catch {
    throw new InvalidReferenceError("assetId", "must be a valid document ID");
  }

  return {
    kind: parseTransactionKind(value.kind),
    assetId,
    quantity: parseQuantity(value.quantity),
    unitPrice: parseUnitPrice(value.unitPrice),
    fee: parseFee(value.fee),
    effectiveDate: parseCivilDate(value.effectiveDate),
  };
}

export function parseTransactionData(value: unknown): TransactionData {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("transaction", "must be an object");
  }

  assertTransactionKeys(value, [
    "kind",
    "assetId",
    "quantity",
    "unitPrice",
    "effectiveDate",
    "createdAt",
  ]);

  let assetId: DocumentId;
  try {
    assetId = parseDocumentId(value.assetId);
  } catch {
    throw new InvalidReferenceError("assetId", "must be a valid document ID");
  }

  return {
    kind: parseTransactionKind(value.kind),
    assetId,
    quantity: parseQuantity(value.quantity),
    unitPrice: parseUnitPrice(value.unitPrice),
    fee: parseFee(value.fee),
    effectiveDate: parseCivilDate(value.effectiveDate),
    createdAt: parseTimestampParts(value.createdAt, "createdAt"),
  };
}

export function parsePersistedTransactionData(value: unknown): TransactionData {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("transaction", "must be an object");
  }

  assertTransactionKeys(value, [
    "kind",
    "assetId",
    "quantity",
    "unitPrice",
    "effectiveDate",
    "createdAt",
  ]);

  let assetId: DocumentId;
  try {
    assetId = parseDocumentId(value.assetId);
  } catch {
    throw new InvalidReferenceError("assetId", "must be a valid document ID");
  }

  return {
    kind: parseTransactionKind(value.kind),
    assetId,
    quantity: parsePersistedQuantity(value.quantity),
    unitPrice: parsePersistedUnitPrice(value.unitPrice),
    fee: parsePersistedFee(value.fee),
    effectiveDate: parseCivilDate(value.effectiveDate),
    createdAt: parseTimestampParts(value.createdAt, "createdAt"),
  };
}

export function createTransaction(
  input: unknown,
  metadata: TransactionMetadata,
): Transaction {
  if (!isRecord(metadata)) {
    throw new InvalidDomainInputError("transaction.metadata", "must be an object");
  }

  return {
    id: parseDocumentId(metadata.id),
    ...parseTransactionData(input),
  };
}

export function parseTransactionDocument(value: unknown, id: unknown): Transaction {
  return {
    id: parseDocumentId(id),
    ...parsePersistedTransactionData(value),
  };
}

/** Parses a complete pure-domain transaction including its document ID. */
export function parseTransaction(value: unknown): Transaction {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("transaction", "must be an object");
  }

  assertExactKeys(value, [
    "id",
    "kind",
    "assetId",
    "quantity",
    "unitPrice",
    "effectiveDate",
    "createdAt",
    ...(hasOwn(value, "fee") ? ["fee"] : []),
  ], "transaction");

  return createTransaction(
    {
      kind: value.kind,
      assetId: value.assetId,
      quantity: value.quantity,
      unitPrice: value.unitPrice,
      fee: value.fee,
      effectiveDate: value.effectiveDate,
      createdAt: value.createdAt,
    },
    { id: value.id },
  );
}
