"use client";

import {
  BASE_CURRENCY,
  createKnownAmount,
  decimalToRational,
  deriveQuoteCoverage,
  materializeDecimalRational,
  type AmountGap,
  type Asset,
  type CurrencyCode,
  type DecimalString,
  type DocumentId,
  type GlobalDashboardRead,
  type GlobalPortfolioCandidate,
  type GlobalPortfolioEntry,
  type Portfolio,
  type QuoteResult,
  type Transaction,
} from "../../domain";
import {
  fetchOpenPositionQuotes,
  type PortfolioPositionReadDependencies,
} from "./portfolio-read";
import {
  preparePortfolioPositions,
  projectPortfolioDashboard,
  type PreparedPortfolioPositions,
} from "./portfolio-projection";

export type GlobalDashboardReadDependencies = Readonly<{
  listPortfolios: () => Promise<readonly Portfolio[]>;
  listAssets: () => Promise<readonly Asset[]>;
  listTransactions: PortfolioPositionReadDependencies["listTransactions"];
  fetchQuotes: PortfolioPositionReadDependencies["fetchQuotes"];
}>;

type PortfolioFailureReason =
  | "read-failed"
  | "invalid-ledger"
  | "composition-failed"
  | "base-currency-mismatch";

type PreparedPortfolioRead = Readonly<{
  portfolio: Portfolio;
  prepared: PreparedPortfolioPositions;
}>;

type PortfolioPreparation =
  | Readonly<{ status: "ready"; value: PreparedPortfolioRead }>
  | Readonly<{
      status: "unavailable";
      portfolio: GlobalPortfolioCandidate;
      reason: PortfolioFailureReason;
    }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorCode(error: unknown): string | undefined {
  return isRecord(error) && typeof error.code === "string" ? error.code : undefined;
}

function isAuthenticationFailure(error: unknown): boolean {
  return errorCode(error) === "UNAUTHENTICATED";
}

function preparationFailureReason(error: unknown): "invalid-ledger" | "composition-failed" {
  switch (errorCode(error)) {
    case "POSITION_INVALID_LEDGER":
    case "INSUFFICIENT_QUANTITY":
    case "POSITION_CURRENCY_MISMATCH":
      return "invalid-ledger";
    default:
      return "composition-failed";
  }
}

function unavailablePortfolioEntry(
  portfolio: GlobalPortfolioCandidate,
  reason: PortfolioFailureReason,
): Extract<PortfolioPreparation, { status: "unavailable" }> {
  return { status: "unavailable", portfolio, reason };
}

async function preparePortfolio(
  portfolio: Portfolio,
  assets: readonly Asset[],
  dependencies: GlobalDashboardReadDependencies,
): Promise<PortfolioPreparation> {
  let transactions: readonly Transaction[];

  try {
    transactions = await dependencies.listTransactions(portfolio.id);
  } catch (error) {
    if (isAuthenticationFailure(error)) throw error;
    return unavailablePortfolioEntry(portfolio, "read-failed");
  }

  if (portfolio.baseCurrency !== BASE_CURRENCY) {
    return unavailablePortfolioEntry(portfolio, "base-currency-mismatch");
  }

  try {
    return {
      status: "ready",
      value: {
        portfolio,
        prepared: preparePortfolioPositions({ portfolio, assets, transactions }),
      },
    };
  } catch (error) {
    return unavailablePortfolioEntry(portfolio, preparationFailureReason(error));
  }
}

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function comparePortfolioEntries(left: GlobalPortfolioEntry, right: GlobalPortfolioEntry): number {
  return compareIds(left.portfolio.id, right.portfolio.id);
}

function divideRationals(
  left: ReturnType<typeof decimalToRational>,
  right: ReturnType<typeof decimalToRational>,
) {
  return {
    numerator: left.numerator * right.denominator,
    denominator: left.denominator * right.numerator,
  };
}

function shareOfKnownMarketValue(
  knownAmount: string,
  totalKnownAmount: string,
): ReturnType<typeof materializeDecimalRational> | null {
  if (totalKnownAmount === "0") return null;

  return materializeDecimalRational(
    divideRationals(decimalToRational(knownAmount), decimalToRational(totalKnownAmount)),
  );
}

function isOpenItem(item: { position: { closed: boolean } }): boolean {
  return !item.position.closed;
}

function amountGapsForUnavailable(
  portfolio: GlobalPortfolioCandidate,
  reason: PortfolioFailureReason,
): { market: AmountGap; invested: AmountGap } {
  const gap = {
    scope: "portfolio" as const,
    portfolioId: portfolio.id,
    reason,
  };

  return { market: gap, invested: gap };
}

/** Reads active portfolios once and shares one deduplicated Quote set. */
export async function readGlobalDashboard(
  dependencies: GlobalDashboardReadDependencies,
): Promise<GlobalDashboardRead> {
  const [listedPortfolios, assets] = await Promise.all([
    dependencies.listPortfolios(),
    dependencies.listAssets(),
  ]);
  const activePortfolios = listedPortfolios
    .filter((portfolio) => portfolio.archivedAt === null)
    .sort((left, right) => compareIds(left.id, right.id));

  const preparations = await Promise.all(
    activePortfolios.map((portfolio) => preparePortfolio(portfolio, assets, dependencies)),
  );
  const readyPreparations = preparations.filter(
    (preparation): preparation is Extract<PortfolioPreparation, { status: "ready" }> =>
      preparation.status === "ready",
  );

  const openAssets = new Map<DocumentId, CurrencyCode>();
  for (const { prepared } of readyPreparations.map(({ value }) => value)) {
    for (const position of prepared.openPositions) {
      if (!openAssets.has(position.assetId)) {
        openAssets.set(position.assetId, position.currency);
      }
    }
  }

  const openAssetIds = [...openAssets.keys()].sort(compareIds);
  const quoteResults = await fetchOpenPositionQuotes(openAssetIds, dependencies.fetchQuotes);
  const quoteResultsByAssetId = new Map<string, QuoteResult>();
  for (const result of quoteResults) {
    quoteResultsByAssetId.set(result.assetId, result);
  }

  const projectedReady = new Map<string, Extract<GlobalPortfolioEntry, { status: "ready" }>>();
  for (const preparation of readyPreparations) {
    const { portfolio, prepared } = preparation.value;

    try {
      const read = projectPortfolioDashboard({ prepared, quoteResults });
      projectedReady.set(portfolio.id, {
        status: "ready",
        portfolio,
        read,
        shareOfKnownMarketValue: null,
      });
    } catch (error) {
      if (isAuthenticationFailure(error)) throw error;
      const index = preparations.indexOf(preparation);
      preparations[index] = unavailablePortfolioEntry(portfolio, "composition-failed");
    }
  }

  const marketValues: DecimalString[] = [];
  const investedValues: DecimalString[] = [];
  const marketUnavailable: AmountGap[] = [];
  const investedUnavailable: AmountGap[] = [];
  let hasGlobalItems = false;

  for (const preparation of preparations) {
    if (preparation.status === "unavailable") {
      const gaps = amountGapsForUnavailable(preparation.portfolio, preparation.reason);
      marketUnavailable.push(gaps.market);
      investedUnavailable.push(gaps.invested);
      hasGlobalItems = true;
      continue;
    }

    const entry = projectedReady.get(preparation.value.portfolio.id);
    if (entry === undefined) continue;

    hasGlobalItems ||= entry.read.items.some(isOpenItem);
    marketValues.push(entry.read.marketValue.knownAmount);
    investedValues.push(entry.read.investedAmount.knownAmount);
    marketUnavailable.push(...entry.read.marketValue.unavailable);
    investedUnavailable.push(...entry.read.investedAmount.unavailable);
  }

  const marketValue = createKnownAmount({
    currency: BASE_CURRENCY as CurrencyCode,
    values: marketValues,
    unavailable: marketUnavailable,
    hasItems: hasGlobalItems,
  });
  const investedAmount = createKnownAmount({
    currency: BASE_CURRENCY as CurrencyCode,
    values: investedValues,
    unavailable: investedUnavailable,
    hasItems: hasGlobalItems,
  });

  const entries: GlobalPortfolioEntry[] = preparations
    .map((preparation) => preparation.status === "unavailable"
      ? preparation
      : projectedReady.get(preparation.value.portfolio.id))
    .filter((entry): entry is GlobalPortfolioEntry => entry !== undefined)
    .sort(comparePortfolioEntries);

  const portfolios = entries.map((entry) => entry.status === "ready"
    ? {
        ...entry,
        shareOfKnownMarketValue: shareOfKnownMarketValue(
          entry.read.marketValue.knownAmount,
          marketValue.knownAmount,
        ),
      }
    : entry);

  return {
    scope: "active-portfolios",
    currency: BASE_CURRENCY,
    portfolios,
    marketValue,
    investedAmount,
    quotes: deriveQuoteCoverage(
      openAssetIds.map((assetId) => ({
        positionCurrency: openAssets.get(assetId) as CurrencyCode,
        result: quoteResultsByAssetId.get(assetId),
      })),
    ),
  };
}
