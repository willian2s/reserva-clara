import assert from "node:assert/strict";
import test from "node:test";

const buildDirectory = process.env.QUOTES_ROUTE_TEST_BUILD;
if (!buildDirectory) {
  throw new Error("QUOTES_ROUTE_TEST_BUILD is required");
}

const { createQuotesPostHandler, parseBearerToken, parseRequestBody } = await import(
  `${buildDirectory}/server/quotes/route-handler.js`
);
const { createAssetReader } = await import(`${buildDirectory}/server/data/asset-reader.js`);
const { config: proxyConfig, proxy } = await import(`${buildDirectory}/proxy.js`);
const { Timestamp } = await import("firebase-admin/firestore");
const { NextRequest } = await import("next/server.js");

function request(body, token = "valid-token") {
  return new Request("http://localhost/api/quotes", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function asset(id) {
  return {
    id,
    symbol: "PETR4",
    market: "B3",
    assetType: "stock",
    currency: "BRL",
    identityKey: "PETR4~B3~stock~BRL",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

test("parses Bearer credentials without accepting malformed headers", () => {
  assert.equal(parseBearerToken("Bearer token-value"), "token-value");
  assert.equal(parseBearerToken("Basic token-value"), null);
  assert.equal(parseBearerToken("Bearer token extra"), null);
});

test("deduplicates valid asset IDs and rejects unknown body fields and batch overflow", () => {
  assert.deepEqual(parseRequestBody({ assetIds: ["a", "a", "b"] }), {
    assetIds: ["a", "b"],
  });

  assert.throws(() => parseRequestBody({ assetIds: ["a"], uid: "attacker" }), {
    publicCode: "INVALID_REQUEST",
  });
  assert.throws(
    () => parseRequestBody({ assetIds: Array.from({ length: 21 }, (_, index) => String(index)) }),
    { publicCode: "BATCH_LIMIT" },
  );
});

test("returns sanitized 401 before reading body or calling downstream", async () => {
  let verified = false;
  let read = false;
  let called = false;
  const handler = createQuotesPostHandler({
    async verifyIdToken() {
      verified = true;
      return { uid: "owner" };
    },
    async listOwnedAssets() {
      read = true;
      return [];
    },
    quoteService: {
      async getQuotes() {
        called = true;
        return [];
      },
    },
  });

  const response = await handler(request({ assetIds: ["asset-1"] }, null));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: { code: "UNAUTHENTICATED" } });
  assert.equal(verified, false);
  assert.equal(read, false);
  assert.equal(called, false);
});

test("sanitizes invalid and unconfigured verifier failures", async () => {
  let read = false;
  const dependencies = (error) => ({
    async verifyIdToken() {
      throw error;
    },
    async listOwnedAssets() {
      read = true;
      return [];
    },
    quoteService: {
      async getQuotes() {
        read = true;
        return [];
      },
    },
  });

  const invalidResponse = await createQuotesPostHandler(dependencies(new Error("expired")))(
    request({ assetIds: ["asset-1"] }),
  );
  assert.equal(invalidResponse.status, 401);
  assert.deepEqual(await invalidResponse.json(), { error: { code: "UNAUTHENTICATED" } });
  assert.equal(read, false);

  const notConfiguredResponse = await createQuotesPostHandler(
    dependencies({ code: "NOT_CONFIGURED" }),
  )(request({ assetIds: ["asset-1"] }));
  assert.equal(notConfiguredResponse.status, 503);
  assert.deepEqual(await notConfiguredResponse.json(), { error: { code: "NOT_CONFIGURED" } });
});

test("derives ownership from verified UID and never sends missing assets to service", async () => {
  const calls = { uid: null, assetIds: null, serviceAssets: null };
  const ownedAsset = asset("owned");
  const handler = createQuotesPostHandler({
    async verifyIdToken(token) {
      assert.equal(token, "verified-token");
      return { uid: "verified-owner" };
    },
    async listOwnedAssets(uid, assetIds) {
      calls.uid = uid;
      calls.assetIds = [...assetIds];
      return assetIds.includes("owned") ? [ownedAsset] : [];
    },
    quoteService: {
      async getQuotes(assets) {
        calls.serviceAssets = assets.map(({ id }) => id);
        return assets.map(({ id }) => ({
          assetId: id,
          status: "unavailable",
          code: "NOT_CONFIGURED",
        }));
      },
    },
  });

  const response = await handler(
    request({ assetIds: ["owned", "missing", "owned"] }, "verified-token"),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(calls, {
    uid: "verified-owner",
    assetIds: ["owned", "missing"],
    serviceAssets: ["owned"],
  });
  assert.deepEqual(await response.json(), {
    results: [
      { assetId: "owned", status: "unavailable", code: "NOT_CONFIGURED" },
      { assetId: "missing", status: "unavailable", code: "NOT_FOUND" },
    ],
  });
});

test("reader builds owner-scoped asset reads and converts Admin timestamps", async () => {
  const reads = [];
  const timestamp = Timestamp.fromDate(new Date("2026-01-02T03:04:05.000Z"));
  const reader = createAssetReader({
    async getAssetDocument(uid, assetId) {
      reads.push({ uid, assetId });
      return assetId === "owned"
        ? {
            symbol: "PETR4",
            market: "B3",
            assetType: "stock",
            currency: "BRL",
            identityKey: "PETR4~B3~stock~BRL",
            createdAt: timestamp,
            updatedAt: timestamp,
          }
        : null;
    },
  });

  const assets = await reader.listOwnedAssets("verified-owner", ["owned", "other"]);
  assert.deepEqual(reads, [
    { uid: "verified-owner", assetId: "owned" },
    { uid: "verified-owner", assetId: "other" },
  ]);
  assert.equal(assets.length, 1);
  assert.equal(assets[0].id, "owned");
  assert.equal(assets[0].createdAt.toISOString(), "2026-01-02T03:04:05.000Z");
});

test("real reader seam prevents cross-user assets from reaching the service", async () => {
  const downstream = [];
  const timestamp = Timestamp.fromDate(new Date("2026-01-02T03:04:05.000Z"));
  const reader = createAssetReader({
    async getAssetDocument(uid, assetId) {
      if (uid !== "verified-owner" || assetId !== "owned") {
        return null;
      }

      return {
        symbol: "PETR4",
        market: "B3",
        assetType: "stock",
        currency: "BRL",
        identityKey: "PETR4~B3~stock~BRL",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    },
  });
  const handler = createQuotesPostHandler({
    async verifyIdToken() {
      return { uid: "verified-owner" };
    },
    listOwnedAssets: reader.listOwnedAssets,
    quoteService: {
      async getQuotes(assets) {
        downstream.push(...assets.map(({ id }) => id));
        return assets.map(({ id }) => ({
          assetId: id,
          status: "unavailable",
          code: "NOT_CONFIGURED",
        }));
      },
    },
  });

  const response = await handler(request({ assetIds: ["owned", "other-user-asset"] }));
  assert.equal(response.status, 200);
  assert.deepEqual(downstream, ["owned"]);
  assert.deepEqual(await response.json(), {
    results: [
      { assetId: "owned", status: "unavailable", code: "NOT_CONFIGURED" },
      { assetId: "other-user-asset", status: "unavailable", code: "NOT_FOUND" },
    ],
  });
});

test("blocks the public host while preserving proxy coverage for app and preview hosts", () => {
  assert.deepEqual(proxyConfig.matcher.at(-1), "/api/quotes/:path*");

  const publicResponse = proxy(
    new NextRequest("https://reservaclara.com.br/api/quotes", { method: "POST" }),
  );
  assert.equal(publicResponse.status, 404);

  const appResponse = proxy(new NextRequest("https://app.reservaclara.com.br/api/quotes"));
  assert.equal(appResponse.status, 200);

  const previewResponse = proxy(new NextRequest("https://feature-1.vercel.app/api/quotes"));
  assert.equal(previewResponse.status, 200);
  assert.equal(previewResponse.headers.get("x-robots-tag"), "noindex, nofollow");
});
