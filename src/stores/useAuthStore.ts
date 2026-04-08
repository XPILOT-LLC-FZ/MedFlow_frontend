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
}

export interface SignupData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "PATIENT" | "ADMIN";
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
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  bootSession: () => Promise<void>;
  getDashboardPath: () => string;
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
  };
}

/** Helper: sync the clinic-os-auth cookie for Next.js middleware */
function syncCookie(token: string | null | undefined) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `clinic-os-auth=${token}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = "clinic-os-auth=; path=/; max-age=0;";
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
          const response = await apiClient.post("/auth/login", { email, password });
          const { accessToken, refreshToken } = extractTokens(response);

          if (!accessToken) {
            throw new Error("No access token received from server");
          }

          syncCookie(accessToken);

          // If the response includes a user object, use it; otherwise fetch /auth/me
          let userData = response.user;
          if (!userData) {
            set({ accessToken, refreshToken });
            userData = await apiClient.get("/auth/me");
          }

          set({
            user: mapUser(userData),
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Invalid credentials";
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

          const response = await apiClient.post("/auth/register", registerPayload);
          let { accessToken, refreshToken } = extractTokens(response);

          // If register doesn't return tokens, auto-login
          if (!accessToken) {
            const loginResp = await apiClient.post("/auth/login", {
              email: data.email,
              password: data.password,
            });
            const tokens = extractTokens(loginResp);
            accessToken = tokens.accessToken;
            refreshToken = tokens.refreshToken;
          }

          if (!accessToken) {
            throw new Error("Registration succeeded but could not obtain session");
          }

          syncCookie(accessToken);

          // Get user profile
          set({ accessToken, refreshToken });
          const userData = await apiClient.get("/auth/me");

          set({
            user: mapUser(userData, data),
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Registration failed";
          return { success: false, error: message };
        }
      },

      // ─── LOGOUT ─────────────────────────────────────────────
      logout: async () => {
        try {
          const { accessToken, refreshToken } = get();
          if (accessToken && refreshToken) {
            await apiClient.post("/auth/logout", { refreshToken }).catch(() => {});
          }
        } finally {
          syncCookie(null);
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      // ─── REFRESH ────────────────────────────────────────────
      refreshAccessToken: async () => {
        try {
          const { refreshToken: currentRefreshToken } = get();
          if (!currentRefreshToken) throw new Error("No refresh token");

          const response = await apiClient.post("/auth/refresh", {
            refreshToken: currentRefreshToken,
          });
          const { accessToken, refreshToken } = extractTokens(response);

          if (accessToken) {
            syncCookie(accessToken);
            set({
              accessToken,
              refreshToken: refreshToken ?? currentRefreshToken,
              isAuthenticated: true,
            });
          }
        } catch {
          syncCookie(null);
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      // ─── BOOT SESSION ──────────────────────────────────────
      bootSession: async () => {
        if (bootSessionInFlight) {
          return bootSessionInFlight;
        }

        const now = Date.now();
        const stateBefore = get();

        // Prevent noisy repeated boot attempts that can trigger backend throttling.
        if (
          now - lastBootSessionAttemptAt < BOOT_SESSION_MIN_INTERVAL_MS &&
          stateBefore.isAuthenticated &&
          stateBefore.user
        ) {
          return;
        }

        lastBootSessionAttemptAt = now;

        bootSessionInFlight = (async () => {
          try {
            const { refreshToken: currentRefreshToken, accessToken: existingToken } = get();

            let token = existingToken;

            // 1) Try current access token first to avoid unnecessary refresh calls.
            if (token) {
              try {
                set({ accessToken: token });
                const userData = await apiClient.get("/auth/me");
                syncCookie(token);
                set({
                  user: mapUser(userData),
                  accessToken: token,
                  isAuthenticated: true,
                });
                return;
              } catch {
                // Access token may be expired; continue to refresh path.
              }
            }

            // 2) Refresh only when needed.
            if (currentRefreshToken) {
              const response = await apiClient.post("/auth/refresh", {
                refreshToken: currentRefreshToken,
              });
              const tokens = extractTokens(response);
              if (tokens.accessToken) {
                token = tokens.accessToken;
                set({
                  accessToken: token,
                  refreshToken: tokens.refreshToken ?? currentRefreshToken,
                });
              }
            }

            if (!token) {
              throw new Error("No valid session");
            }

            set({ accessToken: token });
            const userData = await apiClient.get("/auth/me");
            syncCookie(token);

            set({
              user: mapUser(userData),
              accessToken: token,
              isAuthenticated: true,
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "";
            const isThrottled = /too many requests|throttler/i.test(message);

            if (isThrottled) {
              // Keep current auth state on transient backend throttling.
              console.warn("bootSession throttled; keeping current auth state.");
              return;
            }

            syncCookie(null);
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

      // ─── UPDATE PROFILE ────────────────────────────────────
      updateProfile: async (data) => {
        try {
          const updatedUser = await apiClient.patch("/auth/me", data);
          set({
            user: {
              ...get().user!,
              name: updatedUser.fullName ?? updatedUser.name,
              nameAr: updatedUser.nameAr,
              email: updatedUser.email,
              phone: updatedUser.phone,
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
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
