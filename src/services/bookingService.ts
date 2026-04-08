/**
 * Booking Service — handles Appointment-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiAppointment } from "@/types";

export const bookingService = {
  async getAll(filters?: Record<string, unknown>): Promise<ApiAppointment[]> {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return apiClient.get(`/appointments${qs}`);
  },

  async getById(id: string): Promise<ApiAppointment> {
    return apiClient.get(`/appointments/${id}`);
  },

  async create(data: Partial<ApiAppointment>): Promise<ApiAppointment> {
    return apiClient.post("/appointments", data);
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<ApiAppointment> {
    return apiClient.patch(`/appointments/${id}/status`, { status, notes });
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const params = new URLSearchParams({ doctorId, date });
    const response = await apiClient.get(`/appointments/slots?${params.toString()}`);

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.slots)) return response.slots;
    if (Array.isArray(response?.availableSlots)) return response.availableSlots;
    return [];
  },

  async getStats() {
    const today = new Date().toISOString().split("T")[0];
    const appointments = await this.getAll({ startDate: today, endDate: today });
    // This is a simplified client-side aggregation for stats
    return {
      totalToday: appointments.length,
      pending: appointments.filter((a) => a.status === "SCHEDULED").length,
      confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    };
  },
};
