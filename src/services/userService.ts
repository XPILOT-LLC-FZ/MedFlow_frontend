/**
 * User Service — aggregates user data from multiple sources.
 * Swap internals to fetch() when backend is ready.
 */
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { mockUsers } from "@/data/mockUsers";
import type { Role } from "@/types";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  lastLogin?: string;
}

export const userService = {
  getAll(): SystemUser[] {
    const staff = useStaffStore.getState().staff;
    const registered = useAuthStore.getState().registeredUsers;

    const users: SystemUser[] = [];

    // Mock users
    mockUsers.forEach((u) => {
      users.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: "active",
        lastLogin: "2026-04-03",
      });
    });

    // Staff members (may overlap with mock users by email)
    staff.forEach((s) => {
      if (!users.some((u) => u.email === s.email)) {
        users.push({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          status: s.status === "active" ? "active" : "inactive",
        });
      }
    });

    // Registered users from signup
    registered.forEach((r) => {
      if (!users.some((u) => u.email === r.email)) {
        users.push({
          id: `reg-${r.email}`,
          name: r.name,
          email: r.email,
          role: "PATIENT",
          status: "active",
        });
      }
    });

    return users;
  },

  getStats() {
    const users = this.getAll();
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      byRole: {
        PATIENT: users.filter((u) => u.role === "PATIENT").length,
        DOCTOR: users.filter((u) => u.role === "DOCTOR").length,
        RECEPTION: users.filter((u) => u.role === "RECEPTION").length,
        MEDICAL_ADMIN: users.filter((u) => u.role === "MEDICAL_ADMIN").length,
        SUPER_ADMIN: users.filter((u) => u.role === "SUPER_ADMIN").length,
      },
    };
  },
};
