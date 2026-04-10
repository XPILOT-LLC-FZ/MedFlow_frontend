/**
 * Auth Service — wraps useAuthStore.
 */
import { useAuthStore, roleDashboardMap, normalizeRole, type AuthUser, type SignupData } from "@/stores/useAuthStore";
import { apiClient } from "@/lib/apiClient";
import type { Role } from "@/types";

export interface LoginResult { success: boolean; isNewUser?: boolean; error?: string }

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    return useAuthStore.getState().login(email, password);
  },

  async loginWithGoogle(token: string, role?: "PATIENT" | "ADMIN"): Promise<LoginResult> {
    return useAuthStore.getState().loginWithGoogle(token, role);
  },

  async signup(data: SignupData): Promise<LoginResult> {
    return useAuthStore.getState().signup(data);
  },

  async logout(): Promise<void> {
    await useAuthStore.getState().logout();
  },

  async updateProfile(data: Partial<AuthUser>): Promise<LoginResult> {
    return useAuthStore.getState().updateProfile(data);
  },

  getUser(): AuthUser | null {
    return useAuthStore.getState().user;
  },

  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  },

  getDashboardPath(): string {
    return useAuthStore.getState().getDashboardPath();
  },

  getRoleDashboard(role: Role): string {
    return roleDashboardMap[role];
  },

  async bootSession(force?: boolean): Promise<void> {
    return useAuthStore.getState().bootSession(force);
  }
};
