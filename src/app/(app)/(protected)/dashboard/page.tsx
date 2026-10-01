import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <Card className="w-full border-border/80 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">Visão geral</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Seu espaço está pronto.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Organize suas carteiras em um só lugar e acompanhe seu patrimônio
            com clareza.
          </p>
          <Link
            className={`${buttonVariants({ size: "lg" })} mt-6`}
            href="/portfolios"
          >
            Ver carteiras
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
