import type { AmountGap, KnownAmountStatus } from "../../domain/portfolio-summary";
import type { QuoteErrorCode, QuoteFreshness } from "../../domain/quote";

export const QUOTE_ERROR_MESSAGES: Readonly<Record<QuoteErrorCode, string>> = {
  UNAUTHENTICATED: "Sua sessão não está disponível para carregar esta cotação.",
  INVALID_REQUEST: "Não foi possível solicitar esta cotação.",
  BATCH_LIMIT: "Não foi possível consultar este lote de cotações.",
  UNSUPPORTED_ASSET: "Este ativo não pode ser cotado.",
  CURRENCY_MISMATCH: "A moeda deste ativo não é compatível com a cotação.",
  NOT_FOUND: "Cotação não encontrada para este ativo.",
  TIMEOUT: "A cotação demorou demais e está indisponível.",
  RATE_LIMITED: "A cotação está temporariamente indisponível.",
  PROVIDER_UNAVAILABLE: "A cotação está indisponível no momento.",
  INVALID_PROVIDER_RESPONSE: "A cotação retornou uma resposta inválida.",
  NOT_CONFIGURED: "A cotação está indisponível no momento.",
};

export function quoteErrorMessage(code: QuoteErrorCode): string {
  return QUOTE_ERROR_MESSAGES[code];
}

export function quoteFreshnessLabel(freshness: QuoteFreshness): string {
  return freshness === "stale" ? "Cotação desatualizada" : "Cotação atualizada";
}

export function quoteFreshnessDescription(freshness: QuoteFreshness): string {
  return freshness === "stale"
    ? "Cotação desatualizada; valor corrente calculado com a última cotação disponível."
    : "Valor corrente calculado com uma cotação atualizada.";
}

export function quoteUnavailableDescription(): string {
  return "Cotação indisponível; este item ficou fora do patrimônio conhecido.";
}

export function quoteCurrencyMismatchDescription(): string {
  return "Cotação incompatível; este item ficou fora do patrimônio conhecido.";
}

export function baseCurrencyExcludedDescription(): string {
  return "Moeda diferente da moeda-base; valor atual exibido apenas como referência e excluído dos totais, sem conversão cambial.";
}

export function knownAmountStatusLabel(status: KnownAmountStatus): string {
  switch (status) {
    case "empty":
      return "Sem posições abertas";
    case "complete":
      return "Valor completo";
    case "partial":
      return "Patrimônio conhecido — leitura parcial";
  }
}

export function knownAmountTitle(title: string, status: KnownAmountStatus): string {
  return status === "partial" ? `${title} conhecido` : title;
}

export function amountGapMessage(gap: AmountGap): string {
  switch (gap.reason) {
    case "quote-unavailable":
      return quoteUnavailableDescription();
    case "quote-currency-mismatch":
      return quoteCurrencyMismatchDescription();
    case "base-currency-mismatch":
      return "Moeda diferente da moeda-base; este item ficou fora do valor conhecido.";
    case "read-failed":
      return "Não foi possível ler esta carteira; seu valor não foi estimado como zero.";
    case "invalid-ledger":
      return "O histórico desta carteira não pôde ser composto; seu valor não foi estimado como zero.";
    case "composition-failed":
      return "A composição desta carteira falhou; seu valor não foi estimado como zero.";
  }
}

export function quoteCoverageLabel(status: "none" | "fresh" | "stale" | "mixed"): string {
  switch (status) {
    case "none":
      return "Nenhuma cotação solicitada";
    case "fresh":
      return "Cotações atualizadas";
    case "stale":
      return "Cotações desatualizadas";
    case "mixed":
      return "Cobertura de cotações mista";
  }
}
