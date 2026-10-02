import type { PositionReadItem } from "@/domain/portfolio-summary";

import { formatDecimal, formatMoney, formatTimestamp } from "@/components/financial/financial-format";
import {
  baseCurrencyExcludedDescription,
  quoteCurrencyMismatchDescription,
  quoteErrorMessage,
  quoteFreshnessDescription,
  quoteFreshnessLabel,
  quoteUnavailableDescription,
} from "@/components/financial/financial-copy";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PositionCard({ item }: { item: PositionReadItem }) {
  const { asset, position, currentValue } = item;
  const currency = position.currency;

  return (
    <Card>
      <CardHeader>
        <h3 className="font-heading break-words text-base font-semibold [overflow-wrap:anywhere]">
          {asset.symbol}
        </h3>
        <p className="text-sm text-muted-foreground">
          {asset.market} · {asset.assetType} · {currency}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Quantidade</dt>
            <dd className="break-words font-medium tabular-nums">{formatDecimal(position.quantity)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Custo médio</dt>
            <dd className="break-words font-medium tabular-nums">
              {position.averageCost === null ? "Não se aplica" : formatMoney(position.averageCost, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Custo investido</dt>
            <dd className="break-words font-medium tabular-nums">{formatMoney(position.investedAmount, currency)}</dd>
          </div>
          {currentValue.status === "available" && (
            <div>
              <dt className="text-sm text-muted-foreground">Valor atual</dt>
              <dd className="break-words font-medium tabular-nums">
                {formatMoney(currentValue.marketPosition.marketValue, currentValue.marketPosition.currency)}
              </dd>
            </div>
          )}
        </dl>

        {currentValue.status === "not-applicable" && (
          <p className="border-t border-border pt-3 text-sm text-muted-foreground" role="status">
            Posição fechada; não faz parte das posições atuais.
          </p>
        )}
        {currentValue.status === "unavailable" && (
          <div className="space-y-1 border-t border-border pt-3" role="status">
            {currentValue.reason === "quote-currency-mismatch" ? (
              <p className="text-sm font-medium">{quoteCurrencyMismatchDescription()}</p>
            ) : (
              <>
                <p className="text-sm font-medium">{quoteUnavailableDescription()}</p>
                <p className="text-sm text-muted-foreground">
                  {quoteErrorMessage(currentValue.quoteCode)}
                </p>
              </>
            )}
          </div>
        )}
        {currentValue.status === "available" && (
          <div className="space-y-1 border-t border-border pt-3" role="note">
            <p className="text-sm font-medium">{quoteFreshnessLabel(currentValue.quote.freshness)}</p>
            <p className="text-sm text-muted-foreground">{quoteFreshnessDescription(currentValue.quote.freshness)}</p>
            <p className="text-sm text-muted-foreground">
              Cotada em <time dateTime={currentValue.quote.quotedAt}>{formatTimestamp(currentValue.quote.quotedAt)}</time>
            </p>
            {currentValue.baseCurrency === "excluded" && (
              <p className="text-sm text-muted-foreground">{baseCurrencyExcludedDescription()}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Diferença nominal atual: {formatMoney(currentValue.marketPosition.nominalDifference, currentValue.marketPosition.currency)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
