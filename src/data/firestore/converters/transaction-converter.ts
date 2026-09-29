import {
  serverTimestamp,
  Timestamp,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type SetOptions,
  type WithFieldValue,
} from "firebase/firestore";

import {
  parseTransaction,
  parseTransactionInput,
  type Transaction,
} from "@/domain/transaction";
import { InvalidDomainInputError } from "@/domain/errors";
import {
  parseTimestampParts,
  type TimestampParts,
} from "@/domain/value-objects";
import {
  TRANSACTION_FIELDS,
  parseTransactionDocument,
  type TransactionFirestoreData,
} from "@/data/firestore/parsers/transaction-parser";

type TransactionFirestoreWriteData = Readonly<{
  kind: Transaction["kind"];
  assetId: Transaction["assetId"];
  quantity: Transaction["quantity"];
  unitPrice: Transaction["unitPrice"];
  fee: Transaction["fee"];
  effectiveDate: Transaction["effectiveDate"];
  createdAt: Timestamp;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function timestampFromParts(value: TimestampParts): Timestamp {
  return new Timestamp(value.seconds, value.nanoseconds);
}

export function transactionToFirestore(value: unknown): TransactionFirestoreWriteData {
  const transaction = parseTransaction(value);

  return {
    kind: transaction.kind,
    assetId: transaction.assetId,
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice,
    fee: transaction.fee,
    effectiveDate: transaction.effectiveDate,
    createdAt: timestampFromParts(
      parseTimestampParts(transaction.createdAt, "createdAt"),
    ),
  };
}

export function createTransactionFirestoreData(
  input: unknown,
): PartialWithFieldValue<TransactionFirestoreData> {
  const transaction = parseTransactionInput(input);

  return {
    kind: transaction.kind,
    assetId: transaction.assetId,
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice,
    fee: transaction.fee,
    effectiveDate: transaction.effectiveDate,
    createdAt: serverTimestamp(),
  };
}

function hasRequiredTransactionFields(value: Record<string, unknown>): boolean {
  return TRANSACTION_FIELDS.every((field) =>
    field === "fee" || hasOwn(value, field),
  );
}

function toFirestoreData(
  value: unknown,
  requireComplete: boolean,
): WithFieldValue<TransactionFirestoreData> | PartialWithFieldValue<TransactionFirestoreData> {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("transaction", "must be an object");
  }

  const allowedFields = new Set([...TRANSACTION_FIELDS, "id"]);
  if (Object.keys(value).some((field) => !allowedFields.has(field))) {
    throw new InvalidDomainInputError("transaction", "contains unknown fields");
  }

  if (requireComplete && !hasRequiredTransactionFields(value)) {
    throw new InvalidDomainInputError(
      "transaction",
      "must contain all persisted fields",
    );
  }

  return transactionToFirestore(value) as WithFieldValue<TransactionFirestoreData>;
}

function toFirestore(
  modelObject: WithFieldValue<Transaction>,
): WithFieldValue<TransactionFirestoreData>;
function toFirestore(
  modelObject: PartialWithFieldValue<Transaction>,
  options: SetOptions,
): PartialWithFieldValue<TransactionFirestoreData>;
function toFirestore(
  modelObject: WithFieldValue<Transaction> | PartialWithFieldValue<Transaction>,
  options?: SetOptions,
): WithFieldValue<TransactionFirestoreData> | PartialWithFieldValue<TransactionFirestoreData> {
  const partialWrite =
    options !== undefined &&
    ("mergeFields" in options || ("merge" in options && options.merge === true));

  if (partialWrite) {
    throw new InvalidDomainInputError("transaction", "updates are not supported");
  }

  return toFirestoreData(modelObject, true);
}

export const transactionConverter: FirestoreDataConverter<
  Transaction,
  TransactionFirestoreData
> = {
  toFirestore,

  fromFirestore(snapshot, options) {
    return parseTransactionDocument(snapshot.id, snapshot.data(options));
  },
};
