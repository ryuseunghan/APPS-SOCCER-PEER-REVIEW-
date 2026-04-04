import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isMainRoute =
    req.nextUrl.pathname.startsWith("/home") ||
    req.nextUrl.pathname.startsWith("/matches") ||
    req.nextUrl.pathname.startsWith("/review") ||
    req.nextUrl.pathname.startsWith("/rankings") ||
    req.nextUrl.pathname.startsWith("/profile");

  if (isMainRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/home/:path*",
    "/matches/:path*",
    "/review/:path*",
    "/rankings/:path*",
    "/profile/:path*",
  ],
};
