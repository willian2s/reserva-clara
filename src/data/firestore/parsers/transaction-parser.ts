import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import {
  parseTransactionDocument as parseDomainTransactionDocument,
  type Transaction,
} from "@/domain/transaction";
import {
  InvalidDomainInputError,
  InvalidDomainValueError,
} from "@/domain/errors";
import { parseTimestampParts } from "@/domain/value-objects";
import { InvalidFirestoreDocumentError } from "@/data/firestore/errors";

export const TRANSACTION_FIELDS = [
  "kind",
  "assetId",
  "quantity",
  "unitPrice",
  "fee",
  "effectiveDate",
  "createdAt",
] as const;

const LEGACY_TRANSACTION_FIELDS = TRANSACTION_FIELDS.filter(
  (field) => field !== "fee",
);

export type TransactionFirestoreData = Readonly<{
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

function invalid(field: string): never {
  throw new InvalidFirestoreDocumentError(field);
}

function assertExactFields(value: Record<string, unknown>): void {
  const actualFields = Object.keys(value).sort();
  const expectedFields = [
    ...(hasOwn(value, "fee")
      ? TRANSACTION_FIELDS
      : LEGACY_TRANSACTION_FIELDS),
  ].sort();

  if (
    actualFields.length !== expectedFields.length ||
    actualFields.some((field, index) => field !== expectedFields[index])
  ) {
    invalid("fields");
  }
}

function parseTimestamp(value: unknown): { seconds: number; nanoseconds: number } {
  if (!(value instanceof Timestamp)) {
    invalid("createdAt");
  }

  try {
    return parseTimestampParts(
      { seconds: value.seconds, nanoseconds: value.nanoseconds },
      "createdAt",
    );
  } catch {
    invalid("createdAt");
  }
}

function toInvalidFirestoreDocument(error: unknown): never {
  if (error instanceof InvalidFirestoreDocumentError) {
    throw error;
  }

  if (error instanceof InvalidDomainInputError || error instanceof InvalidDomainValueError) {
    invalid(error.field);
  }

  invalid("document");
}

export function parseTransactionDocument(id: unknown, data: unknown): Transaction {
  if (!isRecord(data)) {
    invalid("document");
  }

  assertExactFields(data);

  try {
    const timestamp = parseTimestamp(data.createdAt);

    return parseDomainTransactionDocument(
      {
        kind: data.kind,
        assetId: data.assetId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        fee: data.fee,
        effectiveDate: data.effectiveDate,
        createdAt: timestamp,
      },
      id,
    );
  } catch (error) {
    return toInvalidFirestoreDocument(error);
  }
}

export function parseTransactionSnapshot(
  snapshot: DocumentSnapshot<DocumentData, DocumentData>,
  options?: SnapshotOptions,
): Transaction {
  if (!snapshot.exists()) {
    invalid("document");
  }

  return parseTransactionDocument(snapshot.id, snapshot.data(options));
}
