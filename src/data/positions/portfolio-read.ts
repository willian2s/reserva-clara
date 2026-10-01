"use client";

import {
  calculateAllocation,
  deriveMarketPosition,
  parseDocumentId,
  QUOTE_ERROR_CODES,
  QUOTE_MAX_BATCH_SIZE,
  reducePositions,
  type AllocationResult,
  type Asset,
  type CurrencyCode,
  type DocumentId,
  type MarketPosition,
  type Portfolio,
  type Position,
  type QuoteErrorCode,
  type QuoteResult,
  type Transaction,
} from "../../domain";
import { PositionCompositionError } from "../../domain/errors";

export type PortfolioPositionReadDependencies = Readonly<{
  getPortfolio: (portfolioId: DocumentId) => Promise<Portfolio | null>;
  listTransactions: (portfolioId: DocumentId) => Promise<readonly Transaction[]>;
  listAssets: () => Promise<readonly Asset[]>;
  fetchQuotes: (assetIds: readonly DocumentId[]) => Promise<readonly QuoteResult[]>;
}>;

export type PortfolioPositionRead = Readonly<{
  portfolio: Portfolio;
  positions: readonly Position[];
  marketPositions: readonly MarketPosition[];
  allocation: AllocationResult;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeQuoteErrorCode(error: unknown): QuoteErrorCode {
  if (isRecord(error) && typeof error.code === "string") {
    const code = error.code as QuoteErrorCode;
    if (QUOTE_ERROR_CODES.includes(code)) {
      return code;
    }
  }

  return "PROVIDER_UNAVAILABLE";
}

function unavailableResults(
  assetIds: readonly DocumentId[],
  code: QuoteErrorCode,
): readonly QuoteResult[] {
  return assetIds.map((assetId) => ({
    assetId,
    status: "unavailable",
    code,
  }));
}

function hasCompleteBatch(
  assetIds: readonly DocumentId[],
  results: readonly QuoteResult[],
): boolean {
  if (results.length !== assetIds.length) {
    return false;
  }

  const requestedIds = new Set(assetIds);
  const returnedIds = new Set<string>();

  for (const result of results) {
    if (
      !isRecord(result) ||
      typeof result.assetId !== "string" ||
      !requestedIds.has(result.assetId) ||
      returnedIds.has(result.assetId)
    ) {
      return false;
    }

    returnedIds.add(result.assetId);
  }

  return returnedIds.size === requestedIds.size;
}

async function fetchQuoteBatch(
  assetIds: readonly DocumentId[],
  fetchQuotes: PortfolioPositionReadDependencies["fetchQuotes"],
): Promise<readonly QuoteResult[]> {
  try {
    const results = await fetchQuotes(assetIds);

    return hasCompleteBatch(assetIds, results)
      ? results
      : unavailableResults(assetIds, "INVALID_PROVIDER_RESPONSE");
  } catch (error) {
    return unavailableResults(assetIds, sanitizeQuoteErrorCode(error));
  }
}

async function fetchOpenPositionQuotes(
  assetIds: readonly DocumentId[],
  fetchQuotes: PortfolioPositionReadDependencies["fetchQuotes"],
): Promise<readonly QuoteResult[]> {
  const results: QuoteResult[] = [];

  for (let start = 0; start < assetIds.length; start += QUOTE_MAX_BATCH_SIZE) {
    const batch = assetIds.slice(start, start + QUOTE_MAX_BATCH_SIZE);
    results.push(...(await fetchQuoteBatch(batch, fetchQuotes)));
  }

  return results;
}

export async function readPortfolioPositions(
  portfolioId: DocumentId,
  dependencies: PortfolioPositionReadDependencies,
): Promise<PortfolioPositionRead> {
  const parsedPortfolioId = parseDocumentId(portfolioId);
  const portfolio = await dependencies.getPortfolio(parsedPortfolioId);

  if (portfolio === null || portfolio.id !== parsedPortfolioId) {
    throw new PositionCompositionError();
  }

  const [transactions, assets] = await Promise.all([
    dependencies.listTransactions(parsedPortfolioId),
    dependencies.listAssets(),
  ]);
  const positions = reducePositions({
    portfolioId: parsedPortfolioId,
    assets,
    transactions,
  });
  const openPositions = positions.filter((position) => !position.closed);
  const quoteResults = await fetchOpenPositionQuotes(
    openPositions.map((position) => position.assetId),
    dependencies.fetchQuotes,
  );
  const quoteResultsByAssetId = new Map(
    quoteResults.map((quoteResult) => [quoteResult.assetId, quoteResult]),
  );
  const marketPositionResults = openPositions.map((position) => {
    const quoteResult = quoteResultsByAssetId.get(position.assetId);

    if (quoteResult === undefined) {
      return {
        status: "unavailable" as const,
        assetId: position.assetId,
        reason: "quote-unavailable" as const,
        quoteCode: "INVALID_PROVIDER_RESPONSE" as const,
      };
    }

    return deriveMarketPosition(position, quoteResult);
  });
  const marketPositions = marketPositionResults.flatMap((result) =>
    result?.status === "available" ? [result.marketPosition] : [],
  );
  const allocation = calculateAllocation({
    portfolioId: parsedPortfolioId,
    currency: portfolio.baseCurrency as CurrencyCode,
    positions,
    marketPositionResults: marketPositionResults.filter(
      (result): result is NonNullable<typeof result> => result !== null,
    ),
  });

  return {
    portfolio,
    positions,
    marketPositions,
    allocation,
  };
}
