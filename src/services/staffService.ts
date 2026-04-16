/**
 * Staff Service — handles Doctor-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import type {
  ApiDoctor,
  CreateDoctorPayload,
  DoctorListFilters,
  DoctorShift,
  ResetDoctorPasswordPayload,
  UpdateDoctorPayload,
} from "@/types";

const toQueryString = (filters?: DoctorListFilters) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const staffService = {
  async getDoctors(filters?: DoctorListFilters): Promise<ApiDoctor[]> {
    return apiClient.get(`/doctors${toQueryString(filters)}`);
  },

  async getDoctorById(id: string): Promise<ApiDoctor> {
    return apiClient.get(`/doctors/${id}`);
  },

  async createDoctor(data: CreateDoctorPayload): Promise<ApiDoctor> {
    return apiClient.post("/doctors", data);
  },

  async updateDoctor(id: string, data: UpdateDoctorPayload): Promise<ApiDoctor> {
    return apiClient.patch(`/doctors/${id}`, data);
  },

  async getDoctorShifts(id: string): Promise<DoctorShift[]> {
    return apiClient.get(`/doctors/${id}/shifts`);
  },

  async updateDoctorShifts(id: string, shifts: DoctorShift[]): Promise<DoctorShift[]> {
    return apiClient.put(`/doctors/${id}/shifts`, shifts);
  },

  async resetDoctorPassword(
    id: string,
    payload: ResetDoctorPasswordPayload,
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.patch(`/doctors/${id}/password`, payload);
  },

  async getDoctorAvailability(id: string, date: string, serviceId?: string): Promise<unknown> {
    const params = new URLSearchParams({ date });
    if (serviceId) params.append("serviceId", serviceId);
    return apiClient.get(`/doctors/${id}/availability?${params.toString()}`);
  },

  /**
   * Returns the Doctor profile for the currently logged-in doctor user.
   * Uses /doctors/me/profile — no clinic context needed.
   */
  async getMyDoctorProfile(): Promise<ApiDoctor> {
    return apiClient.get(`/doctors/me/profile?t=${Date.now()}`);
  },

  /**
   * Deep-merges the supplied preferences object into the doctor's existing preferences.
   * Uses /doctors/me/preferences — no clinic context needed.
   */
  async updateMyPreferences(
    preferences: Record<string, unknown>,
  ): Promise<{ success: boolean; preferences: Record<string, unknown> }> {
    return apiClient.patch("/doctors/me/preferences", preferences);
  },

  async getStats() {
    // This might need a specialized endpoint or client-side aggregation
    const doctors = await this.getDoctors();
    return {
      totalDoctors: doctors.length,
      activeDoctors: doctors.filter((d) => d.status === "ACTIVE").length,
      onLeave: doctors.filter((d) => d.status === "ON_LEAVE").length,
    };
  },
};
