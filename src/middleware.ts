import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected paths
  const isProtectedPath = 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/doctor") || 
    pathname.startsWith("/reception") || 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/super-dashboard") ||
    pathname.startsWith("/onboarding");

  // Check for session cookie (HttpOnly cookie set by backend)
  // Note: We use "clinic-os-auth" as stipulated in the task list.
  const sessionToken = request.cookies.get("clinic-os-auth");

  if (isProtectedPath && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/reception/:path*",
    "/dashboard/:path*",
    "/super-dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/login",
    "/signup",
  ],
};
