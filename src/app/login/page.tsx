import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:py-16">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Reserva Clara"
            width={979}
            height={285}
            priority
            className="mx-auto h-auto w-52 sm:w-60"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Seu patrimônio, com clareza.
          </p>
        </header>

        <Card className="border-border/80 bg-card/95 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>
              <h1 className="text-xl font-semibold">Acesse sua conta</h1>
            </CardTitle>
            <CardDescription>
              Entre para acompanhar seu patrimônio com clareza.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleSignIn />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
