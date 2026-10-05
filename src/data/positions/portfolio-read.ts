"use client";

import {
  parseDocumentId,
  parseQuoteResult,
  QUOTE_ERROR_CODES,
  QUOTE_MAX_BATCH_SIZE,
  type Asset,
  type DocumentId,
  type MarketPosition,
  type Portfolio,
  type PortfolioDashboardRead,
  type Position,
  type QuoteErrorCode,
  type QuoteResult,
  type Transaction,
} from "../../domain";
import { PositionCompositionError } from "../../domain/errors";
import {
  availableMarketPositions,
  preparePortfolioPositions,
  projectPortfolioDashboard,
} from "./portfolio-projection";

export type PortfolioPositionReadDependencies = Readonly<{
  getPortfolio: (portfolioId: DocumentId) => Promise<Portfolio | null>;
  listTransactions: (portfolioId: DocumentId) => Promise<readonly Transaction[]>;
  listAssets: () => Promise<readonly Asset[]>;
  fetchQuotes: (assetIds: readonly DocumentId[]) => Promise<readonly QuoteResult[]>;
}>;

/**
 * The legacy fields remain available while the enriched read is additive.
 * Consumers can migrate to `items` and the known amounts without a second read.
 */
export type PortfolioPositionRead = PortfolioDashboardRead & Readonly<{
  positions: readonly Position[];
  marketPositions: readonly MarketPosition[];
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function sanitizeQuoteErrorCode(error: unknown): QuoteErrorCode {
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

export function hasCompleteQuoteBatch(
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

export async function fetchQuoteBatch(
  assetIds: readonly DocumentId[],
  fetchQuotes: PortfolioPositionReadDependencies["fetchQuotes"],
): Promise<readonly QuoteResult[]> {
  try {
    const results = await fetchQuotes(assetIds);
    if (!Array.isArray(results)) {
      return unavailableResults(assetIds, "INVALID_PROVIDER_RESPONSE");
    }

    let parsedResults: readonly QuoteResult[];
    try {
      parsedResults = results.map((result) => parseQuoteResult(result));
    } catch {
      return unavailableResults(assetIds, "INVALID_PROVIDER_RESPONSE");
    }

    return hasCompleteQuoteBatch(assetIds, parsedResults)
      ? parsedResults
      : unavailableResults(assetIds, "INVALID_PROVIDER_RESPONSE");
  } catch (error) {
    if (isRecord(error) && error.code === "UNAUTHENTICATED") {
      throw error;
    }
    return unavailableResults(assetIds, sanitizeQuoteErrorCode(error));
  }
}

/** Fetches sequential batches so the client boundary never exceeds the quote policy. */
export async function fetchOpenPositionQuotes(
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
  const prepared = preparePortfolioPositions({ portfolio, assets, transactions });
  const quoteResults = await fetchOpenPositionQuotes(
    prepared.openPositions.map((position) => position.assetId),
    dependencies.fetchQuotes,
  );
  const read = projectPortfolioDashboard({ prepared, quoteResults });

  return {
    ...read,
    positions: prepared.positions,
    marketPositions: availableMarketPositions(read).marketPositions,
  };
}
