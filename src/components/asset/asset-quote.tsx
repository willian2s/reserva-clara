import type { QuoteErrorCode, QuoteResult } from "@/domain/quote";

const QUOTE_ERROR_MESSAGES: Record<QuoteErrorCode, string> = {
  UNAUTHENTICATED: "Sua sessão não está disponível para carregar esta cotação.",
  INVALID_REQUEST: "Não foi possível solicitar esta cotação.",
  BATCH_LIMIT: "Não foi possível consultar este lote de cotações.",
  UNSUPPORTED_ASSET: "Este Asset não é suportado para cotação.",
  CURRENCY_MISMATCH: "A moeda deste Asset não é compatível com a cotação.",
  NOT_FOUND: "Cotação não encontrada para este Asset.",
  TIMEOUT: "A cotação demorou demais e está indisponível.",
  RATE_LIMITED: "A cotação está temporariamente indisponível.",
  PROVIDER_UNAVAILABLE: "A cotação está indisponível no momento.",
  INVALID_PROVIDER_RESPONSE: "A cotação retornou uma resposta inválida.",
  NOT_CONFIGURED: "A cotação está indisponível no momento.",
};

function formatPrice(decimal: string) {
  return decimal.replace(".", ",");
}

function formatQuotedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function unavailableMessage(code: QuoteErrorCode) {
  return QUOTE_ERROR_MESSAGES[code];
}

export function AssetQuote({
  loading,
  result,
}: {
  loading: boolean;
  result: QuoteResult | undefined;
}) {
  if (loading) {
    return (
      <div
        className="rounded-control border border-border bg-muted/30 p-3"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="text-sm text-muted-foreground">Carregando cotação...</p>
      </div>
    );
  }

  if (!result || result.status === "unavailable") {
    const code = result?.status === "unavailable" ? result.code : "PROVIDER_UNAVAILABLE";

    return (
      <div className="rounded-control border border-border bg-muted/30 p-3">
        <p className="text-sm font-medium">Cotação indisponível</p>
        <p className="mt-1 text-sm text-muted-foreground">{unavailableMessage(code)}</p>
      </div>
    );
  }

  const { quote } = result;
  const isStale = quote.freshness === "stale";

  return (
    <div className="rounded-control border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">
        {isStale ? "Cotação desatualizada" : "Cotação atualizada"}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight">
        {formatPrice(quote.price.decimal)} {quote.price.currency}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Cotada em{" "}
        <time dateTime={quote.quotedAt}>{formatQuotedAt(quote.quotedAt)}</time>
      </p>
      {quote.symbolChanged && (
        <p className="mt-1 text-sm text-muted-foreground">
          Símbolo no provider: <code className="font-mono">{quote.providerSymbol}</code>
        </p>
      )}
    </div>
  );
}
