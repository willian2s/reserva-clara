import {
  InvalidDomainInputError,
  InvalidDomainValueError,
} from "./errors";
import type { CurrencyCode, DocumentId } from "./value-objects";
import {
  parseCurrencyCode,
  parseDocumentId,
  parseInstant,
} from "./value-objects";

export const ASSET_TYPES = [
  "stock",
  "etf",
  "fii",
  "fund",
  "bond",
  "crypto",
  "other",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export type AssetIdentityKey = string & {
  readonly __assetIdentityKey: "AssetIdentityKey";
};

export type Asset = Readonly<{
  id: DocumentId;
  symbol: string;
  market: string;
  assetType: AssetType;
  currency: CurrencyCode;
  identityKey: AssetIdentityKey;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AssetInput = Readonly<{
  symbol: string;
  market: string;
  assetType: AssetType;
  currency: CurrencyCode;
}>;

export type AssetMetadata = Readonly<{
  id: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function parseIdentitySegment(value: unknown, field: "symbol" | "market"): string {
  if (typeof value !== "string") {
    throw new InvalidDomainValueError(field, "must be a string");
  }

  const normalized = value.trim().toUpperCase();
  if (normalized.length === 0 || !/^[A-Z0-9._-]+$/.test(normalized)) {
    throw new InvalidDomainValueError(
      field,
      "must contain only letters, numbers, dot, underscore or hyphen after normalization",
    );
  }

  return normalized;
}

export function parseAssetSymbol(value: unknown): string {
  return parseIdentitySegment(value, "symbol");
}

export function parseAssetMarket(value: unknown): string {
  return parseIdentitySegment(value, "market");
}

export function parseAssetType(value: unknown): AssetType {
  if (typeof value !== "string" || !ASSET_TYPES.includes(value as AssetType)) {
    throw new InvalidDomainValueError(
      "assetType",
      "must be one of stock, etf, fii, fund, bond, crypto or other",
    );
  }

  return value as AssetType;
}

export function createAssetIdentityKey(
  symbol: unknown,
  market: unknown,
  assetType: unknown,
  currency: unknown,
): AssetIdentityKey {
  return `${parseAssetSymbol(symbol)}~${parseAssetMarket(market)}~${parseAssetType(assetType)}~${parseCurrencyCode(currency)}` as AssetIdentityKey;
}

export function parseAssetInput(value: unknown): AssetInput {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("asset", "must be an object");
  }

  assertExactKeys(value, ["symbol", "market", "assetType", "currency"], "asset");

  return {
    symbol: parseAssetSymbol(value.symbol),
    market: parseAssetMarket(value.market),
    assetType: parseAssetType(value.assetType),
    currency: parseCurrencyCode(value.currency),
  };
}

function parseAssetFields(value: unknown): AssetInput & { identityKey: AssetIdentityKey } {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("asset", "must be an object");
  }

  assertExactKeys(
    value,
    ["symbol", "market", "assetType", "currency", "identityKey", "createdAt", "updatedAt"],
    "asset",
  );

  const input = parseAssetInput({
    symbol: value.symbol,
    market: value.market,
    assetType: value.assetType,
    currency: value.currency,
  });

  if (value.symbol !== input.symbol || value.market !== input.market) {
    throw new InvalidDomainValueError(
      "asset",
      "persisted symbol and market must already be normalized",
    );
  }

  const identityKey = createAssetIdentityKey(
    input.symbol,
    input.market,
    input.assetType,
    input.currency,
  );

  if (value.identityKey !== identityKey) {
    throw new InvalidDomainValueError(
      "identityKey",
      "must match the normalized symbol, market, asset type and currency",
    );
  }

  return { ...input, identityKey };
}

export function createAsset(input: unknown, metadata: AssetMetadata): Asset {
  if (!isRecord(metadata)) {
    throw new InvalidDomainInputError("asset.metadata", "must be an object");
  }

  const parsedInput = parseAssetInput(input);
  return {
    ...parsedInput,
    id: parseDocumentId(metadata.id),
    identityKey: createAssetIdentityKey(
      parsedInput.symbol,
      parsedInput.market,
      parsedInput.assetType,
      parsedInput.currency,
    ),
    createdAt: parseInstant(metadata.createdAt, "createdAt"),
    updatedAt: parseInstant(metadata.updatedAt, "updatedAt"),
  };
}

export function parseAssetDocument(value: unknown, id: unknown): Asset {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("asset", "must be an object");
  }

  const fields = parseAssetFields(value);
  return {
    ...fields,
    id: parseDocumentId(id),
    createdAt: parseInstant(value.createdAt, "createdAt"),
    updatedAt: parseInstant(value.updatedAt, "updatedAt"),
  };
}

/** Parses the complete domain shape, useful for pure-domain fixtures. */
export function parseAsset(value: unknown): Asset {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("asset", "must be an object");
  }

  assertExactKeys(
    value,
    ["id", "symbol", "market", "assetType", "currency", "identityKey", "createdAt", "updatedAt"],
    "asset",
  );

  return parseAssetDocument(
    {
      symbol: value.symbol,
      market: value.market,
      assetType: value.assetType,
      currency: value.currency,
      identityKey: value.identityKey,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    },
    value.id,
  );
}
