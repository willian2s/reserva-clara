"use client";

import Link from "next/link";

import { useGlobalDashboard } from "@/components/dashboard/use-global-dashboard";
import {
  amountGapMessage,
  quoteCurrencyMismatchDescription,
  quoteErrorMessage,
  quoteUnavailableDescription,
} from "@/components/financial/financial-copy";
import { formatMoney, formatPercentage } from "@/components/financial/financial-format";
import { KnownAmountCard } from "@/components/financial/known-amount-card";
import { PositionTable } from "@/components/financial/position-table";
import { QuoteCoverageCard } from "@/components/financial/quote-coverage-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type {
  GlobalDashboardRead,
  GlobalPortfolioEntry,
  PositionReadItem,
} from "@/domain/portfolio-summary";

const GLOBAL_DASHBOARD_ERROR_MESSAGE =
  "Não foi possível carregar o patrimônio das carteiras. Tente novamente.";

function CountCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold">{title}</h2>
      </CardHeader>
      <CardContent>
        <p className="financial-value tabular-nums">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function isOpenItem(item: PositionReadItem): boolean {
  return !item.position.closed;
}

function readyEntries(
  read: GlobalDashboardRead,
): Extract<GlobalPortfolioEntry, { status: "ready" }>[] {
  return read.portfolios.filter(
    (entry): entry is Extract<GlobalPortfolioEntry, { status: "ready" }> =>
      entry.status === "ready",
  );
}

function portfolioUnavailableMessage(entry: Extract<GlobalPortfolioEntry, { status: "unavailable" }>): string {
  return amountGapMessage({
    scope: "portfolio",
    portfolioId: entry.portfolio.id,
    reason: entry.reason,
  });
}

function unavailableAssetMessage(item: PositionReadItem): string {
  if (item.currentValue.status !== "unavailable") return "";
  if (item.currentValue.reason === "quote-currency-mismatch") {
    return quoteCurrencyMismatchDescription();
  }

  return `${quoteUnavailableDescription()} ${quoteErrorMessage(item.currentValue.quoteCode)}`;
}

type UnavailableAsset = Readonly<{
  asset: PositionReadItem["asset"];
  message: string;
  portfolios: readonly Readonly<{ id: string; name: string }>[];
}>;

function unavailableAssets(read: GlobalDashboardRead): UnavailableAsset[] {
  const assets = new Map<string, { asset: PositionReadItem["asset"]; message: string; portfolios: { id: string; name: string }[] }>();

  for (const entry of readyEntries(read)) {
    for (const item of entry.read.items.filter(isOpenItem)) {
      if (item.currentValue.status !== "unavailable") continue;

      const existing = assets.get(item.asset.id);
      if (existing === undefined) {
        assets.set(item.asset.id, {
          asset: item.asset,
          message: unavailableAssetMessage(item),
          portfolios: [{ id: entry.portfolio.id, name: entry.portfolio.name }],
        });
        continue;
      }

      if (!existing.portfolios.some((portfolio) => portfolio.id === entry.portfolio.id)) {
        existing.portfolios.push({ id: entry.portfolio.id, name: entry.portfolio.name });
      }
    }
  }

  return [...assets.values()].sort((left, right) => left.asset.id.localeCompare(right.asset.id));
}

function PortfolioDistribution({ read }: { read: GlobalDashboardRead }) {
  const ready = readyEntries(read);
  const unavailable = read.portfolios.filter(
    (entry): entry is Extract<GlobalPortfolioEntry, { status: "unavailable" }> =>
      entry.status === "unavailable",
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold">Distribuição das carteiras</h2>
        <CardDescription>
          {read.marketValue.status === "partial"
            ? "Distribuição do valor conhecido; carteiras indisponíveis não foram estimadas como zero."
            : "Patrimônio conhecido por carteira, com acesso ao detalhe."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {ready.length > 0 && (
          <ul className="space-y-4" aria-label="Distribuição do valor conhecido por carteira">
            {ready.map((entry) => (
              <li key={entry.portfolio.id} className="min-w-0 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <Link
                    className="min-w-0 break-words font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={`/portfolios/${entry.portfolio.id}`}
                  >
                    {entry.portfolio.name}
                  </Link>
                  <span className="break-words text-right font-semibold tabular-nums [overflow-wrap:anywhere]">
                    {formatMoney(entry.read.marketValue.knownAmount, read.currency)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Participação no valor conhecido: {formatPercentage(entry.shareOfKnownMarketValue)}
                  {entry.read.marketValue.status === "partial" && " · leitura parcial"}
                </p>
              </li>
            ))}
          </ul>
        )}

        {unavailable.length > 0 && (
          <div className="space-y-3 border-t border-border pt-4" role="note">
            <h3 className="font-medium">Carteiras indisponíveis</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {unavailable.map((entry) => (
                <li key={entry.portfolio.id} className="min-w-0">
                  <Link
                    className="break-words font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={`/portfolios/${entry.portfolio.id}`}
                  >
                    {entry.portfolio.name}
                  </Link>
                  <span>: {portfolioUnavailableMessage(entry)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ready.length === 0 && unavailable.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma carteira ativa para distribuir.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PositionSummary({ read }: { read: GlobalDashboardRead }) {
  const groups = readyEntries(read)
    .map((entry) => ({
      entry,
      items: entry.read.items.filter(isOpenItem),
    }))
    .filter(({ items }) => items.length > 0);
  const unavailablePortfolioCount = read.portfolios.filter(
    (entry) => entry.status === "unavailable",
  ).length;

  return (
    <section className="space-y-4" aria-labelledby="global-open-positions-title">
      <header>
        <h2 id="global-open-positions-title" className="font-heading text-base font-semibold">
          Resumo das posições abertas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada posição mantém sua identidade de carteira e ativo; custos não são consolidados entre carteiras.
        </p>
      </header>
      {groups.length === 0 ? (
        <Card>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Nenhuma posição aberta conhecida nas carteiras legíveis.</p>
              {unavailablePortfolioCount > 0 && (
                <p role="note">
                  Não foi possível verificar {unavailablePortfolioCount}{" "}
                  {unavailablePortfolioCount === 1
                    ? "carteira ativa indisponível"
                    : "carteiras ativas indisponíveis"}.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        groups.map(({ entry, items }) => (
          <div key={entry.portfolio.id} className="space-y-2">
            <Link
              className="inline-block break-words font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              href={`/portfolios/${entry.portfolio.id}`}
            >
              Carteira: {entry.portfolio.name}
            </Link>
            <PositionTable
              items={items}
              allocation={entry.read.allocation.entries}
              ariaLabel={`Posições abertas da carteira ${entry.portfolio.name}`}
            />
          </div>
        ))
      )}
    </section>
  );
}

function UnavailableAssets({ read }: { read: GlobalDashboardRead }) {
  const assets = unavailableAssets(read);

  if (assets.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold">Assets sem cotação</h2>
        <CardDescription>
          Lista deduplicada de ativos que ficaram fora do patrimônio conhecido, preservando as carteiras afetadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4" aria-label="Assets sem cotação">
          {assets.map((item) => (
            <li key={item.asset.id} className="min-w-0 border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="break-words font-medium [overflow-wrap:anywhere]">
                {item.asset.symbol} · {item.asset.market} · {item.asset.assetType}
              </p>
              <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {item.message}
              </p>
              <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                Carteiras afetadas: {item.portfolios.map((portfolio) => portfolio.name).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EmptyGlobalDashboard() {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-base font-semibold">Nenhuma carteira ativa</h2>
        <CardDescription>
          Crie ou abra uma carteira para acompanhar seu patrimônio conhecido nesta visão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link className={buttonVariants({ size: "lg" })} href="/portfolios">
          Ver carteiras
        </Link>
      </CardContent>
    </Card>
  );
}

function GlobalDashboardContent({ read }: { read: GlobalDashboardRead }) {
  const openPositionCount = readyEntries(read).reduce(
    (count, entry) => count + entry.read.items.filter(isOpenItem).length,
    0,
  );

  return (
    <div className="space-y-6">
      {read.portfolios.length === 0 ? (
        <EmptyGlobalDashboard />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <KnownAmountCard
              title="Custo investido das posições abertas"
              amount={read.investedAmount}
              description="Custo de aquisição remanescente das posições abertas; não representa aportes ou performance."
            />
            <KnownAmountCard
              title="Patrimônio"
              amount={read.marketValue}
              description="Soma das cotações conhecidas das posições abertas na moeda-base."
            />
            <CountCard
              title="Carteiras ativas"
              value={read.portfolios.length}
              description="Carteiras incluídas no consolidado operacional."
            />
            <CountCard
              title="Posições abertas conhecidas"
              value={openPositionCount}
              description={read.portfolios.some((entry) => entry.status === "unavailable")
                ? "Posições atuais das carteiras legíveis; há carteiras que não puderam ser verificadas."
                : "Posições atuais das carteiras legíveis."}
            />
          </div>
          <PortfolioDistribution read={read} />
          <PositionSummary read={read} />
          <details className="min-w-0 rounded-card border border-border px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              Ver cobertura das cotações e indisponibilidades
            </summary>
            <div className="mt-4 space-y-6">
              <QuoteCoverageCard coverage={read.quotes} />
              <UnavailableAssets read={read} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}

export function GlobalDashboard() {
  const { state, refresh } = useGlobalDashboard();
  const hasRead = state.data !== null;

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="text-sm font-medium text-primary">Patrimônio</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Patrimônio das carteiras ativas
        </h1>
        <p className="mt-3 text-muted-foreground">
          Acompanhe o valor conhecido, o custo investido e as posições atuais sem misturar carteiras.
        </p>
      </header>

      {state.status === "loading" && !hasRead && (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite" aria-busy="true">
          Carregando patrimônio das carteiras...
        </p>
      )}

      {state.status === "error" && !hasRead && (
        <Card role="alert" aria-live="assertive">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold">Dashboard indisponível</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{GLOBAL_DASHBOARD_ERROR_MESSAGE}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => refresh()}>
                Tentar novamente
              </Button>
              <Link className={buttonVariants({ variant: "ghost" })} href="/portfolios">
                Ver carteiras
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "refreshing" && hasRead && (
        <p className="mb-4 text-sm text-muted-foreground" role="status" aria-live="polite" aria-busy="true">
          Atualizando patrimônio das carteiras...
        </p>
      )}

      {state.status === "error" && hasRead && (
        <Card role="alert" aria-live="assertive" className="mb-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-sm text-destructive">
              {state.error ?? GLOBAL_DASHBOARD_ERROR_MESSAGE} A última leitura válida continua visível.
            </p>
            <Button type="button" variant="outline" onClick={() => refresh()}>
              Tentar atualizar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {hasRead && <GlobalDashboardContent read={state.data} />}
    </section>
  );
}
