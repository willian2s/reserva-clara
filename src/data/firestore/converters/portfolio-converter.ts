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
  parseCreatePortfolioInput,
  parseUpdatePortfolioInput,
  parsePortfolioName,
  type Portfolio,
} from "@/domain/portfolio";
import {
  parseBaseCurrencyCode,
  parseDocumentId,
  parseInstant,
  type BaseCurrencyCode,
} from "@/domain/value-objects";
import { InvalidDomainInputError } from "@/domain/errors";
import {
  parsePortfolioDocument,
  type PortfolioFirestoreData,
} from "@/data/firestore/parsers/portfolio-parser";

type PortfolioFirestoreWriteData = Readonly<{
  name: string;
  baseCurrency: BaseCurrencyCode;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePortfolioForWrite(value: unknown): Portfolio {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("portfolio", "must be an object");
  }

  return {
    id: parseDocumentId(value.id),
    name: parsePortfolioName(value.name),
    baseCurrency: parseBaseCurrencyCode(value.baseCurrency),
    createdAt: parseInstant(value.createdAt, "createdAt"),
    updatedAt: parseInstant(value.updatedAt, "updatedAt"),
  };
}

export function portfolioToFirestore(value: unknown): PortfolioFirestoreWriteData {
  const portfolio = parsePortfolioForWrite(value);

  return {
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
    createdAt: Timestamp.fromDate(parseInstant(portfolio.createdAt, "createdAt")),
    updatedAt: Timestamp.fromDate(parseInstant(portfolio.updatedAt, "updatedAt")),
  };
}

export function createPortfolioFirestoreData(
  input: unknown,
): PartialWithFieldValue<Portfolio> {
  const portfolio = parseCreatePortfolioInput(input);

  return {
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function updatePortfolioFirestoreData(
  input: unknown,
): PartialWithFieldValue<Portfolio> {
  const portfolio = parseUpdatePortfolioInput(input);

  return {
    name: portfolio.name,
    updatedAt: serverTimestamp(),
  };
}

function isFieldValue(value: unknown): value is FieldValue {
  return value instanceof FieldValue;
}

function parseWriteName(value: unknown): string {
  if (isFieldValue(value)) {
    throw new InvalidDomainInputError("name", "cannot use a field value");
  }

  return parsePortfolioName(value);
}

function parseWriteBaseCurrency(value: unknown): BaseCurrencyCode {
  if (isFieldValue(value)) {
    throw new InvalidDomainInputError(
      "baseCurrency",
      "cannot use a field value",
    );
  }

  return parseBaseCurrencyCode(value);
}

function parseWriteTimestamp(
  value: unknown,
  field: "createdAt" | "updatedAt",
): Timestamp | FieldValue {
  if (isFieldValue(value)) {
    return value;
  }

  return Timestamp.fromDate(parseInstant(value, field));
}

function hasRequiredPortfolioFields(value: Record<string, unknown>): boolean {
  return ["name", "baseCurrency", "createdAt", "updatedAt"].every((field) =>
    Object.hasOwn(value, field),
  );
}

function toFirestoreData(
  value: unknown,
  requireComplete: boolean,
): WithFieldValue<PortfolioFirestoreData> | PartialWithFieldValue<PortfolioFirestoreData> {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("portfolio", "must be an object");
  }

  if (requireComplete && !hasRequiredPortfolioFields(value)) {
    throw new InvalidDomainInputError(
      "portfolio",
      "must contain all persisted fields",
    );
  }

  const data: Record<string, unknown> = {};

  if (Object.hasOwn(value, "name")) {
    data.name = parseWriteName(value.name);
  }

  if (Object.hasOwn(value, "baseCurrency")) {
    data.baseCurrency = parseWriteBaseCurrency(value.baseCurrency);
  }

  if (Object.hasOwn(value, "createdAt")) {
    data.createdAt = parseWriteTimestamp(value.createdAt, "createdAt");
  }

  if (Object.hasOwn(value, "updatedAt")) {
    data.updatedAt = parseWriteTimestamp(value.updatedAt, "updatedAt");
  }

  return data as
    | WithFieldValue<PortfolioFirestoreData>
    | PartialWithFieldValue<PortfolioFirestoreData>;
}

function toFirestore(
  modelObject: WithFieldValue<Portfolio>,
): WithFieldValue<PortfolioFirestoreData>;
function toFirestore(
  modelObject: PartialWithFieldValue<Portfolio>,
  _options: SetOptions,
): PartialWithFieldValue<PortfolioFirestoreData>;
function toFirestore(
  modelObject: WithFieldValue<Portfolio> | PartialWithFieldValue<Portfolio>,
  options?: SetOptions,
): WithFieldValue<PortfolioFirestoreData> | PartialWithFieldValue<PortfolioFirestoreData> {
  const partialWrite =
    options !== undefined &&
    ("mergeFields" in options || ("merge" in options && options.merge === true));

  return toFirestoreData(modelObject, !partialWrite);
}

export const portfolioConverter: FirestoreDataConverter<
  Portfolio,
  PortfolioFirestoreData
> = {
  toFirestore,

  fromFirestore(snapshot, options) {
    return parsePortfolioDocument(snapshot.id, snapshot.data(options));
  },
};
