import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_HOST = "reservaclara.com.br";
const APP_HOST = "app.reservaclara.com.br";
const WWW_HOST = `www.${PUBLIC_HOST}`;
const APP_ORIGIN = `https://${APP_HOST}`;
const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;
const VERCEL_PREVIEW_SUFFIX = ".vercel.app";

type HostClass = "public" | "app" | "www" | "local" | "preview" | "unknown";

function normalizeHostname(hostname: string) {
  const trimmedHostname = hostname.trim().toLowerCase();
  const withoutPort = trimmedHostname.match(/^\[([^\]]+)\](?::\d+)?$/)?.[1]
    ?? trimmedHostname.replace(/^([^:]+):\d+$/, "$1");

  return withoutPort.replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function classifyHost(hostname: string): HostClass {
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

function redirectToFixedPath(origin: string, pathname: string, status: 307 | 308) {
  return NextResponse.redirect(new URL(pathname, origin), status);
}

function redirectToSameOriginPath(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url), 307);
}

export function proxy(request: NextRequest) {
  const requestHostname = request.headers.get("host") ?? request.nextUrl.hostname;
  const hostClass = classifyHost(requestHostname);
  const { pathname } = request.nextUrl;

  if (hostClass === "unknown") {
    return new NextResponse(null, { status: 404 });
  }

  if (hostClass === "www") {
    return redirectToFixedPath(PUBLIC_ORIGIN, pathname, 308);
  }

  if (hostClass === "public" && (pathname === "/login" || pathname.startsWith("/login/"))) {
    return redirectToFixedPath(APP_ORIGIN, pathname, 307);
  }

  if (
    hostClass === "public" &&
    (pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/portfolios" ||
      pathname.startsWith("/portfolios/"))
  ) {
    return redirectToFixedPath(APP_ORIGIN, pathname, 307);
  }

  if (hostClass === "app" && pathname === "/") {
    return redirectToSameOriginPath(request, "/login");
  }

  if (hostClass === "local" || hostClass === "preview") {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/dashboard/:path*",
    "/portfolios/:path*",
  ],
};
