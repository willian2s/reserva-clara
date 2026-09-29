"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";

import {
  createTransaction as createDomainTransaction,
  parseTransactionInput,
  type Transaction,
  type TransactionInput,
} from "@/domain/transaction";
import { reduceTransactionQuantity, sortTransactions } from "@/domain/decimal-reducer";
import { DomainError, TransactionConflictError } from "@/domain/errors";
import type { Asset } from "@/domain/asset";
import type { Portfolio } from "@/domain/portfolio";
import { parseDocumentId } from "@/domain/value-objects";
import { portfolioConverter } from "@/data/firestore/converters/portfolio-converter";
import {
  createTransactionFirestoreData,
  transactionConverter,
} from "@/data/firestore/converters/transaction-converter";
import { assetConverter } from "@/data/firestore/converters/asset-converter";
import type { AssetFirestoreData } from "@/data/firestore/parsers/asset-parser";
import type { PortfolioFirestoreData } from "@/data/firestore/parsers/portfolio-parser";
import type { TransactionFirestoreData } from "@/data/firestore/parsers/transaction-parser";
import {
  assetDocumentPath,
  portfolioDocumentPath,
  transactionCollectionPath,
  transactionDocumentPath,
} from "@/data/firestore/paths";
import {
  AssetNotFoundError,
  FirestoreOperationError,
  InvalidFirestoreDocumentError,
  PortfolioArchivedError,
  PortfolioNotFoundError,
  UnauthenticatedError,
} from "@/data/firestore/errors";
import { auth, db } from "@/lib/firebase/client";

type PortfolioDocumentReference = DocumentReference<
  Portfolio,
  PortfolioFirestoreData
>;
type TransactionDocumentReference = DocumentReference<Transaction, TransactionFirestoreData>;
type AssetDocumentReference = DocumentReference<
  Asset,
  AssetFirestoreData
>;

function requireAuthenticatedUid(): string {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new UnauthenticatedError();
  }

  return uid;
}

function portfolioDocument(uid: string, portfolioId: string): PortfolioDocumentReference {
  return doc(db, portfolioDocumentPath(uid, portfolioId)).withConverter(portfolioConverter);
}

function portfolioWriteDocument(uid: string, portfolioId: string) {
  return doc(db, portfolioDocumentPath(uid, portfolioId));
}

function assetDocument(uid: string, assetId: string): AssetDocumentReference {
  return doc(db, assetDocumentPath(uid, assetId)).withConverter(assetConverter);
}

function transactionCollection(
  uid: string,
  portfolioId: string,
): CollectionReference<Transaction, TransactionFirestoreData> {
  return collection(db, transactionCollectionPath(uid, portfolioId)).withConverter(
    transactionConverter,
  );
}

function transactionDocument(
  uid: string,
  portfolioId: string,
  transactionId: string,
): TransactionDocumentReference {
  return doc(db, transactionDocumentPath(uid, portfolioId, transactionId)).withConverter(
    transactionConverter,
  );
}

function transactionWriteDocument(
  uid: string,
  portfolioId: string,
  transactionId: string,
) {
  return doc(db, transactionDocumentPath(uid, portfolioId, transactionId));
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
      error instanceof PortfolioNotFoundError ||
      error instanceof PortfolioArchivedError ||
      error instanceof AssetNotFoundError ||
      error instanceof FirestoreOperationError ||
      error instanceof InvalidFirestoreDocumentError ||
      error instanceof DomainError
    ) {
      throw error;
    }

    throw new FirestoreOperationError(operation, "Transaction");
  }
}

function hasSamePayload(left: Transaction, right: TransactionInput): boolean {
  return (
    left.kind === right.kind &&
    left.assetId === right.assetId &&
    left.quantity === right.quantity &&
    left.unitPrice.currency === right.unitPrice.currency &&
    left.unitPrice.decimal === right.unitPrice.decimal &&
    left.effectiveDate === right.effectiveDate
  );
}

function transactionForValidation(
  input: TransactionInput,
  transactionId: string,
): Transaction {
  return createDomainTransaction(
    {
      ...input,
      createdAt: {
        seconds: Number.MAX_SAFE_INTEGER,
        nanoseconds: 999_999_999,
      },
    },
    { id: transactionId },
  );
}

export async function createTransaction(
  portfolioId: string,
  input: TransactionInput,
  transactionId?: string,
): Promise<Transaction> {
  const uid = requireAuthenticatedUid();
  const parsedPortfolioId = parseDocumentId(portfolioId);
  const parsedInput = parseTransactionInput(input);
  const parsedTransactionId =
    transactionId === undefined
      ? doc(transactionCollection(uid, parsedPortfolioId)).id
      : parseDocumentId(transactionId);

  await executeFirestore("create", () =>
    runTransaction(db, async (firestoreTransaction) => {
      const portfolioReference = portfolioDocument(uid, parsedPortfolioId);
      const assetReference = assetDocument(uid, parsedInput.assetId);
      const existingReference = transactionDocument(
        uid,
        parsedPortfolioId,
        parsedTransactionId,
      );
      const ledgerReference = transactionCollection(uid, parsedPortfolioId);

      const portfolioSnapshot = await firestoreTransaction.get(portfolioReference);
      const assetSnapshot = await firestoreTransaction.get(assetReference);
      const existingSnapshot = await firestoreTransaction.get(existingReference);

      if (!portfolioSnapshot.exists()) {
        throw new PortfolioNotFoundError();
      }

      if (!assetSnapshot.exists()) {
        throw new AssetNotFoundError();
      }

      if (existingSnapshot.exists()) {
        const existing = existingSnapshot.data();

        if (!hasSamePayload(existing, parsedInput)) {
          throw new TransactionConflictError();
        }

        return;
      }

      if (portfolioSnapshot.data().archivedAt !== null) {
        throw new PortfolioArchivedError();
      }

      const ledgerSnapshot = await getDocs(ledgerReference);
      const ledgerSnapshots = await Promise.all(
        ledgerSnapshot.docs.map((snapshot) =>
          firestoreTransaction.get(snapshot.ref),
        ),
      );
      const ledger = ledgerSnapshots
        .filter((snapshot) => snapshot.exists())
        .map((snapshot) => snapshot.data());
      const candidate = transactionForValidation(parsedInput, parsedTransactionId);

      if (candidate.kind === "sell") {
        reduceTransactionQuantity(
          [...ledger, candidate],
          candidate.assetId,
        );
      }

      firestoreTransaction.set(
        transactionWriteDocument(uid, parsedPortfolioId, parsedTransactionId),
        createTransactionFirestoreData(parsedInput),
        { merge: false },
      );
      firestoreTransaction.update(portfolioWriteDocument(uid, parsedPortfolioId), {
        updatedAt: serverTimestamp(),
      });
    }),
  );

  const reference = transactionDocument(
    uid,
    parsedPortfolioId,
    parsedTransactionId,
  );
  const snapshot = await executeFirestore("create", () => getDoc(reference));

  if (!snapshot.exists()) {
    throw new FirestoreOperationError("create", "Transaction");
  }

  return snapshot.data();
}

export async function listTransactions(
  portfolioId: string,
): Promise<readonly Transaction[]> {
  const uid = requireAuthenticatedUid();
  const parsedPortfolioId = parseDocumentId(portfolioId);

  return executeFirestore("list", async () => {
    const snapshot = await getDocs(transactionCollection(uid, parsedPortfolioId));
    return sortTransactions(snapshot.docs.map((transactionSnapshot) => transactionSnapshot.data()));
  });
}
