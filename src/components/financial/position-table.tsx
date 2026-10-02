import type { AllocationEntry } from "@/domain/allocation";
import type { PositionReadItem } from "@/domain/portfolio-summary";

import {
  quoteCurrencyMismatchDescription,
  quoteErrorMessage,
  quoteFreshnessDescription,
  quoteFreshnessLabel,
  quoteUnavailableDescription,
} from "@/components/financial/financial-copy";
import {
  formatDecimal,
  formatMoney,
  formatPercentage,
  formatTimestamp,
} from "@/components/financial/financial-format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function CellLabel({ children }: { children: string }) {
  return <span className="mb-1 block text-xs text-muted-foreground lg:hidden">{children}</span>;
}

function PositionRow({
  item,
  allocation,
}: {
  item: PositionReadItem;
  allocation: string | null;
}) {
  const { asset, position, currentValue } = item;
  const positionCurrency = position.currency;
  const updatedValue = currentValue.status === "available"
    ? formatMoney(
        currentValue.marketPosition.marketValue,
        currentValue.marketPosition.currency,
      )
    : currentValue.status === "unavailable"
      ? "Indisponível"
      : "—";

  return (
    <div
      role="row"
      className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-4 border-t border-border p-4 lg:grid-cols-[minmax(10rem,1.5fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(7rem,0.8fr)_minmax(9rem,1fr)] lg:items-start"
    >
      <div role="cell" aria-label={`Ativo: ${asset.symbol}, ${asset.market}, ${asset.assetType}, moeda ${asset.currency}`} className="min-w-0">
        <CellLabel>Ativo</CellLabel>
        <p className="break-words font-medium [overflow-wrap:anywhere]">{asset.symbol}</p>
        <p className="break-words text-xs text-muted-foreground">
          {asset.market} · {asset.assetType} · {asset.currency}
        </p>
      </div>
      <div role="cell" aria-label={`Valor atualizado: ${updatedValue}`} className="min-w-0 lg:text-right">
        <CellLabel>Valor atualizado</CellLabel>
        <p className="break-words tabular-nums">{updatedValue}</p>
      </div>
      <div role="cell" aria-label={`Valor investido: ${formatMoney(position.investedAmount, positionCurrency)}`} className="min-w-0 lg:text-right">
        <CellLabel>Valor investido</CellLabel>
        <p className="break-words tabular-nums">
          {formatMoney(position.investedAmount, positionCurrency)}
        </p>
      </div>
      <div role="cell" aria-label={`Quantidade: ${formatDecimal(position.quantity)}`} className="min-w-0 text-center">
        <CellLabel>Quantidade</CellLabel>
        <p className="break-words tabular-nums">{formatDecimal(position.quantity)}</p>
      </div>
      <div role="cell" aria-label={`Porcentagem do patrimônio: ${formatPercentage(allocation)}`} className="min-w-0 lg:text-right">
        <CellLabel>% do patrimônio</CellLabel>
        <p className="break-words tabular-nums">{formatPercentage(allocation)}</p>
      </div>
    </div>
  );
}

function QuoteDiagnostics({ items }: { items: readonly PositionReadItem[] }) {
  return (
    <details className="min-w-0 rounded-card border border-border px-4 py-3 break-words [overflow-wrap:anywhere]">
      <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        Detalhes das cotações
      </summary>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map(({ asset, currentValue }) => (
          <li key={asset.id} className="min-w-0 border-t border-border pt-3 first:border-0 first:pt-0">
            <p className="break-words font-medium [overflow-wrap:anywhere]">{asset.symbol}</p>
            {currentValue.status === "available" ? (
              <>
                <p className="text-muted-foreground">
                  {quoteFreshnessLabel(currentValue.quote.freshness)} — {quoteFreshnessDescription(currentValue.quote.freshness)}
                </p>
                <p className="text-muted-foreground">
                  Cotada em <time dateTime={currentValue.quote.quotedAt}>{formatTimestamp(currentValue.quote.quotedAt)}</time>
                  {" · "}
                  atualizada em <time dateTime={currentValue.quote.fetchedAt}>{formatTimestamp(currentValue.quote.fetchedAt)}</time>
                </p>
              </>
            ) : currentValue.status === "unavailable" ? (
              <p className="text-muted-foreground">
                {currentValue.reason === "quote-currency-mismatch"
                  ? quoteCurrencyMismatchDescription()
                  : `${quoteUnavailableDescription()} ${quoteErrorMessage(currentValue.quoteCode)}`}
              </p>
            ) : (
              <p className="text-muted-foreground">Cotação não aplicável.</p>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function PositionTable({
  items,
  allocation,
}: {
  items: readonly PositionReadItem[];
  allocation: readonly AllocationEntry[];
}) {
  const allocationByAssetId = new Map(
    allocation.map((entry) => [entry.assetId, entry.allocation]),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="font-heading text-base font-semibold">Posições abertas</h2>
        </CardHeader>
        <CardContent className="p-0 lg:px-(--card-spacing)">
          <div role="table" aria-label="Posições abertas da carteira" className="min-w-0">
            <div
              role="row"
              className="hidden border-y border-border px-4 py-3 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[minmax(10rem,1.5fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(7rem,0.8fr)_minmax(9rem,1fr)] lg:gap-x-4"
            >
              <span role="columnheader">Ativo</span>
              <span role="columnheader" className="text-right">Valor atualizado</span>
              <span role="columnheader" className="text-right">Valor investido</span>
              <span role="columnheader" className="text-center">Quantidade</span>
              <span role="columnheader" className="text-right">% do patrimônio</span>
            </div>
            <div role="rowgroup">
              {items.map((item) => (
                <PositionRow
                  key={`${item.position.portfolioId}-${item.position.assetId}`}
                  item={item}
                  allocation={allocationByAssetId.get(item.asset.id) ?? null}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <QuoteDiagnostics items={items} />
    </div>
  );
}
