import type { Role } from "@/types";

/**
 * Human-readable labels for roles.
 * Note: STAFF is displayed as "Reception" in the UI.
 */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  STAFF: "Reception",
  PATIENT: "Patient",
};

/**
 * Permission groups for RBAC.
 */
const PERMISSIONS = {
  viewAllAppointments: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  manageStaff: ["SUPER_ADMIN", "ADMIN"],
  manageDoctors: ["SUPER_ADMIN", "ADMIN"],
  viewPatients: ["SUPER_ADMIN", "ADMIN", "STAFF", "DOCTOR"],
  manageClinic: ["SUPER_ADMIN", "ADMIN"],
  viewOwnAppointments: ["PATIENT", "DOCTOR"],
  managePromotions: ["SUPER_ADMIN", "ADMIN"],
  manageServices: ["SUPER_ADMIN", "ADMIN"],
  viewSuperDashboard: ["SUPER_ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Checks if a role has a specific permission.
 */
export function can(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
}

/**
 * Checks if a role is one of the administrative roles (Super Admin or Admin).
 */
export function isAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

/**
 * Checks if a role is a clinic staff role (Admin, Doctor, or Staff).
 */
export function isClinicStaff(role: Role): boolean {
  return role === "ADMIN" || role === "DOCTOR" || role === "STAFF";
}
