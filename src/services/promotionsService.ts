/**
 * Promotions Service — handles Promotion and Discount API calls.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiPromotion } from "@/types";

export const promotionsService = {
  async getAll(): Promise<ApiPromotion[]> {
    return apiClient.get("/promotions");
  },

  async getApplicable(): Promise<ApiPromotion[]> {
    return apiClient.get("/promotions/applicable");
  },

  async create(data: Partial<ApiPromotion>): Promise<ApiPromotion> {
    return apiClient.post("/promotions", data);
  },

  async toggleActive(id: string): Promise<ApiPromotion> {
    return apiClient.patch(`/promotions/${id}/toggle`, {});
  },
};
