"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listAssets } from "@/data/firestore/asset-repository";
import type { Asset } from "@/domain/asset";
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

type AssetCatalogState =
  | { status: "loading"; assets: readonly Asset[] }
  | { status: "ready"; assets: readonly Asset[] }
  | { status: "error"; assets: readonly Asset[] };

type AssetLoadResult =
  | { status: "success"; assets: readonly Asset[] }
  | { status: "error" }
  | null;

const LIST_ERROR_MESSAGE =
  "Não foi possível carregar seu catálogo de Assets. Tente novamente.";

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

function AssetCards({ assets }: { assets: readonly Asset[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-label="Seus Assets">
      {assets.map((asset) => (
        <li key={asset.id}>
          <Card className="h-full">
            <CardHeader>
              <h2 className="font-heading text-base leading-snug font-semibold break-words [overflow-wrap:anywhere]">
                {asset.symbol} <span className="text-muted-foreground">·</span>{" "}
                {asset.market}
              </h2>
              <CardDescription>
                {ASSET_TYPE_LABELS[asset.assetType]} em {asset.currency}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Identidade: <code className="font-mono">{asset.identityKey}</code>
              </p>
              <p className="text-sm text-muted-foreground">
                Cadastrado em {formatCreatedAt(asset.createdAt)}
              </p>
            </CardContent>
          </Card>
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
  const isMountedRef = useRef(false);
  const initialLoadScheduledRef = useRef(false);
  const requestIdRef = useRef(0);

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
    };
  }, [loadAssets]);

  const assets = catalogState.assets;
  const isLoading = catalogState.status === "loading";
  const isEmpty = catalogState.status === "ready" && assets.length === 0;

  const handleCreated = (asset: Asset) => {
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
          Assets
        </h1>
        <p className="mt-3 text-muted-foreground">
          Cadastre identidades reutilizáveis para organizar seus lançamentos,
          sem misturar cotação ou posição.
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
                  Nenhum Asset ainda
                </h2>
                <CardDescription>
                  Crie a primeira identidade para reutilizá-la em suas carteiras.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {catalogState.status === "ready" && assets.length > 0 && (
            <AssetCards assets={assets} />
          )}
        </div>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <h2 className="font-heading text-base leading-snug font-semibold">
              {isEmpty ? "Cadastrar primeiro Asset" : "Novo Asset"}
            </h2>
            <CardDescription>
              A mesma identidade será reutilizada em vez de duplicada.
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
