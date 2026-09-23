import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4 sm:gap-6 lg:px-10">
          <Link
            href="/"
            aria-label="Reserva Clara — início"
            className="inline-flex min-h-11 items-center"
          >
            <Image
              src="/brand/logo-horizontal.png"
              alt="Reserva Clara"
              width={979}
              height={285}
              priority
              sizes="196px"
              className="hidden h-auto w-[196px] sm:block"
            />
            <Image
              src="/brand/logo-compact.png"
              alt="Reserva Clara"
              width={609}
              height={172}
              sizes="140px"
              className="h-auto w-[140px] sm:hidden"
            />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-2 sm:gap-4"
          >
            <a
              href="#como-ajuda"
              className="hidden min-h-11 items-center rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Como ajuda
            </a>
            <Link
              href="/login"
              aria-label="Entrar"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section
          aria-labelledby="hero-title"
          className="overflow-hidden bg-primary text-primary-foreground"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:px-10 lg:py-28">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-6 text-sm font-semibold tracking-[0.16em] text-primary-foreground/65 uppercase">
                Organização para o longo prazo
              </p>
              <h1
                id="hero-title"
                className="max-w-2xl break-words text-4xl leading-[1.02] tracking-[-0.04em] [overflow-wrap:anywhere] sm:text-6xl lg:text-7xl"
              >
                Seu patrimônio, com clareza.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-primary-foreground/75 sm:text-xl">
                Reserva Clara ajuda você a organizar, acompanhar e construir seu
                patrimônio com uma visão ampla, tranquila e feita para decisões
                conscientes ao longo do tempo.
              </p>
              <div className="mt-9 flex flex-row flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  aria-label="Entrar"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "lg",
                    className:
                      "focus-visible:border-primary-foreground focus-visible:outline-primary-foreground focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-primary",
                  })}
                >
                  Entrar
                </Link>
                <a
                  href="#proposta"
                  className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm font-medium text-primary-foreground underline-offset-4 transition-colors hover:bg-primary-foreground/10 hover:underline focus-visible:outline-2 focus-visible:outline-primary-foreground focus-visible:outline-offset-4"
                >
                  Conheça a proposta
                </a>
              </div>
            </div>

            <Card className="relative min-w-0 overflow-visible border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground shadow-none">
              <div className="absolute -right-3 -top-3 size-6 rounded-full bg-accent sm:-right-5 sm:-top-5 sm:size-10" />
              <CardHeader className="gap-6 p-6 sm:p-8">
                <div className="flex min-w-0 items-center gap-3 text-sm font-medium text-primary-foreground/70">
                  <span className="flex size-11 items-center justify-center rounded-full bg-card p-1.5">
                    <Image
                      src="/brand/logo-mark.png"
                      alt=""
                      width={512}
                      height={512}
                      sizes="32px"
                      className="size-full"
                    />
                  </span>
                  <span className="min-w-0 break-words">
                    Clareza para o caminho
                  </span>
                </div>
                <div>
                  <h2 className="font-heading text-2xl leading-tight font-semibold text-primary-foreground sm:text-3xl">
                    Um lugar para o que importa.
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-primary-foreground/70">
                    Quando cada parte encontra o seu lugar, fica mais simples
                    entender o presente e escolher os próximos passos.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
                <div className="divide-y divide-primary-foreground/20 border-y border-primary-foreground/20">
                  <div className="flex flex-col items-start gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="min-w-0 font-medium">Organizar</span>
                    <span className="min-w-0 text-sm text-primary-foreground/65 sm:text-right">
                      dar forma aos planos
                    </span>
                  </div>
                  <div className="flex flex-col items-start gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="min-w-0 font-medium">Acompanhar</span>
                    <span className="min-w-0 text-sm text-primary-foreground/65 sm:text-right">
                      perceber o caminho
                    </span>
                  </div>
                  <div className="flex flex-col items-start gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="min-w-0 font-medium">Decidir</span>
                    <span className="min-w-0 text-sm text-primary-foreground/65 sm:text-right">
                      agir com consciência
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="proposta"
          aria-labelledby="proposta-title"
          className="scroll-mt-24 border-b border-border/70 bg-background"
        >
          <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 lg:px-10 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Uma visão mais ampla
                </p>
                <h2 id="proposta-title" className="mt-3 max-w-xl">
                  Patrimônio não é uma fotografia. É uma história.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:justify-self-end">
                A Reserva Clara existe para deixar essa jornada mais organizada
                e compreensível, respeitando o tempo e as escolhas de cada
                pessoa.
              </p>
            </div>

            <div className="mt-14 grid border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
              <article className="py-7 md:px-8 md:first:pl-0 md:last:pr-0">
                <p className="mb-4 text-sm font-semibold text-muted-foreground">
                  Visão do todo
                </p>
                <h3 className="max-w-xs text-xl">
                  Entenda o que faz parte da sua jornada.
                </h3>
                <p className="mt-4 max-w-sm text-muted-foreground">
                  Reúna perspectivas importantes para enxergar seu patrimônio
                  sem perder de vista os seus objetivos.
                </p>
              </article>
              <article className="border-t border-border py-7 md:border-t-0 md:px-8">
                <p className="mb-4 text-sm font-semibold text-muted-foreground">
                  Organização contínua
                </p>
                <h3 className="max-w-xs text-xl">
                  Tenha um lugar para acompanhar o caminho.
                </h3>
                <p className="mt-4 max-w-sm text-muted-foreground">
                  Mantenha planos, escolhas e acompanhamento próximos da sua
                  rotina, com simplicidade e constância.
                </p>
              </article>
              <article className="border-t border-border py-7 md:border-t-0 md:px-8 md:first:pl-0 md:last:pr-0">
                <p className="mb-4 text-sm font-semibold text-muted-foreground">
                  Decisões conscientes
                </p>
                <h3 className="max-w-xs text-xl">
                  Escolha os próximos passos com calma.
                </h3>
                <p className="mt-4 max-w-sm text-muted-foreground">
                  Transforme mais informação em decisões coerentes com o que
                  importa para você no longo prazo.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          id="como-ajuda"
          aria-labelledby="como-ajuda-title"
          className="scroll-mt-24 bg-card"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24 lg:px-10 lg:py-24">
            <div className="max-w-md">
              <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Como ajuda
              </p>
              <h2 id="como-ajuda-title" className="mt-3">
                Clareza é uma prática, não um momento.
              </h2>
              <p className="mt-5 text-muted-foreground">
                Acompanhar o patrimônio ao longo do tempo fica mais leve quando
                existe espaço para organizar, observar e decidir.
              </p>
            </div>

            <div className="divide-y divide-border border-y border-border">
              <article className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:py-7">
                <h3 className="text-lg">Organizar</h3>
                <p className="text-muted-foreground">
                  Comece reunindo o que orienta sua jornada e dando contexto às
                  escolhas que você quer acompanhar.
                </p>
              </article>
              <article className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:py-7">
                <h3 className="text-lg">Acompanhar</h3>
                <p className="text-muted-foreground">
                  Observe a evolução dos seus planos com uma visão que respeita
                  o ritmo real da construção de patrimônio.
                </p>
              </article>
              <article className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:py-7">
                <h3 className="text-lg">Decidir</h3>
                <p className="text-muted-foreground">
                  Use mais clareza para refletir sobre os próximos passos e agir
                  de forma alinhada ao seu longo prazo.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="cta-title"
          className="border-y border-border bg-background"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                O próximo passo
              </p>
              <h2 id="cta-title" className="mt-3">
                Comece a olhar para o seu patrimônio com mais clareza.
              </h2>
            </div>
            <Link
              href="/login"
              aria-label="Entrar"
              className={buttonVariants({ size: "lg" })}
            >
              Entrar
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-muted-foreground lg:px-10">
        <div>
          <Image
            src="/brand/logo-horizontal.png"
            alt="Reserva Clara"
            width={979}
            height={285}
            sizes="180px"
            className="hidden h-auto w-[180px] sm:block"
          />
          <Image
            src="/brand/logo-compact.png"
            alt="Reserva Clara"
            width={609}
            height={172}
            sizes="140px"
            className="h-auto w-[140px] sm:hidden"
          />
          <p className="mt-3">Seu patrimônio, com clareza.</p>
        </div>
      </footer>
    </div>
  );
}
