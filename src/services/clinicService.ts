/**
 * Clinic Service — handles Clinic and Branch management.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiClinic, ApiBranch } from "@/types";

export const clinicService = {
  // Clinic Management
  async getClinic(): Promise<ApiClinic> {
    return apiClient.get("/clinic");
  },

  async updateClinic(data: Partial<ApiClinic>): Promise<ApiClinic> {
    return apiClient.patch("/clinic", data);
  },

  // Branch Management
  async getBranches(): Promise<ApiBranch[]> {
    return apiClient.get("/clinic/branches");
  },

  async createBranch(data: Partial<ApiBranch>): Promise<ApiBranch> {
    return apiClient.post("/clinic/branches", data);
  },

  async updateBranch(id: string, data: Partial<ApiBranch>): Promise<ApiBranch> {
    return apiClient.patch(`/clinic/branches/${id}`, data);
  },

  async deleteBranch(id: string): Promise<void> {
    return apiClient.delete(`/clinic/branches/${id}`);
  },
};
