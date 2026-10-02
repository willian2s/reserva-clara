import {
  calculateAllocation,
  createKnownAmount,
  deriveMarketPosition,
  deriveQuoteCoverage,
  parseDocumentId,
  type Asset,
  type CurrencyCode,
  type MarketPosition,
  type Portfolio,
  type Position,
  type PositionReadItem,
  type PortfolioDashboardRead,
  type QuoteResult,
  reducePositions,
  type Transaction,
} from "../../domain";
import { PositionCompositionError } from "../../domain/errors";

export type PreparedPortfolioPositions = Readonly<{
  portfolio: Portfolio;
  assetsById: ReadonlyMap<string, Asset>;
  positions: readonly Position[];
  openPositions: readonly Position[];
}>;

export type PreparePortfolioPositionsInput = Readonly<{
  portfolio: Portfolio;
  assets: readonly Asset[];
  transactions: readonly Transaction[];
}>;

export function preparePortfolioPositions(
  input: PreparePortfolioPositionsInput,
): PreparedPortfolioPositions {
  const portfolioId = parseDocumentId(input.portfolio.id);
  const positions = reducePositions({
    portfolioId,
    assets: input.assets,
    transactions: input.transactions,
  });
  const assetsById = new Map<string, Asset>();

  for (const asset of input.assets) {
    const assetId = parseDocumentId(asset.id);
    if (assetsById.has(assetId)) {
      throw new PositionCompositionError();
    }
    assetsById.set(assetId, asset);
  }

  return {
    portfolio: input.portfolio,
    assetsById,
    positions,
    openPositions: positions.filter((position) => !position.closed),
  };
}

export type ProjectPortfolioDashboardInput = Readonly<{
  prepared: PreparedPortfolioPositions;
  quoteResults: readonly QuoteResult[];
}>;

function compareAssetIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function assetForPosition(
  assetsById: ReadonlyMap<string, Asset>,
  position: Position,
): Asset {
  const asset = assetsById.get(position.assetId);
  if (asset === undefined || asset.id !== position.assetId) {
    throw new PositionCompositionError();
  }

  return asset;
}

function quoteResultsByAssetId(
  quoteResults: readonly QuoteResult[],
  openPositions: readonly Position[],
): ReadonlyMap<string, QuoteResult> {
  const openAssetIds = new Set(openPositions.map((position) => position.assetId));
  const resultsByAssetId = new Map<string, QuoteResult>();

  for (const result of quoteResults) {
    // A global read may share a superset of QuoteResults with this portfolio.
    // Only duplicates for this portfolio are composition errors.
    if (!openAssetIds.has(result.assetId)) {
      continue;
    }
    if (resultsByAssetId.has(result.assetId)) {
      throw new PositionCompositionError();
    }
    resultsByAssetId.set(result.assetId, result);
  }

  return resultsByAssetId;
}

function unavailableQuoteResult(assetId: Position["assetId"]): QuoteResult {
  return {
    assetId,
    status: "unavailable",
    code: "INVALID_PROVIDER_RESPONSE",
  };
}

function projectPositionItem(
  position: Position,
  asset: Asset,
  quoteResult: QuoteResult | undefined,
  baseCurrency: CurrencyCode,
): { item: PositionReadItem; marketPositionResult: ReturnType<typeof deriveMarketPosition> } {
  if (position.closed) {
    return {
      item: {
        asset: {
          id: asset.id,
          symbol: asset.symbol,
          market: asset.market,
          assetType: asset.assetType,
          currency: asset.currency,
        },
        position,
        currentValue: { status: "not-applicable", reason: "closed" },
      },
      marketPositionResult: null,
    };
  }

  const result = deriveMarketPosition(
    position,
    quoteResult ?? unavailableQuoteResult(position.assetId),
  );
  if (result === null) {
    throw new PositionCompositionError();
  }

  const itemAsset = {
    id: asset.id,
    symbol: asset.symbol,
    market: asset.market,
    assetType: asset.assetType,
    currency: asset.currency,
  };

  if (result.status === "unavailable") {
    return {
      item: {
        asset: itemAsset,
        position,
        currentValue: result.reason === "quote-unavailable"
          ? {
              status: "unavailable",
              reason: "quote-unavailable",
              quoteCode: result.quoteCode ?? "PROVIDER_UNAVAILABLE",
            }
          : {
              status: "unavailable",
              reason: "quote-currency-mismatch",
            },
      },
      marketPositionResult: result,
    };
  }

  if (quoteResult?.status !== "available") {
    throw new PositionCompositionError();
  }

  return {
    item: {
      asset: itemAsset,
      position,
      currentValue: {
        status: "available",
        marketPosition: result.marketPosition,
        quote: {
          price: quoteResult.quote.price,
          quotedAt: quoteResult.quote.quotedAt,
          fetchedAt: quoteResult.quote.fetchedAt,
          freshness: quoteResult.quote.freshness,
        },
        baseCurrency: result.marketPosition.currency === baseCurrency
          ? "included"
          : "excluded",
      },
    },
    marketPositionResult: result,
  };
}

function amountGapForItem(
  portfolioId: Portfolio["id"],
  item: PositionReadItem,
  baseCurrency: CurrencyCode,
  amount: "market" | "invested",
) {
  if (item.position.currency !== baseCurrency) {
    return {
      scope: "asset" as const,
      portfolioId,
      assetId: item.position.assetId,
      reason: "base-currency-mismatch" as const,
    };
  }

  if (amount === "invested") return null;

  if (item.currentValue.status === "unavailable") {
    return {
      scope: "asset" as const,
      portfolioId,
      assetId: item.position.assetId,
      reason: item.currentValue.reason,
    };
  }

  return null;
}

export function projectPortfolioDashboard(
  input: ProjectPortfolioDashboardInput,
): PortfolioDashboardRead {
  const { prepared } = input;
  const baseCurrency = prepared.portfolio.baseCurrency as CurrencyCode;
  const resultsByAssetId = quoteResultsByAssetId(
    input.quoteResults,
    prepared.openPositions,
  );
  const projected = prepared.positions
    .map((position) => projectPositionItem(
      position,
      assetForPosition(prepared.assetsById, position),
      resultsByAssetId.get(position.assetId),
      baseCurrency,
    ))
    .sort((left, right) => compareAssetIds(
      left.item.position.assetId,
      right.item.position.assetId,
    ));
  const items = projected.map(({ item }) => item);
  const marketPositionResults = projected
    .map(({ marketPositionResult }) => marketPositionResult)
    .filter((result): result is NonNullable<typeof result> => result !== null);
  const allocation = calculateAllocation({
    portfolioId: prepared.portfolio.id,
    currency: baseCurrency,
    positions: prepared.positions,
    marketPositionResults,
  });
  const marketValues = items.flatMap((item) =>
    item.currentValue.status === "available" && item.currentValue.baseCurrency === "included"
      ? [item.currentValue.marketPosition.marketValue]
      : [],
  );
  const marketUnavailable = items.flatMap((item) => {
    if (item.position.closed) return [];
    const gap = amountGapForItem(prepared.portfolio.id, item, baseCurrency, "market");
    return gap === null ? [] : [gap];
  });
  const investedValues = items.flatMap((item) =>
    !item.position.closed && item.position.currency === baseCurrency
      ? [item.position.investedAmount]
      : [],
  );
  const investedUnavailable = items.flatMap((item) => {
    if (item.position.closed) return [];
    const gap = amountGapForItem(prepared.portfolio.id, item, baseCurrency, "invested");
    return gap === null ? [] : [gap];
  });

  return {
    portfolio: prepared.portfolio,
    items,
    allocation,
    marketValue: createKnownAmount({
      currency: baseCurrency,
      values: marketValues,
      unavailable: marketUnavailable,
      hasItems: prepared.openPositions.length > 0,
    }),
    investedAmount: createKnownAmount({
      currency: baseCurrency,
      values: investedValues,
      unavailable: investedUnavailable,
      hasItems: prepared.openPositions.length > 0,
    }),
    quotes: deriveQuoteCoverage(prepared.openPositions.map((position) => ({
      positionCurrency: position.currency,
      result: resultsByAssetId.get(position.assetId),
    }))),
  };
}

export type ProjectedMarketPositions = Readonly<{
  marketPositions: readonly MarketPosition[];
}>;

export function availableMarketPositions(
  read: PortfolioDashboardRead,
): ProjectedMarketPositions {
  return {
    marketPositions: read.items.flatMap((item) =>
      item.currentValue.status === "available"
        ? [item.currentValue.marketPosition]
        : [],
    ),
  };
}
