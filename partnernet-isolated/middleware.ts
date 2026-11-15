import { NextRequest, NextResponse } from "next/server";

/**
 * Fail-closed boundary until an existing ZARIKS identity provider is connected
 * and server-verified organization/role permissions are implemented.
 * Do not replace with client-selected roles or a static password.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const restricted = path === "/operations" || path.startsWith("/operations/") ||
    path === "/site/partnernet.html" || path === "/staff" ||
    path.startsWith("/staff/") || path === "/admin" || path.startsWith("/admin/");
  if (!restricted) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/operations/:path*", "/site/partnernet.html", "/staff/:path*", "/admin/:path*"] };
