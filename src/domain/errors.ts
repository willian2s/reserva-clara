export type DomainErrorCode =
  | "INVALID_DOMAIN_INPUT"
  | "INVALID_DOMAIN_VALUE";

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
  ) {
    super(`${field}: ${reason}`, "INVALID_DOMAIN_VALUE");
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
