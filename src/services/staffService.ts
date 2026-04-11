/**
 * Staff Service — handles Doctor-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import type {
  ApiDoctor,
  CreateDoctorPayload,
  DoctorShift,
  ResetDoctorPasswordPayload,
  UpdateDoctorPayload,
} from "@/types";

export const staffService = {
  async getDoctors(filters?: Record<string, unknown>): Promise<ApiDoctor[]> {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return apiClient.get(`/doctors${qs}`);
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
