/**
 * Staff Service — handles Doctor-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiDoctor } from "@/types";

export const staffService = {
  async getDoctors(filters?: Record<string, unknown>): Promise<ApiDoctor[]> {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return apiClient.get(`/doctors${qs}`);
  },

  async getDoctorById(id: string): Promise<ApiDoctor> {
    return apiClient.get(`/doctors/${id}`);
  },

  async createDoctor(data: Partial<ApiDoctor>): Promise<ApiDoctor> {
    return apiClient.post("/doctors", data);
  },

  async updateDoctor(id: string, data: Partial<ApiDoctor>): Promise<ApiDoctor> {
    return apiClient.patch(`/doctors/${id}`, data);
  },

  async removeDoctor(id: string): Promise<void> {
    return apiClient.delete(`/doctors/${id}`);
  },

  async updateDoctorShifts(id: string, shifts: unknown): Promise<void> {
    return apiClient.patch(`/doctors/${id}/shifts`, { shifts });
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
