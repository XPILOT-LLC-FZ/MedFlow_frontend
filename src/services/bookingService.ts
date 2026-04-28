/**
 * Booking Service — handles Appointment-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import { formatDateKey } from "@/lib/dateUtils";
import type {
  ApiAppointment,
  ApiReceptionHandoff,
  AppointmentSummaryResponse,
  CreateReceptionHandoffPayload,
  NotifyAppointmentWhatsAppPayload,
  NotifyAppointmentWhatsAppResponse,
  QueryReceptionHandoffsParams,
  RescheduleAppointmentPayload,
  SmartRecommendationsResponse,
  UpsertMedicalSummaryPayload,
} from "@/types";

export const bookingService = {
  async getAll(filters?: Record<string, unknown>): Promise<ApiAppointment[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
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

  async notifyPatientOnWhatsApp(
    id: string,
    payload: NotifyAppointmentWhatsAppPayload,
  ): Promise<NotifyAppointmentWhatsAppResponse> {
    return apiClient.post(`/appointments/${id}/notify-whatsapp`, payload);
  },

  async createReceptionHandoff(
    id: string,
    payload: CreateReceptionHandoffPayload,
  ): Promise<ApiReceptionHandoff> {
    return apiClient.post(`/appointments/${id}/reception-handoff`, payload);
  },

  async getReceptionHandoffs(
    params?: QueryReceptionHandoffsParams,
  ): Promise<ApiReceptionHandoff[]> {
    const search = new URLSearchParams();
    if (params?.status) {
      search.set("status", params.status);
    }
    if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
      search.set("limit", String(params.limit));
    }
    if (params?.clinicId) {
      search.set("clinicId", params.clinicId);
    }

    const query = search.toString();
    const qs = query ? `?${query}` : "";
    return apiClient.get(`/appointments/reception-handoffs${qs}`);
  },

  async markReceptionHandoffReviewed(
    handoffId: string,
  ): Promise<ApiReceptionHandoff> {
    return apiClient.patch(`/appointments/reception-handoffs/${handoffId}/review`, {});
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

  async getSmartRecommendations(options?: {
    patientId?: string;
    doctorId?: string;
    serviceId?: string;
    durationMinutes?: number;
    horizonDays?: number;
    limit?: number;
  }): Promise<SmartRecommendationsResponse> {
    const params = new URLSearchParams();

    if (options?.patientId) params.set("patientId", options.patientId);
    if (options?.doctorId) params.set("doctorId", options.doctorId);
    if (options?.serviceId) params.set("serviceId", options.serviceId);

    if (
      typeof options?.durationMinutes === "number" &&
      Number.isFinite(options.durationMinutes)
    ) {
      params.set("durationMinutes", String(options.durationMinutes));
    }

    if (
      typeof options?.horizonDays === "number" &&
      Number.isFinite(options.horizonDays)
    ) {
      params.set("horizonDays", String(options.horizonDays));
    }

    if (typeof options?.limit === "number" && Number.isFinite(options.limit)) {
      params.set("limit", String(options.limit));
    }

    const response = await apiClient.get<unknown>(
      `/appointments/smart-recommendations?${params.toString()}`,
    );

    if (response && typeof response === "object") {
      const payload = response as Partial<SmartRecommendationsResponse>;
      return {
        generatedAt:
          typeof payload.generatedAt === "string"
            ? payload.generatedAt
            : new Date().toISOString(),
        horizonDays:
          typeof payload.horizonDays === "number" ? payload.horizonDays : 7,
        recommendations: Array.isArray(payload.recommendations)
          ? payload.recommendations
          : [],
      };
    }

    return {
      generatedAt: new Date().toISOString(),
      horizonDays: 7,
      recommendations: [],
    };
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
