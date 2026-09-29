"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  listArchivedPortfolios,
  listPortfolios,
} from "@/data/firestore/portfolio-repository";
import type { Portfolio } from "@/domain/portfolio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { PortfolioCreateForm } from "@/components/portfolio/portfolio-create-form";

type PortfolioListState =
  | {
      status: "loading";
      portfolios: readonly Portfolio[];
      archivedPortfolios: readonly Portfolio[];
    }
  | {
      status: "ready";
      portfolios: readonly Portfolio[];
      archivedPortfolios: readonly Portfolio[];
    }
  | {
      status: "error";
      portfolios: readonly Portfolio[];
      archivedPortfolios: readonly Portfolio[];
    };

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

function PortfolioCards({
  portfolios,
  label,
  archived = false,
}: {
  portfolios: readonly Portfolio[];
  label: string;
  archived?: boolean;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-label={label}>
      {portfolios.map((portfolio) => (
        <li key={portfolio.id}>
          <Card className="h-full">
            <CardHeader>
              <h2 className="font-heading text-base leading-snug font-semibold break-words [overflow-wrap:anywhere]">
                <Link
                  className="inline-flex min-h-11 w-full items-center underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  href={`/portfolios/${portfolio.id}`}
                >
                  {portfolio.name}
                </Link>
              </h2>
              <CardDescription>
                Carteira {archived ? "arquivada" : "ativa"} em {portfolio.baseCurrency}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Criada em {formatCreatedAt(portfolio.createdAt)}
              </p>
              {archived && (
                <Link
                  className="mt-3 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  href={`/portfolios/${portfolio.id}/settings`}
                >
                  Restaurar em configurações
                </Link>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function PortfolioList() {
  const [listState, setListState] = useState<PortfolioListState>({
    status: "loading",
    portfolios: [],
    archivedPortfolios: [],
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
      archivedPortfolios: currentState.archivedPortfolios,
    }));

    try {
      const [portfolios, archivedPortfolios] = await Promise.all([
        listPortfolios(),
        listArchivedPortfolios(),
      ]);

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return false;
      }

      setListState({
        status: "ready",
        portfolios: sortPortfolios(portfolios),
        archivedPortfolios: sortPortfolios(archivedPortfolios),
      });
      return true;
    } catch {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return false;
      }

      setListState({ status: "error", portfolios: [], archivedPortfolios: [] });
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
  const archivedPortfolios = listState.archivedPortfolios;
  const isEmpty =
    isReady && portfolios.length === 0 && archivedPortfolios.length === 0;

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
                <h2 className="font-heading text-base leading-snug font-semibold">
                  {archivedPortfolios.length === 0
                    ? "Nenhuma carteira ainda"
                    : "Nenhuma carteira ativa"}
                </h2>
                <CardDescription>
                  {archivedPortfolios.length === 0
                    ? "Seu patrimônio, com clareza. Crie uma carteira para organizar um conjunto de recursos em um só lugar."
                    : "Suas carteiras arquivadas continuam disponíveis para consulta e restauração. Crie uma nova carteira ativa quando precisar."}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {listState.status === "ready" && portfolios.length > 0 && (
            <PortfolioCards
              portfolios={portfolios}
              label="Suas carteiras ativas"
            />
          )}

          {listState.status === "ready" && archivedPortfolios.length > 0 && (
            <div className="space-y-4 border-t border-border pt-6">
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  Carteiras arquivadas
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Arquivar preserva histórico e permite restauração; não remove
                  filhos nem dados da carteira.
                </p>
              </div>
              <PortfolioCards
                portfolios={archivedPortfolios}
                label="Suas carteiras arquivadas"
                archived
              />
            </div>
          )}
        </div>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <h2 className="font-heading text-base leading-snug font-semibold">
              {isEmpty ? "Criar primeira carteira" : "Nova carteira"}
            </h2>
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
