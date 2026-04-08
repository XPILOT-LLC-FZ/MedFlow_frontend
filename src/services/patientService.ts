/**
 * Patient Service — handles Patient-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiPatient } from "@/types";

export const patientService = {
  async getAll(filters?: Record<string, unknown>): Promise<ApiPatient[]> {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return apiClient.get(`/patients${qs}`);
  },

  async getMe(): Promise<ApiPatient> {
    return apiClient.get("/patients/me");
  },

  async getById(id: string): Promise<ApiPatient> {
    return apiClient.get(`/patients/${id}`);
  },

  async create(data: Partial<ApiPatient>): Promise<ApiPatient> {
    return apiClient.post("/patients", data);
  },

  async update(id: string, data: Partial<ApiPatient>): Promise<ApiPatient> {
    return apiClient.patch(`/patients/${id}`, data);
  },

  async getStats() {
    const patients = await this.getAll();
    return {
      totalPatients: patients.length,
      // Add more client-side stats if needed
    };
  },
};
