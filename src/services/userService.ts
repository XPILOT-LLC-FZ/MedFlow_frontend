/**
 * User Service — aggregates user data from the API.
 */
import { usersService } from "./usersService";
import { staffService } from "./staffService";
import { normalizeRole } from "@/stores/useAuthStore";
import type { Role } from "@/types";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  phone?: string;
  lastLogin?: string;
}

export const userService = {
  async getAll(): Promise<SystemUser[]> {
    try {
      const apiUsers = await usersService.getAll();
      return apiUsers.map(u => ({
        id: u.id,
        name: u.name || (u as any).fullName || "Unknown User",
        email: u.email || "",
        role: normalizeRole(u.role),
        status: u.isActive ? "active" : "inactive",
        phone: u.phone,
        lastLogin: u.createdAt,
      }));
    } catch (error: any) {
      if (error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
         console.warn("Global users access forbidden, falling back to staff-specific fetch");
         return this.getClinicStaff();
      }
      throw error;
    }
  },

  async getClinicStaff(): Promise<SystemUser[]> {
    // Attempting to use a clinic-scoped endpoint if available, or filtered doctors endpoint
    const apiUsers = await staffService.getDoctors({ role: "STAFF" }).catch(() => []);
    
    // If doctors endpoint only returns doctors, we might need a fallback or a specific /staff endpoint
    // For now, mapping whatever we get back to SystemUser
    return (apiUsers as any[]).map(u => ({
      id: u.id,
      name: u.fullName || u.name || "Unknown User",
      email: u.email || "",
      role: normalizeRole(u.role || "STAFF"),
      status: u.status === "ACTIVE" ? "active" : "inactive",
      phone: u.phone,
      lastLogin: u.createdAt,
    }));
  },

  async getStats() {
    const users = await this.getAll();
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      byRole: {
        PATIENT: users.filter((u) => u.role === "PATIENT").length,
        DOCTOR: users.filter((u) => u.role === "DOCTOR").length,
        STAFF: users.filter((u) => u.role === "STAFF").length,
        ADMIN: users.filter((u) => u.role === "ADMIN").length,
        SUPER_ADMIN: users.filter((u) => u.role === "SUPER_ADMIN").length,
      },
    };
  },
};
