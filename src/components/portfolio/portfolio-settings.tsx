"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { PortfolioNotFoundError } from "@/data/firestore/errors";
import {
  archivePortfolio,
  restorePortfolio,
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
const ARCHIVE_ERROR_MESSAGE =
  "Não foi possível arquivar a carteira agora. Tente novamente.";
const ARCHIVE_SUCCESS_MESSAGE = "Carteira arquivada com sucesso.";
const RESTORE_ERROR_MESSAGE =
  "Não foi possível restaurar a carteira agora. Tente novamente.";
const RESTORE_SUCCESS_MESSAGE = "Carteira restaurada com sucesso.";

type PortfolioOperation = {
  portfolioId: string;
  routeVersion: number;
};

export function PortfolioSettings({ portfolioId }: { portfolioId: string }) {
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
  const renameDraftRef = useRef<{
    portfolioId: string;
    value: string;
  } | null>(null);
  const renameSubmittingRef = useRef(false);
  const [archiveConfirmationOpen, setArchiveConfirmationOpen] =
    useState(false);
  const [archiveConfirmationName, setArchiveConfirmationName] = useState("");
  const [archiveOperationError, setArchiveOperationError] = useState("");
  const [archiveFeedback, setArchiveFeedback] = useState("");
  const [archiveOperation, setArchiveOperation] =
    useState<PortfolioOperation | null>(null);
  const [restoreOperationError, setRestoreOperationError] = useState("");
  const [restoreFeedback, setRestoreFeedback] = useState("");
  const [restoreOperation, setRestoreOperation] =
    useState<PortfolioOperation | null>(null);
  const archiveTriggerRef = useRef<HTMLButtonElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);
  const restoreArchiveTriggerFocusRef = useRef(false);
  const archiveSubmittingRef = useRef(false);
  const restoreSubmittingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const nextRouteVersion = routeVersionRef.current + 1;
    routeVersionRef.current = nextRouteVersion;
    restoreArchiveTriggerFocusRef.current = false;

    queueMicrotask(() => {
      if (
        !isMountedRef.current ||
        routeVersionRef.current !== nextRouteVersion
      ) {
        return;
      }

      setRenameOperation(null);
      setArchiveConfirmationOpen(false);
      setArchiveConfirmationName("");
      setArchiveOperationError("");
      setArchiveFeedback("");
      setArchiveOperation(null);
      setRestoreOperationError("");
      setRestoreFeedback("");
      setRestoreOperation(null);
    });
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
    if (archiveConfirmationOpen) {
      archiveInputRef.current?.focus();
    } else if (restoreArchiveTriggerFocusRef.current) {
      restoreArchiveTriggerFocusRef.current = false;
      archiveTriggerRef.current?.focus();
    }
  }, [archiveConfirmationOpen]);

  const isRenaming =
    currentState.status === "ready" &&
    renameOperation !== null &&
    renameOperation.portfolioId === portfolioId;
  const isArchiveOperationActive =
    currentState.status === "ready" &&
    archiveOperation !== null &&
    archiveOperation.portfolioId === portfolioId;
  const isRestoreOperationActive =
    currentState.status === "ready" &&
    restoreOperation !== null &&
    restoreOperation.portfolioId === portfolioId;
  const isArchiving = isArchiveOperationActive;
  const isRestoring = isRestoreOperationActive;
  const isLifecyclePending =
    (archiveOperation !== null && archiveOperation.portfolioId === portfolioId) ||
    (restoreOperation !== null && restoreOperation.portfolioId === portfolioId);
  const isArchived =
    currentState.status === "ready" && currentState.portfolio.archivedAt !== null;
  const archiveNameMatches =
    currentState.status === "ready" &&
    archiveConfirmationName === currentState.portfolio.name;
  const renameDescribedBy = [
    renameNameError ? "portfolio-rename-error" : "",
    renameOperationError ? "portfolio-rename-operation-error" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const archiveDescribedBy = [
    "portfolio-archive-instructions",
    archiveOperationError ? "portfolio-archive-error" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const isPageBusy =
    isLifecyclePending || archiveConfirmationOpen || isRenaming;

  const handleOpenArchiveConfirmation = () => {
    if (
      archiveSubmittingRef.current ||
      isLifecyclePending ||
      isRenaming ||
      archiveConfirmationOpen ||
      currentState.status !== "ready" ||
      currentState.portfolio.archivedAt !== null
    ) {
      return;
    }

    setArchiveConfirmationName("");
    setArchiveOperationError("");
    setArchiveFeedback("");
    setArchiveConfirmationOpen(true);
  };

  const handleCancelArchive = () => {
    if (isArchiving || archiveSubmittingRef.current) {
      return;
    }

    restoreArchiveTriggerFocusRef.current = true;
    setArchiveConfirmationOpen(false);
    setArchiveConfirmationName("");
    setArchiveOperationError("");
    setArchiveFeedback("");
  };

  const handleArchiveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      archiveSubmittingRef.current ||
      isLifecyclePending ||
      !archiveNameMatches ||
      currentState.status !== "ready" ||
      currentState.portfolio.archivedAt !== null
    ) {
      return;
    }

    archiveSubmittingRef.current = true;
    const operationRouteVersion = routeVersionRef.current;
    setArchiveOperation({
      portfolioId,
      routeVersion: operationRouteVersion,
    });
    setArchiveOperationError("");
    setArchiveFeedback("");

    try {
      const archivedPortfolio = await archivePortfolio(portfolioId);

      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      setLoadedPortfolio(archivedPortfolio);
      setArchiveConfirmationOpen(false);
      setArchiveConfirmationName("");
      setArchiveFeedback(ARCHIVE_SUCCESS_MESSAGE);
    } catch {
      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      setArchiveOperationError(ARCHIVE_ERROR_MESSAGE);
      setArchiveFeedback("");
    } finally {
      archiveSubmittingRef.current = false;

      if (isMountedRef.current) {
        setArchiveOperation((operation) =>
          operation?.routeVersion === operationRouteVersion ? null : operation,
        );
      }
    }
  };

  const handleRestore = async () => {
    if (
      restoreSubmittingRef.current ||
      isLifecyclePending ||
      isRenaming ||
      currentState.status !== "ready" ||
      currentState.portfolio.archivedAt === null
    ) {
      return;
    }

    restoreSubmittingRef.current = true;
    const operationRouteVersion = routeVersionRef.current;
    setRestoreOperation({
      portfolioId,
      routeVersion: operationRouteVersion,
    });
    setRestoreOperationError("");
    setRestoreFeedback("");

    try {
      const restoredPortfolio = await restorePortfolio(portfolioId);

      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      setLoadedPortfolio(restoredPortfolio);
      setRestoreFeedback(RESTORE_SUCCESS_MESSAGE);
      setArchiveFeedback("");
    } catch {
      if (
        !isMountedRef.current ||
        routeVersionRef.current !== operationRouteVersion
      ) {
        return;
      }

      setRestoreOperationError(RESTORE_ERROR_MESSAGE);
      setRestoreFeedback("");
    } finally {
      restoreSubmittingRef.current = false;

      if (isMountedRef.current) {
        setRestoreOperation((operation) =>
          operation?.routeVersion === operationRouteVersion ? null : operation,
        );
      }
    }
  };

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      renameSubmittingRef.current ||
      archiveSubmittingRef.current ||
      isLifecyclePending ||
      archiveConfirmationOpen ||
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
    setRenameOperation({
      portfolioId,
      routeVersion: operationRouteVersion,
    });

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
              <Button type="button" variant="outline" onClick={retry}>
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
            <p className="text-sm font-medium text-primary">
              {isArchived ? "Carteira arquivada" : "Carteira ativa"}
            </p>
            <h2 className="font-heading break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
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
                    disabled={isPageBusy}
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
                <Button type="submit" disabled={isPageBusy} aria-busy={isRenaming}>
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

            {!isArchived ? (
              <div className="space-y-4 border-t border-border pt-5">
                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold">
                    Arquivar carteira
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    O archive preserva esta carteira e seus dados filhos para
                    consulta histórica. A carteira poderá ser restaurada depois.
                  </p>
                </div>
                <Button
                  ref={archiveTriggerRef}
                  type="button"
                  variant="outline"
                  onClick={handleOpenArchiveConfirmation}
                  disabled={isPageBusy}
                  aria-expanded={archiveConfirmationOpen}
                  aria-controls={
                    archiveConfirmationOpen
                      ? "portfolio-archive-confirmation"
                      : undefined
                  }
                >
                  Arquivar carteira
                </Button>

                {archiveConfirmationOpen && (
                  <div
                    id="portfolio-archive-confirmation"
                    className="space-y-4 rounded-card border border-border bg-muted/40 p-4"
                    role="group"
                    aria-labelledby="portfolio-archive-confirmation-title"
                  >
                    <div className="space-y-2">
                      <h4
                        id="portfolio-archive-confirmation-title"
                        className="font-heading text-base font-semibold"
                      >
                        Confirmar arquivamento
                      </h4>
                      <p className="text-sm text-foreground">
                        Você está arquivando a carteira{" "}
                        <strong className="break-words [overflow-wrap:anywhere]">
                          {currentState.portfolio.name}
                        </strong>
                        .
                      </p>
                      <p
                        id="portfolio-archive-instructions"
                        className="text-sm text-muted-foreground"
                      >
                        Digite exatamente o nome exibido para confirmar. O
                        arquivamento não apaga filhos nem dados históricos.
                      </p>
                    </div>

                    <form
                      className="space-y-4"
                      onSubmit={handleArchiveSubmit}
                      noValidate
                    >
                      <div className="space-y-2">
                        <Label htmlFor="portfolio-archive-name">
                          Nome da carteira para confirmação
                        </Label>
                        <Input
                          ref={archiveInputRef}
                          id="portfolio-archive-name"
                          name="archive-name"
                          value={archiveConfirmationName}
                          onChange={(event) => {
                            setArchiveConfirmationName(event.target.value);
                            setArchiveOperationError("");
                            setArchiveFeedback("");
                          }}
                          disabled={isArchiving}
                          aria-invalid={Boolean(archiveOperationError)}
                          aria-describedby={archiveDescribedBy}
                          autoComplete="off"
                        />
                        {archiveOperationError && (
                          <p
                            id="portfolio-archive-error"
                            className="text-sm text-destructive"
                            role="alert"
                            aria-live="assertive"
                          >
                            {archiveOperationError}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="submit"
                          disabled={!archiveNameMatches || isArchiving}
                          aria-busy={isArchiving}
                        >
                          {isArchiving ? "Arquivando carteira..." : "Confirmar arquivamento"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelArchive}
                          disabled={isArchiving}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
                <p
                  className="min-h-5 text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {isArchiving
                    ? "Arquivando carteira..."
                    : archiveFeedback || restoreFeedback}
                </p>
              </div>
            ) : (
              <div className="space-y-4 border-t border-border pt-5">
                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold">
                    Restaurar carteira
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Restaure a carteira para permitir novas operações quando o
                    ledger estiver disponível. Dados históricos permanecem
                    intactos.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRestore()}
                  disabled={isPageBusy}
                  aria-busy={isRestoring}
                >
                  {isRestoring ? "Restaurando carteira..." : "Restaurar carteira"}
                </Button>
                {restoreOperationError && (
                  <p
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="assertive"
                  >
                    {restoreOperationError}
                  </p>
                )}
                <p
                  className="min-h-5 text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {isRestoring ? "Restaurando carteira..." : restoreFeedback || archiveFeedback}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/portfolios/${currentState.portfolio.id}`}
                aria-disabled={isPageBusy}
                tabIndex={isPageBusy ? -1 : undefined}
                onClick={(event) => {
                  if (isPageBusy) {
                    event.preventDefault();
                  }
                }}
              >
                Voltar para carteira
              </Link>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href="/portfolios"
                aria-disabled={isPageBusy}
                tabIndex={isPageBusy ? -1 : undefined}
                onClick={(event) => {
                  if (isPageBusy) {
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
