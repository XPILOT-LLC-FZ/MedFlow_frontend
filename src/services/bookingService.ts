/**
 * Booking Service — handles Appointment-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import { formatDateKey } from "@/lib/dateUtils";
import type {
  ApiAppointment,
  AppointmentSummaryResponse,
  RescheduleAppointmentPayload,
  UpsertMedicalSummaryPayload,
} from "@/types";

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

  async rescheduleAppointment(
    id: string,
    payload: RescheduleAppointmentPayload,
  ): Promise<ApiAppointment> {
    return apiClient.patch(`/appointments/${id}/reschedule`, payload);
  },

  async saveManualSummary(
    id: string,
    payload: UpsertMedicalSummaryPayload,
  ): Promise<{ appointmentId: string; summary: string; mode: string; sendToPatient: boolean }> {
    return apiClient.post(`/appointments/${id}/summary/manual`, payload);
  },

  async getSummary(id: string): Promise<AppointmentSummaryResponse> {
    return apiClient.get(`/appointments/${id}/summary`);
  },

  async getAvailableSlots(
    doctorId: string,
    date: string,
    options?: { serviceId?: string; durationMinutes?: number },
  ): Promise<string[]> {
    const params = new URLSearchParams({ doctorId, date });
    if (options?.serviceId) {
      params.set("serviceId", options.serviceId);
    }
    if (
      typeof options?.durationMinutes === "number" &&
      Number.isFinite(options.durationMinutes)
    ) {
      params.set("durationMinutes", String(options.durationMinutes));
    }

    const response = await apiClient.get<unknown>(
      `/appointments/slots?${params.toString()}`,
    );

    if (Array.isArray(response)) {
      return response.map((slot) => String(slot));
    }

    const responseRecord =
      typeof response === "object" && response !== null
        ? (response as Record<string, unknown>)
        : {};

    if (Array.isArray(responseRecord.slots)) {
      return responseRecord.slots.map((slot) => String(slot));
    }

    if (Array.isArray(responseRecord.availableSlots)) {
      return responseRecord.availableSlots.map((slot) => String(slot));
    }

    return [];
  },

  async getStats() {
    const today = formatDateKey(new Date());
    const appointments = await this.getAll({ startDate: today, endDate: today });
    // This is a simplified client-side aggregation for stats
    return {
      totalToday: appointments.length,
      pending: appointments.filter((a) => a.status === "SCHEDULED").length,
      confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    };
  },
};
