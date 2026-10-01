import Link from "next/link";
import { headers } from "next/headers";

import { buttonVariants } from "@/components/ui/button";
import { classifyHost } from "@/lib/host-routing";

export default async function NotFound() {
  const requestHeaders = await headers();
  const hostClass = classifyHost(requestHeaders.get("host") ?? "");
  const returnToApp = ["app", "local", "preview"].includes(hostClass);
  const returnHref = returnToApp ? "/dashboard" : "/";
  const returnLabel = "Voltar ao início";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:py-24">
      <div className="w-full max-w-lg text-center">
        <p className="font-heading text-7xl font-semibold tracking-tight text-primary sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Não encontramos esta página.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          O endereço pode estar incorreto ou a página pode ter sido movida.
        </p>
        <Link className={`${buttonVariants({ size: "lg" })} mt-8`} href={returnHref}>
          {returnLabel}
        </Link>
      </div>
    </main>
  );
}
