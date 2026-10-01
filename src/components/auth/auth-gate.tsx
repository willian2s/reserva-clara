"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase/client";

type AuthState = "checking" | "authenticated" | "redirecting";

const STATUS_MESSAGES = {
  checking: "Verificando sua sessão...",
  redirecting: "Sessão não encontrada. Levando você para a tela de entrada...",
} as const;

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [authenticatedUserKey, setAuthenticatedUserKey] = useState<
    string | null
  >(null);
  const isMountedRef = useRef(true);
  const redirectStartedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMountedRef.current) {
        return;
      }

      if (user) {
        setAuthenticatedUserKey(user.uid);
        setAuthState("authenticated");
        return;
      }

      if (redirectStartedRef.current) {
        return;
      }

      redirectStartedRef.current = true;
      setAuthenticatedUserKey(null);
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
      <Fragment key={authenticatedUserKey ?? "authenticated"}>
        {children}
      </Fragment>
    );
  }

  return (
    <main
      className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:py-16"
      aria-busy="true"
    >
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {STATUS_MESSAGES[authState]}
      </p>
    </main>
  );
}
