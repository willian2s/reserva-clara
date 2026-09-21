"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";

type AuthStatus =
  | "checking"
  | "ready"
  | "signing-in"
  | "cancelled"
  | "error"
  | "authenticated";

type GoogleSignInProps = {
  disabled?: boolean;
  statusMessage?: string;
  statusRole?: "status" | "alert";
};

const STATUS_MESSAGES = {
  checking: "Verificando sua sessão...",
  signingIn: "Abrindo login do Google...",
  authenticated: "Login confirmado. Redirecionando...",
  cancelled: "Login cancelado. Você pode tentar novamente.",
  popupBlocked:
    "O navegador bloqueou o popup. Permita popups para este site e tente novamente.",
  genericError:
    "Não foi possível entrar agora. Verifique sua conexão e tente novamente.",
} as const;

const CANCELLED_AUTH_CODES = new Set([
  "auth/cancelled-popup-request",
  "auth/popup-closed-by-user",
  "auth/redirect-cancelled-by-user",
]);

const POPUP_BLOCKED_AUTH_CODE = "auth/popup-blocked";

function getAuthErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = error.code;
  return typeof code === "string" ? code : undefined;
}

export function GoogleSignIn({
  disabled = false,
  statusMessage,
  statusRole = "status",
}: GoogleSignInProps) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [localStatusMessage, setLocalStatusMessage] = useState<string>(
    STATUS_MESSAGES.checking,
  );
  const isMountedRef = useRef(true);
  const isSigningInRef = useRef(false);
  const navigationStartedRef = useRef(false);
  const statusId = "google-sign-in-status";

  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMountedRef.current || navigationStartedRef.current) {
        return;
      }

      if (user) {
        navigationStartedRef.current = true;
        setAuthStatus("authenticated");
        setLocalStatusMessage(STATUS_MESSAGES.authenticated);
        router.replace("/dashboard");
        return;
      }

      if (isSigningInRef.current) {
        return;
      }

      setAuthStatus("ready");
      setLocalStatusMessage("");
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [router]);

  const handleSignIn = async () => {
    if (
      isSigningInRef.current ||
      navigationStartedRef.current ||
      authStatus === "checking" ||
      authStatus === "authenticated"
    ) {
      return;
    }

    isSigningInRef.current = true;
    setAuthStatus("signing-in");
    setLocalStatusMessage(STATUS_MESSAGES.signingIn);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      if (!isMountedRef.current || navigationStartedRef.current) {
        return;
      }

      const errorCode = getAuthErrorCode(error);

      if (errorCode && CANCELLED_AUTH_CODES.has(errorCode)) {
        setAuthStatus("cancelled");
        setLocalStatusMessage(STATUS_MESSAGES.cancelled);
      } else if (errorCode === POPUP_BLOCKED_AUTH_CODE) {
        setAuthStatus("error");
        setLocalStatusMessage(STATUS_MESSAGES.popupBlocked);
      } else {
        setAuthStatus("error");
        setLocalStatusMessage(STATUS_MESSAGES.genericError);
      }
    } finally {
      isSigningInRef.current = false;
    }
  };

  const displayedStatusMessage = localStatusMessage || statusMessage;
  const displayedStatusRole = localStatusMessage
    ? authStatus === "error"
      ? "alert"
      : "status"
    : statusRole;
  const isBusy =
    authStatus === "checking" ||
    authStatus === "signing-in" ||
    authStatus === "authenticated";

  return (
    <div aria-busy={isBusy}>
      {authStatus !== "authenticated" && (
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full px-4"
          disabled={disabled || isBusy}
          onClick={handleSignIn}
          aria-describedby={displayedStatusMessage ? statusId : undefined}
        >
          Continuar com Google
        </Button>
      )}
      <div
        id={displayedStatusMessage ? statusId : undefined}
        className={`min-h-6 pt-2 text-sm ${
          authStatus === "error"
            ? "text-destructive"
            : "text-muted-foreground"
        }`}
        role={displayedStatusMessage ? displayedStatusRole : undefined}
        aria-live={
          displayedStatusRole === "alert" ? "assertive" : "polite"
        }
        aria-atomic="true"
      >
        {displayedStatusMessage}
      </div>
    </div>
  );
}
