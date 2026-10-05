import type { QuoteCoverage } from "@/domain/portfolio-summary";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { quoteCoverageLabel } from "@/components/financial/financial-copy";

export function QuoteCoverageCard({ coverage }: { coverage: QuoteCoverage }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold">Cobertura das cotações</h2>
        <p className="text-sm text-muted-foreground">{quoteCoverageLabel(coverage.status)}</p>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Solicitadas</dt>
            <dd className="font-semibold tabular-nums">{coverage.requested}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Atualizadas</dt>
            <dd className="font-semibold tabular-nums">{coverage.fresh}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Desatualizadas</dt>
            <dd className="font-semibold tabular-nums">{coverage.stale}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Indisponíveis</dt>
            <dd className="font-semibold tabular-nums">{coverage.unavailable}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">
          A cobertura conta ativos consultados; ela não é um percentual do patrimônio.
        </p>
      </CardContent>
    </Card>
  );
}
