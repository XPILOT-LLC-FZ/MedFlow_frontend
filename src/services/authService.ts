/**
 * Auth Service — wraps useAuthStore.
 * Swap internals to fetch() when backend is ready.
 */
import { useAuthStore, type AuthUser, type SignupData } from "@/stores/useAuthStore";
import { roleDashboardMap } from "@/data/mockUsers";
import type { Role } from "@/types";

export interface LoginResult { success: boolean; error?: string }

export const authService = {
  login(email: string, password: string): LoginResult {
    return useAuthStore.getState().login(email, password);
  },

  loginWithGoogle(): LoginResult {
    // Mock Google login → always creates a patient
    const mockGoogleUser: AuthUser = {
      id: `usr_google_${Date.now()}`,
      name: "Google User",
      nameAr: "مستخدم جوجل",
      email: "google.user@gmail.com",
      role: "PATIENT",
      phone: "",
    };
    useAuthStore.setState({ user: mockGoogleUser, isAuthenticated: true });
    return { success: true };
  },

  signup(data: SignupData): LoginResult {
    return useAuthStore.getState().signup(data);
  },

  logout(): void {
    useAuthStore.getState().logout();
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
};
