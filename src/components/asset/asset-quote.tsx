import type { QuoteResult } from "@/domain/quote";
import { formatDecimal, formatTimestamp } from "@/components/financial/financial-format";
import {
  quoteErrorMessage,
  quoteFreshnessLabel,
  quoteUnavailableDescription,
} from "@/components/financial/financial-copy";

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
        <p className="text-sm font-medium">{quoteUnavailableDescription()}</p>
        <p className="mt-1 text-sm text-muted-foreground">{quoteErrorMessage(code)}</p>
      </div>
    );
  }

  const { quote } = result;

  return (
    <div className="rounded-control border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">
        {quoteFreshnessLabel(quote.freshness)}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight">
        {formatDecimal(quote.price.decimal)} {quote.price.currency}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Cotada em{" "}
        <time dateTime={quote.quotedAt}>{formatTimestamp(quote.quotedAt)}</time>
      </p>
      {quote.symbolChanged && (
        <p className="mt-1 text-sm text-muted-foreground">
          Código usado pela fonte de cotação: {quote.providerSymbol}
        </p>
      )}
    </div>
  );
}
