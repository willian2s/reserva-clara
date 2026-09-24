"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listPortfolios } from "@/data/firestore/portfolio-repository";
import type { Portfolio } from "@/domain/portfolio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PortfolioCreateForm } from "@/components/portfolio/portfolio-create-form";

type PortfolioListState =
  | { status: "loading"; portfolios: readonly Portfolio[] }
  | { status: "ready"; portfolios: readonly Portfolio[] }
  | { status: "error"; portfolios: readonly Portfolio[] };

const LIST_ERROR_MESSAGE =
  "Não foi possível carregar suas carteiras. Tente novamente.";

function sortPortfolios(portfolios: readonly Portfolio[]) {
  return [...portfolios].sort((left, right) => {
    const createdAtDifference =
      right.createdAt.getTime() - left.createdAt.getTime();

    if (createdAtDifference !== 0) {
      return createdAtDifference;
    }

    return left.id.localeCompare(right.id);
  });
}

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(createdAt);
}

export function PortfolioList() {
  const [listState, setListState] = useState<PortfolioListState>({
    status: "loading",
    portfolios: [],
  });
  const isMountedRef = useRef(false);
  const initialLoadScheduledRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPortfolios = useCallback(async (): Promise<boolean> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setListState((currentState) => ({
      status: "loading",
      portfolios: currentState.portfolios,
    }));

    try {
      const portfolios = await listPortfolios();

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return false;
      }

      setListState({
        status: "ready",
        portfolios: sortPortfolios(portfolios),
      });
      return true;
    } catch {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return false;
      }

      setListState({ status: "error", portfolios: [] });
      return false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!initialLoadScheduledRef.current) {
      initialLoadScheduledRef.current = true;
      queueMicrotask(() => {
        if (isMountedRef.current) {
          void loadPortfolios();
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadPortfolios]);

  const isLoading = listState.status === "loading";
  const isReady = listState.status === "ready";
  const portfolios = listState.portfolios;
  const isEmpty = isReady && portfolios.length === 0;

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">Patrimônio</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Carteiras
        </h1>
        <p className="mt-3 text-muted-foreground">
          Organize seus conjuntos de patrimônio com clareza, sem misturar suas
          escolhas.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
        <div className="order-2 space-y-4 lg:order-1">
          {isLoading && (
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite" aria-busy="true">
              Carregando suas carteiras...
            </p>
          )}

          {listState.status === "error" && (
            <Card role="alert">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-destructive">{LIST_ERROR_MESSAGE}</p>
                <Button type="button" variant="outline" onClick={() => void loadPortfolios()}>
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {listState.status === "ready" && portfolios.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma carteira ainda</CardTitle>
                <CardDescription>
                  Seu patrimônio, com clareza. Crie uma carteira para organizar
                  um conjunto de recursos em um só lugar.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {listState.status === "ready" && portfolios.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2" aria-label="Suas carteiras">
              {portfolios.map((portfolio) => (
                <li key={portfolio.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{portfolio.name}</CardTitle>
                      <CardDescription>Carteira em {portfolio.baseCurrency}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Criada em {formatCreatedAt(portfolio.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <CardTitle>
              {isEmpty ? "Criar primeira carteira" : "Nova carteira"}
            </CardTitle>
            <CardDescription>
              Dê um nome para identificar este conjunto de patrimônio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioCreateForm
              disabled={isLoading || listState.status === "error"}
              onReconcile={loadPortfolios}
              submitLabel={isEmpty ? "Criar primeira carteira" : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
