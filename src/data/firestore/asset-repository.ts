"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";

import {
  parseAssetInput,
  parseAssetIdentityKey,
  type Asset,
  type AssetInput,
} from "@/domain/asset";
import { DomainError } from "@/domain/errors";
import { auth, db } from "@/lib/firebase/client";
import {
  createAssetFirestoreData,
  assetConverter,
} from "@/data/firestore/converters/asset-converter";
import {
  parseAssetIdentityDocument,
  type AssetFirestoreData,
} from "@/data/firestore/parsers/asset-parser";
import {
  assetCollectionPath,
  assetDocumentPath,
  assetIdentityCollectionPath,
  assetIdentityDocumentPath,
} from "@/data/firestore/paths";
import {
  AssetIdentityConflictError,
  AssetIdentityRegistryOrphanError,
  AssetNotFoundError,
  AssetWithoutRegistryError,
  FirestoreOperationError,
  InvalidFirestoreDocumentError,
  UnauthenticatedError,
} from "@/data/firestore/errors";
import { parseDocumentId } from "@/domain/value-objects";

type AssetDocumentReference = DocumentReference<Asset, AssetFirestoreData>;

function requireAuthenticatedUid(): string {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new UnauthenticatedError();
  }

  return uid;
}

function assetCollection(uid: string): CollectionReference<Asset, AssetFirestoreData> {
  return collection(db, assetCollectionPath(uid)).withConverter(assetConverter);
}

function assetDocument(uid: string, assetId: unknown): AssetDocumentReference {
  const id = parseDocumentId(assetId);

  return doc(db, assetDocumentPath(uid, id)).withConverter(assetConverter);
}

function assetIdentityDocument(uid: string, identityKey: unknown) {
  const key = parseAssetIdentityKey(identityKey);
  return doc(db, assetIdentityDocumentPath(uid, key));
}

async function executeFirestore<T>(
  operation: FirestoreOperationError["operation"],
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (
      error instanceof UnauthenticatedError ||
      error instanceof AssetNotFoundError ||
      error instanceof AssetIdentityConflictError ||
      error instanceof AssetIdentityRegistryOrphanError ||
      error instanceof AssetWithoutRegistryError ||
      error instanceof FirestoreOperationError ||
      error instanceof InvalidFirestoreDocumentError ||
      error instanceof DomainError
    ) {
      throw error;
    }

    throw new FirestoreOperationError(operation, "Asset");
  }
}

function assertRegistryMatchesAsset(
  asset: Asset,
  registry: ReturnType<typeof parseAssetIdentityDocument>,
): void {
  if (registry.assetId !== asset.id || registry.identityKey !== asset.identityKey) {
    throw new AssetIdentityConflictError();
  }
}

async function assertAssetHasRegistry(uid: string, asset: Asset): Promise<void> {
  const registrySnapshot = await getDoc(assetIdentityDocument(uid, asset.identityKey));

  if (!registrySnapshot.exists()) {
    throw new AssetWithoutRegistryError();
  }

  const registry = parseAssetIdentityDocument(
    registrySnapshot.id,
    registrySnapshot.data(),
  );
  assertRegistryMatchesAsset(asset, registry);
}

async function findAssetIdForIdentity(
  uid: string,
  identityKey: Asset["identityKey"],
): Promise<Asset["id"] | null> {
  const snapshot = await getDocs(assetCollection(uid));
  const asset = snapshot.docs
    .map((assetSnapshot) => assetSnapshot.data())
    .find((candidate) => candidate.identityKey === identityKey);

  return asset?.id ?? null;
}

async function readAssetCatalog(uid: string): Promise<readonly Asset[]> {
  const [assetSnapshot, registrySnapshot] = await Promise.all([
    getDocs(assetCollection(uid)),
    getDocs(collection(db, assetIdentityCollectionPath(uid))),
  ]);
  const assets = assetSnapshot.docs.map((snapshot) => snapshot.data());
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const seenAssetIds = new Set<string>();

  for (const asset of assets) {
    const registry = registrySnapshot.docs.find(
      (snapshot) => snapshot.id === asset.identityKey,
    );

    if (!registry) {
      throw new AssetWithoutRegistryError();
    }

    assertRegistryMatchesAsset(
      asset,
      parseAssetIdentityDocument(registry.id, registry.data()),
    );
  }

  for (const snapshot of registrySnapshot.docs) {
    const registry = parseAssetIdentityDocument(snapshot.id, snapshot.data());
    const asset = assetsById.get(registry.assetId);

    if (!asset) {
      throw new AssetIdentityRegistryOrphanError();
    }

    assertRegistryMatchesAsset(asset, registry);

    if (seenAssetIds.has(registry.assetId)) {
      throw new AssetIdentityConflictError();
    }

    seenAssetIds.add(registry.assetId);
  }

  return [...assets].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  );
}

function isRegistryConsistencyError(error: unknown): boolean {
  return (
    error instanceof AssetIdentityConflictError ||
    error instanceof AssetIdentityRegistryOrphanError ||
    error instanceof AssetWithoutRegistryError
  );
}

export async function createAsset(input: AssetInput): Promise<Asset> {
  const uid = requireAuthenticatedUid();
  const parsedInput = parseAssetInput(input);
  const identityKey = parseAssetIdentityKey(
    `${parsedInput.symbol}~${parsedInput.market}~${parsedInput.assetType}~${parsedInput.currency}`,
  );

  const assetId = await executeFirestore("create", () =>
    (async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const orphanAssetId = await findAssetIdForIdentity(uid, identityKey);

        try {
          return await runTransaction(db, async (transaction) => {
            const registryReference = assetIdentityDocument(uid, identityKey);
            const registrySnapshot = await transaction.get(registryReference);

            if (registrySnapshot.exists()) {
              const registry = parseAssetIdentityDocument(
                registrySnapshot.id,
                registrySnapshot.data(),
              );
              const existingReference = assetDocument(uid, registry.assetId);
              const existingSnapshot = await transaction.get(existingReference);

              if (!existingSnapshot.exists()) {
                throw new AssetIdentityRegistryOrphanError();
              }

              const existingAsset = existingSnapshot.data();
              assertRegistryMatchesAsset(existingAsset, registry);
              return existingAsset.id;
            }

            if (orphanAssetId !== null) {
              const orphanReference = assetDocument(uid, orphanAssetId);
              const orphanSnapshot = await transaction.get(orphanReference);

              if (orphanSnapshot.exists()) {
                throw new AssetWithoutRegistryError();
              }
            }

            const newReference = doc(assetCollection(uid));
            transaction.set(newReference, createAssetFirestoreData(parsedInput));
            transaction.set(
              registryReference,
              { assetId: newReference.id },
              { merge: false },
            );

            return newReference.id;
          });
        } catch (error) {
          if (!(error instanceof AssetWithoutRegistryError) || attempt === 2) {
            throw error;
          }

          await new Promise<void>((resolve) => setTimeout(resolve, 10));
        }
      }

      throw new AssetIdentityConflictError();
    })(),
  );

  const reference = assetDocument(uid, assetId);
  const snapshot = await executeFirestore("create", () => getDoc(reference));

  if (!snapshot.exists()) {
    throw new AssetNotFoundError();
  }

  const asset = snapshot.data();
  await executeFirestore("create", () => assertAssetHasRegistry(uid, asset));
  return asset;
}

export async function listAssets(): Promise<readonly Asset[]> {
  const uid = requireAuthenticatedUid();

  return executeFirestore("list", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await readAssetCatalog(uid);
      } catch (error) {
        if (!isRegistryConsistencyError(error) || attempt === 2) {
          throw error;
        }

        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      }
    }

    throw new AssetIdentityConflictError();
  });
}
