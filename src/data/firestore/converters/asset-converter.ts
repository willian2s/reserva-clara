import {
  FieldValue,
  serverTimestamp,
  Timestamp,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type SetOptions,
  type WithFieldValue,
} from "firebase/firestore";

import {
  parseAsset,
  parseAssetInput,
  parseAssetUpdateInput,
  parseAssetIdentityKey,
  createAssetIdentityKey,
  type Asset,
} from "@/domain/asset";
import {
  InvalidDomainInputError,
} from "@/domain/errors";
import {
  parseAssetDocument,
  type AssetFirestoreData,
} from "@/data/firestore/parsers/asset-parser";
import {
  parseCurrencyCode,
  parseInstant,
} from "@/domain/value-objects";

type AssetFirestoreWriteData = Readonly<{
  symbol: string;
  market: string;
  assetType: Asset["assetType"];
  currency: Asset["currency"];
  identityKey: Asset["identityKey"];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldValue(value: unknown): value is FieldValue {
  return value instanceof FieldValue;
}

function isServerTimestamp(value: FieldValue): boolean {
  return (
    (value as unknown as { _methodName?: unknown })._methodName ===
    "serverTimestamp"
  );
}

function parseWriteString(value: unknown, field: "symbol" | "market"): string {
  if (isFieldValue(value)) {
    throw new InvalidDomainInputError(field, "cannot use a field value");
  }

  const input = parseAssetInput({
    symbol: field === "symbol" ? value : "A",
    market: field === "market" ? value : "A",
    assetType: "other",
    currency: "BRL",
  });

  return field === "symbol" ? input.symbol : input.market;
}

function parseWriteAssetType(value: unknown): Asset["assetType"] {
  if (isFieldValue(value)) {
    throw new InvalidDomainInputError("assetType", "cannot use a field value");
  }

  return parseAssetInput({
    symbol: "A",
    market: "A",
    assetType: value,
    currency: "BRL",
  }).assetType;
}

function parseWriteCurrency(value: unknown): Asset["currency"] {
  if (isFieldValue(value)) {
    throw new InvalidDomainInputError("currency", "cannot use a field value");
  }

  return parseCurrencyCode(value);
}

function parseWriteIdentityKey(value: unknown): Asset["identityKey"] {
  if (isFieldValue(value)) {
    throw new InvalidDomainInputError("identityKey", "cannot use a field value");
  }

  return parseAssetIdentityKey(value);
}

function parseWriteTimestamp(
  value: unknown,
  field: "createdAt" | "updatedAt",
): Timestamp | FieldValue {
  if (isFieldValue(value)) {
    if (!isServerTimestamp(value)) {
      throw new InvalidDomainInputError(
        field,
        "only serverTimestamp is allowed for Asset timestamps",
      );
    }

    return value;
  }

  return Timestamp.fromDate(parseInstant(value, field));
}

export function assetToFirestore(value: unknown): AssetFirestoreWriteData {
  const asset = parseAsset(value);

  return {
    symbol: asset.symbol,
    market: asset.market,
    assetType: asset.assetType,
    currency: asset.currency,
    identityKey: asset.identityKey,
    createdAt: Timestamp.fromDate(asset.createdAt),
    updatedAt: Timestamp.fromDate(asset.updatedAt),
  };
}

export function createAssetFirestoreData(input: unknown): PartialWithFieldValue<Asset> {
  const asset = parseAssetInput(input);

  return {
    symbol: asset.symbol,
    market: asset.market,
    assetType: asset.assetType,
    currency: asset.currency,
    identityKey: createAssetIdentityKey(
      asset.symbol,
      asset.market,
      asset.assetType,
      asset.currency,
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function updateAssetFirestoreData(input: unknown): PartialWithFieldValue<Asset> {
  const asset = parseAssetUpdateInput(input);

  return {
    symbol: asset.symbol,
    market: asset.market,
    assetType: asset.assetType,
    currency: asset.currency,
    identityKey: createAssetIdentityKey(
      asset.symbol,
      asset.market,
      asset.assetType,
      asset.currency,
    ),
    updatedAt: serverTimestamp(),
  };
}

function hasRequiredAssetFields(value: Record<string, unknown>): boolean {
  return ASSET_WRITE_FIELDS.every((field) => Object.hasOwn(value, field));
}

const ASSET_WRITE_FIELDS = [
  "symbol",
  "market",
  "assetType",
  "currency",
  "identityKey",
  "createdAt",
  "updatedAt",
] as const;

function toFirestoreData(
  value: unknown,
  requireComplete: boolean,
): WithFieldValue<AssetFirestoreData> | PartialWithFieldValue<AssetFirestoreData> {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("asset", "must be an object");
  }

  const allowedFields = new Set([...ASSET_WRITE_FIELDS, "id"]);
  if (Object.keys(value).some((field) => !allowedFields.has(field))) {
    throw new InvalidDomainInputError("asset", "contains unknown fields");
  }

  if (requireComplete && !hasRequiredAssetFields(value)) {
    throw new InvalidDomainInputError("asset", "must contain all persisted fields");
  }

  const data: Record<string, unknown> = {};

  if (Object.hasOwn(value, "symbol")) {
    data.symbol = parseWriteString(value.symbol, "symbol");
  }
  if (Object.hasOwn(value, "market")) {
    data.market = parseWriteString(value.market, "market");
  }
  if (Object.hasOwn(value, "assetType")) {
    data.assetType = parseWriteAssetType(value.assetType);
  }
  if (Object.hasOwn(value, "currency")) {
    data.currency = parseWriteCurrency(value.currency);
  }
  if (Object.hasOwn(value, "identityKey")) {
    data.identityKey = parseWriteIdentityKey(value.identityKey);
  }
  if (Object.hasOwn(value, "createdAt")) {
    data.createdAt = parseWriteTimestamp(value.createdAt, "createdAt");
  }
  if (Object.hasOwn(value, "updatedAt")) {
    data.updatedAt = parseWriteTimestamp(value.updatedAt, "updatedAt");
  }

  if (
    ["symbol", "market", "assetType", "currency", "identityKey"].every((field) =>
      Object.hasOwn(data, field),
    )
  ) {
    const expectedIdentityKey = createAssetIdentityKey(
      data.symbol,
      data.market,
      data.assetType,
      data.currency,
    );

    if (data.identityKey !== expectedIdentityKey) {
      throw new InvalidDomainInputError(
        "identityKey",
        "must match the normalized asset fields",
      );
    }
  }

  return data as
    | WithFieldValue<AssetFirestoreData>
    | PartialWithFieldValue<AssetFirestoreData>;
}

function toFirestore(
  modelObject: WithFieldValue<Asset>,
): WithFieldValue<AssetFirestoreData>;
function toFirestore(
  modelObject: PartialWithFieldValue<Asset>,
  _options: SetOptions,
): PartialWithFieldValue<AssetFirestoreData>;
function toFirestore(
  modelObject: WithFieldValue<Asset> | PartialWithFieldValue<Asset>,
  options?: SetOptions,
): WithFieldValue<AssetFirestoreData> | PartialWithFieldValue<AssetFirestoreData> {
  const partialWrite =
    options !== undefined &&
    ("mergeFields" in options || ("merge" in options && options.merge === true));

  if (partialWrite) {
    throw new InvalidDomainInputError("asset", "updates are not supported");
  }

  return toFirestoreData(modelObject, true);
}

export const assetConverter: FirestoreDataConverter<Asset, AssetFirestoreData> = {
  toFirestore,

  fromFirestore(snapshot, options) {
    return parseAssetDocument(snapshot.id, snapshot.data(options));
  },
};
