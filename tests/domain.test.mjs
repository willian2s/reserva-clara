import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const domain = require(resolve(process.env.DOMAIN_TEST_BUILD, "index.js"));

const errorCode = (code) => (error) => error?.code === code;

const transaction = ({
  id,
  assetId = "asset-a",
  kind = "buy",
  quantity = "1",
  effectiveDate = "2026-01-01",
  seconds = 1,
  nanoseconds = 0,
}) =>
  domain.parseTransaction({
    id,
    assetId,
    kind,
    quantity,
    unitPrice: { currency: "BRL", decimal: "10.00" },
    effectiveDate,
    createdAt: { seconds, nanoseconds },
  });

test("Asset normalizes identity fields and derives a closed identity key", () => {
  const asset = domain.parseAssetInput({
    symbol: " bova11 ",
    market: " b3 ",
    assetType: "etf",
    currency: "BRL",
  });

  assert.deepEqual(asset, {
    symbol: "BOVA11",
    market: "B3",
    assetType: "etf",
    currency: "BRL",
  });
  assert.equal(
    domain.createAssetIdentityKey("BOVA11", "B3", "etf", "BRL"),
    "BOVA11~B3~etf~BRL",
  );
  assert.throws(
    () => domain.parseAssetInput({ ...asset, unexpected: true }),
    errorCode("INVALID_DOMAIN_INPUT"),
  );
  assert.throws(
    () => domain.parseAssetInput({ ...asset, assetType: "future" }),
    errorCode("INVALID_DOMAIN_VALUE"),
  );
});

test("decimal input normalizes while persisted grammar stays canonical and bounded", () => {
  assert.equal(domain.parseDecimalString("1.2300"), "1.23");
  assert.equal(domain.parseDecimalString("0.000"), "0");
  assert.equal(domain.parsePersistedDecimalString("0"), "0");
  assert.equal(
    domain.parsePersistedDecimalString("123456789012345678901234567890.123456789012345678"),
    "123456789012345678901234567890.123456789012345678",
  );
  assert.throws(() => domain.parsePersistedDecimalString("1.20"), errorCode("INVALID_DECIMAL"));
  assert.throws(() => domain.parseDecimalString("1".repeat(31)), errorCode("INVALID_DECIMAL"));
  assert.throws(
    () => domain.parseDecimalString("1." + "1".repeat(19)),
    errorCode("INVALID_DECIMAL"),
  );
  assert.throws(() => domain.parseQuantity("0"), errorCode("INVALID_DECIMAL"));
});

test("decimal operations use exact carry, borrow and comparison", () => {
  assert.equal(domain.addDecimalStrings("0.99", "0.01"), "1");
  assert.equal(domain.subtractDecimalStrings("2.000", "0.001"), "1.999");
  assert.equal(domain.compareDecimalStrings("1.10", "1.1"), 0);
  assert.equal(domain.compareDecimalStrings("0.999", "1"), -1);
});

test("Transaction is a closed buy/sell contract and preserves Timestamp precision", () => {
  const parsed = transaction({ id: "tx-a", quantity: "1.2300", seconds: 42, nanoseconds: 123 });
  assert.equal(parsed.quantity, "1.23");
  assert.deepEqual(parsed.createdAt, { seconds: 42, nanoseconds: 123 });
  assert.throws(
    () => transaction({ id: "tx-future", kind: "dividend" }),
    errorCode("INVALID_DOMAIN_INPUT"),
  );
  assert.throws(
    () => domain.parsePersistedTransactionData({
      kind: parsed.kind,
      assetId: parsed.assetId,
      quantity: "1.20",
      unitPrice: parsed.unitPrice,
      effectiveDate: parsed.effectiveDate,
      createdAt: parsed.createdAt,
    }),
    errorCode("INVALID_DECIMAL"),
  );
});

test("reducer sorts backfill, same-day ties and rejects mixed assets or negative balance", () => {
  const events = [
    transaction({ id: "sell", kind: "sell", quantity: "0.50", effectiveDate: "2026-01-02", seconds: 3 }),
    transaction({ id: "buy-late", quantity: "1", effectiveDate: "2026-01-02", seconds: 2 }),
    transaction({ id: "buy-early", quantity: "0.25", effectiveDate: "2026-01-01", seconds: 2 }),
  ];
  assert.equal(domain.reduceTransactionQuantity(events), "0.75");
  assert.equal(
    domain.sortTransactions([
      transaction({ id: "B", seconds: 2 }),
      transaction({ id: "a", seconds: 2, nanoseconds: 1 }),
      transaction({ id: "A", seconds: 2 }),
    ]).map(({ id }) => id).join(","),
    "A,B,a",
  );
  assert.throws(
    () => domain.reduceTransactionQuantity([transaction({ id: "sell", kind: "sell" })]),
    errorCode("INSUFFICIENT_QUANTITY"),
  );
  assert.throws(
    () => domain.reduceTransactionQuantity([
      transaction({ id: "a", assetId: "asset-a" }),
      transaction({ id: "b", assetId: "asset-b" }),
    ]),
    errorCode("INVALID_REFERENCE"),
  );
});
