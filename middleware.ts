import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Public routes that don't need auth (login, etc) handled by NextAuth matcher.
    
    // We can add simple path-based authorization here if we want,
    // but the task says "Hiding navigation is UX only. Server-side authorization remains mandatory."
    // So we'll rely on page components and server actions calling `requirePermission`.
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    }
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
