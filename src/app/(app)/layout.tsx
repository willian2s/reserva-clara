import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Aplicação | Reserva Clara",
  description: "Acesse sua aplicação Reserva Clara.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}
