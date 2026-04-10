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
      return apiUsers.map((u) => {
        const raw = u as unknown as { fullName?: string };

        return {
          id: u.id,
          name: u.name || raw.fullName || "Unknown User",
          email: u.email || "",
          role: normalizeRole(u.role),
          status: u.isActive ? "active" : "inactive",
          phone: u.phone,
          lastLogin: u.createdAt,
        };
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("403") || message.includes("Forbidden")) {
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
    return apiUsers.map((u) => {
      const raw = u as unknown as Record<string, unknown>;

      const fullName =
        typeof raw.fullName === "string"
          ? raw.fullName
          : typeof raw.name === "string"
            ? raw.name
            : "Unknown User";

      const email = typeof raw.email === "string" ? raw.email : "";
      const phone = typeof raw.phone === "string" ? raw.phone : undefined;
      const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : undefined;
      const rawRole = typeof raw.role === "string" ? raw.role : "STAFF";
      const rawStatus = typeof raw.status === "string" ? raw.status : "INACTIVE";

      return {
        id: typeof raw.id === "string" ? raw.id : "",
        name: fullName,
        email,
        role: normalizeRole(rawRole),
        status: rawStatus === "ACTIVE" ? "active" : "inactive",
        phone,
        lastLogin: createdAt,
      };
    });
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
