"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase/client";

type DashboardAuthState = "checking" | "authenticated" | "redirecting";

const STATUS_MESSAGES = {
  checking: "Verificando sua sessão...",
  redirecting: "Sessão não encontrada. Redirecionando para o login...",
} as const;

export function DashboardGate() {
  const router = useRouter();
  const [authState, setAuthState] =
    useState<DashboardAuthState>("checking");
  const isMountedRef = useRef(true);
  const redirectStartedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMountedRef.current) {
        return;
      }

      if (user) {
        setAuthState("authenticated");
        return;
      }

      if (redirectStartedRef.current) {
        return;
      }

      redirectStartedRef.current = true;
      setAuthState("redirecting");
      router.replace("/login");
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [router]);

  if (authState === "authenticated") {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        <section className="w-full max-w-md text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Autenticação confirmada.
          </p>
        </section>
      </main>
    );
  }

  const statusMessage = STATUS_MESSAGES[authState];

  return (
    <main
      className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12"
      aria-busy="true"
    >
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </main>
  );
}
