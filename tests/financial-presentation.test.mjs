import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const buildDirectory = process.env.FINANCIAL_PRESENTATION_TEST_BUILD;
if (!buildDirectory) throw new Error("FINANCIAL_PRESENTATION_TEST_BUILD is required");

const { formatDecimal, formatMoney, formatPercentage, formatTimestamp } = require(`${buildDirectory}/components/financial/financial-format.js`);
const {
  baseCurrencyExcludedDescription,
  quoteCurrencyMismatchDescription,
} = require(`${buildDirectory}/components/financial/financial-copy.js`);
const { createDashboardReadState, dashboardReadReducer } = require(`${buildDirectory}/components/dashboard/dashboard-read-state.js`);

test("formats exact decimals and money in pt-BR", () => {
  assert.equal(formatDecimal("12345678901234567890.125"), "12.345.678.901.234.567.890,125");
  assert.equal(formatDecimal("-1234.5", { minimumFractionDigits: 2 }), "-1.234,50");
  assert.equal(formatMoney("999999999999999999.995", "BRL"), "R$ 1.000.000.000.000.000.000,00");
});

test("formats ratios without floating-point conversion", () => {
  assert.equal(formatPercentage("0.125"), "12,5%");
  assert.equal(formatPercentage("0"), "0%");
  assert.equal(formatPercentage(null), "Indisponível");
});

test("formats canonical quote timestamps in pt-BR", () => {
  assert.match(formatTimestamp("2026-01-02T00:30:00Z"), /1 de jan\. de 2026, 21:30/);
});

test("keeps incompatible quote and base-currency copy explicit", () => {
  assert.equal(
    quoteCurrencyMismatchDescription(),
    "Cotação incompatível; este item ficou fora do patrimônio conhecido.",
  );
  assert.equal(
    baseCurrencyExcludedDescription(),
    "Moeda diferente da moeda-base; valor atual exibido apenas como referência e excluído dos totais, sem conversão cambial.",
  );
});

test("preserves the last read across refresh and failure", () => {
  let state = createDashboardReadState();
  state = dashboardReadReducer(state, { type: "request", requestId: 1 });
  state = dashboardReadReducer(state, { type: "success", requestId: 1, data: "first" });
  state = dashboardReadReducer(state, { type: "request", requestId: 2 });
  assert.deepEqual(state, { status: "refreshing", data: "first", error: null, requestId: 2 });
  state = dashboardReadReducer(state, { type: "failure", requestId: 2, error: "retry" });
  assert.deepEqual(state, { status: "error", data: "first", error: "retry", requestId: 2 });
});

test("ignores stale responses", () => {
  let state = createDashboardReadState();
  state = dashboardReadReducer(state, { type: "request", requestId: 1 });
  state = dashboardReadReducer(state, { type: "request", requestId: 2 });
  state = dashboardReadReducer(state, { type: "success", requestId: 1, data: "stale" });
  assert.equal(state.status, "loading");
  assert.equal(state.data, null);
  state = dashboardReadReducer(state, { type: "success", requestId: 2, data: "current" });
  assert.equal(state.data, "current");
});
