import { Timestamp, type DocumentData } from "firebase-admin/firestore";

import { parseAssetDocument, type Asset } from "../../domain/asset";
import { parseDocumentId } from "../../domain/value-objects";
import { assetDocumentPath } from "../../data/firestore/paths";
import { getFirebaseAdminServices } from "../firebase-admin";

const ASSET_FIELDS = [
  "symbol",
  "market",
  "assetType",
  "currency",
  "identityKey",
  "createdAt",
  "updatedAt",
] as const;

export type AssetDocumentStore = Readonly<{
  getAssetDocument(uid: string, assetId: string): Promise<unknown | null>;
}>;

export class AssetReaderError extends Error {
  readonly code = "ASSET_READ_FAILED" as const;

  constructor() {
    super("Asset could not be read");
    this.name = "AssetReaderError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...ASSET_FIELDS].sort();

  return (
    actual.length === expected.length &&
    actual.every((field, index) => field === expected[index])
  );
}

function parseAdminTimestamp(value: unknown): Date {
  if (!(value instanceof Timestamp)) {
    throw new AssetReaderError();
  }

  const date = value.toDate();
  if (Number.isNaN(date.getTime())) {
    throw new AssetReaderError();
  }

  return date;
}

function parseAdminAssetDocument(id: string, data: unknown): Asset {
  if (!isRecord(data) || !hasExactFields(data)) {
    throw new AssetReaderError();
  }

  try {
    return parseAssetDocument(
      {
        symbol: data.symbol,
        market: data.market,
        assetType: data.assetType,
        currency: data.currency,
        identityKey: data.identityKey,
        createdAt: parseAdminTimestamp(data.createdAt),
        updatedAt: parseAdminTimestamp(data.updatedAt),
      },
      id,
    );
  } catch {
    throw new AssetReaderError();
  }
}

function createAdminAssetDocumentStore(): AssetDocumentStore {
  return {
    async getAssetDocument(uid, assetId) {
      const reference = getFirebaseAdminServices().db.doc(
        assetDocumentPath(uid, assetId),
      );
      const snapshot = await reference.get();

      return snapshot.exists ? snapshot.data() : null;
    },
  };
}

export function createAssetReader(
  store: AssetDocumentStore = createAdminAssetDocumentStore(),
) {
  return {
    async listOwnedAssets(
      verifiedUid: string,
      assetIds: readonly string[],
    ): Promise<readonly Asset[]> {
      const parsedIds = assetIds.map((assetId) => parseDocumentId(assetId));
      const documents = await Promise.all(
        parsedIds.map(async (assetId) => ({
          assetId,
          data: await store.getAssetDocument(verifiedUid, assetId),
        })),
      );

      return documents.flatMap(({ assetId, data }) =>
        data === null ? [] : [parseAdminAssetDocument(assetId, data)],
      );
    },
  };
}

export async function listOwnedAssets(
  verifiedUid: string,
  assetIds: readonly string[],
): Promise<readonly Asset[]> {
  return createAssetReader().listOwnedAssets(verifiedUid, assetIds);
}

export type AdminAssetDocumentData = DocumentData;
