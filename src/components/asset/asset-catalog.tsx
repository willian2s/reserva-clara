"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AssetHasTransactionsError,
  AssetIdentityConflictError,
  AssetNotFoundError,
  AssetUsageReconciliationIncompleteError,
} from "@/data/firestore/errors";
import { deleteAsset, listAssets } from "@/data/firestore/asset-repository";
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
import { AssetEditForm } from "@/components/asset/asset-edit-form";
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

const DELETE_CONFIRMATION_MESSAGE =
  "A exclusão remove somente este cadastro. Ela não remove operações nem outros dados relacionados e não pode ser desfeita.";
const DELETE_ERROR_MESSAGE =
  "Não foi possível excluir este ativo. O cadastro permanece no catálogo.";
const DELETE_BLOCKED_MESSAGE =
  "Não é possível excluir este ativo porque existem operações vinculadas.";
const DELETE_RECONCILIATION_MESSAGE =
  "Não foi possível verificar todas as operações vinculadas. O ativo não foi excluído.";
const DELETE_CONFLICT_MESSAGE =
  "Este ativo não está mais disponível. Atualize o catálogo antes de tentar novamente.";

function deleteErrorMessage(error: unknown) {
  if (error instanceof AssetHasTransactionsError) {
    return DELETE_BLOCKED_MESSAGE;
  }

  if (error instanceof AssetUsageReconciliationIncompleteError) {
    return DELETE_RECONCILIATION_MESSAGE;
  }

  if (error instanceof AssetNotFoundError) {
    return DELETE_CONFLICT_MESSAGE;
  }

  if (error instanceof AssetIdentityConflictError) {
    return "O cadastro está inconsistente e não pôde ser excluído. Atualize o catálogo.";
  }

  return DELETE_ERROR_MESSAGE;
}

function AssetRow({
  asset,
  quoteResult,
  quotesLoading,
  onUpdated,
  onDeleted,
}: {
  asset: Asset;
  quoteResult: QuoteResult | undefined;
  quotesLoading: boolean;
  onUpdated: (asset: Asset) => void;
  onDeleted: (assetId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [feedback, setFeedback] = useState("");
  const editTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteConfirmationRef = useRef<HTMLButtonElement>(null);
  const deletingRef = useRef(false);

  useEffect(() => {
    if (deleteConfirmationOpen) {
      deleteConfirmationRef.current?.focus();
    }
  }, [deleteConfirmationOpen]);

  const openEdit = () => {
    setDeleteConfirmationOpen(false);
    setDeleteError("");
    setFeedback("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDeleteError("");
    queueMicrotask(() => editTriggerRef.current?.focus());
  };

  const openDeleteConfirmation = () => {
    if (deletingRef.current || isEditing) {
      return;
    }

    setDeleteError("");
    setFeedback("");
    setDeleteConfirmationOpen(true);
  };

  const cancelDelete = () => {
    if (deletingRef.current) {
      return;
    }

    setDeleteConfirmationOpen(false);
    setDeleteError("");
    queueMicrotask(() => deleteTriggerRef.current?.focus());
  };

  const confirmDelete = async () => {
    if (deletingRef.current || !deleteConfirmationOpen) {
      return;
    }

    deletingRef.current = true;
    setIsDeleting(true);
    setDeleteError("");
    setFeedback("");

    try {
      await deleteAsset(asset.id);
      onDeleted(asset.id);
    } catch (error: unknown) {
      setDeleteError(deleteErrorMessage(error));
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="grid gap-4 md:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.2fr)] md:items-center">
        <div>
          <h2 className="font-heading text-base leading-snug font-semibold break-words [overflow-wrap:anywhere]">
            {asset.symbol} <span className="text-muted-foreground">·</span> {asset.market}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ASSET_TYPE_LABELS[asset.assetType]} · {asset.currency}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastrado em {formatCreatedAt(asset.createdAt)}
          </p>
        </div>
        <AssetQuote loading={quotesLoading} result={quoteResult} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          ref={editTriggerRef}
          type="button"
          variant="outline"
          size="sm"
          onClick={openEdit}
          disabled={isDeleting || deleteConfirmationOpen}
          aria-expanded={isEditing}
          aria-controls={isEditing ? `asset-edit-${asset.id}` : undefined}
        >
          Editar ativo
        </Button>
        <Button
          ref={deleteTriggerRef}
          type="button"
          variant="destructive"
          size="sm"
          onClick={openDeleteConfirmation}
          disabled={isDeleting || isEditing}
          aria-expanded={deleteConfirmationOpen}
          aria-controls={
            deleteConfirmationOpen ? `asset-delete-${asset.id}` : undefined
          }
        >
          Excluir ativo
        </Button>
      </div>

      {isEditing && (
        <div className="mt-4">
          <AssetEditForm
            asset={asset}
            onCancel={cancelEdit}
            onUpdated={(updatedAsset) => {
              setIsEditing(false);
              setFeedback("Ativo atualizado com sucesso. A cotação será recarregada.");
              onUpdated(updatedAsset);
              queueMicrotask(() => editTriggerRef.current?.focus());
            }}
          />
        </div>
      )}

      {deleteConfirmationOpen && (
        <div
          id={`asset-delete-${asset.id}`}
          className="mt-4 space-y-4 rounded-card border border-destructive/40 bg-destructive/5 p-4"
          role="group"
          aria-labelledby={`asset-delete-${asset.id}-title`}
        >
          <div className="space-y-2">
            <h3
              id={`asset-delete-${asset.id}-title`}
              className="font-heading text-base font-semibold"
            >
              Confirmar exclusão
            </h3>
            <p className="text-sm text-foreground">
              Você está excluindo o ativo <strong>{asset.symbol} em {asset.market}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">{DELETE_CONFIRMATION_MESSAGE}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              ref={deleteConfirmationRef}
              type="button"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={isDeleting}
              aria-busy={isDeleting}
              aria-describedby={deleteError ? `asset-delete-${asset.id}-error` : undefined}
            >
              {isDeleting ? "Excluindo ativo..." : "Confirmar exclusão"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              Cancelar
            </Button>
          </div>

          {deleteError && (
            <p
              id={`asset-delete-${asset.id}-error`}
              className="text-sm text-destructive"
              role="alert"
              aria-live="assertive"
            >
              {deleteError}
            </p>
          )}
          <p className="min-h-5 text-sm text-muted-foreground" role="status" aria-live="polite">
            {isDeleting ? "Excluindo o cadastro com segurança..." : ""}
          </p>
        </div>
      )}

      <p className="min-h-5 pt-2 text-sm text-primary" role="status" aria-live="polite">
        {feedback}
      </p>
    </li>
  );
}

function AssetList({
  assets,
  quoteResults,
  quotesLoading,
  onUpdated,
  onDeleted,
}: {
  assets: readonly Asset[];
  quoteResults: ReadonlyMap<string, QuoteResult>;
  quotesLoading: boolean;
  onUpdated: (asset: Asset) => void;
  onDeleted: (assetId: string) => void;
}) {
  return (
    <ul className="divide-y divide-border border-y border-border" aria-label="Seus ativos">
      {assets.map((asset) => (
        <AssetRow
          key={asset.id}
          asset={asset}
          quoteResult={quoteResults.get(asset.id)}
          quotesLoading={quotesLoading}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
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
  const [operationFeedback, setOperationFeedback] = useState("");
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
    setOperationFeedback("");
    requestIdRef.current += 1;
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

  const handleUpdated = (updatedAsset: Asset) => {
    setOperationFeedback("");
    requestIdRef.current += 1;
    quoteRequestIdRef.current += 1;
    setQuoteState((currentState) => {
      const results = new Map(currentState.results);
      results.delete(updatedAsset.id);
      return { status: "idle", results };
    });
    setCatalogState((currentState) => ({
      status: "ready",
      assets: sortAssets(
        currentState.assets.map((asset) =>
          asset.id === updatedAsset.id ? updatedAsset : asset,
        ),
      ),
    }));
  };

  const handleDeleted = (assetId: string) => {
    setOperationFeedback("Ativo excluído com sucesso. Nenhuma operação vinculada foi removida.");
    requestIdRef.current += 1;
    quoteRequestIdRef.current += 1;
    setQuoteState((currentState) => {
      const results = new Map(currentState.results);
      results.delete(assetId);
      return { status: "idle", results };
    });
    setCatalogState((currentState) => ({
      status: "ready",
      assets: currentState.assets.filter((asset) => asset.id !== assetId),
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
        <p className="min-h-5 pt-2 text-sm text-primary" role="status" aria-live="polite">
          {operationFeedback}
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
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
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
