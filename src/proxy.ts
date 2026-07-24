import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Read the session cookie from the request headers
  const session = request.cookies.get("session_user")?.value;
  const { pathname } = request.nextUrl;

  // Guard: If authenticated and trying to access login/signup pages, redirect to home page
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Continue to the requested page
  return NextResponse.next();
}

// Only match authentication pages to avoid running proxy intercepts on public assets or other routes
export const config = {
  matcher: ["/login", "/signup"],
};
