"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createPortfolio } from "@/data/firestore/portfolio-repository";
import { DomainError } from "@/domain/errors";
import { parsePortfolioName } from "@/domain/portfolio";
import { BASE_CURRENCY } from "@/domain/value-objects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INVALID_NAME_MESSAGE = "Informe um nome entre 1 e 100 caracteres.";
const CREATE_ERROR_MESSAGE =
  "Não foi possível confirmar a criação. Verifique suas carteiras antes de tentar criar novamente.";

type PortfolioCreateFormProps = {
  disabled?: boolean;
  onReconcile: () => Promise<boolean>;
  submitLabel?: string;
};

export function PortfolioCreateForm({
  disabled = false,
  onReconcile,
  submitLabel = "Criar carteira",
}: PortfolioCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationRequired, setReconciliationRequired] = useState(false);
  const submittingRef = useRef(false);
  const inputErrorId = "portfolio-name-error";
  const isDisabled = disabled || isSubmitting || isReconciling;
  const isSubmitDisabled = isDisabled || reconciliationRequired;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current || disabled) {
      return;
    }

    let normalizedName: string;

    try {
      normalizedName = parsePortfolioName(name);
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        setNameError(INVALID_NAME_MESSAGE);
      } else {
        setReconciliationRequired(true);
        setOperationError(CREATE_ERROR_MESSAGE);
      }
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setNameError("");
    setOperationError("");

    try {
      const portfolio = await createPortfolio({
        name: normalizedName,
        baseCurrency: BASE_CURRENCY,
      });

      router.push(`/portfolios/${portfolio.id}`);
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        setNameError(INVALID_NAME_MESSAGE);
      } else {
        setReconciliationRequired(true);
        setOperationError(CREATE_ERROR_MESSAGE);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReconcile = async () => {
    if (disabled || isSubmitting || isReconciling) {
      return;
    }

    setIsReconciling(true);

    try {
      const reconciled = await onReconcile();

      if (reconciled) {
        setReconciliationRequired(false);
        setOperationError("");
      }
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="portfolio-name">Nome da carteira</Label>
        <Input
          id="portfolio-name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameError("");
          }}
          disabled={isSubmitDisabled}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? inputErrorId : undefined}
          autoComplete="off"
        />
        {nameError && (
          <p id={inputErrorId} className="text-sm text-destructive" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Moeda base: {BASE_CURRENCY} — fixa nesta versão
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitDisabled} aria-busy={isSubmitting}>
          {isSubmitting ? "Criando carteira..." : submitLabel}
        </Button>
        {operationError && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleReconcile()}
            disabled={disabled || isSubmitting || isReconciling}
            aria-busy={isReconciling}
          >
            {isReconciling ? "Verificando carteiras..." : "Verificar carteiras"}
          </Button>
        )}
      </div>
      {operationError && (
        <p className="text-sm text-destructive" role="alert" aria-live="assertive">
          {operationError}
        </p>
      )}
      <p className="min-h-5 text-sm text-muted-foreground" role="status" aria-live="polite">
        {isSubmitting ? "Salvando sua carteira..." : ""}
      </p>
    </form>
  );
}
