import assert from "node:assert/strict";
import test from "node:test";

const buildDirectory = process.env.QUOTES_SERVICE_TEST_BUILD;
if (!buildDirectory) {
  throw new Error("QUOTES_SERVICE_TEST_BUILD is required");
}

const { createQuoteService } = await import(
  `${buildDirectory}/server/quotes/quote-service.js`,
);
const { QuoteCache } = await import(
  `${buildDirectory}/server/quotes/quote-cache.js`,
);

const asset = (id, overrides = {}) => ({
  id,
  symbol: "PETR4",
  market: "B3",
  assetType: "stock",
  currency: "BRL",
  identityKey: "PETR4~B3~stock~BRL",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const quote = (currentAsset, price = "41.18", now = "2026-09-30T12:00:00.000Z") => ({
  assetId: currentAsset.id,
  provider: "brapi",
  requestedSymbol: currentAsset.symbol,
  providerSymbol: currentAsset.symbol,
  symbolChanged: false,
  price: { currency: currentAsset.currency, decimal: price },
  quotedAt: now,
  fetchedAt: now,
  freshness: "fresh",
});

const transient = (code = "TIMEOUT") => Object.assign(new Error(code), {
  code,
  retryable: true,
});

test("serves fresh cache entries and refreshes them at the TTL", async () => {
  let currentTime = Date.parse("2026-09-30T12:00:00.000Z");
  let calls = 0;
  const currentAsset = asset("asset-petr4");
  const service = createQuoteService({
    cache: new QuoteCache(),
    clock: () => new Date(currentTime),
    adapter: { getQuote: async (value) => {
      calls += 1;
      return quote(value, String(40 + calls), new Date(currentTime).toISOString());
    } },
  });

  assert.equal((await service.getQuote(currentAsset)).quote.price.decimal, "41");
  currentTime += 59_999;
  assert.equal((await service.getQuote(currentAsset)).quote.price.decimal, "41");
  assert.equal(calls, 1);
  currentTime += 1;
  assert.equal((await service.getQuote(currentAsset)).quote.price.decimal, "42");
  assert.equal(calls, 2);
});

test("shares an in-flight promise and deduplicates symbols in a batch", async () => {
  let release;
  let calls = 0;
  const pending = new Promise((resolve) => { release = resolve; });
  const first = asset("asset-one");
  const second = asset("asset-two");
  const service = createQuoteService({
    cache: new QuoteCache(),
    adapter: {
      getQuote: async (value) => {
        calls += 1;
        await pending;
        return quote(value);
      },
    },
  });

  const firstResult = service.getQuote(first);
  const batchResult = service.getQuotes([first, second]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  release();
  const results = await Promise.all([firstResult, batchResult]);
  assert.equal(results[0].status, "available");
  assert.deepEqual(results[1].map((result) => result.assetId), ["asset-one", "asset-two"]);
});

test("shares the process cache and upstream slot across service instances", async () => {
  let release;
  let calls = 0;
  let active = 0;
  let maximumActive = 0;
  const pending = new Promise((resolve) => { release = resolve; });
  const currentAsset = asset("process-shared", {
    symbol: "PROCESS1",
    identityKey: "PROCESS1~B3~stock~BRL",
  });
  const otherAsset = asset("process-other", {
    symbol: "PROCESS2",
    identityKey: "PROCESS2~B3~stock~BRL",
  });
  const adapter = {
    getQuote: async (value) => {
      calls += 1;
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      if (value.symbol === "PROCESS1") await pending;
      await new Promise((resolve) => setImmediate(resolve));
      active -= 1;
      return quote(value);
    },
  };
  const firstService = createQuoteService({ adapter });
  const secondService = createQuoteService({ adapter });

  const first = firstService.getQuote(currentAsset);
  const shared = secondService.getQuote(currentAsset);
  const serialized = secondService.getQuote(otherAsset);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(maximumActive, 1);
  release();
  await Promise.all([first, shared, serialized]);
  assert.equal(calls, 2);
});

test("retries transient failures once with controlled backoff", async () => {
  let calls = 0;
  const delays = [];
  const currentAsset = asset("asset-petr4");
  const service = createQuoteService({
    cache: new QuoteCache(),
    adapter: { getQuote: async (value) => {
      calls += 1;
      if (calls === 1) throw transient("RATE_LIMITED");
      return quote(value);
    } },
    sleeper: async (milliseconds) => delays.push(milliseconds),
  });

  const result = await service.getQuote(currentAsset);
  assert.equal(result.status, "available");
  assert.equal(calls, 2);
  assert.deepEqual(delays, [100]);
});

test("does not retry permanent errors and preserves partial results", async () => {
  let calls = 0;
  const supported = asset("supported");
  const unavailable = asset("unavailable", { symbol: "VALE3", identityKey: "VALE3~B3~stock~BRL" });
  const malformed = asset("malformed", { symbol: "ITUB4", identityKey: "ITUB4~B3~stock~BRL" });
  const unsupported = asset("unsupported", { assetType: "fund", identityKey: "PETR4~B3~fund~BRL" });
  const service = createQuoteService({
    cache: new QuoteCache(),
    adapter: { getQuote: async (value) => {
      calls += 1;
      if (value.id === "unavailable") throw Object.assign(new Error("bad request"), {
        code: "NOT_FOUND",
        retryable: false,
      });
      if (value.id === "malformed") return {};
      return quote(value);
    } },
  });

  const results = await service.getQuotes([supported, unavailable, malformed, unsupported]);
  assert.deepEqual(results.map((result) => result.status), ["available", "unavailable", "unavailable", "unavailable"]);
  assert.equal(results[1].code, "NOT_FOUND");
  assert.equal(results[2].code, "INVALID_PROVIDER_RESPONSE");
  assert.equal(results[3].code, "UNSUPPORTED_ASSET");
  assert.equal(calls, 3);
});

test("serves transient stale data only inside the stale window", async () => {
  let currentTime = Date.parse("2026-09-30T12:00:00.000Z");
  let calls = 0;
  const currentAsset = asset("asset-petr4");
  const service = createQuoteService({
    cache: new QuoteCache(),
    clock: () => new Date(currentTime),
    adapter: { getQuote: async (value) => {
      calls += 1;
      if (calls > 1) throw transient();
      return quote(value, "41.18", new Date(currentTime).toISOString());
    } },
    sleeper: async () => {},
  });

  await service.getQuote(currentAsset);
  currentTime += 60_000;
  const stale = await service.getQuote(currentAsset);
  assert.equal(stale.status, "available");
  assert.equal(stale.quote.freshness, "stale");
  currentTime += 300_001;
  const expired = await service.getQuote(currentAsset);
  assert.deepEqual(expired, {
    assetId: "asset-petr4",
    status: "unavailable",
    code: "TIMEOUT",
  });
  assert.equal(calls, 5);
});

test("does not serve stale data after a refresh wait crosses the stale window", async () => {
  let currentTime = Date.parse("2026-09-30T12:00:00.000Z");
  let calls = 0;
  const currentAsset = asset("asset-long-refresh");
  const service = createQuoteService({
    cache: new QuoteCache(),
    clock: () => new Date(currentTime),
    adapter: { getQuote: async (value) => {
      calls += 1;
      if (calls > 1) throw transient();
      return quote(value, "41.18", new Date(currentTime).toISOString());
    } },
    sleeper: async () => {
      currentTime += 300_001;
    },
  });

  await service.getQuote(currentAsset);
  currentTime += 60_000;
  const result = await service.getQuote(currentAsset);
  assert.deepEqual(result, {
    assetId: "asset-long-refresh",
    status: "unavailable",
    code: "TIMEOUT",
  });
  assert.equal(calls, 3);
});

test("enforces batch and process-local cache limits", async () => {
  let calls = 0;
  const service = createQuoteService({
    cache: new QuoteCache(500),
    adapter: { getQuote: async (value) => {
      calls += 1;
      return quote(value);
    } },
  });
  const tooMany = Array.from({ length: 21 }, (_, index) => asset(`too-many-${index}`));
  const limited = await service.getQuotes(tooMany);
  assert.ok(limited.every((result) => result.code === "BATCH_LIMIT"));
  assert.equal(calls, 0);

  const allAssets = Array.from({ length: 501 }, (_, index) => asset(`asset-${index}`, {
    symbol: `SYM${index}`,
    identityKey: `SYM${index}~B3~stock~BRL`,
  }));
  for (let index = 0; index < allAssets.length; index += 20) {
    await service.getQuotes(allAssets.slice(index, index + 20));
  }
  assert.equal(calls, 501);
  assert.equal((await service.getQuote(allAssets[0])).status, "available");
  assert.equal(calls, 502);
});
