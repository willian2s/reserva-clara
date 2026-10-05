"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { AllocationList } from "@/components/financial/allocation-list";
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button";
import { KnownAmountCard } from "@/components/financial/known-amount-card";
import { QuoteCoverageCard } from "@/components/financial/quote-coverage-card";
import { PositionTable } from "@/components/financial/position-table";
import { usePortfolioDashboard } from "@/components/portfolio/use-portfolio-dashboard";
import type { PortfolioDashboardRead } from "@/domain/portfolio-summary";

const DETAIL_ERROR_MESSAGE =
  "Não foi possível carregar os dados desta carteira. Tente novamente.";

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(createdAt);
}

function PortfolioActions({
  portfolioId,
  isArchived,
}: {
  portfolioId: string;
  isArchived: boolean;
}) {
  return (
    <nav
      className="flex flex-wrap items-center gap-3 border-t border-border pt-5"
      aria-label="Ações da carteira"
    >
      {!isArchived && (
        <Link
          className={buttonVariants({ variant: "default" })}
          href={`/portfolios/${portfolioId}/transactions#novo-lancamento`}
        >
          Cadastrar posição
        </Link>
      )}
      <Link
        className={buttonVariants({ variant: isArchived ? "outline" : "ghost" })}
        href={`/portfolios/${portfolioId}/transactions`}
      >
        Histórico de operações
      </Link>
      <Link
        className={buttonVariants({ variant: "outline" })}
        href={`/portfolios/${portfolioId}/settings`}
      >
        Configurações
      </Link>
      <Link
        className={buttonVariants({ variant: "ghost" })}
        href="/assets"
      >
        Ativos
      </Link>
      <Link className={buttonVariants({ variant: "ghost" })} href="/portfolios">
        Todas as carteiras
      </Link>
    </nav>
  );
}

function PortfolioDashboardContent({
  read,
  portfolioId,
}: {
  read: PortfolioDashboardRead;
  portfolioId: string;
}) {
  const openItems = read.items.filter((item) => !item.position.closed);
  const itemsByAssetId = new Map(
    openItems.map((item) => [item.asset.id, item]),
  );
  const allocationItems = read.allocation.entries.map((entry) => {
    const item = itemsByAssetId.get(entry.assetId);
    return {
      assetId: entry.assetId,
      label: item
        ? `${item.asset.symbol} · ${item.asset.market}`
        : entry.assetId,
      marketValue: entry.marketValue,
      allocation: entry.allocation,
    };
  });
  const isArchived = read.portfolio.archivedAt !== null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Carteira {isArchived ? "arquivada" : "ativa"} · Moeda base: {read.portfolio.baseCurrency} · Criada em {formatCreatedAt(read.portfolio.createdAt)}
        </p>
        {isArchived ? (
          <Card>
            <CardContent className="p-6">
              <p className="rounded-card border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Carteira arquivada — leitura somente. Os valores usam cotações
                atuais e não representam um snapshot do arquivamento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground">
            Visão corrente derivada das posições abertas e das cotações
            disponíveis.
          </p>
        )}
      </div>

      <PortfolioActions portfolioId={portfolioId} isArchived={isArchived} />

      <div className="grid gap-4 md:grid-cols-2">
        <KnownAmountCard
          title="Valor investido"
          amount={read.investedAmount}
          description="Custo de aquisição remanescente das posições abertas; não representa aportes ou performance."
        />
        <KnownAmountCard
          title="Patrimônio"
          amount={read.marketValue}
          description="Soma das cotações conhecidas das posições abertas na moeda-base."
        />
      </div>

      {openItems.length === 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-heading text-base font-semibold">
              Nenhuma posição aberta
            </h2>
            <CardDescription>
              {isArchived
                ? "Esta carteira arquivada não possui posições atuais; novas operações continuam bloqueadas."
                : "Esta carteira não possui operações que formem uma posição atual."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isArchived
                ? "Consulte o histórico ou abra as configurações para restaurar a carteira antes de registrar uma operação."
                : "Consulte o histórico ou cadastre uma posição para começar uma nova operação."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/portfolios/${portfolioId}/transactions`}
              >
                Abrir histórico
              </Link>
              {isArchived ? (
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href={`/portfolios/${portfolioId}/settings`}
                >
                  Abrir configurações
                </Link>
              ) : (
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href={`/portfolios/${portfolioId}/transactions#novo-lancamento`}
                >
                  Cadastrar posição
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <PositionTable items={openItems} allocation={read.allocation.entries} />
      )}

      <details className="min-w-0 rounded-card border border-border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Ver composição e cobertura das cotações
        </summary>
        <div className="mt-4 space-y-6">
          <QuoteCoverageCard coverage={read.quotes} />
          <AllocationList allocation={read.allocation} items={allocationItems} />
        </div>
      </details>

    </div>
  );
}

export function PortfolioDetail({ portfolioId }: { portfolioId: string }) {
  const { state, refresh } = usePortfolioDashboard(portfolioId);
  const read = state.data?.portfolio.id === portfolioId ? state.data : null;
  const hasRead = read !== null;
  const isScopePending = state.data !== null && !hasRead;

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Patrimônio</p>
          <h1 className="mt-2 break-words font-heading text-3xl font-semibold tracking-tight [overflow-wrap:anywhere]">
            {read?.portfolio.name ?? "Visão da carteira"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Consulte o patrimônio conhecido, a composição e as posições atuais.
          </p>
        </div>
        <DashboardRefreshButton />
      </header>

      {(state.status === "loading" || isScopePending) && !hasRead && (
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          Carregando dados da carteira...
        </p>
      )}

      {state.status === "error" && !isScopePending && !hasRead && (
        <Card role="alert" aria-live="assertive">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold">
              Carteira indisponível
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{DETAIL_ERROR_MESSAGE}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => refresh()}
              >
                Tentar novamente
              </Button>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href="/portfolios"
              >
                Voltar para carteiras
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "refreshing" && hasRead && (
        <p className="mb-4 text-sm text-muted-foreground" role="status" aria-live="polite" aria-busy="true">
          Atualizando dados da carteira...
        </p>
      )}

      {state.status === "error" && hasRead && (
        <Card role="alert" aria-live="assertive" className="mb-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-sm text-destructive">
              {state.error ?? DETAIL_ERROR_MESSAGE} A última leitura válida
              continua visível.
            </p>
            <Button type="button" variant="outline" onClick={() => refresh()}>
              Tentar atualizar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {hasRead && (
        <>
          <PortfolioDashboardContent read={read} portfolioId={portfolioId} />
        </>
      )}
    </section>
  );
}
