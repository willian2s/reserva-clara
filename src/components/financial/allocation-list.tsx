import type { AllocationResult } from "@/domain/allocation";

import { formatMoney, formatPercentage } from "@/components/financial/financial-format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type AllocationListItem = Readonly<{
  assetId: string;
  label: string;
  marketValue: string;
  allocation: string | null;
}>;

export function AllocationList({
  allocation,
  items,
}: {
  allocation: AllocationResult;
  items: readonly AllocationListItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold">Composição corrente</h2>
        <p className="text-sm text-muted-foreground">
          Valores e participação no patrimônio conhecido.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma posição valorizada para compor.</p>
        ) : (
          <ul className="space-y-4" aria-label="Composição da carteira">
            {items.map((item) => (
              <li key={item.assetId} className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="min-w-0 break-words font-medium">{item.label}</span>
                  <span className="min-w-0 max-w-full break-words text-right font-semibold tabular-nums [overflow-wrap:anywhere]">
                    {formatMoney(item.marketValue, allocation.currency)}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
                  <span>Participação conhecida: {formatPercentage(item.allocation)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {allocation.unavailable.length > 0 && (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground" role="note">
            {allocation.unavailable.length} posição(ões) sem valor conhecido não entram nesta composição.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
