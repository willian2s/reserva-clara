export type DomainErrorCode =
  | "INVALID_DOMAIN_INPUT"
  | "INVALID_DOMAIN_VALUE"
  | "INVALID_DECIMAL"
  | "INVALID_DATE"
  | "INVALID_REFERENCE"
  | "INSUFFICIENT_QUANTITY"
  | "TRANSACTION_CONFLICT"
  | "POSITION_ARITHMETIC_OVERFLOW"
  | "POSITION_ASSET_NOT_FOUND"
  | "POSITION_ASSET_MISMATCH"
  | "POSITION_CURRENCY_MISMATCH"
  | "POSITION_INVALID_LEDGER";

export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: DomainErrorCode,
  ) {
    super(message);
    this.name = "DomainError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidDomainValueError extends DomainError {
  constructor(
    readonly field: string,
    reason: string,
    code: DomainErrorCode = "INVALID_DOMAIN_VALUE",
  ) {
    super(`${field}: ${reason}`, code);
    this.name = "InvalidDomainValueError";
  }
}

export class InvalidDomainInputError extends DomainError {
  constructor(
    readonly field: string,
    reason: string,
  ) {
    super(`${field}: ${reason}`, "INVALID_DOMAIN_INPUT");
    this.name = "InvalidDomainInputError";
  }
}

export class InvalidDecimalError extends InvalidDomainValueError {
  constructor(field = "decimal", reason = "must be a valid decimal") {
    super(field, reason, "INVALID_DECIMAL");
    this.name = "InvalidDecimalError";
  }
}

export class InvalidDateError extends InvalidDomainValueError {
  constructor(field = "effectiveDate", reason = "must be a real calendar date") {
    super(field, reason, "INVALID_DATE");
    this.name = "InvalidDateError";
  }
}

export class InvalidReferenceError extends InvalidDomainValueError {
  constructor(field = "reference", reason = "must be a valid document ID") {
    super(field, reason, "INVALID_REFERENCE");
    this.name = "InvalidReferenceError";
  }
}

export class InsufficientQuantityError extends DomainError {
  constructor() {
    super("quantity: sell exceeds the available quantity", "INSUFFICIENT_QUANTITY");
    this.name = "InsufficientQuantityError";
  }
}

export class TransactionConflictError extends DomainError {
  constructor() {
    super("transaction: immutable payload conflicts with the existing event", "TRANSACTION_CONFLICT");
    this.name = "TransactionConflictError";
  }
}

export class DecimalArithmeticOverflowError extends DomainError {
  constructor() {
    super(
      "decimal: calculation result exceeds the canonical precision limits",
      "POSITION_ARITHMETIC_OVERFLOW",
    );
    this.name = "DecimalArithmeticOverflowError";
  }
}

export class PositionAssetNotFoundError extends DomainError {
  constructor() {
    super("position: transaction references an unknown Asset", "POSITION_ASSET_NOT_FOUND");
    this.name = "PositionAssetNotFoundError";
  }
}

export class PositionAssetMismatchError extends DomainError {
  constructor() {
    super(
      "position: transaction does not belong to the requested Asset",
      "POSITION_ASSET_MISMATCH",
    );
    this.name = "PositionAssetMismatchError";
  }
}

export class PositionCurrencyMismatchError extends DomainError {
  constructor() {
    super(
      "position: transaction price or fee uses an incompatible currency",
      "POSITION_CURRENCY_MISMATCH",
    );
    this.name = "PositionCurrencyMismatchError";
  }
}

export class PositionInvalidLedgerError extends DomainError {
  constructor() {
    super("position: ledger references are inconsistent", "POSITION_INVALID_LEDGER");
    this.name = "PositionInvalidLedgerError";
  }
}
