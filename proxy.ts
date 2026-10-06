import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { landingPath, modulesForPath, snapshotCanViewAny } from "@/lib/rbac/catalog";

// Optimistic checks only (cookie/token, no database). Real authorization happens
// in the Data Access Layer (src/lib/auth.ts) on every page, server action and API route.

// /q/<token> is the page a customer opens with the share link of a quote: it needs no sign-in and shows that one quote only
const PUBLIC_PATHS = ["/login", "/forgot-password", "/unauthorized", "/q"];
const PASSWORD_CHANGE_PATHS = ["/account/change-password", "/api/account/password"];

function matches(pathname: string, paths: string[]) {
  return paths.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export default withAuth(
  function proxy(req) {
    const { pathname, search } = req.nextUrl;
    const token = req.nextauth.token;
    const isApi = pathname.startsWith("/api/");

    if (matches(pathname, PUBLIC_PATHS)) return NextResponse.next();

    const expired = !token || token.invalid || !token.sessionExpiresAt || Date.now() > token.sessionExpiresAt;
    if (expired) {
      if (isApi) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
      const url = new URL("/login", req.url);
      if (token) url.searchParams.set("expired", "1");
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }

    if (token.mustChangePassword && !matches(pathname, PASSWORD_CHANGE_PATHS)) {
      if (isApi) return NextResponse.json({ error: "Password change required" }, { status: 403 });
      return NextResponse.redirect(new URL("/account/change-password", req.url));
    }

    if (!isApi) {
      const modules = modulesForPath(pathname);
      if (modules && !snapshotCanViewAny(token.permissions, modules)) {
        const target = pathname === "/" ? landingPath(token.permissions) : "/unauthorized";
        if (target !== pathname) return NextResponse.redirect(new URL(target, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Let the function above decide, so API routes get JSON instead of a redirect
      authorized: () => true,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    // Everything except NextAuth endpoints, Next internals and static files
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|woff2?)$).*)",
  ],
};
