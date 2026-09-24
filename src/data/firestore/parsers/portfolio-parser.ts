import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import {
  createPortfolio,
  type Portfolio,
  type PortfolioMetadata,
} from "@/domain/portfolio";
import { InvalidDomainInputError, InvalidDomainValueError } from "@/domain/errors";
import { InvalidFirestoreDocumentError } from "@/data/firestore/errors";

const PORTFOLIO_FIELDS = [
  "name",
  "baseCurrency",
  "createdAt",
  "updatedAt",
] as const;

export type PortfolioFirestoreData = Readonly<{
  name: string;
  baseCurrency: "BRL";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(field: string): never {
  throw new InvalidFirestoreDocumentError(field);
}

function assertExactFields(value: Record<string, unknown>): void {
  const actualFields = Object.keys(value).sort();
  const expectedFields = [...PORTFOLIO_FIELDS].sort();

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

function parsePortfolioMetadata(
  id: unknown,
  data: Record<string, unknown>,
): PortfolioMetadata {
  return {
    id,
    createdAt: parseTimestamp(data.createdAt, "createdAt"),
    updatedAt: parseTimestamp(data.updatedAt, "updatedAt"),
  };
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

export function parsePortfolioDocument(
  id: unknown,
  data: unknown,
): Portfolio {
  if (!isRecord(data)) {
    invalid("document");
  }

  assertExactFields(data);

  try {
    return createPortfolio(
      {
        name: data.name,
        baseCurrency: data.baseCurrency,
      },
      parsePortfolioMetadata(id, data),
    );
  } catch (error) {
    return toInvalidFirestoreDocument(error);
  }
}

export function parsePortfolioSnapshot(
  snapshot: DocumentSnapshot<DocumentData, DocumentData>,
  options?: SnapshotOptions,
): Portfolio {
  if (!snapshot.exists()) {
    invalid("document");
  }

  return parsePortfolioDocument(snapshot.id, snapshot.data(options));
}

export { PORTFOLIO_FIELDS };
