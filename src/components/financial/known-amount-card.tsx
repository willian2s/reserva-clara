import type { KnownAmount } from "@/domain/portfolio-summary";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatMoney } from "@/components/financial/financial-format";
import {
  amountGapMessage,
  knownAmountStatusLabel,
  knownAmountTitle,
} from "@/components/financial/financial-copy";

export function KnownAmountCard({
  title,
  amount,
  description,
}: {
  title: string;
  amount: KnownAmount;
  description?: string;
}) {
  const gaps = amount.unavailable;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold">
          {knownAmountTitle(title, amount.status)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {knownAmountStatusLabel(amount.status)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="financial-value break-words" aria-label={`${title}: ${formatMoney(amount.knownAmount, amount.currency)}`}>
          {formatMoney(amount.knownAmount, amount.currency)}
        </p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {gaps.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3" role="note">
            <p className="text-sm font-medium">Itens fora deste valor conhecido</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {gaps.map((gap, index) => (
                <li key={`${gap.scope}-${gap.portfolioId}-${"assetId" in gap ? gap.assetId : index}`}>
                  {amountGapMessage(gap)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
