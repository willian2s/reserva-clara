"use client";

import { useCallback } from "react";

import { listAssets } from "@/data/firestore/asset-repository";
import { listTransactions } from "@/data/firestore/transaction-repository";
import { getPortfolio } from "@/data/firestore/portfolio-repository";
import { fetchQuotes } from "@/data/quotes/quote-client";
import { readPortfolioPositions } from "@/data/positions/portfolio-read";
import { useDashboardRead } from "@/components/dashboard/use-dashboard-read";
import type { PortfolioDashboardRead } from "@/domain/portfolio-summary";
import { parseDocumentId } from "@/domain/value-objects";

const PORTFOLIO_DASHBOARD_ERROR_MESSAGE =
  "Não foi possível carregar os dados desta carteira. Tente novamente.";

export function usePortfolioDashboard(portfolioId: string) {
  const read = useCallback(
    () => {
      const parsedPortfolioId = parseDocumentId(portfolioId);

      return readPortfolioPositions(parsedPortfolioId, {
        getPortfolio,
        listTransactions,
        listAssets,
        fetchQuotes,
      });
    },
    [portfolioId],
  );

  return useDashboardRead<PortfolioDashboardRead>(
    read,
    PORTFOLIO_DASHBOARD_ERROR_MESSAGE,
    { scopeKey: portfolioId },
  );
}
