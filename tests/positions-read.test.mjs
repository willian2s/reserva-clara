import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const build = process.env.POSITIONS_READ_TEST_BUILD;
const domain = require(resolve(build, "domain/index.js"));
const { readPortfolioPositions } = require(resolve(build, "data/positions/portfolio-read.js"));

const errorCode = (code) => (error) => error?.code === code;

const portfolio = {
  id: "portfolio-a",
  name: "Carteira",
  baseCurrency: "BRL",
  archivedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

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

const transaction = ({
  id,
  assetId,
  kind = "buy",
  quantity = "1",
  price = "10",
  effectiveDate = "2026-01-01",
}) =>
  domain.parseTransaction({
    id,
    assetId,
    kind,
    quantity,
    unitPrice: { currency: "BRL", decimal: price },
    effectiveDate,
    createdAt: { seconds: 1, nanoseconds: 0 },
  });

const availableQuote = (assetId, price = "12", freshness = "fresh", currency = "BRL") => ({
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

const dependenciesFor = ({ assets, transactions, fetchQuotes, getPortfolio = async () => portfolio }) => ({
  getPortfolio,
  listTransactions: async () => transactions,
  listAssets: async () => assets,
  fetchQuotes,
});

test("composes ledger, valuation and allocation with injected owner-scoped boundaries", async () => {
  const calls = [];
  const result = await readPortfolioPositions(
    "portfolio-a",
    dependenciesFor({
      assets: [asset("asset-b"), asset("asset-a")],
      transactions: [
        transaction({ id: "tx-b", assetId: "asset-b" }),
        transaction({ id: "tx-a", assetId: "asset-a" }),
      ],
      fetchQuotes: async (assetIds) => {
        calls.push([...assetIds]);
        return assetIds.map((assetId) => availableQuote(assetId));
      },
    }),
  );

  assert.deepEqual(result.positions.map(({ assetId }) => assetId), ["asset-a", "asset-b"]);
  assert.deepEqual(result.marketPositions.map(({ assetId }) => assetId), ["asset-a", "asset-b"]);
  assert.deepEqual(result.allocation.entries.map(({ assetId }) => assetId), ["asset-a", "asset-b"]);
  assert.equal(result.allocation.status, "complete");
  assert.deepEqual(calls, [["asset-a", "asset-b"]]);
});

test("keeps closed positions but does not request their quotes", async () => {
  const calls = [];
  const result = await readPortfolioPositions(
    "portfolio-a",
    dependenciesFor({
      assets: [asset("asset-open"), asset("asset-closed")],
      transactions: [
        transaction({ id: "open", assetId: "asset-open" }),
        transaction({ id: "buy", assetId: "asset-closed" }),
        transaction({
          id: "sell",
          assetId: "asset-closed",
          kind: "sell",
          effectiveDate: "2026-01-02",
        }),
      ],
      fetchQuotes: async (assetIds) => {
        calls.push([...assetIds]);
        return assetIds.map((assetId) => availableQuote(assetId));
      },
    }),
  );

  assert.equal(result.positions.find(({ assetId }) => assetId === "asset-closed").closed, true);
  assert.deepEqual(result.marketPositions.map(({ assetId }) => assetId), ["asset-open"]);
  assert.deepEqual(calls, [["asset-open"]]);
});

test("chunks quote requests at twenty assets", async () => {
  const assets = Array.from({ length: 21 }, (_, index) => asset(`asset-${String(index).padStart(2, "0")}`));
  const transactions = assets.map((currentAsset) =>
    transaction({ id: `tx-${currentAsset.id}`, assetId: currentAsset.id }),
  );
  const calls = [];
  const result = await readPortfolioPositions(
    "portfolio-a",
    dependenciesFor({
      assets,
      transactions,
      fetchQuotes: async (assetIds) => {
        calls.push([...assetIds]);
        return assetIds.map((assetId) => availableQuote(assetId));
      },
    }),
  );

  assert.deepEqual(calls.map((batch) => batch.length), [20, 1]);
  assert.equal(new Set(calls.flat()).size, 21);
  assert.equal(result.marketPositions.length, 21);
});

test("sanitizes a failed quote batch without losing positions", async () => {
  const result = await readPortfolioPositions(
    "portfolio-a",
    dependenciesFor({
      assets: [asset("asset-a")],
      transactions: [transaction({ id: "tx-a", assetId: "asset-a" })],
      fetchQuotes: async () => {
        throw { code: "TIMEOUT", message: "provider payload must not escape" };
      },
    }),
  );

  assert.equal(result.positions.length, 1);
  assert.deepEqual(result.marketPositions, []);
  assert.deepEqual(result.allocation.unavailable, [
    { assetId: "asset-a", reason: "quote-unavailable" },
  ]);
  assert.equal(result.allocation.status, "partial");
  assert.equal(JSON.stringify(result).includes("provider payload"), false);
});

test("preserves stale freshness and propagates currency mismatch to allocation", async () => {
  const result = await readPortfolioPositions(
    "portfolio-a",
    dependenciesFor({
      assets: [asset("asset-a")],
      transactions: [transaction({ id: "tx-a", assetId: "asset-a" })],
      fetchQuotes: async () => [availableQuote("asset-a", "12", "stale", "USD")],
    }),
  );

  assert.deepEqual(result.marketPositions, []);
  assert.deepEqual(result.allocation.unavailable, [
    { assetId: "asset-a", reason: "quote-currency-mismatch" },
  ]);
});

test("propagates invalid ledger and missing portfolio without requesting quotes", async () => {
  let quoteCalls = 0;
  const dependencies = dependenciesFor({
    assets: [asset("asset-a")],
    transactions: [transaction({ id: "sell", assetId: "asset-a", kind: "sell" })],
    fetchQuotes: async () => {
      quoteCalls += 1;
      return [];
    },
  });

  await assert.rejects(
    () => readPortfolioPositions("portfolio-a", dependencies),
    errorCode("INSUFFICIENT_QUANTITY"),
  );
  assert.equal(quoteCalls, 0);

  await assert.rejects(
    () => readPortfolioPositions(
      "portfolio-a",
      dependenciesFor({
        assets: [],
        transactions: [],
        fetchQuotes: async () => {
          quoteCalls += 1;
          return [];
        },
        getPortfolio: async () => null,
      }),
    ),
    errorCode("POSITION_COMPOSITION_FAILED"),
  );
  assert.equal(quoteCalls, 0);
});
