"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { listAssets } from "@/data/firestore/asset-repository";
import { listTransactions } from "@/data/firestore/transaction-repository";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePortfolio } from "@/components/portfolio/use-portfolio";
import { sortTransactions } from "@/domain/decimal-reducer";
import type { Asset } from "@/domain/asset";
import type { Transaction } from "@/domain/transaction";
import {
  TransactionForm,
  type PendingTransaction,
  type TransactionReconciliationResult,
} from "@/components/transaction/transaction-form";

type LedgerState =
  | { status: "loading"; assets: readonly Asset[]; transactions: readonly Transaction[] }
  | { status: "ready"; assets: readonly Asset[]; transactions: readonly Transaction[] }
  | { status: "error"; assets: readonly Asset[]; transactions: readonly Transaction[] };

type LedgerLoadResult =
  | { status: "success"; assets: readonly Asset[]; transactions: readonly Transaction[] }
  | { status: "error" }
  | null;

const LIST_ERROR_MESSAGE =
  "Não foi possível carregar o histórico desta carteira. Tente novamente.";

function formatTransactionDate(effectiveDate: string) {
  const [year, month, day] = effectiveDate.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatBrazilianDecimal(value: string) {
  return value.replace(".", ",");
}

function AssetName({ asset }: { asset: Asset | undefined }) {
  if (!asset) {
    return <span>Ativo indisponível</span>;
  }

  return (
    <>
      {asset.symbol} <span className="text-muted-foreground">·</span> {asset.market}
    </>
  );
}

function TransactionCards({
  assets,
  transactions,
}: {
  assets: readonly Asset[];
  transactions: readonly Transaction[];
}) {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <ol className="space-y-4" aria-label="Histórico de operações">
      {transactions.map((transaction) => (
        <li key={transaction.id}>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary">
                    {transaction.kind === "buy" ? "Compra" : "Venda"}
                  </p>
                  <h2 className="mt-1 font-heading text-base font-semibold">
                    <AssetName asset={assetsById.get(transaction.assetId)} />
                  </h2>
                </div>
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={transaction.effectiveDate}
                >
                  {formatTransactionDate(transaction.effectiveDate)}
                </time>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground">
                Quantidade: <strong className="font-medium text-foreground">{formatBrazilianDecimal(transaction.quantity)}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Preço unitário: {formatBrazilianDecimal(transaction.unitPrice.decimal)} {transaction.unitPrice.currency}
              </p>
              <p className="text-sm text-muted-foreground">
                Taxa: {transaction.fee
                  ? `${formatBrazilianDecimal(transaction.fee.decimal)} ${transaction.fee.currency}`
                  : "sem taxa"}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}

export function TransactionLedger({ portfolioId }: { portfolioId: string }) {
  const {
    state: portfolioState,
    retry: retryPortfolio,
  } = usePortfolio(portfolioId);
  const [ledgerState, setLedgerState] = useState<LedgerState>({
    status: "loading",
    assets: [],
    transactions: [],
  });
  const isMountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadLedger = useCallback(async (): Promise<LedgerLoadResult> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLedgerState((currentState) => ({
      status: "loading",
      assets: currentState.assets,
      transactions: currentState.transactions,
    }));

    try {
      const [assets, transactions] = await Promise.all([
        listAssets(),
        listTransactions(portfolioId),
      ]);

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return null;
      }

      const sortedTransactions = sortTransactions(transactions);
      setLedgerState({
        status: "ready",
        assets,
        transactions: sortedTransactions,
      });
      return { status: "success", assets, transactions: sortedTransactions };
    } catch {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return null;
      }

      setLedgerState((currentState) => ({
        status: "error",
        assets: currentState.assets,
        transactions: currentState.transactions,
      }));
      return { status: "error" };
    }
  }, [portfolioId]);

  useEffect(() => {
    isMountedRef.current = true;
    requestIdRef.current += 1;
    let effectIsActive = true;

    queueMicrotask(() => {
      if (isMountedRef.current && effectIsActive) {
        void loadLedger();
      }
    });

    return () => {
      effectIsActive = false;
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadLedger]);

  const retry = () => {
    retryPortfolio();
    void loadLedger();
  };

  const handleCreated = (transaction: Transaction) => {
    setLedgerState((currentState) => ({
      status: "ready",
      assets: currentState.assets,
      transactions: sortTransactions([
        ...currentState.transactions.filter((candidate) => candidate.id !== transaction.id),
        transaction,
      ]),
    }));
  };

  const reconcileTransaction = async (
    operation: PendingTransaction,
  ): Promise<TransactionReconciliationResult> => {
    const result = await loadLedger();

    if (!result || result.status === "error") {
      return { status: "error" };
    }

    const transaction = result.transactions.find(
      (candidate) => candidate.id === operation.transactionId,
    );

    return transaction
      ? { status: "found", transaction }
      : { status: "not-found" };
  };

  const isPortfolioLoading = portfolioState.status === "loading";
  const isLedgerLoading = ledgerState.status === "loading";
  const isArchived =
    portfolioState.status === "ready" && portfolioState.portfolio.archivedAt !== null;

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">Carteira</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Operações da carteira
        </h1>
        <p className="mt-3 text-muted-foreground">
          Consulte compras e vendas em ordem cronológica, sem
          calcular posição, saldo, total ou rentabilidade.
        </p>
      </header>

      {(isPortfolioLoading || isLedgerLoading) && (
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          Carregando carteira e histórico...
        </p>
      )}

      {portfolioState.status === "unavailable" && (
        <Card role="alert" aria-live="assertive">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold">
              Carteira indisponível
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">
              Não foi possível acessar esta carteira.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={retry}>
                Tentar novamente
              </Button>
              <Link className={buttonVariants({ variant: "ghost" })} href="/portfolios">
                Voltar para carteiras
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {portfolioState.status === "ready" && ledgerState.status === "error" && (
        <Card role="alert" aria-live="assertive">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-destructive">{LIST_ERROR_MESSAGE}</p>
            <Button type="button" variant="outline" onClick={retry}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {portfolioState.status === "ready" && ledgerState.status === "ready" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-primary">
                {isArchived ? "Carteira arquivada" : "Carteira ativa"}
              </p>
              <h2 className="font-heading break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
                {portfolioState.portfolio.name}
              </h2>
              <CardDescription>
                Moeda base: {portfolioState.portfolio.baseCurrency}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isArchived ? (
                <p className="rounded-card border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Esta carteira está arquivada. O histórico continua disponível,
                  mas novos lançamentos estão bloqueados até a restauração.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Registre apenas eventos de compra e venda confirmados. A
                  correção futura será feita por um novo lançamento, não por
                  edição ou exclusão.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
            <div className="order-2 space-y-4 lg:order-1">
              {ledgerState.transactions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <h2 className="font-heading text-base font-semibold">
                      Nenhum evento ainda
                    </h2>
                    <CardDescription>
                      {isArchived
                        ? "Esta carteira ainda não possui operações."
                        : "O primeiro lançamento aparecerá aqui após a confirmação."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <TransactionCards
                  assets={ledgerState.assets}
                  transactions={ledgerState.transactions}
                />
              )}
            </div>

            {!isArchived && (
              <Card className="order-1 lg:order-2">
                <CardHeader>
                  <h2 className="font-heading text-base font-semibold">
                    Novo lançamento
                  </h2>
                  <CardDescription>
                    Informe o ativo, tipo, quantidade, preço, moeda, data e, se
                    quiser, uma taxa fixa.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ledgerState.assets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Cadastre um ativo no catálogo antes de registrar uma
                      operação.
                    </p>
                  ) : (
                    <TransactionForm
                      portfolioId={portfolioId}
                      assets={ledgerState.assets}
                      onCreated={handleCreated}
                      onPortfolioArchived={retryPortfolio}
                      onReconcile={reconcileTransaction}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/portfolios/${portfolioId}`}
            >
              Voltar para carteira
            </Link>
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/assets"
            >
              Gerenciar ativos
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
