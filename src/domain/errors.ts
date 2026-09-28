export type DomainErrorCode =
  | "INVALID_DOMAIN_INPUT"
  | "INVALID_DOMAIN_VALUE"
  | "INVALID_DECIMAL"
  | "INVALID_DATE"
  | "INVALID_REFERENCE"
  | "INSUFFICIENT_QUANTITY"
  | "TRANSACTION_CONFLICT";

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
