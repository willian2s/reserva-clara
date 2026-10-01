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

export class PortfolioArchivedError extends Error {
  readonly code = "PORTFOLIO_ARCHIVED" as const;

  constructor() {
    super("Archived portfolios do not accept new transactions");
    this.name = "PortfolioArchivedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssetNotFoundError extends Error {
  readonly code = "ASSET_NOT_FOUND" as const;

  constructor() {
    super("Asset was not found");
    this.name = "AssetNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssetIdentityConflictError extends Error {
  readonly code = "ASSET_IDENTITY_CONFLICT" as const;

  constructor() {
    super("Asset identity is inconsistent");
    this.name = "AssetIdentityConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssetIdentityRegistryOrphanError extends Error {
  readonly code = "ASSET_IDENTITY_REGISTRY_ORPHAN" as const;

  constructor() {
    super("Asset identity registry is orphaned");
    this.name = "AssetIdentityRegistryOrphanError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssetWithoutRegistryError extends Error {
  readonly code = "ASSET_WITHOUT_REGISTRY" as const;

  constructor() {
    super("Asset identity registry is missing");
    this.name = "AssetWithoutRegistryError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssetHasTransactionsError extends Error {
  readonly code = "ASSET_HAS_TRANSACTIONS" as const;

  constructor() {
    super("Não é possível excluir este ativo porque existem operações vinculadas.");
    this.name = "AssetHasTransactionsError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssetUsageReconciliationIncompleteError extends Error {
  readonly code = "ASSET_USAGE_RECONCILIATION_INCOMPLETE" as const;

  constructor() {
    super("Não foi possível verificar todas as operações vinculadas ao ativo.");
    this.name = "AssetUsageReconciliationIncompleteError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssetUsageConflictError extends Error {
  readonly code = "ASSET_USAGE_CONFLICT" as const;

  constructor() {
    super("Asset usage guard is inconsistent");
    this.name = "AssetUsageConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FirestoreOperationError extends Error {
  readonly code = "FIRESTORE_OPERATION_FAILED" as const;

  constructor(
    readonly operation: FirestoreOperation,
    resource = "Portfolio",
  ) {
    super(`${resource} ${operation} failed`);
    this.name = "FirestoreOperationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
