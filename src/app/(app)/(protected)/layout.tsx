import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AuthGate } from "@/components/auth/auth-gate";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-full flex-1 flex-col">
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-background focus:px-3 focus:py-2 focus:text-foreground focus:ring-3 focus:ring-ring/50"
          href="#main-content"
        >
          Pular para conteúdo
        </a>
        <header className="border-b border-border/80 bg-background">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
            <Image
              src="/brand/logo-horizontal.png"
              alt="Reserva Clara"
              width={979}
              height={285}
              priority
              className="h-auto w-36 sm:w-44"
            />
            <nav aria-label="Navegação principal">
              <ul className="flex items-center gap-2 text-sm font-medium">
                <li>
                  <Link
                    className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-foreground underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href="/dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-foreground underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href="/portfolios"
                  >
                    Carteiras
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
