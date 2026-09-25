export const PUBLIC_HOST = "reservaclara.com.br";
export const APP_HOST = "app.reservaclara.com.br";
const WWW_HOST = `www.${PUBLIC_HOST}`;
const VERCEL_PREVIEW_SUFFIX = ".vercel.app";

export type HostClass = "public" | "app" | "www" | "local" | "preview" | "unknown";

export function normalizeHostname(hostname: string) {
  const trimmedHostname = hostname.trim().toLowerCase();
  const withoutPort = trimmedHostname.match(/^\[([^\]]+)\](?::\d+)?$/)?.[1]
    ?? trimmedHostname.replace(/^([^:]+):\d+$/, "$1");

  return withoutPort.replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

export function classifyHost(hostname: string): HostClass {
  const normalizedHostname = normalizeHostname(hostname);

  if (normalizedHostname === PUBLIC_HOST) {
    return "public";
  }

  if (normalizedHostname === APP_HOST) {
    return "app";
  }

  if (normalizedHostname === WWW_HOST) {
    return "www";
  }

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "0.0.0.0" ||
    normalizedHostname === "::1"
  ) {
    return "local";
  }

  if (
    normalizedHostname.endsWith(VERCEL_PREVIEW_SUFFIX) &&
    normalizedHostname.length > VERCEL_PREVIEW_SUFFIX.length
  ) {
    return "preview";
  }

  return "unknown";
}
