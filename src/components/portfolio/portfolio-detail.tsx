"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { getPortfolio } from "@/data/firestore/portfolio-repository";
import type { Portfolio } from "@/domain/portfolio";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

const DETAIL_ERROR_MESSAGE = "Não foi possível acessar esta carteira.";

type PortfolioDetailState =
  | { status: "loading"; portfolioId: string }
  | { status: "ready"; portfolioId: string; portfolio: Portfolio }
  | { status: "unavailable"; portfolioId: string };

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(createdAt);
}

export function PortfolioDetail({ portfolioId }: { portfolioId: string }) {
  const [detailState, setDetailState] = useState<PortfolioDetailState>({
    status: "loading",
    portfolioId,
  });
  const isMountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPortfolio = useCallback(
    (requestedPortfolioId: string, requestId: number) => {
      void getPortfolio(requestedPortfolioId)
        .then((portfolio) => {
          if (
            !isMountedRef.current ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          setDetailState(
            portfolio
              ? {
                  status: "ready",
                  portfolioId: requestedPortfolioId,
                  portfolio,
                }
              : { status: "unavailable", portfolioId: requestedPortfolioId },
          );
        })
        .catch(() => {
          if (
            !isMountedRef.current ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          // All repository read failures intentionally share one message.
          setDetailState({
            status: "unavailable",
            portfolioId: requestedPortfolioId,
          });
        });
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let effectIsActive = true;

    // Deferring the first call avoids duplicate reads from Strict Mode's
    // setup-cleanup-setup cycle while keeping the read after AuthGate mounts.
    queueMicrotask(() => {
      if (effectIsActive) {
        loadPortfolio(portfolioId, requestId);
      }
    });

    return () => {
      effectIsActive = false;
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadPortfolio, portfolioId]);

  const retry = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setDetailState({ status: "loading", portfolioId });
    loadPortfolio(portfolioId, requestId);
  }, [loadPortfolio, portfolioId]);

  const currentState =
    detailState.portfolioId === portfolioId
      ? detailState
      : { status: "loading" as const, portfolioId };

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">Patrimônio</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Detalhe da carteira
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
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
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
