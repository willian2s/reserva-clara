export type DashboardReadStatus = "loading" | "ready" | "refreshing" | "error";

export type DashboardReadState<T> = Readonly<{
  status: DashboardReadStatus;
  data: T | null;
  error: string | null;
  requestId: number;
}>;

export type DashboardReadAction<T> =
  | Readonly<{ type: "request"; requestId: number }>
  | Readonly<{ type: "success"; requestId: number; data: T }>
  | Readonly<{ type: "failure"; requestId: number; error: string }>;

export function createDashboardReadState<T>(): DashboardReadState<T> {
  return { status: "loading", data: null, error: null, requestId: 0 };
}

/** Keeps the last valid read while an update runs or fails. */
export function dashboardReadReducer<T>(
  state: DashboardReadState<T>,
  action: DashboardReadAction<T>,
): DashboardReadState<T> {
  if (action.requestId < state.requestId) return state;

  switch (action.type) {
    case "request":
      return {
        status: state.data === null ? "loading" : "refreshing",
        data: state.data,
        error: null,
        requestId: action.requestId,
      };
    case "success":
      if (action.requestId !== state.requestId) return state;
      return { status: "ready", data: action.data, error: null, requestId: action.requestId };
    case "failure":
      if (action.requestId !== state.requestId) return state;
      return { status: "error", data: state.data, error: action.error, requestId: action.requestId };
  }
}
