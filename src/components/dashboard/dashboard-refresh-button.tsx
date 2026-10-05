"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DASHBOARD_REFRESH_EVENT,
  DASHBOARD_REFRESH_STATUS_EVENT,
} from "@/components/dashboard/use-dashboard-read";

export function DashboardRefreshButton() {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleRefreshStatus = (event: Event) => {
      const { isRefreshing: nextIsRefreshing } =
        (event as CustomEvent<{ isRefreshing: boolean }>).detail;
      setIsRefreshing(nextIsRefreshing);
    };

    window.addEventListener(DASHBOARD_REFRESH_STATUS_EVENT, handleRefreshStatus);
    return () => {
      window.removeEventListener(DASHBOARD_REFRESH_STATUS_EVENT, handleRefreshStatus);
    };
  }, []);

  if (pathname !== "/dashboard" && !/^\/portfolios\/[^/]+$/.test(pathname)) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.dispatchEvent(new Event(DASHBOARD_REFRESH_EVENT))}
      disabled={isRefreshing}
      aria-busy={isRefreshing}
    >
      {isRefreshing ? "Atualizando..." : "Atualizar dados"}
    </Button>
  );
}
