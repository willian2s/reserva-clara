"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createDashboardReadState,
  dashboardReadReducer,
  type DashboardReadState,
} from "@/components/dashboard/dashboard-read-state";

const DEFAULT_ERROR_MESSAGE = "Não foi possível atualizar os dados. Tente novamente.";

export type DashboardReadOptions = Readonly<{
  /** Invalidates an in-flight read when the owning user or scope changes. */
  scopeKey?: string;
}>;

export function useDashboardRead<T>(
  read: () => Promise<T>,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  options: DashboardReadOptions = {},
): {
  state: DashboardReadState<T>;
  refresh: () => boolean;
} {
  const { scopeKey } = options;
  const [state, setState] = useState<DashboardReadState<T>>(() => createDashboardReadState<T>());
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const readRef = useRef(read);

  useEffect(() => {
    readRef.current = read;
  }, [read]);

  const refresh = useCallback(() => {
    if (!mountedRef.current) return false;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => dashboardReadReducer(current, { type: "request", requestId }));

    void Promise.resolve().then(() => readRef.current()).then(
      (data) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setState((current) => dashboardReadReducer(current, { type: "success", requestId, data }));
      },
      () => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setState((current) => dashboardReadReducer(current, {
          type: "failure",
          requestId,
          error: errorMessage,
        }));
      },
    );
    return true;
  }, [errorMessage]);

  useEffect(() => {
    const effectGeneration = requestIdRef.current + 1;
    requestIdRef.current = effectGeneration;
    mountedRef.current = true;
    let effectIsActive = true;
    queueMicrotask(() => {
      if (!effectIsActive || !mountedRef.current || effectGeneration !== requestIdRef.current) return;
      setState(createDashboardReadState<T>());
      void refresh();
    });

    return () => {
      effectIsActive = false;
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [refresh, scopeKey]);

  return { state, refresh };
}
