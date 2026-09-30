import { parseDocumentId, type DocumentId } from "../../domain/value-objects";
import type { Asset } from "../../domain/asset";
import type { QuoteResult } from "../../domain/quote";

const MAX_BATCH_SIZE = 20;

type VerifiedIdentity = Readonly<{ uid: string }>;

export type QuoteRouteDependencies = Readonly<{
  verifyIdToken(token: string): Promise<VerifiedIdentity>;
  listOwnedAssets(
    verifiedUid: string,
    assetIds: readonly DocumentId[],
  ): Promise<readonly Asset[]>;
  quoteService: Readonly<{
    getQuotes(assets: readonly Asset[]): Promise<readonly QuoteResult[]>;
  }>;
}>;

type ParsedQuoteRequest = Readonly<{ assetIds: readonly DocumentId[] }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyAssetIds(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === "assetIds";
}

function parseBearerToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = /^Bearer\s+(\S+)$/.exec(value);
  return match?.[1] ?? null;
}

function parseRequestBody(value: unknown): ParsedQuoteRequest {
  if (!isRecord(value) || !hasOnlyAssetIds(value) || !Array.isArray(value.assetIds)) {
    throw new RequestValidationError("INVALID_REQUEST");
  }

  if (value.assetIds.length === 0) {
    throw new RequestValidationError("INVALID_REQUEST");
  }

  if (value.assetIds.length > MAX_BATCH_SIZE) {
    throw new RequestValidationError("BATCH_LIMIT");
  }

  const uniqueIds: DocumentId[] = [];
  const seen = new Set<string>();

  for (const assetIdValue of value.assetIds) {
    let assetId: DocumentId;
    try {
      assetId = parseDocumentId(assetIdValue);
    } catch {
      throw new RequestValidationError("INVALID_REQUEST");
    }

    if (!seen.has(assetId)) {
      seen.add(assetId);
      uniqueIds.push(assetId);
    }
  }

  return { assetIds: uniqueIds };
}

class RequestValidationError extends Error {
  constructor(readonly publicCode: "INVALID_REQUEST" | "BATCH_LIMIT") {
    super(publicCode);
    this.name = "RequestValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function responseBody(
  body: unknown,
  status: number,
): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(code: string, status: number): Response {
  return responseBody({ error: { code } }, status);
}

function isNotConfiguredError(error: unknown): boolean {
  return isRecord(error) && error.code === "NOT_CONFIGURED";
}

type UnavailableCode = Extract<QuoteResult, { status: "unavailable" }>["code"];

function unavailableResult(assetId: DocumentId, code: UnavailableCode): QuoteResult {
  return { assetId, status: "unavailable", code };
}

export function createQuotesPostHandler(dependencies: QuoteRouteDependencies) {
  return async function postQuotes(request: Request): Promise<Response> {
    const token = parseBearerToken(request.headers.get("authorization"));
    if (!token) {
      return errorResponse("UNAUTHENTICATED", 401);
    }

    let identity: VerifiedIdentity;
    try {
      identity = await dependencies.verifyIdToken(token);
    } catch (error) {
      return errorResponse(isNotConfiguredError(error) ? "NOT_CONFIGURED" : "UNAUTHENTICATED", isNotConfiguredError(error) ? 503 : 401);
    }

    let parsedBody: ParsedQuoteRequest;
    try {
      parsedBody = parseRequestBody(await request.json());
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return errorResponse(error.publicCode, 400);
      }

      return errorResponse("INVALID_REQUEST", 400);
    }

    let ownedAssets: readonly Asset[];
    try {
      ownedAssets = await dependencies.listOwnedAssets(identity.uid, parsedBody.assetIds);
    } catch {
      return errorResponse("PROVIDER_UNAVAILABLE", 503);
    }

    const ownedIds = new Set(ownedAssets.map((asset) => asset.id));
    let serviceResults: readonly QuoteResult[];
    try {
      serviceResults = await dependencies.quoteService.getQuotes(ownedAssets);
    } catch {
      return errorResponse("PROVIDER_UNAVAILABLE", 503);
    }

    const resultsByAssetId = new Map(
      serviceResults
        .filter((result) => ownedIds.has(result.assetId))
        .map((result) => [result.assetId, result]),
    );
    const results = parsedBody.assetIds.map((assetId) =>
      ownedIds.has(assetId)
        ? resultsByAssetId.get(assetId) ?? unavailableResult(assetId, "PROVIDER_UNAVAILABLE")
        : unavailableResult(assetId, "NOT_FOUND"),
    );

    return responseBody({ results }, 200);
  };
}

export { parseBearerToken, parseRequestBody };
