import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  APP_HOST,
  classifyHost,
  PUBLIC_HOST,
} from "@/lib/host-routing";

const APP_ORIGIN = `https://${APP_HOST}`;
const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;

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
