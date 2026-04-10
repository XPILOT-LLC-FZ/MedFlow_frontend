/**
 * Services Catalog Service — handles Clinic Services management.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiService, CreateServicePayload, UpdateServicePayload } from "@/types";

export const servicesCatalogService = {
  async getAll(filters?: Record<string, unknown>): Promise<ApiService[]> {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return apiClient.get(`/services${qs}`);
  },

  async getById(id: string): Promise<ApiService> {
    return apiClient.get(`/services/${id}`);
  },

  async create(data: CreateServicePayload): Promise<ApiService> {
    return apiClient.post("/services", data);
  },

  async update(id: string, data: UpdateServicePayload): Promise<ApiService> {
    return apiClient.patch(`/services/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/services/${id}`);
  },
};
