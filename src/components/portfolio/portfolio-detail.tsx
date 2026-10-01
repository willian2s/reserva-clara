"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { usePortfolio } from "@/components/portfolio/use-portfolio";

const DETAIL_ERROR_MESSAGE = "Não foi possível acessar esta carteira.";

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(createdAt);
}

export function PortfolioDetail({ portfolioId }: { portfolioId: string }) {
  const { state: currentState, retry } = usePortfolio(portfolioId);

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">Patrimônio</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Visão da carteira
        </h1>
        <p className="mt-3 text-muted-foreground">
          Consulte os dados reais desta carteira, sem métricas patrimoniais
          calculadas nesta fase.
        </p>
      </header>

      {currentState.status === "loading" && (
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          Carregando carteira...
        </p>
      )}

      {currentState.status === "unavailable" && (
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
                onClick={retry}
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

      {currentState.status === "ready" && (
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-primary">Carteira</p>
            <h2 className="font-heading break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
              {currentState.portfolio.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Moeda base: {currentState.portfolio.baseCurrency}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Criada em {formatCreatedAt(currentState.portfolio.createdAt)}
            </p>
            <p className="rounded-card border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Recursos patrimoniais estarão disponíveis em fases futuras. Esta
              carteira ainda não exibe saldo, valores ou posições.
            </p>
            <div className="space-y-3 border-t border-border pt-5">
              <h3 className="font-heading text-lg font-semibold">
                Gerenciamento da carteira
              </h3>
              <p className="text-sm text-muted-foreground">
                As configurações ficam separadas das informações financeiras
                desta carteira.
              </p>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/portfolios/${currentState.portfolio.id}/settings`}
              >
                Configurações da carteira
              </Link>
            </div>
            <div className="space-y-3 border-t border-border pt-5">
              <h3 className="font-heading text-lg font-semibold">
                Histórico de operações
              </h3>
              <p className="text-sm text-muted-foreground">
                Consulte e registre compras e vendas sem cálculos patrimoniais.
              </p>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/portfolios/${currentState.portfolio.id}/transactions`}
              >
                Abrir histórico de operações
              </Link>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/portfolios"
            >
              Voltar para carteiras
            </Link>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
