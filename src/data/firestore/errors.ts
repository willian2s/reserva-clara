export class InvalidFirestoreDocumentError extends Error {
  readonly code = "INVALID_FIRESTORE_DOCUMENT" as const;

  constructor(readonly field: string) {
    super(`Invalid Firestore document: ${field}`);
    this.name = "InvalidFirestoreDocumentError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
