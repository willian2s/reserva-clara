import assert from "node:assert/strict";
import test from "node:test";
import { changedBrapiResponse, successfulBrapiResponse } from "./fixtures/brapi-responses.mjs";

const buildDirectory = process.env.QUOTES_ADAPTER_TEST_BUILD;
if (!buildDirectory) {
  throw new Error("QUOTES_ADAPTER_TEST_BUILD is required");
}

const { BrapiAdapter } = await import(
  `${buildDirectory}/server/quotes/brapi-adapter.js`,
);
const { mapAssetToBrapi } = await import(
  `${buildDirectory}/server/quotes/brapi-mapping.js`,
);

const asset = (overrides = {}) => ({
  id: "asset-petr4",
  symbol: "PETR4",
  market: "B3",
  assetType: "stock",
  currency: "BRL",
  identityKey: "PETR4~B3~stock~BRL",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const response = (body, status = 200) =>
  new Response(body === undefined ? undefined : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const errorCode = (code) => (error) =>
  error?.code === code && typeof error.message === "string";

test("maps only supported B3/BRL asset types", () => {
  assert.equal(mapAssetToBrapi(asset()).symbol, "PETR4");
  assert.equal(mapAssetToBrapi(asset({ assetType: "etf" })).symbol, "PETR4");
  assert.equal(mapAssetToBrapi(asset({ assetType: "fii" })).symbol, "PETR4");
  assert.equal(mapAssetToBrapi(asset({ assetType: "fund" })), null);
  assert.equal(mapAssetToBrapi(asset({ market: "NYSE" })), null);
  assert.equal(mapAssetToBrapi(asset({ currency: "USD" })), null);
  assert.equal(mapAssetToBrapi(asset({ symbol: "PETR4&token=leak" })), null);
  assert.equal(mapAssetToBrapi(asset({ symbol: "petr4" })), null);
});

test("does not call the provider for an unsupported asset", async () => {
  let called = false;
  await assert.rejects(
    new BrapiAdapter({
      apiKey: "secret-key",
      fetch: async () => {
        called = true;
        return response(successfulBrapiResponse);
      },
    }).getQuote(asset({ assetType: "fund" })),
    errorCode("UNSUPPORTED_ASSET"),
  );
  assert.equal(called, false);
});

test("requests the fixed endpoint with only server-side Authorization", async () => {
  const calls = [];
  const adapter = new BrapiAdapter({
    apiKey: "secret-key",
    now: () => new Date("2026-09-30T12:00:01.000Z"),
    fetch: async (url, init) => {
      calls.push({ url, init });
      return response(successfulBrapiResponse);
    },
  });

  const quote = await adapter.getQuote(asset());
  const requestUrl = new URL(calls[0].url);
  assert.equal(requestUrl.origin, "https://brapi.dev");
  assert.equal(requestUrl.pathname, "/api/v2/stocks/quote");
  assert.equal(requestUrl.searchParams.get("symbols"), "PETR4");
  assert.equal(requestUrl.searchParams.has("token"), false);
  assert.deepEqual(calls[0].init.headers, { Authorization: "Bearer secret-key" });
  assert.equal(quote.price.decimal, "41.18");
  assert.equal(quote.price.currency, "BRL");
  assert.equal(quote.fetchedAt, "2026-09-30T12:00:01.000Z");
});

test("preserves local identity when provider changes the ticker", async () => {
  const localAsset = asset();
  const quote = await new BrapiAdapter({
    apiKey: "secret-key",
    fetch: async () => response(changedBrapiResponse),
  }).getQuote(localAsset);

  assert.equal(localAsset.symbol, "PETR4");
  assert.equal(localAsset.identityKey, "PETR4~B3~stock~BRL");
  assert.equal(quote.requestedSymbol, "PETR4");
  assert.equal(quote.providerSymbol, "PETR4F");
  assert.equal(quote.symbolChanged, true);
});

test("sanitizes status, configuration and network failures", async () => {
  for (const [status, code, retryable] of [
    [404, "NOT_FOUND", false],
    [400, "INVALID_PROVIDER_RESPONSE", false],
    [401, "INVALID_PROVIDER_RESPONSE", false],
    [403, "INVALID_PROVIDER_RESPONSE", false],
    [429, "RATE_LIMITED", true],
    [503, "PROVIDER_UNAVAILABLE", true],
  ]) {
    const adapter = new BrapiAdapter({
      apiKey: "secret-key",
      fetch: async () => response({ secret: "must-not-leak" }, status),
    });
    await assert.rejects(adapter.getQuote(asset()), (error) => {
      assert.equal(error.code, code);
      assert.equal(error.retryable, retryable);
      assert.equal(error.message.includes("secret"), false);
      return true;
    });
  }

  await assert.rejects(
    new BrapiAdapter({
      apiKey: "secret-key",
      fetch: async () => { throw new Error("provider body"); },
    }).getQuote(asset()),
    (error) => {
      assert.equal(error.code, "PROVIDER_UNAVAILABLE");
      assert.equal(error.retryable, true);
      assert.equal(error.message.includes("provider body"), false);
      return true;
    },
  );
  await assert.rejects(
    new BrapiAdapter({ fetch: async () => response(successfulBrapiResponse) }).getQuote(asset()),
    errorCode("NOT_CONFIGURED"),
  );
});

test("distinguishes timeout and rejects malformed provider responses", async () => {
  await assert.rejects(
    new BrapiAdapter({
      apiKey: "secret-key",
      timeoutMs: 5,
      fetch: (_url, init) => new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      }),
    }).getQuote(asset()),
    errorCode("TIMEOUT"),
  );

  for (const body of [
    {},
    { results: [] },
    { results: [{ requestedSymbol: "VALE3", symbol: "VALE3", changed: false, data: {} }] },
    { results: [{ requestedSymbol: "PETR4", symbol: "PETR4", changed: false, data: { currency: "BRL", regularMarketPrice: 0, regularMarketTime: "2026-09-30T12:00:00.000Z" } }] },
    { results: [{ requestedSymbol: "PETR4", symbol: "PETR4", changed: false, data: { currency: "USD", regularMarketPrice: 41.18, regularMarketTime: "2026-09-30T12:00:00.000Z" } }] },
    { results: [{ requestedSymbol: "PETR4", symbol: "PETR4", changed: false, data: { currency: "BRL", regularMarketPrice: 41.18, regularMarketTime: "not-a-date" } }] },
  ]) {
    await assert.rejects(
      new BrapiAdapter({ apiKey: "secret-key", fetch: async () => response(body) }).getQuote(asset()),
      (error) => {
        assert.ok(["CURRENCY_MISMATCH", "INVALID_PROVIDER_RESPONSE"].includes(error.code));
        assert.equal(error.message.includes("regularMarket"), false);
        return true;
      },
    );
  }
});

test("keeps the timeout active while reading the response body", async () => {
  await assert.rejects(
    new BrapiAdapter({
      apiKey: "secret-key",
      timeoutMs: 5,
      fetch: async (_url, init) => ({
        ok: true,
        status: 200,
        json: () => new Promise((_, reject) => {
          init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
      }),
    }).getQuote(asset()),
    (error) => {
      assert.equal(error.code, "TIMEOUT");
      assert.equal(error.retryable, true);
      return true;
    },
  );
});
