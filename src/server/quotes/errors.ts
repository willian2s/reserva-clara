import type { QuoteErrorCode } from "../../domain/quote";

export type BrapiFailureCode = Extract<
  QuoteErrorCode,
  | "UNSUPPORTED_ASSET"
  | "CURRENCY_MISMATCH"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_PROVIDER_RESPONSE"
  | "NOT_CONFIGURED"
>;

/**
 * Internal provider failure. Its shape intentionally contains no upstream
 * response, request URL, credential or provider message.
 */
export class BrapiAdapterError extends Error {
  readonly retryable: boolean;
  readonly transient: boolean;

  constructor(
    readonly code: BrapiFailureCode,
    retryable = false,
  ) {
    super(code);
    this.name = "BrapiAdapterError";
    this.retryable = retryable;
    this.transient = retryable;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isBrapiAdapterError(
  error: unknown,
): error is BrapiAdapterError {
  return error instanceof BrapiAdapterError;
}
