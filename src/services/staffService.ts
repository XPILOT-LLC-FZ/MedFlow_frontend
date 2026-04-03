/**
 * Staff Service — wraps useStaffStore.
 * Swap internals to fetch() when backend is ready.
 */
import { useStaffStore, type StaffMember } from "@/stores/useStaffStore";

export const staffService = {
  getAll(): StaffMember[] {
    return useStaffStore.getState().staff;
  },

  getDoctors(): StaffMember[] {
    return useStaffStore.getState().getDoctors();
  },

  getReception(): StaffMember[] {
    return useStaffStore.getState().getReception();
  },

  getById(id: string): StaffMember | undefined {
    return useStaffStore.getState().staff.find((s) => s.id === id);
  },

  add(member: Omit<StaffMember, "id" | "joinDate">): void {
    useStaffStore.getState().addStaff(member);
  },

  update(id: string, updates: Partial<StaffMember>): void {
    useStaffStore.getState().updateStaff(id, updates);
  },

  remove(id: string): void {
    useStaffStore.getState().deleteStaff(id);
  },

  changeRole(id: string, newRole: "DOCTOR" | "RECEPTION"): void {
    useStaffStore.getState().changeRole(id, newRole);
  },

  getStats() {
    const staff = useStaffStore.getState().staff;
    return {
      totalStaff: staff.length,
      totalDoctors: staff.filter((s) => s.role === "DOCTOR").length,
      totalReception: staff.filter((s) => s.role === "RECEPTION").length,
      activeStaff: staff.filter((s) => s.status === "active").length,
      onLeave: staff.filter((s) => s.status === "on-leave").length,
    };
  },
};
