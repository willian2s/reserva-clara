import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import { parseDocumentId, type DocumentId } from "@/domain/value-objects";
import { InvalidFirestoreDocumentError } from "@/data/firestore/errors";

export const ASSET_USAGE_FIELDS = ["assetId", "createdAt"] as const;

export type AssetUsageFirestoreData = Readonly<{
  assetId: DocumentId;
  createdAt: Timestamp;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(field: string): never {
  throw new InvalidFirestoreDocumentError(field);
}

function assertExactFields(value: Record<string, unknown>): void {
  const actualFields = Object.keys(value).sort();
  const expectedFields = [...ASSET_USAGE_FIELDS].sort();

  if (
    actualFields.length !== expectedFields.length ||
    actualFields.some((field, index) => field !== expectedFields[index])
  ) {
    invalid("fields");
  }
}

export function parseAssetUsageDocument(
  id: unknown,
  data: unknown,
): AssetUsageFirestoreData {
  if (!isRecord(data)) {
    invalid("document");
  }

  assertExactFields(data);

  if (!(data.createdAt instanceof Timestamp)) {
    invalid("createdAt");
  }

  try {
    const assetId = parseDocumentId(data.assetId);
    if (assetId !== parseDocumentId(id)) {
      invalid("assetId");
    }

    return { assetId, createdAt: data.createdAt };
  } catch (error) {
    if (error instanceof InvalidFirestoreDocumentError) {
      throw error;
    }

    invalid("assetId");
  }
}

export function parseAssetUsageSnapshot(
  snapshot: DocumentSnapshot<DocumentData, DocumentData>,
  options?: SnapshotOptions,
): AssetUsageFirestoreData {
  if (!snapshot.exists()) {
    invalid("document");
  }

  return parseAssetUsageDocument(snapshot.id, snapshot.data(options));
}
