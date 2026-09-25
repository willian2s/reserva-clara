"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getPortfolio } from "@/data/firestore/portfolio-repository";
import type { Portfolio } from "@/domain/portfolio";

export type PortfolioLoadState =
  | { status: "loading"; portfolioId: string }
  | { status: "ready"; portfolioId: string; portfolio: Portfolio }
  | { status: "unavailable"; portfolioId: string };

export function usePortfolio(portfolioId: string) {
  const [portfolioState, setPortfolioState] = useState<PortfolioLoadState>({
    status: "loading",
    portfolioId,
  });
  const isMountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPortfolio = useCallback(
    (requestedPortfolioId: string, requestId: number) => {
      void getPortfolio(requestedPortfolioId)
        .then((portfolio) => {
          if (
            !isMountedRef.current ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          setPortfolioState(
            portfolio
              ? {
                  status: "ready",
                  portfolioId: requestedPortfolioId,
                  portfolio,
                }
              : {
                  status: "unavailable",
                  portfolioId: requestedPortfolioId,
                },
          );
        })
        .catch(() => {
          if (
            !isMountedRef.current ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          // All repository read failures intentionally share one state.
          setPortfolioState({
            status: "unavailable",
            portfolioId: requestedPortfolioId,
          });
        });
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let effectIsActive = true;

    // Defer the first call to avoid duplicate reads from Strict Mode's
    // setup-cleanup-setup cycle while keeping the read after AuthGate mounts.
    queueMicrotask(() => {
      if (effectIsActive) {
        loadPortfolio(portfolioId, requestId);
      }
    });

    return () => {
      effectIsActive = false;
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadPortfolio, portfolioId]);

  const retry = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPortfolioState({ status: "loading", portfolioId });
    loadPortfolio(portfolioId, requestId);
  }, [loadPortfolio, portfolioId]);

  const setLoadedPortfolio = useCallback(
    (portfolio: Portfolio) => {
      if (!isMountedRef.current) {
        return false;
      }

      setPortfolioState({
        status: "ready",
        portfolioId,
        portfolio,
      });
      return true;
    },
    [portfolioId],
  );

  const markUnavailable = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setPortfolioState({ status: "unavailable", portfolioId });
  }, [portfolioId]);

  const currentState =
    portfolioState.portfolioId === portfolioId
      ? portfolioState
      : { status: "loading" as const, portfolioId };

  return {
    state: currentState,
    retry,
    setLoadedPortfolio,
    markUnavailable,
  };
}
