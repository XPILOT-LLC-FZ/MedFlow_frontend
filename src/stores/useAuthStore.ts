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
  jobTitle?: string;
  clinicId?: string;
  isOnboarded?: boolean;
  isAvailable?: boolean;
  avatarUrl?: string | null;
  passwordUpdatedAt?: string | null;
  loyaltyPoints?: number;
  specialDiscount?: number;
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
  sendSignupOtp: (email: string, fullName: string, role: "PATIENT" | "ADMIN") => Promise<{ success: boolean; error?: string }>;
  verifySignupOtp: (email: string, fullName: string, password: string, otpCode: string, role: "PATIENT" | "ADMIN") => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  sendResetOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetOtp: (email: string, otpCode: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendChangeEmailOtp: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  verifyChangeEmailOtp: (newEmail: string, otpCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  bootSession: (force?: boolean) => Promise<void>;
  getDashboardPath: () => string;
  getPostAuthPath: (candidateUser?: AuthUser | null) => string;
  updateProfile: (data: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  toggleAvailability: () => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  generate2fa: () => Promise<{ success: boolean; qrUrl?: string; error?: string }>;
  enable2fa: (code: string) => Promise<{ success: boolean; error?: string }>;
  getSessions: () => Promise<unknown[]>;
  revokeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  setUser: (user: AuthUser | null) => void;
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
function mapUser(raw: Record<string, unknown>, fallback?: Partial<SignupData>): AuthUser {
  const clinic = raw["clinic"] as { id?: string } | undefined;
  return {
    id: (raw["id"] as string) ?? "unknown",
    name: (raw["fullName"] as string) ?? (raw["name"] as string) ?? fallback?.name ?? "User",
    nameAr: raw["nameAr"] as string | undefined,
    email: (raw["email"] as string) ?? fallback?.email ?? "",
    role: normalizeRole(raw["role"]),
    phone: (raw["phone"] as string) ?? fallback?.phone,
    jobTitle: (raw["jobTitle"] as string) ?? undefined,
    clinicId: (raw["clinicId"] as string) ?? (raw["clinic_id"] as string) ?? clinic?.id ?? (raw["tenantId"] as string) ?? (raw["tenant_id"] as string) ?? (raw["cid"] as string),
    isOnboarded: (raw["isOnboarded"] as boolean) ?? false,
    isAvailable: (raw["isAvailable"] as boolean) ?? true,
    avatarUrl: (raw["avatarUrl"] as string) ?? (raw["avatar"] as string) ?? null,
    passwordUpdatedAt: (raw["passwordUpdatedAt"] as string) ?? (raw["password_updated_at"] as string) ?? null,
    loyaltyPoints: (raw["loyaltyPoints"] as number) ?? 0,
    specialDiscount: (raw["specialDiscount"] as number) ?? (raw["patient"] as Record<string, unknown> | undefined)?.["specialDiscount"] ?? 0,
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
          let userData = response["user"] as Record<string, unknown> | undefined;
          if (!userData) {
            if (accessToken || refreshToken) {
              set({
                accessToken: accessToken ?? null,
                refreshToken: refreshToken ?? null,
              });
            }
            userData = await apiClient.get<Record<string, unknown>>("/auth/me");
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
          if (role) payload["role"] = role;

          const response = await apiClient.post<Record<string, unknown>>(
            "/auth/oauth/google",
            payload,
          );
          const { accessToken, refreshToken } = extractTokens(response);
          let userData = response["user"] as Record<string, unknown> | undefined;

          if (!userData) {
            if (accessToken || refreshToken) {
              set({
                accessToken: accessToken ?? null,
                refreshToken: refreshToken ?? null,
              });
            }
            userData = await apiClient.get<Record<string, unknown>>("/auth/me");
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
          if (data.role) registerPayload["role"] = data.role;

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

          const userData = response["user"] as Record<string, unknown> | undefined;
          const fallbackUserData = userData ?? (await apiClient.get<Record<string, unknown>>("/auth/me").catch(() => null));
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

      // ─── OTP SIGNUP ──────────────────────────────────────────
      sendSignupOtp: async (email, fullName, role) => {
        try {
          await apiClient.post("/auth/send-signup-otp", {
            email,
            fullName,
            role,
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to send OTP";
          return { success: false, error: message };
        }
      },

      verifySignupOtp: async (email, fullName, password, otpCode, role) => {
        try {
          const response = await apiClient.post<Record<string, unknown>>(
            "/auth/verify-signup-otp",
            {
              email,
              fullName,
              password,
              otpCode,
              role,
            },
          );
          const { accessToken, refreshToken } = extractTokens(response);

          let userData = response["user"] as Record<string, unknown> | undefined;
          if (!userData) {
            if (accessToken || refreshToken) {
              set({
                accessToken: accessToken ?? null,
                refreshToken: refreshToken ?? null,
              });
            }
            userData = await apiClient.get<Record<string, unknown>>("/auth/me");
          }

          const parsedUser = mapUser(userData);
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
          const message = error instanceof Error ? error.message : "OTP verification failed";
          return { success: false, error: message };
        }
      },

      // ─── OTP RESET PASSWORD ──────────────────────────────────
      sendResetOtp: async (email) => {
        try {
          await apiClient.post("/auth/send-reset-otp", { email });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to send reset OTP";
          return { success: false, error: message };
        }
      },

      verifyResetOtp: async (email, otpCode, newPassword) => {
        try {
          await apiClient.post("/auth/verify-reset-otp", {
            email,
            otpCode,
            newPassword,
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Password reset failed";
          return { success: false, error: message };
        }
      },

      // ─── OTP CHANGE EMAIL ──────────────────────────────────
      sendChangeEmailOtp: async (newEmail) => {
        try {
          await apiClient.post("/auth/me/email/send-otp", { newEmail });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to send code";
          return { success: false, error: message };
        }
      },

      verifyChangeEmailOtp: async (newEmail, otpCode) => {
        try {
          await apiClient.post("/auth/me/email/verify-otp", { newEmail, otpCode });

          // Update local user state
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, email: newEmail }
            });
          }

          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Email verification failed";
          return { success: false, error: message };
        }
      },

      // ─── LOGOUT ─────────────────────────────────────────────
      logout: async () => {
        try {
          const { refreshToken } = get();
          const payload = refreshToken ? { refreshToken } : {};
          await apiClient.post("/auth/logout", payload).catch(() => { });
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

          const me = await apiClient.get<Record<string, unknown>>("/auth/me");
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
            const userData = await apiClient.get<Record<string, unknown>>("/auth/me");
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

      updateProfile: async (data) => {
        try {
          const payload: Record<string, unknown> = {};

          if (typeof data.name === "string") {
            payload["fullName"] = data.name.trim();
          }
          if (typeof data.avatarUrl === "string") {
            payload["avatarUrl"] = data.avatarUrl;
          }
          if (typeof data.isAvailable === "boolean") {
            payload["isAvailable"] = data.isAvailable;
          }
          if (typeof data.phone === "string") {
            payload["phone"] = data.phone.trim();
          }
          if (typeof data.jobTitle === "string") {
            payload["jobTitle"] = data.jobTitle.trim();
          }

          const updatedUser = await apiClient.patch<Record<string, unknown>>(
            "/auth/me",
            payload,
          );
          const currentUser = get().user;
          if (!currentUser) {
            return { success: false, error: "Not authenticated" };
          }

          const nextName =
            typeof updatedUser["fullName"] === "string"
              ? (updatedUser["fullName"] as string)
              : typeof updatedUser["name"] === "string"
                ? (updatedUser["name"] as string)
                : currentUser.name;

          const nextEmail =
            typeof updatedUser["email"] === "string"
              ? (updatedUser["email"] as string)
              : currentUser.email;

          const nextNameAr =
            typeof updatedUser["nameAr"] === "string"
              ? (updatedUser["nameAr"] as string)
              : currentUser.nameAr;

          const nextPhone =
            typeof updatedUser["phone"] === "string"
              ? (updatedUser["phone"] as string)
              : data.phone !== undefined
                ? data.phone
                : currentUser.phone;

          const nextAvatarUrl =
            typeof updatedUser["avatarUrl"] === "string"
              ? (updatedUser["avatarUrl"] as string)
              : typeof updatedUser["avatar"] === "string"
                ? (updatedUser["avatar"] as string)
                : data.avatarUrl !== undefined
                  ? data.avatarUrl
                  : currentUser.avatarUrl;

          const nextJobTitle =
            typeof updatedUser["jobTitle"] === "string"
              ? (updatedUser["jobTitle"] as string)
              : data.jobTitle !== undefined
                ? data.jobTitle
                : currentUser.jobTitle;

          const nextIsAvailable =
            typeof updatedUser["isAvailable"] === "boolean"
              ? (updatedUser["isAvailable"] as boolean)
              : currentUser.isAvailable;

          const nextPasswordUpdatedAt =
            typeof updatedUser["passwordUpdatedAt"] === "string"
              ? (updatedUser["passwordUpdatedAt"] as string)
              : currentUser.passwordUpdatedAt;

          set({
            user: {
              ...currentUser,
              name: nextName,
              nameAr: nextNameAr,
              email: nextEmail,
              phone: nextPhone,
              avatarUrl: nextAvatarUrl,
              jobTitle: nextJobTitle,
              isAvailable: nextIsAvailable,
              passwordUpdatedAt: nextPasswordUpdatedAt,
            },
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Update failed";
          return { success: false, error: message };
        }
      },

      toggleAvailability: async () => {
        try {
          const { user, updateProfile } = get();
          if (!user) return { success: false, error: "Not authenticated" };
          return await updateProfile({ isAvailable: !user.isAvailable });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Toggle failed";
          return { success: false, error: message };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          await apiClient.patch("/auth/me/password", {
            currentPassword,
            newPassword,
          });
          return { success: true };
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Password change failed";
          return { success: false, error: message };
        }
      },

      deleteAccount: async () => {
        try {
          await apiClient.delete("/auth/me");
          get().logout();
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Account deletion failed";
          return { success: false, error: message };
        }
      },

      generate2fa: async () => {
        try {
          const response = await apiClient.post<{ qrUrl: string }>("/auth/me/2fa/generate");
          return { success: true, qrUrl: response.qrUrl };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to generate 2FA";
          return { success: false, error: message };
        }
      },

      enable2fa: async (code) => {
        try {
          await apiClient.post("/auth/me/2fa/enable", { code });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to enable 2FA";
          return { success: false, error: message };
        }
      },

      getSessions: async () => {
        try {
          return await apiClient.get<unknown[]>("/auth/me/sessions");
        } catch {
          return [];
        }
      },

      revokeSession: async (sessionId) => {
        try {
          await apiClient.delete(`/auth/me/sessions/${sessionId}`);
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to revoke session";
          return { success: false, error: message };
        }
      },
      setUser: (user) => set({ user }),
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
