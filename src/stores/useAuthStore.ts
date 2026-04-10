"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";
import { apiClient } from "@/lib/apiClient";

export interface AuthUser {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  role: Role;
  phone?: string;
  clinicId?: string;
  isOnboarded?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "PATIENT" | "ADMIN";
}

function requiresOnboarding(role: Role): boolean {
  return role === "PATIENT" || role === "ADMIN";
}

let bootSessionInFlight: Promise<void> | null = null;
let lastBootSessionAttemptAt = 0;
const BOOT_SESSION_MIN_INTERVAL_MS = 5000;

export function normalizeRole(role: unknown): Role {
  switch (role) {
    case "MEDICAL_ADMIN":
    case "CLINIC_ADMIN":
    case "ADMIN":
      return "ADMIN";
    case "RECEPTION":
    case "RECEPTIONIST":
    case "STAFF":
      return "STAFF";
    case "DOCTOR":
      return "DOCTOR";
    case "SUPER_ADMIN":
      return "SUPER_ADMIN";
    case "PATIENT":
    default:
      return "PATIENT";
  }
}

export const roleDashboardMap: Record<Role, string> = {
  PATIENT: "/dashboard",
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/dashboard",
  STAFF: "/reception/dashboard",
  SUPER_ADMIN: "/super-dashboard",
};

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (token: string, role?: "PATIENT" | "ADMIN") => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  bootSession: (force?: boolean) => Promise<void>;
  getDashboardPath: () => string;
  getPostAuthPath: (candidateUser?: AuthUser | null) => string;
  updateProfile: (data: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Helper: extract tokens from any API auth response shape.
 * The backend may return { access_token, refresh_token, user } or { accessToken, refreshToken, user }.
 */
function extractTokens(response: Record<string, unknown>) {
  const accessToken = (response.access_token || response.accessToken) as string | undefined;
  const refreshToken = (response.refresh_token || response.refreshToken) as string | undefined;
  return { accessToken, refreshToken };
}

/** Helper: map any user-shaped object from the API into our AuthUser. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(raw: any, fallback?: Partial<SignupData>): AuthUser {
  return {
    id: raw.id ?? "unknown",
    name: raw.fullName ?? raw.name ?? fallback?.name ?? "User",
    nameAr: raw.nameAr,
    email: raw.email ?? fallback?.email ?? "",
    role: normalizeRole(raw.role),
    phone: raw.phone ?? fallback?.phone,
    clinicId: raw.clinicId ?? raw.clinic_id ?? raw.clinic?.id ?? raw.tenantId ?? raw.tenant_id ?? raw.cid,
    isOnboarded: raw.isOnboarded ?? false,
  };
}

/** Helper: sync onboarding hint cookie for middleware stale-claim bridging. */
function syncOnboardingHintCookie(user?: AuthUser | null) {
  if (typeof document === "undefined") return;

  if (!user) {
    document.cookie = "clinic-os-onboarded=; path=/; max-age=0;";
    return;
  }

  let isOnboardingCleared = true;
  if (requiresOnboarding(user.role)) {
    isOnboardingCleared = Boolean(user.isOnboarded);
  }

  if (isOnboardingCleared) {
    document.cookie = "clinic-os-onboarded=1; path=/; max-age=604800; SameSite=Lax";
  } else {
    document.cookie = "clinic-os-onboarded=; path=/; max-age=0;";
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // ─── LOGIN ──────────────────────────────────────────────
      login: async (email, password) => {
        try {
          const response = await apiClient.post<Record<string, unknown>>(
            "/auth/login",
            { email, password },
          );
          const { accessToken, refreshToken } = extractTokens(response);

          // If the response includes a user object, use it; otherwise fetch /auth/me
          let userData = response.user;
          if (!userData) {
            if (accessToken || refreshToken) {
              set({
                accessToken: accessToken ?? null,
                refreshToken: refreshToken ?? null,
              });
            }
            userData = await apiClient.get("/auth/me");
          }

          const parsedUser = mapUser(userData);
          syncOnboardingHintCookie(parsedUser);

          set({
            user: parsedUser,
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? null,
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Invalid credentials";
          return { success: false, error: message };
        }
      },

      // ─── GOOGLE LOGIN ─────────────────────────────────────────
      loginWithGoogle: async (token, role) => {
        try {
          const payload: Record<string, unknown> = { token };
          if (role) payload.role = role;
          
          const response = await apiClient.post<Record<string, unknown>>(
            "/auth/oauth/google",
            payload,
          );
          const { accessToken, refreshToken } = extractTokens(response);
          let userData = response.user;

          if (!userData) {
            if (accessToken || refreshToken) {
              set({
                accessToken: accessToken ?? null,
                refreshToken: refreshToken ?? null,
              });
            }
            userData = await apiClient.get("/auth/me");
          }

          const parsedUser = mapUser(userData);
          syncOnboardingHintCookie(parsedUser);

          set({
            user: parsedUser,
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? null,
            isAuthenticated: true,
          });
          return { success: true, isNewUser: requiresOnboarding(parsedUser.role) && !parsedUser.isOnboarded };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "OAuth login failed";
          return { success: false, error: message };
        }
      },

      // ─── SIGNUP ─────────────────────────────────────────────
      signup: async (data) => {
        try {
          // RegisterDto: { email, password, fullName, role? }
          // Note: password min 8 chars, phone is NOT part of RegisterDto
          const registerPayload: Record<string, unknown> = {
            email: data.email,
            password: data.password,
            fullName: data.name,
          };
          if (data.role) registerPayload.role = data.role;

          const response = await apiClient.post<Record<string, unknown>>(
            "/auth/register",
            registerPayload,
          );
          const { accessToken, refreshToken } = extractTokens(response);
          if (accessToken || refreshToken) {
            set({
              accessToken: accessToken ?? null,
              refreshToken: refreshToken ?? null,
            });
          }

          const userData = response.user;
          const fallbackUserData = userData ?? (await apiClient.get("/auth/me").catch(() => null));
          const parsedUser = mapUser(fallbackUserData ?? {}, data);

          syncOnboardingHintCookie(parsedUser);

          set({
            user: parsedUser,
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? null,
            isAuthenticated: true,
          });
          return {
            success: true,
            isNewUser: requiresOnboarding(parsedUser.role) && !parsedUser.isOnboarded,
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Registration failed";
          return { success: false, error: message };
        }
      },

      // ─── LOGOUT ─────────────────────────────────────────────
      logout: async () => {
        try {
          const { refreshToken } = get();
          const payload = refreshToken ? { refreshToken } : {};
          await apiClient.post("/auth/logout", payload).catch(() => {});
        } finally {
          syncOnboardingHintCookie(null);
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      // ─── REFRESH ────────────────────────────────────────────
      refreshAccessToken: async () => {
        try {
          const { refreshToken: currentRefreshToken } = get();
          const payload = currentRefreshToken ? { refreshToken: currentRefreshToken } : {};
          const response = await apiClient.post<Record<string, unknown>>(
            "/auth/refresh",
            payload,
          );
          const { accessToken, refreshToken } = extractTokens(response);

          set({
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? currentRefreshToken ?? null,
            isAuthenticated: true,
          });

          const me = await apiClient.get("/auth/me");
          const parsedUser = mapUser(me);
          syncOnboardingHintCookie(parsedUser);
          set({ user: parsedUser, isAuthenticated: true });

          return true;
        } catch {
          syncOnboardingHintCookie(null);
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          throw new Error("Session refresh failed");
        }
      },

      // ─── BOOT SESSION ──────────────────────────────────────
      bootSession: async (force = false) => {
        if (bootSessionInFlight) {
          return bootSessionInFlight;
        }

        const now = Date.now();
        const stateBefore = get();

        // Prevent noisy repeated boot attempts that can trigger backend throttling.
        if (
          !force &&
          now - lastBootSessionAttemptAt < BOOT_SESSION_MIN_INTERVAL_MS &&
          stateBefore.isAuthenticated &&
          stateBefore.user
        ) {
          return;
        }

        lastBootSessionAttemptAt = now;

        bootSessionInFlight = (async () => {
          try {
            // Prefer cookie-backed identity check first.
            const userData = await apiClient.get("/auth/me");
            const parsedUser = mapUser(userData);
            syncOnboardingHintCookie(parsedUser);

            set({
              user: parsedUser,
              isAuthenticated: true,
            });
            return;
          } catch {
            // Continue to refresh path.
          }

          try {
            await get().refreshAccessToken();
            return;
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "";
            const isThrottled = /too many requests|throttler/i.test(message);
            const isForbiddenOrOnboarding = /forbidden|onboarding required|access denied|onboarding/i.test(message);

            const currentState = get();

            if (isThrottled) {
              // Keep current auth state on transient backend throttling.
              console.warn("bootSession throttled; keeping current auth state.");
              return;
            }

            if (
              isForbiddenOrOnboarding &&
              currentState.isAuthenticated &&
              currentState.user
            ) {
              // Do not drop a valid local session when backend check temporarily rejects /auth/me.
              syncOnboardingHintCookie(currentState.user);
              console.warn("bootSession forbidden check; preserving existing local session.");
              return;
            }

            syncOnboardingHintCookie(null);
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          } finally {
            bootSessionInFlight = null;
          }
        })();

        return bootSessionInFlight;
      },

      // ─── GET DASHBOARD PATH ────────────────────────────────
      getDashboardPath: () => {
        const { user } = get();
        if (!user) return "/login";
        return roleDashboardMap[user.role] ?? "/dashboard";
      },

      getPostAuthPath: (candidateUser) => {
        const effectiveUser = candidateUser ?? get().user;
        if (!effectiveUser) return "/login";
        if (requiresOnboarding(effectiveUser.role) && !effectiveUser.isOnboarded) {
          return "/onboarding";
        }
        return roleDashboardMap[effectiveUser.role] ?? "/dashboard";
      },

      // ─── UPDATE PROFILE ────────────────────────────────────
      updateProfile: async (data) => {
        try {
          const updatedUser = await apiClient.patch<Record<string, unknown>>(
            "/auth/me",
            data,
          );
          const currentUser = get().user;
          if (!currentUser) {
            return { success: false, error: "Not authenticated" };
          }

          const nextName =
            typeof updatedUser.fullName === "string"
              ? updatedUser.fullName
              : typeof updatedUser.name === "string"
                ? updatedUser.name
                : currentUser.name;

          const nextEmail =
            typeof updatedUser.email === "string"
              ? updatedUser.email
              : currentUser.email;

          const nextNameAr =
            typeof updatedUser.nameAr === "string"
              ? updatedUser.nameAr
              : currentUser.nameAr;

          const nextPhone =
            typeof updatedUser.phone === "string"
              ? updatedUser.phone
              : currentUser.phone;

          set({
            user: {
              ...currentUser,
              name: nextName,
              nameAr: nextNameAr,
              email: nextEmail,
              phone: nextPhone,
            },
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Update failed";
          return { success: false, error: message };
        }
      },
    }),
    {
      name: "clinic-os-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
