export class InvalidFirestoreDocumentError extends Error {
  readonly code = "INVALID_FIRESTORE_DOCUMENT" as const;

  constructor(readonly field: string) {
    super(`Invalid Firestore document: ${field}`);
    this.name = "InvalidFirestoreDocumentError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type FirestoreOperation = "create" | "get" | "list" | "update" | "delete";

export class UnauthenticatedError extends Error {
  readonly code = "UNAUTHENTICATED" as const;

  constructor() {
    super("Authentication is required");
    this.name = "UnauthenticatedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PortfolioNotFoundError extends Error {
  readonly code = "PORTFOLIO_NOT_FOUND" as const;

  constructor() {
    super("Portfolio was not found");
    this.name = "PortfolioNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FirestoreOperationError extends Error {
  readonly code = "FIRESTORE_OPERATION_FAILED" as const;

  constructor(readonly operation: FirestoreOperation) {
    super(`Portfolio ${operation} failed`);
    this.name = "FirestoreOperationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
