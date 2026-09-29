import {
  BASE_CURRENCY,
  parseBaseCurrencyCode,
  parseDocumentId,
  parseInstant,
} from "./value-objects";
import {
  InvalidDomainInputError,
  InvalidDomainValueError,
} from "./errors";

const PORTFOLIO_INPUT_FIELDS = ["name", "baseCurrency"] as const;
const PORTFOLIO_UPDATE_FIELDS = ["name"] as const;

export type Portfolio = Readonly<{
  /** Firestore document ID; never derived from name or ticker. */
  id: ReturnType<typeof parseDocumentId>;
  name: string;
  baseCurrency: typeof BASE_CURRENCY;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type CreatePortfolioInput = Readonly<{
  name: string;
  baseCurrency: typeof BASE_CURRENCY;
}>;

/** V1 permits renaming only; base currency remains fixed at BRL. */
export type UpdatePortfolioInput = Readonly<{
  name: string;
}>;

export type PortfolioMetadata = Readonly<{
  id: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  /** Optional for callers constructing legacy-compatible domain metadata. */
  archivedAt?: unknown;
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

export function parsePortfolioName(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidDomainValueError("name", "must be a string");
  }

  const name = value.trim();
  const characterCount = [...name].length;

  if (characterCount < 1 || characterCount > 100) {
    throw new InvalidDomainValueError(
      "name",
      "must contain between 1 and 100 characters after trim",
    );
  }

  return name;
}

export function parseCreatePortfolioInput(value: unknown): CreatePortfolioInput {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("portfolio", "must be an object");
  }

  assertExactKeys(value, PORTFOLIO_INPUT_FIELDS, "portfolio");

  return {
    name: parsePortfolioName(value.name),
    baseCurrency: parseBaseCurrencyCode(value.baseCurrency),
  };
}

export function parseUpdatePortfolioInput(value: unknown): UpdatePortfolioInput {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("portfolio", "must be an object");
  }

  assertExactKeys(value, PORTFOLIO_UPDATE_FIELDS, "portfolio");

  return { name: parsePortfolioName(value.name) };
}

export function parsePortfolioArchivedAt(value: unknown): Date | null {
  if (value === null) {
    return null;
  }

  return parseInstant(value, "archivedAt");
}

export function createPortfolio(
  input: unknown,
  metadata: PortfolioMetadata,
): Portfolio {
  const parsedInput = parseCreatePortfolioInput(input);

  if (!isRecord(metadata)) {
    throw new InvalidDomainInputError("portfolio.metadata", "must be an object");
  }

  return {
    id: parseDocumentId(metadata.id),
    name: parsedInput.name,
    baseCurrency: parsedInput.baseCurrency,
    archivedAt: parsePortfolioArchivedAt(metadata.archivedAt ?? null),
    createdAt: parseInstant(metadata.createdAt, "createdAt"),
    updatedAt: parseInstant(metadata.updatedAt, "updatedAt"),
  };
}
