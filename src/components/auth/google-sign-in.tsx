"use client";

import { Button } from "@/components/ui/button";

type GoogleSignInProps = {
  disabled?: boolean;
  statusMessage?: string;
  statusRole?: "status" | "alert";
};

export function GoogleSignIn({
  disabled = false,
  statusMessage,
  statusRole = "status",
}: GoogleSignInProps) {
  const statusId = "google-sign-in-status";

  return (
    <div>
      <Button
        type="button"
        size="lg"
        className="min-h-11 w-full px-4"
        disabled={disabled}
        aria-describedby={statusMessage ? statusId : undefined}
      >
        Continuar com Google
      </Button>
      <div
        id={statusMessage ? statusId : undefined}
        className="min-h-6 pt-2 text-sm text-muted-foreground"
        role={statusMessage ? statusRole : undefined}
        aria-live={statusRole === "alert" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {statusMessage}
      </div>
    </div>
  );
}
