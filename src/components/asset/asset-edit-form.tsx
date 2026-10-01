"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  AssetIdentityConflictError,
  AssetNotFoundError,
} from "@/data/firestore/errors";
import { updateAsset } from "@/data/firestore/asset-repository";
import { DomainError } from "@/domain/errors";
import {
  ASSET_TYPES,
  parseAssetUpdateInput,
  type Asset,
  type AssetUpdateInput,
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

const ASSET_TYPE_LABELS: Record<(typeof ASSET_TYPES)[number], string> = {
  stock: "AÇÃO",
  etf: "ETF",
  fii: "FII",
  fund: "FUNDO",
  bond: "TÍTULO",
  crypto: "CRIPTOATIVO",
  other: "OUTRO",
};

const UPDATE_ERROR_MESSAGE =
  "Não foi possível salvar a alteração. O ativo original foi preservado.";
const UPDATE_CONFLICT_MESSAGE =
  "Já existe outro ativo com essa combinação de símbolo, mercado, tipo e moeda.";
const UPDATE_NOT_FOUND_MESSAGE =
  "Este ativo não está mais disponível. Atualize o catálogo antes de tentar novamente.";

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

export function AssetEditForm({
  asset,
  onCancel,
  onUpdated,
}: {
  asset: Asset;
  onCancel: () => void;
  onUpdated: (asset: Asset) => void;
}) {
  const [values, setValues] = useState<AssetFormValues>({
    symbol: asset.symbol,
    market: asset.market,
    assetType: asset.assetType,
    currency: asset.currency,
  });
  const [validationError, setValidationError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [operationError, setOperationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const formId = `asset-edit-${asset.id}`;
  const inputErrorId = `${formId}-error`;
  const operationErrorId = `${formId}-operation-error`;

  useEffect(() => {
    symbolInputRef.current?.focus();
  }, []);

  const updateValue = (field: keyof AssetFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    setOperationError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    let input: AssetUpdateInput;

    try {
      input = parseAssetUpdateInput(values);
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

    try {
      const updatedAsset = await updateAsset(asset.id, input);
      onUpdated(updatedAsset);
    } catch (error: unknown) {
      if (error instanceof AssetIdentityConflictError) {
        setOperationError(UPDATE_CONFLICT_MESSAGE);
      } else if (error instanceof AssetNotFoundError) {
        setOperationError(UPDATE_NOT_FOUND_MESSAGE);
      } else if (error instanceof DomainError) {
        setValidationError({
          field: findInputField(error),
          message: inputMessage(findInputField(error)),
        });
      } else {
        setOperationError(UPDATE_ERROR_MESSAGE);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const fieldError = validationError?.message ?? "";
  const hasFieldError = (field: string) => validationError?.field === field;
  const describedBy = [
    validationError ? inputErrorId : "",
    operationError ? operationErrorId : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      id={formId}
      className="space-y-4 rounded-card border border-border bg-muted/20 p-4"
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Editar ativo ${asset.symbol}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-symbol`}>Símbolo</Label>
          <Input
            ref={symbolInputRef}
            id={`${formId}-symbol`}
            name="symbol"
            value={values.symbol}
            onChange={(event) => updateValue("symbol", event.target.value)}
            disabled={isSubmitting}
            aria-invalid={hasFieldError("symbol")}
            aria-describedby={describedBy || undefined}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-market`}>Mercado</Label>
          <Input
            id={`${formId}-market`}
            name="market"
            value={values.market}
            onChange={(event) => updateValue("market", event.target.value)}
            disabled={isSubmitting}
            aria-invalid={hasFieldError("market")}
            aria-describedby={describedBy || undefined}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-type`}>Tipo de ativo</Label>
          <select
            id={`${formId}-type`}
            name="assetType"
            value={values.assetType}
            onChange={(event) => updateValue("assetType", event.target.value)}
            disabled={isSubmitting}
            aria-invalid={hasFieldError("assetType")}
            aria-describedby={describedBy || undefined}
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
          <Label htmlFor={`${formId}-currency`}>Moeda</Label>
          <Input
            id={`${formId}-currency`}
            name="currency"
            value={values.currency}
            onChange={(event) => updateValue("currency", event.target.value.toUpperCase())}
            disabled={isSubmitting}
            aria-invalid={hasFieldError("currency")}
            aria-describedby={describedBy || undefined}
            autoComplete="off"
            maxLength={3}
          />
        </div>
      </div>

      {fieldError && (
        <p id={inputErrorId} className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Salvando alteração..." : "Salvar alteração"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
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
      <p className="min-h-5 text-sm text-muted-foreground" role="status" aria-live="polite">
        {isSubmitting ? "Salvando o cadastro com segurança..." : ""}
      </p>
    </form>
  );
}
