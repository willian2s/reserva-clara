"use client";

import { useRef, useState, type FormEvent } from "react";

import { createAsset } from "@/data/firestore/asset-repository";
import { DomainError } from "@/domain/errors";
import {
  ASSET_TYPES,
  createAssetIdentityKey,
  parseAssetInput,
  type Asset,
  type AssetInput,
} from "@/domain/asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INVALID_FIELD_MESSAGES: Record<string, string> = {
  symbol: "Informe um símbolo válido usando letras, números, ponto, hífen ou sublinhado.",
  market: "Informe um mercado válido usando letras, números, ponto, hífen ou sublinhado.",
  assetType: "Selecione um tipo de ativo válido.",
  currency: "Informe um código de moeda com três letras, como BRL ou USD.",
};

const CREATE_ERROR_MESSAGE =
  "Não foi possível confirmar o cadastro. Verifique o catálogo antes de tentar novamente.";

const ASSET_TYPE_LABELS: Record<(typeof ASSET_TYPES)[number], string> = {
  stock: "AÇÃO",
  etf: "ETF",
  fii: "FII",
  fund: "FUNDO",
  bond: "TÍTULO",
  crypto: "CRIPTOATIVO",
  other: "OUTRO",
};

type AssetCreateFormProps = {
  assets: readonly Asset[];
  disabled?: boolean;
  onCreated: (asset: Asset) => void;
  onReconcile: (identityKey: string) => Promise<AssetReconciliationResult>;
};

export type AssetReconciliationResult =
  | { status: "found"; asset: Asset }
  | { status: "not-found" }
  | { status: "error" };

type AssetFormValues = {
  symbol: string;
  market: string;
  assetType: string;
  currency: string;
};

function inputMessage(field: string) {
  return INVALID_FIELD_MESSAGES[field] ?? "Revise os dados informados.";
}

function findInputField(error: DomainError) {
  return "field" in error && typeof error.field === "string" ? error.field : "asset";
}

export function AssetCreateForm({
  assets,
  disabled = false,
  onCreated,
  onReconcile,
}: AssetCreateFormProps) {
  const [values, setValues] = useState<AssetFormValues>({
    symbol: "",
    market: "",
    assetType: "stock",
    currency: "BRL",
  });
  const [validationError, setValidationError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [operationError, setOperationError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingIdentityKey, setPendingIdentityKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationRequired, setReconciliationRequired] = useState(false);
  const submittingRef = useRef(false);

  const isDisabled = disabled || isSubmitting || isReconciling;
  const inputErrorId = "asset-form-error";
  const operationErrorId = "asset-operation-error";
  const fieldError = validationError?.message ?? "";
  const hasFieldError = (field: string) => validationError?.field === field;

  const updateValue = (field: keyof AssetFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    setFeedback("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current || disabled) {
      return;
    }

    let input: AssetInput;
    let identityKey: string;

    try {
      input = parseAssetInput(values);
      identityKey = createAssetIdentityKey(
        input.symbol,
        input.market,
        input.assetType,
        input.currency,
      );
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        setValidationError({
          field: findInputField(error),
          message: inputMessage(findInputField(error)),
        });
      } else {
        setValidationError({
          field: "asset",
          message: "Revise os dados informados antes de continuar.",
        });
      }
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setValidationError(null);
    setOperationError("");
    setFeedback("");
    setReconciliationRequired(false);
    setPendingIdentityKey("");

    try {
      const existingAsset = assets.find((asset) => asset.identityKey === identityKey);
      const asset = await createAsset(input);

      onCreated(asset);
      setFeedback(
        existingAsset
          ? `Este ativo já estava cadastrado: ${asset.symbol} em ${asset.market}.`
          : `Ativo ${asset.symbol} cadastrado com sucesso.`,
      );
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        setValidationError({
          field: findInputField(error),
          message: inputMessage(findInputField(error)),
        });
      } else {
        setPendingIdentityKey(identityKey);
        setReconciliationRequired(true);
        setOperationError(CREATE_ERROR_MESSAGE);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReconcile = async () => {
    if (!reconciliationRequired || !pendingIdentityKey || isDisabled) {
      return;
    }

    setIsReconciling(true);

    try {
      const reconciliation = await onReconcile(pendingIdentityKey);

      if (reconciliation.status === "found") {
        onCreated(reconciliation.asset);
        setFeedback(
          `Cadastro confirmado. Ativo existente: ${reconciliation.asset.symbol} em ${reconciliation.asset.market}.`,
        );
        setOperationError("");
        setReconciliationRequired(false);
        setPendingIdentityKey("");
      } else if (reconciliation.status === "not-found") {
        setOperationError(
          "Catálogo atualizado, mas o ativo não foi encontrado. Revise os dados antes de tentar novamente.",
        );
        setReconciliationRequired(false);
      } else {
        setOperationError(
          "Não foi possível verificar o catálogo. Tente a reconciliação novamente.",
        );
      }
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="asset-symbol">Símbolo</Label>
          <Input
            id="asset-symbol"
            name="symbol"
            value={values.symbol}
            onChange={(event) => updateValue("symbol", event.target.value)}
            disabled={isDisabled || reconciliationRequired}
            aria-invalid={hasFieldError("symbol")}
            aria-describedby={hasFieldError("symbol") ? inputErrorId : undefined}
            autoComplete="off"
            placeholder="BOVA11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset-market">Mercado</Label>
          <Input
            id="asset-market"
            name="market"
            value={values.market}
            onChange={(event) => updateValue("market", event.target.value)}
            disabled={isDisabled || reconciliationRequired}
            aria-invalid={hasFieldError("market")}
            aria-describedby={hasFieldError("market") ? inputErrorId : undefined}
            autoComplete="off"
            placeholder="B3"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset-type">Tipo de ativo</Label>
          <select
            id="asset-type"
            name="assetType"
            value={values.assetType}
            onChange={(event) => updateValue("assetType", event.target.value)}
            disabled={isDisabled || reconciliationRequired}
            aria-invalid={hasFieldError("assetType")}
            aria-describedby={hasFieldError("assetType") ? inputErrorId : undefined}
            className="h-10 w-full rounded-control border border-input bg-transparent px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 md:text-sm"
          >
            {ASSET_TYPES.map((assetType) => (
              <option key={assetType} value={assetType}>
                {ASSET_TYPE_LABELS[assetType]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset-currency">Moeda</Label>
          <Input
            id="asset-currency"
            name="currency"
            value={values.currency}
            onChange={(event) =>
              updateValue("currency", event.target.value.toUpperCase())
            }
            disabled={isDisabled || reconciliationRequired}
            aria-invalid={hasFieldError("currency")}
            aria-describedby={hasFieldError("currency") ? inputErrorId : undefined}
            autoComplete="off"
            maxLength={3}
            placeholder="BRL"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        O cadastro combina código, mercado, tipo e moeda para evitar duplicidades.
      </p>

      {fieldError && (
        <p id={inputErrorId} className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isDisabled || reconciliationRequired}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Salvando ativo..." : "Cadastrar ativo"}
        </Button>
        {reconciliationRequired && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleReconcile()}
            disabled={isDisabled}
            aria-busy={isReconciling}
            aria-describedby={operationError ? operationErrorId : undefined}
          >
            {isReconciling ? "Verificando catálogo..." : "Verificar catálogo"}
          </Button>
        )}
      </div>

      {operationError && (
        <p
          id={operationErrorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      )}
      {feedback && (
        <p className="text-sm text-primary" role="status" aria-live="polite">
          {feedback}
        </p>
      )}
      <p className="min-h-5 text-sm text-muted-foreground" role="status" aria-live="polite">
        {isSubmitting ? "Salvando o cadastro com segurança..." : ""}
      </p>
    </form>
  );
}
