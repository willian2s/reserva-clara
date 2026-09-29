"use client";

import { useRef, useState, type FormEvent } from "react";

import {
  AssetNotFoundError,
  PortfolioArchivedError,
} from "@/data/firestore/errors";
import { createTransaction } from "@/data/firestore/transaction-repository";
import {
  InsufficientQuantityError,
  TransactionConflictError,
  DomainError,
} from "@/domain/errors";
import {
  parseTransactionInput,
  type Transaction,
  type TransactionInput,
} from "@/domain/transaction";
import type { Asset } from "@/domain/asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TransactionFormValues = {
  assetId: string;
  kind: "buy" | "sell";
  quantity: string;
  unitPrice: string;
  currency: string;
  feeAmount: string;
  feeCurrency: string;
  effectiveDate: string;
};

export type PendingTransaction = Readonly<{
  transactionId: string;
  input: TransactionInput;
}>;

export type TransactionReconciliationResult =
  | { status: "found"; transaction: Transaction }
  | { status: "not-found" }
  | { status: "error" };

type TransactionFormProps = {
  portfolioId: string;
  assets: readonly Asset[];
  disabled?: boolean;
  onCreated: (transaction: Transaction) => void;
  onPortfolioArchived: () => void;
  onReconcile: (
    operation: PendingTransaction,
  ) => Promise<TransactionReconciliationResult>;
};

const FORM_ERROR_MESSAGE =
  "Não foi possível confirmar o lançamento. Verifique o histórico antes de tentar novamente.";
const RECONCILIATION_ERROR_MESSAGE =
  "Não foi possível reler o histórico. Tente verificar novamente.";
const RECONCILIATION_NOT_FOUND_MESSAGE =
  "O histórico foi relido, mas o lançamento não foi confirmado. Você pode tentar salvar novamente com os mesmos dados.";

function createOperationId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `transaction-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeBrazilianDecimal(value: string) {
  const normalized = value.trim().replace(/\s/g, "");

  if (!normalized.includes(",")) {
    return /^-?[0-9]{1,3}(?:\.[0-9]{3})+$/.test(normalized)
      ? normalized.replace(/\./g, "")
      : normalized;
  }

  if (
    !/^-?(?:0|[1-9][0-9]*),[0-9]+$/.test(normalized) &&
    !/^-?[0-9]{1,3}(?:\.[0-9]{3})+,[0-9]+$/.test(normalized)
  ) {
    return normalized;
  }

  return normalized.replace(/\./g, "").replace(",", ".");
}

function maskBrazilianDecimal(value: string) {
  const sanitized = value.replace(/[^0-9,]/g, "");
  const commaIndex = sanitized.indexOf(",");
  const hasFraction = commaIndex >= 0;
  const rawInteger = hasFraction
    ? sanitized.slice(0, commaIndex)
    : sanitized;
  const rawFraction = hasFraction
    ? sanitized.slice(commaIndex + 1).slice(0, 17)
    : "";
  const integer = rawInteger.replace(/^0+(?=\d)/, "").slice(0, 30);
  const groupedInteger = (integer || (hasFraction ? "0" : "")).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ".",
  );

  return `${groupedInteger}${hasFraction ? `,${rawFraction}` : ""}`;
}

function maskBrazilianDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskCurrency(value: string) {
  return value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 3);
}

function normalizeBrazilianDate(value: string) {
  const normalized = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);

  return match ? `${match[3]}-${match[2]}-${match[1]}` : normalized;
}

function findInputField(error: DomainError) {
  if (!("field" in error) || typeof error.field !== "string") {
    return "transaction";
  }

  if (error.field === "unitPrice" || error.field === "decimal") {
    return "unitPrice";
  }

  if (error.field === "effectiveDate") {
    return "effectiveDate";
  }

  if (error.field === "fee") {
    return "feeAmount";
  }

  return error.field;
}

function inputMessage(field: string) {
  switch (field) {
    case "assetId":
      return "Selecione um ativo válido.";
    case "kind":
      return "Selecione compra ou venda.";
    case "quantity":
      return "Informe uma quantidade positiva em formato decimal, sem expoente.";
    case "unitPrice":
      return "Informe um preço positivo em formato decimal, sem expoente.";
    case "currency":
      return "Informe uma moeda ISO 4217 em letras maiúsculas, como BRL ou USD.";
    case "effectiveDate":
      return "Informe uma data civil real.";
    case "feeAmount":
      return "Informe uma taxa fixa não negativa ou deixe o campo vazio.";
    default:
      return "Revise os dados informados.";
  }
}

function sameInput(left: TransactionInput, right: TransactionInput) {
  return (
    left.kind === right.kind &&
    left.assetId === right.assetId &&
    left.quantity === right.quantity &&
    left.unitPrice.currency === right.unitPrice.currency &&
    left.unitPrice.decimal === right.unitPrice.decimal &&
    (left.fee?.currency ?? null) === (right.fee?.currency ?? null) &&
    (left.fee?.decimal ?? null) === (right.fee?.decimal ?? null) &&
    left.effectiveDate === right.effectiveDate
  );
}

export function TransactionForm({
  portfolioId,
  assets,
  disabled = false,
  onCreated,
  onPortfolioArchived,
  onReconcile,
}: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>({
    assetId: "",
    kind: "buy",
    quantity: "",
    unitPrice: "",
    currency: "BRL",
    feeAmount: "",
    feeCurrency: "BRL",
    effectiveDate: "",
  });
  const [validationError, setValidationError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [operationError, setOperationError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingOperation, setPendingOperation] =
    useState<PendingTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationRequired, setReconciliationRequired] = useState(false);
  const submittingRef = useRef(false);

  const isDisabled = disabled || isSubmitting || isReconciling;
  const fieldsDisabled = isDisabled || pendingOperation !== null;
  const inputErrorId = "transaction-form-error";
  const operationErrorId = "transaction-operation-error";
  const fieldError = validationError?.message ?? "";
  const hasFieldError = (field: string) => validationError?.field === field;

  const updateValue = <T extends keyof TransactionFormValues>(
    field: T,
    value: TransactionFormValues[T],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    setOperationError("");
    setFeedback("");
  };

  const buildInput = (): TransactionInput =>
    parseTransactionInput({
      assetId: values.assetId,
      kind: values.kind,
      quantity: normalizeBrazilianDecimal(values.quantity),
      unitPrice: {
        currency: values.currency.toUpperCase(),
        decimal: normalizeBrazilianDecimal(values.unitPrice),
      },
      fee: values.feeAmount.trim()
        ? {
            currency: values.feeCurrency.toUpperCase(),
            decimal: normalizeBrazilianDecimal(values.feeAmount),
          }
        : null,
      effectiveDate: normalizeBrazilianDate(values.effectiveDate),
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current || disabled || reconciliationRequired) {
      return;
    }

    let input: TransactionInput;

    try {
      input = buildInput();
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        const field = findInputField(error);
        setValidationError({ field, message: inputMessage(field) });
      } else {
        setValidationError({
          field: "transaction",
          message: "Revise os dados informados antes de continuar.",
        });
      }
      return;
    }

    const operation =
      pendingOperation ?? { transactionId: createOperationId(), input };

    if (pendingOperation && !sameInput(pendingOperation.input, input)) {
      setOperationError(FORM_ERROR_MESSAGE);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setValidationError(null);
    setOperationError("");
    setFeedback("");
    setPendingOperation(operation);

    try {
      const transaction = await createTransaction(
        portfolioId,
        operation.input,
        operation.transactionId,
      );

      onCreated(transaction);
      setPendingOperation(null);
      setReconciliationRequired(false);
      setFeedback("Lançamento confirmado no histórico.");
      setValues((current) => ({
        ...current,
        quantity: "",
        unitPrice: "",
        feeAmount: "",
        effectiveDate: "",
      }));
    } catch (error: unknown) {
      if (error instanceof InsufficientQuantityError) {
        setPendingOperation(null);
        setValidationError({
          field: "quantity",
          message: "Esta venda excede a quantidade disponível no histórico.",
        });
      } else if (error instanceof PortfolioArchivedError) {
        setPendingOperation(null);
        setOperationError(
          "Esta carteira foi arquivada e não aceita novos lançamentos.",
        );
        onPortfolioArchived();
      } else if (error instanceof AssetNotFoundError) {
        setPendingOperation(null);
        setOperationError(
          "O ativo selecionado não está disponível. Atualize a página e selecione outro.",
        );
      } else if (error instanceof TransactionConflictError) {
        setReconciliationRequired(true);
        setOperationError(FORM_ERROR_MESSAGE);
      } else {
        setReconciliationRequired(true);
        setOperationError(FORM_ERROR_MESSAGE);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReconcile = async () => {
    if (!pendingOperation || !reconciliationRequired || isDisabled) {
      return;
    }

    setIsReconciling(true);

    try {
      const reconciliation = await onReconcile(pendingOperation);

      if (
        reconciliation.status === "found" &&
        sameInput(pendingOperation.input, {
          kind: reconciliation.transaction.kind,
          assetId: reconciliation.transaction.assetId,
          quantity: reconciliation.transaction.quantity,
          unitPrice: reconciliation.transaction.unitPrice,
          fee: reconciliation.transaction.fee,
          effectiveDate: reconciliation.transaction.effectiveDate,
        })
      ) {
        onCreated(reconciliation.transaction);
        setPendingOperation(null);
        setReconciliationRequired(false);
        setOperationError("");
        setFeedback("Lançamento confirmado após reler o histórico.");
      } else if (reconciliation.status === "not-found") {
        setReconciliationRequired(false);
        setOperationError(RECONCILIATION_NOT_FOUND_MESSAGE);
      } else {
        setOperationError(RECONCILIATION_ERROR_MESSAGE);
      }
    } finally {
      setIsReconciling(false);
    }
  };

  const formDescribedBy = [
    fieldError ? inputErrorId : "",
    operationError ? operationErrorId : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="transaction-asset">Ativo</Label>
          <select
            id="transaction-asset"
            name="assetId"
            value={values.assetId}
            onChange={(event) => updateValue("assetId", event.target.value)}
            disabled={fieldsDisabled}
            required
            aria-invalid={hasFieldError("assetId")}
            aria-describedby={formDescribedBy || undefined}
            className="h-10 w-full rounded-control border border-input bg-transparent px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 md:text-sm"
          >
            <option value="">Selecione um ativo</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.symbol} · {asset.market} · {asset.currency}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-kind">Operação</Label>
          <select
            id="transaction-kind"
            name="kind"
            value={values.kind}
            onChange={(event) =>
              updateValue("kind", event.target.value as TransactionFormValues["kind"])
            }
            disabled={fieldsDisabled}
            required
            aria-invalid={hasFieldError("kind")}
            aria-describedby={formDescribedBy || undefined}
            className="h-10 w-full rounded-control border border-input bg-transparent px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 md:text-sm"
          >
            <option value="buy">Compra</option>
            <option value="sell">Venda</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-quantity">Quantidade</Label>
          <Input
            id="transaction-quantity"
            name="quantity"
            type="text"
            inputMode="decimal"
            value={values.quantity}
            onChange={(event) =>
              updateValue("quantity", maskBrazilianDecimal(event.target.value))
            }
            disabled={fieldsDisabled}
            required
            aria-invalid={hasFieldError("quantity")}
            aria-describedby={formDescribedBy || undefined}
            autoComplete="off"
            placeholder="10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-price">Preço unitário</Label>
          <Input
            id="transaction-price"
            name="unitPrice"
            type="text"
            inputMode="decimal"
            value={values.unitPrice}
            onChange={(event) =>
              updateValue("unitPrice", maskBrazilianDecimal(event.target.value))
            }
            disabled={fieldsDisabled}
            required
            aria-invalid={hasFieldError("unitPrice")}
            aria-describedby={formDescribedBy || undefined}
            autoComplete="off"
            placeholder="100,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-currency">Moeda</Label>
          <Input
            id="transaction-currency"
            name="currency"
            value={values.currency}
            onChange={(event) =>
              updateValue("currency", maskCurrency(event.target.value))
            }
            disabled={fieldsDisabled}
            required
            aria-invalid={hasFieldError("currency")}
            aria-describedby={formDescribedBy || undefined}
            autoComplete="off"
            maxLength={3}
            placeholder="BRL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-date">Data da operação</Label>
          <Input
            id="transaction-date"
            name="effectiveDate"
            type="text"
            inputMode="numeric"
            value={values.effectiveDate}
            onChange={(event) =>
              updateValue("effectiveDate", maskBrazilianDate(event.target.value))
            }
            disabled={fieldsDisabled}
            required
            aria-invalid={hasFieldError("effectiveDate")}
            aria-describedby={formDescribedBy || undefined}
            placeholder="dd/mm/aaaa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-fee">Taxa (opcional)</Label>
          <Input
            id="transaction-fee"
            name="fee"
            type="text"
            inputMode="decimal"
            value={values.feeAmount}
            onChange={(event) =>
              updateValue("feeAmount", maskBrazilianDecimal(event.target.value))
            }
            disabled={fieldsDisabled}
            aria-invalid={hasFieldError("feeAmount")}
            aria-describedby={formDescribedBy || undefined}
            autoComplete="off"
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-fee-currency">Moeda da taxa</Label>
          <Input
            id="transaction-fee-currency"
            name="feeCurrency"
            value={values.feeCurrency}
            onChange={(event) =>
              updateValue("feeCurrency", maskCurrency(event.target.value))
            }
            disabled={fieldsDisabled}
            aria-invalid={hasFieldError("feeAmount")}
            aria-describedby={formDescribedBy || undefined}
            autoComplete="off"
            maxLength={3}
            placeholder="BRL"
          />
        </div>
      </div>

      {fieldError && (
        <p id={inputErrorId} className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isDisabled || reconciliationRequired || assets.length === 0}
          aria-busy={isSubmitting}
        >
          {isSubmitting
            ? "Salvando lançamento..."
            : pendingOperation
              ? "Tentar salvar novamente"
              : "Registrar lançamento"}
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
            {isReconciling ? "Relendo histórico..." : "Verificar histórico"}
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
      <p className="text-sm text-muted-foreground">
        A taxa é um valor fixo opcional. O histórico registra apenas o evento
        informado. Não há cálculo de saldo,
        posição, total ou rentabilidade nesta fase. Eventos são append-only:
        não há edição ou exclusão.
      </p>
    </form>
  );
}
