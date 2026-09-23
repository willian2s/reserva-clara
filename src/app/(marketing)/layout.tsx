import type { Metadata } from "next";

const PUBLIC_URL = "https://reservaclara.com.br/";
const LANDING_TITLE = "Reserva Clara — Seu patrimônio, com clareza.";
const LANDING_DESCRIPTION =
  "Uma aplicação para organizar, acompanhar e construir seu patrimônio com clareza e visão de longo prazo.";

export const metadata: Metadata = {
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  alternates: {
    canonical: PUBLIC_URL,
  },
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    url: PUBLIC_URL,
    siteName: "Reserva Clara",
    locale: "pt_BR",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: LayoutProps<"/">) {
  return children;
}
