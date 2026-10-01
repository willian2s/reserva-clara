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
    unitPrice: { currency: "BRL", decimal: "10.00" },
    fee,
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

test("Asset update input is closed and cannot provide persisted identity metadata", () => {
  const input = domain.parseAssetUpdateInput({
    symbol: " bova11 ",
    market: " b3 ",
    assetType: "etf",
    currency: "BRL",
  });

  assert.deepEqual(input, {
    symbol: "BOVA11",
    market: "B3",
    assetType: "etf",
    currency: "BRL",
  });
  for (const field of ["id", "identityKey", "createdAt"]) {
    assert.throws(
      () => domain.parseAssetUpdateInput({ ...input, [field]: "external" }),
      errorCode("INVALID_DOMAIN_INPUT"),
    );
  }
});

test("Quote contract validates price, UTC timestamps, mapping and changed symbols", () => {
  const supportedAsset = {
    symbol: "PETR4",
    market: "B3",
    assetType: "stock",
    currency: "BRL",
  };
  const mapping = domain.mapAssetToBrapi(supportedAsset);

  assert.deepEqual(mapping, {
    provider: "brapi",
    endpoint: "https://brapi.dev/api/v2/stocks/quote",
    symbol: "PETR4",
  });
  assert.equal(
    domain.createQuoteCacheKey(mapping),
    "v1:brapi:https://brapi.dev/api/v2/stocks/quote:PETR4",
  );
  for (const assetType of ["etf", "fii"]) {
    assert.equal(domain.mapAssetToBrapi({ ...supportedAsset, assetType }).symbol, "PETR4");
  }
  assert.equal(domain.mapAssetToBrapi({ ...supportedAsset, assetType: "fund" }), null);
  assert.equal(domain.mapAssetToBrapi({ ...supportedAsset, market: "NYSE" }), null);
  assert.equal(domain.mapAssetToBrapi({ ...supportedAsset, currency: "USD" }), null);
  assert.deepEqual(domain.QUOTE_CACHE_POLICY, {
    freshTtlMs: 60_000,
    staleIfErrorMs: 300_000,
    upstreamTimeoutMs: 3_000,
    maxRetries: 1,
    retryBackoffMinMs: 100,
    retryBackoffMaxMs: 250,
    maxBatchSize: 20,
    maxConcurrentUpstreamRequests: 1,
    maxCacheEntries: 500,
  });

  const parsed = domain.parseQuote({
    assetId: "asset-petr4",
    provider: "brapi",
    requestedSymbol: "PETR4",
    providerSymbol: "PETR4F",
    symbolChanged: true,
    price: { currency: "BRL", decimal: "41.1800" },
    quotedAt: "2026-09-30T12:00:00.000Z",
    fetchedAt: "2026-09-30T12:00:01.000Z",
    freshness: "fresh",
  });

  assert.equal(parsed.price.decimal, "41.18");
  assert.equal(parsed.providerSymbol, "PETR4F");
  assert.equal(domain.parseQuotePrice(41.18), "41.18");
  assert.throws(() => domain.parseQuotePrice(0), errorCode("INVALID_DECIMAL"));
  assert.throws(() => domain.parseQuotePrice(-1), errorCode("INVALID_DECIMAL"));
  assert.throws(() => domain.parseQuotePrice(Number.NaN), errorCode("INVALID_DECIMAL"));
  assert.throws(
    () => domain.parseQuotePrice("1e2"),
    errorCode("INVALID_DECIMAL"),
  );
  assert.throws(
    () => domain.parseQuote({
      ...parsed,
      price: { currency: "ZZZ", decimal: "41.18" },
    }),
    errorCode("INVALID_DOMAIN_VALUE"),
  );
  assert.throws(
    () => domain.parseQuote({ ...parsed, quotedAt: "2026-02-29T12:00:00Z" }),
    errorCode("INVALID_DATE"),
  );
  assert.deepEqual(
    domain.parseQuoteResult({
      assetId: "asset-other",
      status: "unavailable",
      code: "UNSUPPORTED_ASSET",
    }),
    {
      assetId: "asset-other",
      status: "unavailable",
      code: "UNSUPPORTED_ASSET",
    },
  );
  assert.throws(
    () => domain.parseQuoteResult({
      assetId: "asset-other",
      status: "available",
      quote: parsed,
    }),
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

test("decimal rational operations preserve exact intermediates and materialize half-up", () => {
  assert.deepEqual(domain.decimalToRational("1.2500"), {
    numerator: 5n,
    denominator: 4n,
  });
  assert.equal(domain.multiplyDecimalStrings("0.99", "0.01"), "0.0099");
  assert.equal(domain.divideDecimalStrings("1", "4"), "0.25");
  assert.equal(domain.divideDecimalStrings("1", "3"), "0.333333333333333333");
  assert.equal(domain.divideDecimalStrings("2", "3"), "0.666666666666666667");
  assert.equal(
    domain.materializeDecimalRational({
      numerator: -2000000000000000001n,
      denominator: 2000000000000000000n,
    }),
    "-1.000000000000000001",
  );

  const exactSum = domain.addDecimalRationals(
    domain.divideDecimalRationals(domain.decimalToRational("1"), domain.decimalToRational("3")),
    domain.divideDecimalRationals(domain.decimalToRational("1"), domain.decimalToRational("3")),
  );
  assert.equal(domain.materializeDecimalRational(exactSum), "0.666666666666666667");
  assert.equal(
    domain.materializeDecimalRational(
      domain.decimalToRational("123456789012345678901234567890.123456789012345678"),
    ),
    "123456789012345678901234567890.123456789012345678",
  );
  assert.equal(
    domain.materializeDecimalRational(
      domain.subtractDecimalRationals(
        domain.decimalToRational("1"),
        domain.decimalToRational("1.25"),
      ),
    ),
    "-0.25",
  );
});

test("signed decimal difference and rational failures remain explicit", () => {
  assert.equal(domain.subtractSignedDecimalStrings("0", "2"), "-2");
  assert.equal(domain.subtractSignedDecimalStrings("1.10", "1.1"), "0");
  assert.throws(
    () => domain.subtractDecimalStrings("0", "1"),
    errorCode("INVALID_DECIMAL"),
  );
  assert.throws(
    () => domain.divideDecimalStrings("1", "0"),
    errorCode("INVALID_DOMAIN_VALUE"),
  );
  assert.throws(
    () => domain.multiplyDecimalStrings("999999999999999999999999999999", "10"),
    errorCode("POSITION_ARITHMETIC_OVERFLOW"),
  );
  assert.throws(
    () => domain.divideDecimalStrings("999999999999999999999999999999", "0.1"),
    errorCode("POSITION_ARITHMETIC_OVERFLOW"),
  );
  assert.throws(
    () => domain.subtractSignedDecimalStrings("999999999999999999999999999999", "-1"),
    errorCode("POSITION_ARITHMETIC_OVERFLOW"),
  );
});

test("Transaction is a closed buy/sell contract and preserves Timestamp precision", () => {
  const parsed = transaction({ id: "tx-a", quantity: "1.2300", seconds: 42, nanoseconds: 123 });
  assert.equal(parsed.quantity, "1.23");
  assert.equal(parsed.fee, null);
  assert.deepEqual(parsed.createdAt, { seconds: 42, nanoseconds: 123 });
  assert.deepEqual(
    transaction({
      id: "tx-fee",
      fee: { currency: "USD", decimal: "1.2300" },
    }).fee,
    { currency: "USD", decimal: "1.23" },
  );
  assert.equal(
    domain.parseTransactionInput({
      kind: "buy",
      assetId: "asset-a",
      quantity: "1",
      unitPrice: { currency: "BRL", decimal: "10" },
      effectiveDate: "2026-01-01",
    }).fee,
    null,
  );
  assert.equal(
    domain.parseTransactionInput({
      kind: "buy",
      assetId: "asset-a",
      quantity: "1",
      unitPrice: { currency: "BRL", decimal: "10" },
      fee: { currency: "BRL", decimal: "0.000" },
      effectiveDate: "2026-01-01",
    }).fee,
    null,
  );
  assert.throws(
    () => domain.parseTransactionInput({
      kind: "buy",
      assetId: "asset-a",
      quantity: "1",
      unitPrice: { currency: "BRL", decimal: "10" },
      fee: { currency: "BRL", decimal: "-1" },
      effectiveDate: "2026-01-01",
    }),
    errorCode("INVALID_DECIMAL"),
  );
  const feeTransaction = transaction({
    id: "tx-fee-match",
    fee: { currency: "BRL", decimal: "1" },
  });
  assert.equal(
    domain.transactionPayloadEquals(feeTransaction, {
      kind: feeTransaction.kind,
      assetId: feeTransaction.assetId,
      quantity: feeTransaction.quantity,
      unitPrice: feeTransaction.unitPrice,
      fee: feeTransaction.fee,
      effectiveDate: feeTransaction.effectiveDate,
    }),
    true,
  );
  assert.equal(
    domain.transactionPayloadEquals(feeTransaction, {
      kind: feeTransaction.kind,
      assetId: feeTransaction.assetId,
      quantity: feeTransaction.quantity,
      unitPrice: feeTransaction.unitPrice,
      fee: { currency: "BRL", decimal: "2" },
      effectiveDate: feeTransaction.effectiveDate,
    }),
    false,
  );
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
  assert.equal(
    domain.parsePersistedTransactionData({
      kind: parsed.kind,
      assetId: parsed.assetId,
      quantity: parsed.quantity,
      unitPrice: parsed.unitPrice,
      effectiveDate: parsed.effectiveDate,
      createdAt: parsed.createdAt,
    }).fee,
    null,
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
    domain.reduceTransactionQuantity([
      transaction({ id: "without-fee", quantity: "1" }),
      transaction({
        id: "with-fee",
        quantity: "1",
        effectiveDate: "2026-01-02",
        fee: { currency: "BRL", decimal: "999.99" },
      }),
    ]),
    "2",
  );
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
