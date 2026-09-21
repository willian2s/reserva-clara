import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleSignIn } from "@/components/auth/google-sign-in";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="font-heading text-2xl font-semibold tracking-tight">
            Reserva Clara
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu patrimônio, com clareza.
          </p>
        </header>

        <Card>
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
