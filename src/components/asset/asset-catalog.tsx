"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listAssets } from "@/data/firestore/asset-repository";
import { fetchQuotes, QuoteClientError } from "@/data/quotes/quote-client";
import type { Asset } from "@/domain/asset";
import {
  QUOTE_MAX_BATCH_SIZE,
  type QuoteErrorCode,
  type QuoteResult,
} from "@/domain/quote";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  AssetCreateForm,
  type AssetReconciliationResult,
} from "@/components/asset/asset-create-form";
import { AssetQuote } from "@/components/asset/asset-quote";

type AssetCatalogState =
  | { status: "loading"; assets: readonly Asset[] }
  | { status: "ready"; assets: readonly Asset[] }
  | { status: "error"; assets: readonly Asset[] };

type AssetLoadResult =
  | { status: "success"; assets: readonly Asset[] }
  | { status: "error" }
  | null;

type QuoteCatalogState =
  | { status: "idle"; results: ReadonlyMap<string, QuoteResult> }
  | { status: "loading"; results: ReadonlyMap<string, QuoteResult> }
  | { status: "ready"; results: ReadonlyMap<string, QuoteResult> }
  | { status: "error"; results: ReadonlyMap<string, QuoteResult>; code: QuoteErrorCode };

const LIST_ERROR_MESSAGE =
  "Não foi possível carregar seu catálogo de ativos. Tente novamente.";

const QUOTE_ERROR_MESSAGE =
  "Não foi possível atualizar algumas cotações. Os dados básicos dos ativos continuam disponíveis.";

const ASSET_TYPE_LABELS: Record<Asset["assetType"], string> = {
  stock: "Ação",
  etf: "ETF",
  fii: "FII",
  fund: "Fundo",
  bond: "Título",
  crypto: "Criptoativo",
  other: "Outro",
};

function sortAssets(assets: readonly Asset[]) {
  return [...assets].sort((left, right) => {
    const symbolDifference = left.symbol.localeCompare(right.symbol);

    if (symbolDifference !== 0) {
      return symbolDifference;
    }

    return left.id.localeCompare(right.id);
  });
}

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    createdAt,
  );
}

function AssetList({
  assets,
  quoteResults,
  quotesLoading,
}: {
  assets: readonly Asset[];
  quoteResults: ReadonlyMap<string, QuoteResult>;
  quotesLoading: boolean;
}) {
  return (
    <ul className="divide-y divide-border border-y border-border" aria-label="Seus ativos">
      {assets.map((asset) => (
        <li key={asset.id} className="py-5 first:pt-0 last:pb-0">
          <div className="grid gap-4 md:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.2fr)] md:items-center">
            <div>
              <h2 className="font-heading text-base leading-snug font-semibold break-words [overflow-wrap:anywhere]">
                {asset.symbol} <span className="text-muted-foreground">·</span>{" "}
                {asset.market}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {ASSET_TYPE_LABELS[asset.assetType]} · {asset.currency}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastrado em {formatCreatedAt(asset.createdAt)}
              </p>
            </div>
            <AssetQuote
              loading={quotesLoading}
              result={quoteResults.get(asset.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AssetCatalog() {
  const [catalogState, setCatalogState] = useState<AssetCatalogState>({
    status: "loading",
    assets: [],
  });
  const [quoteState, setQuoteState] = useState<QuoteCatalogState>({
    status: "idle",
    results: new Map(),
  });
  const isMountedRef = useRef(false);
  const initialLoadScheduledRef = useRef(false);
  const requestIdRef = useRef(0);
  const quoteRequestIdRef = useRef(0);

  const loadAssets = useCallback(async (): Promise<AssetLoadResult> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setCatalogState((currentState) => ({
      status: "loading",
      assets: currentState.assets,
    }));

    try {
      const assets = await listAssets();

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return null;
      }

      const sortedAssets = sortAssets(assets);
      quoteRequestIdRef.current += 1;
      setQuoteState({ status: "idle", results: new Map() });
      setCatalogState({ status: "ready", assets: sortedAssets });
      return { status: "success", assets: sortedAssets };
    } catch {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return null;
      }

      setCatalogState({ status: "error", assets: [] });
      return { status: "error" };
    }
  }, []);

  const loadQuotes = useCallback(async (assetsToQuote: readonly Asset[]) => {
    if (assetsToQuote.length === 0) {
      return;
    }

    const requestId = quoteRequestIdRef.current + 1;
    quoteRequestIdRef.current = requestId;
    setQuoteState({ status: "loading", results: new Map() });

    const results: QuoteResult[] = [];
    let firstErrorCode: QuoteErrorCode | undefined;

    for (let start = 0; start < assetsToQuote.length; start += QUOTE_MAX_BATCH_SIZE) {
      const batch = assetsToQuote.slice(start, start + QUOTE_MAX_BATCH_SIZE);

      try {
        results.push(...(await fetchQuotes(batch.map((asset) => asset.id))));
      } catch (error) {
        const code =
          error instanceof QuoteClientError
            ? error.code
            : "PROVIDER_UNAVAILABLE";

        firstErrorCode ??= code;
        results.push(
          ...batch.map((asset) => ({
            assetId: asset.id,
            status: "unavailable" as const,
            code,
          })),
        );
      }

      if (!isMountedRef.current || requestId !== quoteRequestIdRef.current) {
        return;
      }
    }

    const nextResults = new Map(results.map((result) => [result.assetId, result]));
    if (!isMountedRef.current || requestId !== quoteRequestIdRef.current) {
      return;
    }

    setQuoteState(
      firstErrorCode
        ? { status: "error", results: nextResults, code: firstErrorCode }
        : { status: "ready", results: nextResults },
    );
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!initialLoadScheduledRef.current) {
      initialLoadScheduledRef.current = true;
      queueMicrotask(() => {
        if (isMountedRef.current) {
          void loadAssets();
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      quoteRequestIdRef.current += 1;
    };
  }, [loadAssets]);

  useEffect(() => {
    let effectIsActive = true;

    if (catalogState.status === "ready" && catalogState.assets.length > 0) {
      queueMicrotask(() => {
        if (isMountedRef.current && effectIsActive) {
          void loadQuotes(catalogState.assets);
        }
      });
    }

    return () => {
      effectIsActive = false;
    };
  }, [catalogState.assets, catalogState.status, loadQuotes]);

  const assets = catalogState.assets;
  const isLoading = catalogState.status === "loading";
  const isEmpty = catalogState.status === "ready" && assets.length === 0;
  const quotesLoading =
    catalogState.status === "ready" &&
    (quoteState.status === "idle" || quoteState.status === "loading");

  const handleCreated = (asset: Asset) => {
    quoteRequestIdRef.current += 1;
    setQuoteState({ status: "idle", results: new Map() });
    setCatalogState((currentState) => ({
      status: "ready",
      assets: sortAssets([
        ...currentState.assets.filter((candidate) => candidate.id !== asset.id),
        asset,
      ]),
    }));
  };

  const reconcileAsset = async (
    identityKey: string,
  ): Promise<AssetReconciliationResult> => {
    const result = await loadAssets();

    if (!result || result.status === "error") {
      return { status: "error" };
    }

    const asset = result.assets.find((candidate) => candidate.identityKey === identityKey);
    return asset ? { status: "found", asset } : { status: "not-found" };
  };

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">Catálogo privado</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Ativos
        </h1>
        <p className="mt-3 text-muted-foreground">
          Cadastre ativos para organizar seus lançamentos, sem misturar cotação
          ou posição.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
        <div className="order-2 space-y-4 lg:order-1">
          {isLoading && (
            <p
              className="text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              Carregando seu catálogo...
            </p>
          )}

          {catalogState.status === "error" && (
            <Card role="alert">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-destructive">{LIST_ERROR_MESSAGE}</p>
                <Button type="button" variant="outline" onClick={() => void loadAssets()}>
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {isEmpty && (
            <Card>
              <CardHeader>
                <h2 className="font-heading text-base leading-snug font-semibold">
                  Nenhum ativo cadastrado
                </h2>
                <CardDescription>
                  Cadastre o primeiro ativo para reutilizá-lo em suas carteiras.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {catalogState.status === "ready" && assets.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className="text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                  aria-busy={quotesLoading}
                >
                  {quotesLoading
                    ? "Carregando cotações..."
                    : "As cotações são atualizadas separadamente dos dados dos ativos."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={quotesLoading}
                  onClick={() => void loadQuotes(assets)}
                >
                  {quoteState.status === "error" ? "Tentar novamente" : "Atualizar cotações"}
                </Button>
              </div>

              {quoteState.status === "error" && (
                <Card role="alert" aria-live="assertive">
                  <CardContent className="p-4">
                    <p className="text-sm text-destructive">{QUOTE_ERROR_MESSAGE}</p>
                  </CardContent>
                </Card>
              )}

              <AssetList
                assets={assets}
                quoteResults={quoteState.results}
                quotesLoading={quotesLoading}
              />
            </>
          )}
        </div>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <h2 className="font-heading text-base leading-snug font-semibold">
              {isEmpty ? "Cadastrar primeiro ativo" : "Novo ativo"}
            </h2>
            <CardDescription>
              O mesmo cadastro será reutilizado em vez de duplicado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetCreateForm
              assets={assets}
              disabled={isLoading}
              onCreated={handleCreated}
              onReconcile={reconcileAsset}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
