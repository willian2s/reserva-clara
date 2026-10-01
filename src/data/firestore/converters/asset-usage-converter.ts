import {
  serverTimestamp,
  Timestamp,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type SetOptions,
  type WithFieldValue,
} from "firebase/firestore";

import { InvalidDomainInputError } from "@/domain/errors";
import { parseDocumentId } from "@/domain/value-objects";
import {
  ASSET_USAGE_FIELDS,
  parseAssetUsageDocument,
  type AssetUsageFirestoreData,
} from "@/data/firestore/parsers/asset-usage-parser";

export function createAssetUsageFirestoreData(
  assetId: unknown,
): PartialWithFieldValue<AssetUsageFirestoreData> {
  return {
    assetId: parseDocumentId(assetId),
    createdAt: serverTimestamp(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFirestoreData(value: unknown): WithFieldValue<AssetUsageFirestoreData> {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("assetUsage", "must be an object");
  }

  const actualFields = Object.keys(value).sort();
  const expectedFields = [...ASSET_USAGE_FIELDS].sort();
  if (
    actualFields.length !== expectedFields.length ||
    actualFields.some((field, index) => field !== expectedFields[index])
  ) {
    throw new InvalidDomainInputError("assetUsage", "contains unknown or missing fields");
  }

  if (!(value.createdAt instanceof Timestamp)) {
    throw new InvalidDomainInputError("createdAt", "must be a Timestamp");
  }

  return {
    assetId: parseDocumentId(value.assetId),
    createdAt: value.createdAt,
  };
}

function toFirestore(
  modelObject: WithFieldValue<AssetUsageFirestoreData>,
): WithFieldValue<AssetUsageFirestoreData>;
function toFirestore(
  modelObject: PartialWithFieldValue<AssetUsageFirestoreData>,
  _options: SetOptions,
): PartialWithFieldValue<AssetUsageFirestoreData>;
function toFirestore(
  modelObject:
    | WithFieldValue<AssetUsageFirestoreData>
    | PartialWithFieldValue<AssetUsageFirestoreData>,
  options?: SetOptions,
): WithFieldValue<AssetUsageFirestoreData> | PartialWithFieldValue<AssetUsageFirestoreData> {
  if (options !== undefined) {
    throw new InvalidDomainInputError("assetUsage", "updates are not supported");
  }

  return toFirestoreData(modelObject);
}

export const assetUsageConverter: FirestoreDataConverter<
  AssetUsageFirestoreData,
  AssetUsageFirestoreData
> = {
  toFirestore,

  fromFirestore(snapshot, options) {
    return parseAssetUsageDocument(snapshot.id, snapshot.data(options));
  },
};
