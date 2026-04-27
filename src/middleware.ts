import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = atob(padded);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")) {
    return NextResponse.next();
  }

  const isAuthPath = 
    pathname.startsWith("/login") || 
    pathname.startsWith("/signup");
  const isOnboardingPath = pathname.startsWith("/onboarding");
  
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
    return NextResponse.redirect(url);
  }

  // UX gate: derive onboarding state from auth token payload.
  // Backend authorization remains the source of truth.
  const payload = sessionToken?.value ? decodeJwtPayload(sessionToken.value) : null;
  const role = String(payload?.role ?? "").toUpperCase();
  const hasRole = role.length > 0;
  const requiresOnboarding = role === "PATIENT" || role === "ADMIN";
  const onboardingCookie = request.cookies.get("clinic-os-onboarded")?.value;
  const tokenIsOnboarded = payload?.isOnboarded;
  // Only use cookie fallback when token does not carry an explicit onboarding claim.
  // This avoids redirect loops when token says false but a stale cookie says true.
  const isOnboarded =
    typeof tokenIsOnboarded === "boolean"
      ? tokenIsOnboarded
      : onboardingCookie === "1";

  if (sessionToken && isAuthPath && hasRole) {
    const url = request.nextUrl.clone();
    if (requiresOnboarding && !isOnboarded) {
      url.pathname = "/onboarding";
    } else if (role === "ADMIN") {
      url.pathname = "/admin/dashboard";
    } else if (role === "STAFF") {
      url.pathname = "/reception/dashboard";
    } else if (role === "DOCTOR") {
      url.pathname = "/doctor/dashboard";
    } else if (role === "SUPER_ADMIN") {
      url.pathname = "/super-dashboard";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  if (sessionToken && requiresOnboarding && !isOnboarded && isProtectedPath && !isOnboardingPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (sessionToken && isOnboardingPath && hasRole && (!requiresOnboarding || isOnboarded)) {
    const url = request.nextUrl.clone();
    if (role === "ADMIN") url.pathname = "/admin/dashboard";
    else if (role === "STAFF") url.pathname = "/reception/dashboard";
    else if (role === "DOCTOR") url.pathname = "/doctor/dashboard";
    else if (role === "SUPER_ADMIN") url.pathname = "/super-dashboard";
    else url.pathname = "/dashboard";
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
