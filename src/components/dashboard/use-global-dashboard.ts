"use client";

import { useCallback } from "react";

import { listAssets } from "@/data/firestore/asset-repository";
import { listPortfolios } from "@/data/firestore/portfolio-repository";
import { listTransactions } from "@/data/firestore/transaction-repository";
import { fetchQuotes } from "@/data/quotes/quote-client";
import { readGlobalDashboard } from "@/data/positions/dashboard-read";
import { useDashboardRead } from "@/components/dashboard/use-dashboard-read";
import type { GlobalDashboardRead } from "@/domain/portfolio-summary";

const GLOBAL_DASHBOARD_ERROR_MESSAGE =
  "Não foi possível carregar o patrimônio das carteiras. Tente novamente.";

export function useGlobalDashboard() {
  const read = useCallback(
    () =>
      readGlobalDashboard({
        listPortfolios,
        listAssets,
        listTransactions,
        fetchQuotes,
      }),
    [],
  );

  return useDashboardRead<GlobalDashboardRead>(
    read,
    GLOBAL_DASHBOARD_ERROR_MESSAGE,
    { scopeKey: "global-dashboard" },
  );
}
