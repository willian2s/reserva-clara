import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  display: "swap",
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reserva Clara",
  description: "Seu patrimônio, com clareza.",
  icons: {
    icon: [
      {
        url: "/brand/favicon-16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/brand/favicon-32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/brand/favicon-48.png",
        type: "image/png",
        sizes: "48x48",
      },
      {
        url: "/brand/favicon-64.png",
        type: "image/png",
        sizes: "64x64",
      },
      {
        url: "/brand/favicon-128.png",
        type: "image/png",
        sizes: "128x128",
      },
      {
        url: "/brand/favicon-256.png",
        type: "image/png",
        sizes: "256x256",
      },
    ],
    apple: {
      url: "/brand/app-icon-light.png",
      type: "image/png",
      sizes: "512x512",
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
