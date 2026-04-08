/**
 * Auth Service — wraps useAuthStore.
 */
import { useAuthStore, roleDashboardMap, normalizeRole, type AuthUser, type SignupData } from "@/stores/useAuthStore";
import { apiClient } from "@/lib/apiClient";
import type { Role } from "@/types";

export interface LoginResult { success: boolean; error?: string }

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    return useAuthStore.getState().login(email, password);
  },

  async loginWithGoogle(token: string): Promise<LoginResult> {
    try {
      const response = await apiClient.post("/auth/oauth/google", { token });
      const accessToken = response.access_token || response.accessToken;
      const refreshToken = response.refresh_token || response.refreshToken;
      const user = response.user;

      if (!accessToken) throw new Error("No access token received");

      // Sync cookie
      if (typeof document !== "undefined") {
        document.cookie = `clinic-os-auth=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      let userData = user;
      if (!userData) {
        useAuthStore.setState({ accessToken, refreshToken });
        userData = await apiClient.get("/auth/me");
      }

      useAuthStore.setState({ 
        user: {
          id: userData.id,
          name: userData.fullName || userData.name,
          nameAr: userData.nameAr,
          email: userData.email,
          role: normalizeRole(userData.role),
          phone: userData.phone,
        }, 
        accessToken,
        refreshToken,
        isAuthenticated: true 
      });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "OAuth login failed";
      return { success: false, error: message };
    }
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

  async bootSession(): Promise<void> {
    return useAuthStore.getState().bootSession();
  }
};
