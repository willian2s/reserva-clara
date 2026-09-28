import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import {
  parseAssetDocument as parseDomainAssetDocument,
  parseAssetIdentityKey,
  type Asset,
  type AssetIdentityKey,
} from "@/domain/asset";
import { InvalidDomainInputError, InvalidDomainValueError } from "@/domain/errors";
import { parseDocumentId } from "@/domain/value-objects";
import { InvalidFirestoreDocumentError } from "@/data/firestore/errors";

export const ASSET_FIELDS = [
  "symbol",
  "market",
  "assetType",
  "currency",
  "identityKey",
  "createdAt",
  "updatedAt",
] as const;

export type AssetFirestoreData = Readonly<{
  symbol: string;
  market: string;
  assetType: Asset["assetType"];
  currency: Asset["currency"];
  identityKey: AssetIdentityKey;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(field: string): never {
  throw new InvalidFirestoreDocumentError(field);
}

function assertExactFields(value: Record<string, unknown>, fields: readonly string[]): void {
  const actualFields = Object.keys(value).sort();
  const expectedFields = [...fields].sort();

  if (
    actualFields.length !== expectedFields.length ||
    actualFields.some((field, index) => field !== expectedFields[index])
  ) {
    invalid("fields");
  }
}

function parseTimestamp(value: unknown, field: "createdAt" | "updatedAt"): Date {
  if (!(value instanceof Timestamp)) {
    invalid(field);
  }

  const date = value.toDate();
  if (Number.isNaN(date.getTime())) {
    invalid(field);
  }

  return date;
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

export function parseAssetDocument(id: unknown, data: unknown): Asset {
  if (!isRecord(data)) {
    invalid("document");
  }

  assertExactFields(data, ASSET_FIELDS);

  try {
    return parseDomainAssetDocument(
      {
        symbol: data.symbol,
        market: data.market,
        assetType: data.assetType,
        currency: data.currency,
        identityKey: data.identityKey,
        createdAt: parseTimestamp(data.createdAt, "createdAt"),
        updatedAt: parseTimestamp(data.updatedAt, "updatedAt"),
      },
      id,
    );
  } catch (error) {
    return toInvalidFirestoreDocument(error);
  }
}

export function parseAssetSnapshot(
  snapshot: DocumentSnapshot<DocumentData, DocumentData>,
  options?: SnapshotOptions,
): Asset {
  if (!snapshot.exists()) {
    invalid("document");
  }

  return parseAssetDocument(snapshot.id, snapshot.data(options));
}

export type AssetIdentityRegistry = Readonly<{
  identityKey: AssetIdentityKey;
  assetId: Asset["id"];
}>;

export const ASSET_IDENTITY_FIELDS = ["assetId"] as const;

export function parseAssetIdentityDocument(
  identityKey: unknown,
  data: unknown,
): AssetIdentityRegistry {
  if (!isRecord(data)) {
    invalid("document");
  }

  assertExactFields(data, ASSET_IDENTITY_FIELDS);

  try {
    if (typeof data.assetId !== "string") {
      invalid("assetId");
    }

    return {
      identityKey: parseAssetIdentityKey(identityKey),
      assetId: parseDocumentId(data.assetId),
    };
  } catch (error) {
    return toInvalidFirestoreDocument(error);
  }
}

export function parseAssetIdentitySnapshot(
  snapshot: DocumentSnapshot<DocumentData, DocumentData>,
  options?: SnapshotOptions,
): AssetIdentityRegistry {
  if (!snapshot.exists()) {
    invalid("document");
  }

  return parseAssetIdentityDocument(snapshot.id, snapshot.data(options));
}

export const parseAssetIdentityRegistry = parseAssetIdentityDocument;
