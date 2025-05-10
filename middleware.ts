// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;
  const userId = req.auth?.user?.id;

  // Public pages
  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  const isPublic = publicRoutes.includes(pathname);

  // Authenticated users visiting public pages → redirect to dashboard
  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(new URL(`/dashboard/${userId}`, req.url));
  }

  // Routes that need auth (protected routes)
  const protectedRoutes = ["/dashboard", "workspace" , "/board", "/cards"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    // Not logged in → redirect to sign-in
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(
        `/sign-in?callbackUrl=${encodeURIComponent(pathname)}`,
        req.url
      ));
    }

    // If route is /dashboard/[userId] and does not match logged-in user → redirect to correct one
    if (pathname.startsWith("/dashboard")) {
      const pathUserId = pathname.split("/")[2];
      if (userId !== pathUserId) {
        return NextResponse.redirect(new URL(`/dashboard/${userId}`, req.url));
      }
    }
  }

  return NextResponse.next();
});
