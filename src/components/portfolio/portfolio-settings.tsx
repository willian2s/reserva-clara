"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PortfolioNotFoundError } from "@/data/firestore/errors";
import {
  deletePortfolio,
  updatePortfolio,
} from "@/data/firestore/portfolio-repository";
import { DomainError } from "@/domain/errors";
import { parsePortfolioName } from "@/domain/portfolio";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortfolio } from "@/components/portfolio/use-portfolio";

const DETAIL_ERROR_MESSAGE = "Não foi possível acessar esta carteira.";
const INVALID_NAME_MESSAGE = "Informe um nome entre 1 e 100 caracteres.";
const RENAME_ERROR_MESSAGE =
  "Não foi possível renomear a carteira agora. Tente novamente.";
const RENAME_SUCCESS_MESSAGE = "Carteira renomeada com sucesso.";
const RENAME_NOOP_MESSAGE = "O nome da carteira já está atualizado.";
const DELETE_ERROR_MESSAGE =
  "Não foi possível excluir a carteira agora. Tente novamente.";

type PortfolioOperation = {
  portfolioId: string;
  routeVersion: number;
};

export function PortfolioSettings({ portfolioId }: { portfolioId: string }) {
  const router = useRouter();
  const {
    state: currentState,
    retry,
    setLoadedPortfolio,
    markUnavailable,
  } = usePortfolio(portfolioId);
  const [renameName, setRenameName] = useState("");
  const [renameNameError, setRenameNameError] = useState("");
  const [renameOperationError, setRenameOperationError] = useState("");
  const [renameFeedback, setRenameFeedback] = useState("");
  const [renameOperation, setRenameOperation] =
    useState<PortfolioOperation | null>(null);
  const isMountedRef = useRef(false);
  const routeVersionRef = useRef(0);
  const [routeVersion, setRouteVersion] = useState(0);
  const renameDraftRef = useRef<{
    portfolioId: string;
    value: string;
  } | null>(null);
  const renameSubmittingRef = useRef(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
  const [deleteOperationError, setDeleteOperationError] = useState("");
  const [deleteFeedback, setDeleteFeedback] = useState("");
  const [deleteOperation, setDeleteOperation] =
    useState<PortfolioOperation | null>(null);
  const [deleteNavigating, setDeleteNavigating] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const restoreDeleteTriggerFocusRef = useRef(false);
  const deleteSubmittingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const nextRouteVersion = routeVersionRef.current + 1;
    routeVersionRef.current = nextRouteVersion;
    setRouteVersion(nextRouteVersion);
    restoreDeleteTriggerFocusRef.current = false;
    setDeleteConfirmationOpen(false);
    setDeleteConfirmationName("");
    setDeleteOperationError("");
    setDeleteFeedback("");
    setDeleteNavigating(false);
  }, [portfolioId]);

  useEffect(() => {
    if (
      currentState.status !== "ready" ||
      (renameDraftRef.current &&
        renameDraftRef.current.portfolioId === portfolioId)
    ) {
      return;
    }

    renameDraftRef.current = {
      portfolioId,
      value: currentState.portfolio.name,
    };
    setRenameName(currentState.portfolio.name);
    setRenameNameError("");
    setRenameOperationError("");
    setRenameFeedback("");
  }, [currentState, portfolioId]);

  useEffect(() => {
    if (deleteConfirmationOpen) {
      deleteInputRef.current?.focus();
    } else if (restoreDeleteTriggerFocusRef.current) {
      restoreDeleteTriggerFocusRef.current = false;
      deleteTriggerRef.current?.focus();
    }
  }, [deleteConfirmationOpen]);

  const isRenaming =
    currentState.status === "ready" &&
    renameOperation !== null &&
    renameOperation.portfolioId === portfolioId;
  const isDeleteOperationActive =
    currentState.status === "ready" &&
    deleteOperation !== null &&
    deleteOperation.portfolioId === portfolioId;
  const isDeleting = isDeleteOperationActive || deleteNavigating;
  const isDeletePending = deleteOperation !== null || deleteNavigating;
  const deleteNameMatches =
    currentState.status === "ready" &&
    deleteConfirmationName === currentState.portfolio.name;
  const renameDescribedBy = [
    renameNameError ? "portfolio-rename-error" : "",
    renameOperationError ? "portfolio-rename-operation-error" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const deleteDescribedBy = [
    "portfolio-delete-instructions",
    deleteOperationError ? "portfolio-delete-error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleOpenDeleteConfirmation = () => {
    if (
      deleteSubmittingRef.current ||
      isDeletePending ||
      isRenaming ||
      deleteConfirmationOpen ||
      currentState.status !== "ready"
    ) {
      return;
    }

    setDeleteConfirmationName("");
    setDeleteOperationError("");
    setDeleteFeedback("");
    setDeleteConfirmationOpen(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting || deleteSubmittingRef.current) {
      return;
    }

    restoreDeleteTriggerFocusRef.current = true;
    setDeleteConfirmationOpen(false);
    setDeleteConfirmationName("");
    setDeleteOperationError("");
    setDeleteFeedback("");
  };

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      deleteSubmittingRef.current ||
      isDeletePending ||
      !deleteNameMatches ||
      currentState.status !== "ready"
    ) {
      return;
    }

    deleteSubmittingRef.current = true;
    const operationRouteVersion = routeVersionRef.current;
    setDeleteOperation({
      portfolioId,
      routeVersion: operationRouteVersion,
    });
    setDeleteOperationError("");
    setDeleteFeedback("");

    try {
      await deletePortfolio(portfolioId);

      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      setDeleteNavigating(true);
      router.replace("/portfolios");
    } catch {
      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      setDeleteOperationError(DELETE_ERROR_MESSAGE);
      setDeleteFeedback("");
    } finally {
      deleteSubmittingRef.current = false;

      if (isMountedRef.current) {
        setDeleteOperation((operation) =>
          operation?.routeVersion === operationRouteVersion ? null : operation,
        );
      }
    }
  };

  const handleRenameSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      renameSubmittingRef.current ||
      deleteSubmittingRef.current ||
      isDeletePending ||
      deleteConfirmationOpen ||
      currentState.status !== "ready"
    ) {
      return;
    }

    let normalizedName: string;

    try {
      normalizedName = parsePortfolioName(renameName);
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        setRenameNameError(INVALID_NAME_MESSAGE);
      } else {
        setRenameOperationError(RENAME_ERROR_MESSAGE);
      }
      setRenameFeedback("");
      return;
    }

    const currentPortfolio = currentState.portfolio;

    setRenameNameError("");
    setRenameOperationError("");
    setRenameFeedback("");

    if (normalizedName === currentPortfolio.name) {
      renameDraftRef.current = {
        portfolioId,
        value: normalizedName,
      };
      setRenameName(normalizedName);
      setRenameFeedback(RENAME_NOOP_MESSAGE);
      return;
    }

    renameSubmittingRef.current = true;
    const operationRouteVersion = routeVersionRef.current;
    setRenameOperation({ portfolioId, routeVersion });

    try {
      const updatedPortfolio = await updatePortfolio(portfolioId, {
        name: normalizedName,
      });

      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      renameDraftRef.current = {
        portfolioId,
        value: updatedPortfolio.name,
      };
      setRenameName(updatedPortfolio.name);
      setLoadedPortfolio(updatedPortfolio);
      setRenameFeedback(RENAME_SUCCESS_MESSAGE);
    } catch (error: unknown) {
      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      if (error instanceof PortfolioNotFoundError) {
        markUnavailable();
      } else if (error instanceof DomainError) {
        setRenameNameError(INVALID_NAME_MESSAGE);
      } else {
        setRenameOperationError(RENAME_ERROR_MESSAGE);
      }
    } finally {
      renameSubmittingRef.current = false;

      if (isMountedRef.current) {
        setRenameOperation((operation) =>
          operation?.routeVersion === operationRouteVersion ? null : operation,
        );
      }
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">Administração</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Configurações da carteira
        </h1>
        <p className="mt-3 text-muted-foreground">
          Gerencie os dados básicos da carteira sem misturar suas configurações
          com o contexto patrimonial.
        </p>
      </header>

      {currentState.status === "loading" && (
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          Carregando carteira...
        </p>
      )}

      {currentState.status === "unavailable" && (
        <Card role="alert" aria-live="assertive">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold">
              Carteira indisponível
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{DETAIL_ERROR_MESSAGE}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={retry}
              >
                Tentar novamente
              </Button>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href={`/portfolios/${portfolioId}`}
              >
                Voltar para carteira
              </Link>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href="/portfolios"
              >
                Voltar para carteiras
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {currentState.status === "ready" && (
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-primary">Carteira</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {currentState.portfolio.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Moeda base: {currentState.portfolio.baseCurrency} — fixa nesta
              versão
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-semibold">
                Renomear carteira
              </h3>
              <form className="space-y-4" onSubmit={handleRenameSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="portfolio-rename-name">Nome da carteira</Label>
                  <Input
                    id="portfolio-rename-name"
                    name="name"
                    value={renameName}
                    onChange={(event) => {
                      const value = event.target.value;
                      renameDraftRef.current = { portfolioId, value };
                      setRenameName(value);
                      setRenameNameError("");
                      setRenameOperationError("");
                      setRenameFeedback("");
                    }}
                    disabled={isRenaming || isDeletePending || deleteConfirmationOpen}
                    aria-invalid={Boolean(renameNameError)}
                    aria-describedby={renameDescribedBy || undefined}
                    autoComplete="off"
                  />
                  {renameNameError && (
                    <p
                      id="portfolio-rename-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {renameNameError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isRenaming || isDeletePending || deleteConfirmationOpen}
                  aria-busy={isRenaming || isDeletePending}
                >
                  {isRenaming ? "Salvando nome..." : "Salvar novo nome"}
                </Button>
                {renameOperationError && (
                  <p
                    id="portfolio-rename-operation-error"
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="assertive"
                  >
                    {renameOperationError}
                  </p>
                )}
                <p
                  className="min-h-5 text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {isRenaming ? "Salvando novo nome..." : renameFeedback}
                </p>
              </form>
            </div>
            <div className="space-y-4 border-t border-border pt-5">
              <div className="space-y-2">
                <h3 className="font-heading text-lg font-semibold">
                  Excluir carteira
                </h3>
                <p className="text-sm text-muted-foreground">
                  A exclusão remove permanentemente esta carteira. Ela não pode
                  ser desfeita.
                </p>
              </div>
              <Button
                ref={deleteTriggerRef}
                type="button"
                variant="destructive"
                onClick={handleOpenDeleteConfirmation}
                disabled={isRenaming || isDeletePending || deleteConfirmationOpen}
                aria-expanded={deleteConfirmationOpen}
                aria-controls={
                  deleteConfirmationOpen
                    ? "portfolio-delete-confirmation"
                    : undefined
                }
              >
                Excluir carteira
              </Button>

              {deleteConfirmationOpen && (
                <div
                  id="portfolio-delete-confirmation"
                  className="space-y-4 rounded-card border border-destructive/30 bg-destructive/5 p-4"
                  role="group"
                  aria-labelledby="portfolio-delete-confirmation-title"
                >
                  <div className="space-y-2">
                    <h4
                      id="portfolio-delete-confirmation-title"
                      className="font-heading text-base font-semibold"
                    >
                      Confirmar exclusão permanente
                    </h4>
                    <p className="text-sm text-foreground">
                      Você está excluindo a carteira{" "}
                      <strong>{currentState.portfolio.name}</strong>.
                    </p>
                    <p
                      id="portfolio-delete-instructions"
                      className="text-sm text-muted-foreground"
                    >
                      Digite exatamente o nome exibido para confirmar. Esta
                      ação é permanente e não pode ser desfeita.
                    </p>
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={handleDeleteSubmit}
                    noValidate
                  >
                    <div className="space-y-2">
                      <Label htmlFor="portfolio-delete-name">
                        Nome da carteira para confirmação
                      </Label>
                      <Input
                        ref={deleteInputRef}
                        id="portfolio-delete-name"
                        name="delete-name"
                        value={deleteConfirmationName}
                        onChange={(event) => {
                          setDeleteConfirmationName(event.target.value);
                          setDeleteOperationError("");
                          setDeleteFeedback("");
                        }}
                        disabled={isDeleting}
                        aria-invalid={Boolean(deleteOperationError)}
                        aria-describedby={deleteDescribedBy}
                        autoComplete="off"
                      />
                      {deleteOperationError && (
                        <p
                          id="portfolio-delete-error"
                          className="text-sm text-destructive"
                          role="alert"
                          aria-live="assertive"
                        >
                          {deleteOperationError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={!deleteNameMatches || isDeleting}
                        aria-busy={isDeleting}
                      >
                        {isDeleting
                          ? "Deletando permanentemente..."
                          : "Deletar permanentemente"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <p
                      className="min-h-5 text-sm text-muted-foreground"
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {isDeleting
                        ? "Excluindo carteira..."
                        : deleteFeedback}
                    </p>
                  </form>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/portfolios/${currentState.portfolio.id}`}
                aria-disabled={isDeletePending}
                tabIndex={isDeletePending ? -1 : undefined}
                onClick={(event) => {
                  if (isDeletePending) {
                    event.preventDefault();
                  }
                }}
              >
                Voltar para carteira
              </Link>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href="/portfolios"
                aria-disabled={isDeletePending}
                tabIndex={isDeletePending ? -1 : undefined}
                onClick={(event) => {
                  if (isDeletePending) {
                    event.preventDefault();
                  }
                }}
              >
                Voltar para carteiras
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
