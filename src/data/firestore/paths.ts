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

export function assetCollectionPath(uid: string): string {
  assertPathSegment(uid, "uid");
  return `users/${uid}/assets`;
}

export function assetDocumentPath(uid: string, assetId: string): string {
  assertPathSegment(uid, "uid");
  assertPathSegment(assetId, "assetId");
  return `${assetCollectionPath(uid)}/${assetId}`;
}

export function assetIdentityCollectionPath(uid: string): string {
  assertPathSegment(uid, "uid");
  return `users/${uid}/assetIdentities`;
}

export function assetIdentityDocumentPath(uid: string, identityKey: string): string {
  assertPathSegment(uid, "uid");
  assertPathSegment(identityKey, "identityKey");
  return `${assetIdentityCollectionPath(uid)}/${identityKey}`;
}

export function transactionCollectionPath(uid: string, portfolioId: string): string {
  assertPathSegment(uid, "uid");
  assertPathSegment(portfolioId, "portfolioId");
  return `${portfolioDocumentPath(uid, portfolioId)}/transactions`;
}

export function transactionDocumentPath(
  uid: string,
  portfolioId: string,
  transactionId: string,
): string {
  assertPathSegment(transactionId, "transactionId");
  return `${transactionCollectionPath(uid, portfolioId)}/${transactionId}`;
}
