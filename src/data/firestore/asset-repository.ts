"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";

import {
  parseAssetInput,
  parseAssetUpdateInput,
  parseAssetIdentityKey,
  type Asset,
  type AssetInput,
  type AssetUpdateInput,
} from "@/domain/asset";
import { DomainError } from "@/domain/errors";
import { auth, db } from "@/lib/firebase/client";
import {
  createAssetFirestoreData,
  assetConverter,
  updateAssetFirestoreData,
} from "@/data/firestore/converters/asset-converter";
import { createAssetUsageFirestoreData } from "@/data/firestore/converters/asset-usage-converter";
import {
  parseAssetIdentityDocument,
  type AssetFirestoreData,
} from "@/data/firestore/parsers/asset-parser";
import {
  assetCollectionPath,
  assetDocumentPath,
  assetIdentityCollectionPath,
  assetIdentityDocumentPath,
  assetUsageDocumentPath,
  portfolioCollectionPath,
  transactionCollectionPath,
} from "@/data/firestore/paths";
import {
  AssetHasTransactionsError,
  AssetIdentityConflictError,
  AssetIdentityRegistryOrphanError,
  AssetNotFoundError,
  AssetWithoutRegistryError,
  AssetUsageConflictError,
  AssetUsageReconciliationIncompleteError,
  FirestoreOperationError,
  InvalidFirestoreDocumentError,
  UnauthenticatedError,
} from "@/data/firestore/errors";
import { parseDocumentId } from "@/domain/value-objects";
import { portfolioConverter } from "@/data/firestore/converters/portfolio-converter";
import { parseAssetUsageDocument } from "@/data/firestore/parsers/asset-usage-parser";

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

function assetWriteDocument(uid: string, assetId: unknown) {
  const id = parseDocumentId(assetId);

  return doc(db, assetDocumentPath(uid, id));
}

function assetIdentityDocument(uid: string, identityKey: unknown) {
  const key = parseAssetIdentityKey(identityKey);
  return doc(db, assetIdentityDocumentPath(uid, key));
}

function assetUsageDocument(uid: string, assetId: unknown) {
  const id = parseDocumentId(assetId);

  return doc(db, assetUsageDocumentPath(uid, id));
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
      error instanceof AssetHasTransactionsError ||
      error instanceof AssetUsageReconciliationIncompleteError ||
      error instanceof AssetUsageConflictError ||
      error instanceof FirestoreOperationError ||
      error instanceof InvalidFirestoreDocumentError ||
      error instanceof DomainError
    ) {
      throw error;
    }

    throw new FirestoreOperationError(operation, "Asset");
  }
}

function assertUsageData(
  snapshot: { exists(): boolean; id: string; data(): unknown },
  assetId: Asset["id"],
): void {
  if (!snapshot.exists()) {
    return;
  }

  const usage = parseAssetUsageDocument(snapshot.id, snapshot.data());
  if (usage.assetId !== assetId) {
    throw new AssetUsageConflictError();
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

export async function updateAsset(
  assetId: string,
  input: AssetUpdateInput,
): Promise<Asset> {
  const uid = requireAuthenticatedUid();
  const parsedAssetId = parseDocumentId(assetId);
  const parsedInput = parseAssetUpdateInput(input);
  const nextIdentityKey = parseAssetIdentityKey(
    `${parsedInput.symbol}~${parsedInput.market}~${parsedInput.assetType}~${parsedInput.currency}`,
  );

  await executeFirestore("update", async () => {
    const orphanAssetId = await findAssetIdForIdentity(uid, nextIdentityKey);

    return runTransaction(db, async (firestoreTransaction) => {
      const assetReference = assetDocument(uid, parsedAssetId);
      const assetSnapshot = await firestoreTransaction.get(assetReference);

      if (!assetSnapshot.exists()) {
        throw new AssetNotFoundError();
      }

      const asset = assetSnapshot.data();
      const oldRegistryReference = assetIdentityDocument(uid, asset.identityKey);
      const oldRegistrySnapshot = await firestoreTransaction.get(oldRegistryReference);

      if (!oldRegistrySnapshot.exists()) {
        throw new AssetWithoutRegistryError();
      }

      const oldRegistry = parseAssetIdentityDocument(
        oldRegistrySnapshot.id,
        oldRegistrySnapshot.data(),
      );
      assertRegistryMatchesAsset(asset, oldRegistry);

      if (nextIdentityKey !== asset.identityKey) {
        const nextRegistryReference = assetIdentityDocument(uid, nextIdentityKey);
        const nextRegistrySnapshot = await firestoreTransaction.get(nextRegistryReference);

        if (nextRegistrySnapshot.exists()) {
          const nextRegistry = parseAssetIdentityDocument(
            nextRegistrySnapshot.id,
            nextRegistrySnapshot.data(),
          );
          const registeredAssetSnapshot = await firestoreTransaction.get(
            assetDocument(uid, nextRegistry.assetId),
          );

          if (!registeredAssetSnapshot.exists()) {
            throw new AssetIdentityRegistryOrphanError();
          }

          throw new AssetIdentityConflictError();
        }

        if (orphanAssetId !== null && orphanAssetId !== asset.id) {
          const candidateSnapshot = await firestoreTransaction.get(
            assetDocument(uid, orphanAssetId),
          );

          if (candidateSnapshot.exists()) {
            const candidate = candidateSnapshot.data();
            const candidateRegistrySnapshot = await firestoreTransaction.get(
              assetIdentityDocument(uid, candidate.identityKey),
            );

            if (!candidateRegistrySnapshot.exists()) {
              throw new AssetWithoutRegistryError();
            }

            assertRegistryMatchesAsset(
              candidate,
              parseAssetIdentityDocument(
                candidateRegistrySnapshot.id,
                candidateRegistrySnapshot.data(),
              ),
            );
            throw new AssetIdentityConflictError();
          }
        }

        firestoreTransaction.delete(oldRegistryReference);
        firestoreTransaction.set(
          nextRegistryReference,
          { assetId: asset.id },
          { merge: false },
        );
      }

      firestoreTransaction.update(
        assetWriteDocument(uid, asset.id),
        updateAssetFirestoreData(parsedInput),
      );
    });
  });

  const reference = assetDocument(uid, parsedAssetId);
  const snapshot = await executeFirestore("update", () => getDoc(reference));

  if (!snapshot.exists()) {
    throw new AssetNotFoundError();
  }

  return snapshot.data();
}

export type AssetUsageReconciliation = Readonly<{
  complete: boolean;
  transactionCount: number;
  portfolioCount: number;
}>;

async function createOrConfirmAssetUsage(
  uid: string,
  assetId: Asset["id"],
): Promise<void> {
  await runTransaction(db, async (firestoreTransaction) => {
    const reference = assetUsageDocument(uid, assetId);
    const snapshot = await firestoreTransaction.get(reference);

    if (snapshot.exists()) {
      assertUsageData(snapshot, assetId);
      return;
    }

    firestoreTransaction.set(
      reference,
      createAssetUsageFirestoreData(assetId),
      { merge: false },
    );
  });
}

export async function reconcileAssetUsage(
  assetId: string,
): Promise<AssetUsageReconciliation> {
  let transactionCount = 0;
  let portfolioCount = 0;

  try {
    const uid = requireAuthenticatedUid();
    const parsedAssetId = parseDocumentId(assetId);
    const portfolios = await getDocs(
      collection(db, portfolioCollectionPath(uid)).withConverter(portfolioConverter),
    );
    portfolioCount = portfolios.size;
    let hasUsage = false;

    for (const portfolio of portfolios.docs) {
      const transactions = await getDocs(
        query(
          collection(db, transactionCollectionPath(uid, portfolio.id)),
          where("assetId", "==", parsedAssetId),
        ),
      );
      transactionCount += transactions.size;
      hasUsage ||= transactions.size > 0;
    }

    if (hasUsage) {
      await createOrConfirmAssetUsage(uid, parsedAssetId);
    }

    return { complete: true, transactionCount, portfolioCount };
  } catch {
    return { complete: false, transactionCount, portfolioCount };
  }
}

export async function deleteAsset(assetId: string): Promise<void> {
  const uid = requireAuthenticatedUid();
  const parsedAssetId = parseDocumentId(assetId);
  const reconciliation = await reconcileAssetUsage(parsedAssetId);

  if (!reconciliation.complete) {
    throw new AssetUsageReconciliationIncompleteError();
  }

  await executeFirestore("delete", () =>
    runTransaction(db, async (firestoreTransaction) => {
      const assetReference = assetDocument(uid, parsedAssetId);
      const assetSnapshot = await firestoreTransaction.get(assetReference);

      if (!assetSnapshot.exists()) {
        throw new AssetNotFoundError();
      }

      const asset = assetSnapshot.data();
      const registryReference = assetIdentityDocument(uid, asset.identityKey);
      const registrySnapshot = await firestoreTransaction.get(registryReference);
      const usageSnapshot = await firestoreTransaction.get(
        assetUsageDocument(uid, parsedAssetId),
      );

      if (!registrySnapshot.exists()) {
        throw new AssetWithoutRegistryError();
      }

      assertRegistryMatchesAsset(
        asset,
        parseAssetIdentityDocument(registrySnapshot.id, registrySnapshot.data()),
      );

      if (usageSnapshot.exists()) {
        assertUsageData(usageSnapshot, parsedAssetId);
        throw new AssetHasTransactionsError();
      }

      firestoreTransaction.delete(assetWriteDocument(uid, parsedAssetId));
      firestoreTransaction.delete(registryReference);
    }),
  );
}
