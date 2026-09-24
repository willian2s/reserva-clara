import { InvalidDomainInputError } from "@/domain/errors";

function assertPathSegment(value: unknown, field: string): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value === "." ||
    value === ".." ||
    value.includes("/")
  ) {
    throw new InvalidDomainInputError(
      field,
      "must be a non-empty path segment without separators",
    );
  }
}

export function portfolioCollectionPath(uid: string): string {
  assertPathSegment(uid, "uid");
  return `users/${uid}/portfolios`;
}

export function portfolioDocumentPath(uid: string, portfolioId: string): string {
  assertPathSegment(uid, "uid");
  assertPathSegment(portfolioId, "id");
  return `${portfolioCollectionPath(uid)}/${portfolioId}`;
}
