"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
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
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Reserva Clara"
            width={979}
            height={285}
            priority
            className="h-auto w-36 sm:w-44"
          />
          <p className="text-sm text-muted-foreground">Área protegida</p>
        </header>
        <section className="mx-auto flex w-full max-w-5xl flex-1 items-center py-12">
          <Card className="w-full border-border/80 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm font-medium text-primary">Bem-vindo</p>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Seu espaço está pronto.
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">
                A autenticação foi confirmada. Em breve, você poderá acompanhar
                seu patrimônio com clareza por aqui.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  const statusMessage = STATUS_MESSAGES[authState];

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:py-16"
      aria-busy="true"
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={512}
        height={512}
        priority
        className="mb-6 h-12 w-12"
      />
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </main>
  );
}
