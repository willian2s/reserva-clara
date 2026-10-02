import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const domain = require(resolve(process.env.POSITION_TEST_BUILD, "index.js"));

const errorCode = (code) => (error) => error?.code === code;

const trade = ({
  id,
  assetId = "asset-a",
  currency = "BRL",
  kind = "buy",
  quantity,
  price,
  fee = null,
  effectiveDate = "2026-01-01",
  seconds = 1,
  nanoseconds = 0,
}) =>
  domain.parseTransaction({
    id,
    assetId,
    kind,
    quantity,
    unitPrice: { currency, decimal: price },
    fee,
    effectiveDate,
    createdAt: { seconds, nanoseconds },
  });

test("reduces an unordered ledger with weighted cost and fees", () => {
  const asset = { id: "asset-a", currency: "BRL" };
  const transactions = [
    trade({
      id: "sell",
      kind: "sell",
      quantity: "1",
      price: "999",
      fee: { currency: "BRL", decimal: "2" },
      effectiveDate: "2026-01-03",
    }),
    trade({
      id: "buy-late",
      quantity: "1",
      price: "20",
      effectiveDate: "2026-01-02",
    }),
    trade({
      id: "buy-early",
      quantity: "2",
      price: "10",
      fee: { currency: "BRL", decimal: "1" },
    }),
  ];

  assert.deepEqual(domain.reducePosition({
    portfolioId: "portfolio-a",
    asset,
    transactions,
  }), {
    portfolioId: "portfolio-a",
    assetId: "asset-a",
    currency: "BRL",
    quantity: "2",
    investedAmount: "27.333333333333333333",
    averageCost: "13.666666666666666667",
    closed: false,
  });
});

test("materializes an explicit closed position without mutating the ledger", () => {
  const asset = { id: "asset-a", currency: "BRL" };
  const transactions = [
    trade({
      id: "sell-all",
      kind: "sell",
      quantity: "3",
      price: "12",
      effectiveDate: "2026-01-02",
    }),
    trade({ id: "buy", quantity: "3", price: "10" }),
  ];
  const originalTransactions = [...transactions];

  assert.deepEqual(domain.reducePosition({
    portfolioId: "portfolio-a",
    asset,
    transactions,
  }), {
    portfolioId: "portfolio-a",
    assetId: "asset-a",
    currency: "BRL",
    quantity: "0",
    investedAmount: "0",
    averageCost: null,
    closed: true,
  });
  assert.deepEqual(transactions, originalTransactions);
});

test("groups positions by asset identity and orders the result deterministically", () => {
  const assets = [
    { id: "asset-z", currency: "USD" },
    { id: "asset-a", currency: "BRL" },
  ];
  const transactions = [
    trade({ id: "z-buy", assetId: "asset-z", currency: "USD", quantity: "1", price: "3" }),
    trade({ id: "a-buy", assetId: "asset-a", quantity: "1", price: "2" }),
  ];

  assert.deepEqual(
    domain.reducePositions({ portfolioId: "portfolio-a", assets, transactions })
      .map(({ assetId }) => assetId),
    ["asset-a", "asset-z"],
  );
  assert.throws(
    () => domain.reducePositions({
      portfolioId: "portfolio-a",
      assets,
      transactions: [trade({ id: "missing", assetId: "asset-missing", quantity: "1", price: "2" })],
    }),
    errorCode("POSITION_ASSET_NOT_FOUND"),
  );
});

test("rejects invalid Position ledger references, currencies, and balances", () => {
  const asset = { id: "asset-a", currency: "BRL" };

  assert.throws(
    () => domain.reducePosition({
      portfolioId: "portfolio-a",
      asset,
      transactions: [trade({ id: "wrong-asset", assetId: "asset-b", quantity: "1", price: "2" })],
    }),
    errorCode("POSITION_ASSET_MISMATCH"),
  );
  assert.throws(
    () => domain.reducePosition({
      portfolioId: "portfolio-a",
      asset,
      transactions: [trade({ id: "wrong-currency", currency: "USD", quantity: "1", price: "2" })],
    }),
    errorCode("POSITION_CURRENCY_MISMATCH"),
  );
  assert.throws(
    () => domain.reducePosition({
      portfolioId: "portfolio-a",
      asset,
      transactions: [trade({ id: "sell", kind: "sell", quantity: "1", price: "2" })],
    }),
    errorCode("INSUFFICIENT_QUANTITY"),
  );
});
