"use client";

import {
  parseQuoteResult,
  QUOTE_ERROR_CODES,
  type QuoteErrorCode,
  type QuoteResult,
} from "@/domain/quote";
import { auth } from "@/lib/firebase/client";

export class QuoteClientError extends Error {
  constructor(readonly code: QuoteErrorCode) {
    super(code);
    this.name = "QuoteClientError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuoteErrorCode(value: unknown): value is QuoteErrorCode {
  return typeof value === "string" && QUOTE_ERROR_CODES.includes(value as QuoteErrorCode);
}

function codeFromHttpStatus(status: number): QuoteErrorCode {
  if (status === 401) {
    return "UNAUTHENTICATED";
  }

  if (status === 429) {
    return "RATE_LIMITED";
  }

  if (status === 400) {
    return "INVALID_REQUEST";
  }

  return "PROVIDER_UNAVAILABLE";
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorCodeFromResponse(status: number, payload: unknown): QuoteErrorCode {
  if (
    isRecord(payload) &&
    isRecord(payload.error) &&
    isQuoteErrorCode(payload.error.code)
  ) {
    return payload.error.code;
  }

  return codeFromHttpStatus(status);
}

/** Fetches sanitized Quote results through the authenticated same-origin route. */
export async function fetchQuotes(
  assetIds: readonly string[],
): Promise<readonly QuoteResult[]> {
  if (assetIds.length === 0) {
    return [];
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new QuoteClientError("UNAUTHENTICATED");
  }

  let token: string;
  try {
    token = await currentUser.getIdToken();
  } catch {
    throw new QuoteClientError("UNAUTHENTICATED");
  }

  if (!token) {
    throw new QuoteClientError("UNAUTHENTICATED");
  }

  let response: Response;
  try {
    response = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assetIds }),
      cache: "no-store",
    });
  } catch {
    throw new QuoteClientError("PROVIDER_UNAVAILABLE");
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new QuoteClientError(errorCodeFromResponse(response.status, payload));
  }

  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new QuoteClientError("INVALID_PROVIDER_RESPONSE");
  }

  const requestedIds = new Set(assetIds);
  const seenIds = new Set<string>();
  const results: QuoteResult[] = [];

  try {
    for (const value of payload.results) {
      const result = parseQuoteResult(value);

      if (!requestedIds.has(result.assetId) || seenIds.has(result.assetId)) {
        throw new Error("Unexpected quote result asset");
      }

      seenIds.add(result.assetId);
      results.push(result);
    }

    if (seenIds.size !== requestedIds.size) {
      throw new Error("Missing quote result asset");
    }
  } catch {
    throw new QuoteClientError("INVALID_PROVIDER_RESPONSE");
  }

  return results;
}
