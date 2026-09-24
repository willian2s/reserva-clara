"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentReference,
} from "firebase/firestore";

import { DomainError } from "@/domain/errors";
import {
  parseCreatePortfolioInput,
  parseUpdatePortfolioInput,
  type CreatePortfolioInput,
  type Portfolio,
  type UpdatePortfolioInput,
} from "@/domain/portfolio";
import { parseDocumentId } from "@/domain/value-objects";
import { auth, db } from "@/lib/firebase/client";
import {
  createPortfolioFirestoreData,
  portfolioConverter,
  updatePortfolioFirestoreData,
} from "@/data/firestore/converters/portfolio-converter";
import type { PortfolioFirestoreData } from "@/data/firestore/parsers/portfolio-parser";
import { portfolioCollectionPath, portfolioDocumentPath } from "@/data/firestore/paths";
import {
  FirestoreOperationError,
  InvalidFirestoreDocumentError,
  PortfolioNotFoundError,
  UnauthenticatedError,
} from "@/data/firestore/errors";

type PortfolioDocumentReference = DocumentReference<Portfolio, PortfolioFirestoreData>;

function requireAuthenticatedUid(): string {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new UnauthenticatedError();
  }

  return uid;
}

function portfolioCollection(uid: string) {
  return collection(db, portfolioCollectionPath(uid)).withConverter(portfolioConverter);
}

function portfolioDocument(uid: string, portfolioId: unknown): PortfolioDocumentReference {
  const id = parseDocumentId(portfolioId);

  return doc(
    db,
    portfolioDocumentPath(uid, id),
  ).withConverter(portfolioConverter);
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
      error instanceof FirestoreOperationError ||
      error instanceof InvalidFirestoreDocumentError ||
      error instanceof DomainError
    ) {
      throw error;
    }

    throw new FirestoreOperationError(operation);
  }
}

async function readPortfolio(
  reference: PortfolioDocumentReference,
): Promise<Portfolio | null> {
  const snapshot = await getDoc(reference);

  return snapshot.exists() ? snapshot.data() : null;
}

async function requireExistingPortfolio(
  reference: PortfolioDocumentReference,
): Promise<Portfolio> {
  const portfolio = await readPortfolio(reference);

  if (!portfolio) {
    throw new PortfolioNotFoundError();
  }

  return portfolio;
}

export async function createPortfolio(
  input: CreatePortfolioInput,
): Promise<Portfolio> {
  const uid = requireAuthenticatedUid();
  const parsedInput = parseCreatePortfolioInput(input);
  const reference = doc(portfolioCollection(uid));

  await executeFirestore("create", () =>
    setDoc(reference, createPortfolioFirestoreData(parsedInput), { merge: false }),
  );

  const portfolio = await executeFirestore("create", () => readPortfolio(reference));

  if (!portfolio) {
    throw new FirestoreOperationError("create");
  }

  return portfolio;
}

export async function getPortfolio(
  portfolioId: string,
): Promise<Portfolio | null> {
  const uid = requireAuthenticatedUid();
  const reference = portfolioDocument(uid, portfolioId);

  return executeFirestore("get", () => readPortfolio(reference));
}

export async function listPortfolios(): Promise<readonly Portfolio[]> {
  const uid = requireAuthenticatedUid();
  const reference = portfolioCollection(uid);

  return executeFirestore("list", async () => {
    const snapshot = await getDocs(reference);
    return snapshot.docs.map((portfolioSnapshot) => portfolioSnapshot.data());
  });
}

export async function updatePortfolio(
  portfolioId: string,
  input: UpdatePortfolioInput,
): Promise<Portfolio> {
  const uid = requireAuthenticatedUid();
  const parsedInput = parseUpdatePortfolioInput(input);
  const reference = portfolioDocument(uid, portfolioId);

  await executeFirestore("update", async () => {
    await requireExistingPortfolio(reference);

    const firestoreData = portfolioConverter.toFirestore(
      updatePortfolioFirestoreData(parsedInput),
      { merge: true },
    );

    await updateDoc(reference, firestoreData);
  });

  const portfolio = await executeFirestore("update", () => readPortfolio(reference));

  if (!portfolio) {
    throw new PortfolioNotFoundError();
  }

  return portfolio;
}

/** Deletes only parent document; future Portfolio subcollections do not cascade. */
export async function deletePortfolio(portfolioId: string): Promise<void> {
  const uid = requireAuthenticatedUid();
  const reference = portfolioDocument(uid, portfolioId);

  await executeFirestore("delete", () => deleteDoc(reference));
}
