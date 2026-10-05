import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const build = process.env.DASHBOARD_READ_TEST_BUILD;
const domain = require(resolve(build, "domain/index.js"));
const { readGlobalDashboard } = require(resolve(build, "data/positions/dashboard-read.js"));

const portfolio = (id, archivedAt = null) => ({
  id,
  name: `Carteira ${id}`,
  baseCurrency: "BRL",
  archivedAt,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

const asset = (id, currency = "BRL") => ({
  id,
  symbol: id.toUpperCase(),
  market: "B3",
  assetType: "stock",
  currency,
  identityKey: `${id.toUpperCase()}~B3~stock~${currency}`,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

const transaction = ({ id, assetId, kind = "buy", quantity = "1", price = "10", currency = "BRL" }) =>
  domain.parseTransaction({
    id,
    assetId,
    kind,
    quantity,
    unitPrice: { currency, decimal: price },
    effectiveDate: "2026-01-01",
    createdAt: { seconds: 1, nanoseconds: 0 },
  });

const quote = (assetId, price = "12", freshness = "fresh", currency = "BRL") => ({
  assetId,
  status: "available",
  quote: {
    assetId,
    provider: "brapi",
    requestedSymbol: assetId.toUpperCase(),
    providerSymbol: assetId.toUpperCase(),
    symbolChanged: false,
    price: { currency, decimal: price },
    quotedAt: "2026-09-30T12:00:00Z",
    fetchedAt: "2026-09-30T12:00:01Z",
    freshness,
  },
});

const dependenciesFor = ({ portfolios, assets, transactionsByPortfolio, fetchQuotes }) => ({
  listPortfolios: async () => portfolios,
  listAssets: async () => assets,
  listTransactions: async (portfolioId) => transactionsByPortfolio[portfolioId] ?? [],
  fetchQuotes,
});

test("reads active catalog once, one ledger per active portfolio, and deduplicates quotes", async () => {
  const activeA = portfolio("portfolio-a");
  const activeB = portfolio("portfolio-b");
  const archived = portfolio("portfolio-archived", new Date("2026-01-02T00:00:00.000Z"));
  const calls = { portfolios: 0, assets: 0, ledgers: [], quotes: [] };
  const result = await readGlobalDashboard({
    listPortfolios: async () => {
      calls.portfolios += 1;
      return [activeB, archived, activeA];
    },
    listAssets: async () => {
      calls.assets += 1;
      return [asset("asset-shared"), asset("asset-b")];
    },
    listTransactions: async (portfolioId) => {
      calls.ledgers.push(portfolioId);
      return portfolioId === "portfolio-a"
        ? [transaction({ id: "tx-a", assetId: "asset-shared" })]
        : [transaction({ id: "tx-b", assetId: "asset-shared" }), transaction({ id: "tx-b2", assetId: "asset-b" })];
    },
    fetchQuotes: async (assetIds) => {
      calls.quotes.push([...assetIds]);
      return assetIds.map((assetId) => quote(assetId));
    },
  });

  assert.equal(calls.portfolios, 1);
  assert.equal(calls.assets, 1);
  assert.deepEqual(calls.ledgers.sort(), ["portfolio-a", "portfolio-b"]);
  assert.deepEqual(calls.quotes, [["asset-b", "asset-shared"]]);
  assert.deepEqual(result.portfolios.map(({ portfolio: current }) => current.id), ["portfolio-a", "portfolio-b"]);
  assert.equal(result.portfolios.some(({ portfolio: current }) => current.id === "portfolio-archived"), false);
  assert.equal(result.marketValue.knownAmount, "36");
  assert.equal(result.investedAmount.knownAmount, "30");
  assert.equal(result.marketValue.status, "complete");
  assert.equal(result.quotes.requested, 2);
  assert.equal(result.portfolios[0].shareOfKnownMarketValue, "0.333333333333333333");
});

test("chunks the shared quote request at twenty plus one", async () => {
  const assets = Array.from({ length: 21 }, (_, index) => asset(`asset-${String(index).padStart(2, "0")}`));
  const calls = [];
  let firstBatchResolved = false;
  let secondBatchStarted = false;
  const result = await readGlobalDashboard(dependenciesFor({
    portfolios: [portfolio("portfolio-a")],
    assets,
    transactionsByPortfolio: {
      "portfolio-a": assets.map((currentAsset) => transaction({ id: `tx-${currentAsset.id}`, assetId: currentAsset.id })),
    },
    fetchQuotes: async (assetIds) => {
      if (assetIds.length === 1) {
        secondBatchStarted = true;
        assert.equal(firstBatchResolved, true);
      }
      calls.push([...assetIds]);
      if (assetIds.length === 20) {
        await Promise.resolve();
        firstBatchResolved = true;
      }
      return assetIds.map((assetId) => quote(assetId));
    },
  }));

  assert.deepEqual(calls.map((batch) => batch.length), [20, 1]);
  assert.equal(secondBatchStarted, true);
  assert.equal(result.portfolios[0].read.items.length, 21);
});

test("isolates a failed ledger and does not impute it as zero", async () => {
  const result = await readGlobalDashboard({
    listPortfolios: async () => [portfolio("portfolio-bad"), portfolio("portfolio-good")],
    listAssets: async () => [asset("asset-good")],
    listTransactions: async (portfolioId) => {
      if (portfolioId === "portfolio-bad") throw new Error("financial payload must not escape");
      return [transaction({ id: "tx-good", assetId: "asset-good" })];
    },
    fetchQuotes: async (assetIds) => assetIds.map((assetId) => quote(assetId)),
  });

  assert.deepEqual(result.portfolios.map(({ status }) => status), ["unavailable", "ready"]);
  assert.equal(result.portfolios[0].reason, "read-failed");
  assert.deepEqual(result.marketValue.unavailable, [{
    scope: "portfolio",
    portfolioId: "portfolio-bad",
    reason: "read-failed",
  }]);
  assert.equal(result.marketValue.status, "partial");
  assert.equal(result.marketValue.knownAmount, "12");
  assert.equal(JSON.stringify(result).includes("financial payload"), false);
});

test("returns empty global state without quotes when active portfolios have no open positions", async () => {
  let quoteCalls = 0;
  const result = await readGlobalDashboard(dependenciesFor({
    portfolios: [portfolio("portfolio-empty")],
    assets: [asset("asset-empty")],
    transactionsByPortfolio: { "portfolio-empty": [] },
    fetchQuotes: async () => {
      quoteCalls += 1;
      return [];
    },
  }));

  assert.equal(quoteCalls, 0);
  assert.deepEqual(result.marketValue, { currency: "BRL", status: "empty", knownAmount: "0", unavailable: [] });
  assert.deepEqual(result.investedAmount, result.marketValue);
  assert.deepEqual(result.quotes, { status: "none", requested: 0, fresh: 0, stale: 0, unavailable: 0 });
});

test("keeps stale known and unavailable quotes partial while reconciling the global breakdown", async () => {
  const result = await readGlobalDashboard({
    listPortfolios: async () => [portfolio("portfolio-a"), portfolio("portfolio-b")],
    listAssets: async () => [asset("asset-stale"), asset("asset-missing")],
    listTransactions: async (portfolioId) => [transaction({
      id: `tx-${portfolioId}`,
      assetId: portfolioId === "portfolio-a" ? "asset-stale" : "asset-missing",
    })],
    fetchQuotes: async (assetIds) => assetIds.map((assetId) => assetId === "asset-stale"
      ? quote(assetId, "11", "stale")
      : { assetId, status: "unavailable", code: "NOT_FOUND" }),
  });

  assert.equal(result.marketValue.knownAmount, "11");
  assert.equal(result.marketValue.status, "partial");
  assert.deepEqual(result.quotes, { status: "mixed", requested: 2, fresh: 0, stale: 1, unavailable: 1 });
  assert.equal(result.portfolios[0].shareOfKnownMarketValue, "1");
  assert.equal(result.portfolios[1].shareOfKnownMarketValue, "0");
  assert.deepEqual(result.portfolios[1].read.items[0].currentValue, {
    status: "unavailable",
    reason: "quote-unavailable",
    quoteCode: "NOT_FOUND",
  });
});

test("excludes a non-BRL portfolio with a sanitized partial diagnosis", async () => {
  const foreignPortfolio = { ...portfolio("portfolio-usd"), baseCurrency: "USD" };
  let quoteCalls = 0;
  const result = await readGlobalDashboard({
    listPortfolios: async () => [foreignPortfolio],
    listAssets: async () => [asset("asset-usd", "USD")],
    listTransactions: async () => [transaction({ id: "tx-usd", assetId: "asset-usd", currency: "USD" })],
    fetchQuotes: async () => {
      quoteCalls += 1;
      return [];
    },
  });

  assert.equal(quoteCalls, 0);
  assert.equal(result.portfolios[0].status, "unavailable");
  assert.equal(result.portfolios[0].reason, "base-currency-mismatch");
  assert.equal(result.marketValue.status, "partial");
  assert.deepEqual(result.marketValue.unavailable, [{
    scope: "portfolio",
    portfolioId: "portfolio-usd",
    reason: "base-currency-mismatch",
  }]);
});

test("keeps participation null when the known denominator is zero", async () => {
  const result = await readGlobalDashboard({
    listPortfolios: async () => [portfolio("portfolio-a"), portfolio("portfolio-b")],
    listAssets: async () => [asset("asset-a"), asset("asset-b")],
    listTransactions: async (portfolioId) => [transaction({
      id: `tx-${portfolioId}`,
      assetId: portfolioId === "portfolio-a" ? "asset-a" : "asset-b",
    })],
    fetchQuotes: async (assetIds) => assetIds.map((assetId) => ({
      assetId,
      status: "unavailable",
      code: "NOT_FOUND",
    })),
  });

  assert.equal(result.marketValue.knownAmount, "0");
  assert.equal(result.marketValue.status, "partial");
  assert.deepEqual(
    result.portfolios.map((entry) => entry.status === "ready" ? entry.shareOfKnownMarketValue : null),
    [null, null],
  );
});

test("propagates authentication failures from the shared quote boundary", async () => {
  await assert.rejects(
    () => readGlobalDashboard({
      listPortfolios: async () => [portfolio("portfolio-a")],
      listAssets: async () => [asset("asset-a")],
      listTransactions: async () => [transaction({ id: "tx-a", assetId: "asset-a" })],
      fetchQuotes: async () => {
        throw { code: "UNAUTHENTICATED", message: "auth detail must not be returned" };
      },
    }),
    (error) => error?.code === "UNAUTHENTICATED",
  );
});
