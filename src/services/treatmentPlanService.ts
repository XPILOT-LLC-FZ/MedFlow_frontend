import { apiClient } from "@/lib/apiClient";
import type {
  ApiTreatmentPlan,
  CreateTreatmentPlanPayload,
  TreatmentPlanListFilters,
  UpdateTreatmentPlanPayload,
} from "@/types";

const toQueryString = (filters?: TreatmentPlanListFilters) => {
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

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const treatmentPlanService = {
  async getAll(filters?: TreatmentPlanListFilters): Promise<ApiTreatmentPlan[]> {
    return apiClient.get(`/treatment-plans${toQueryString(filters)}`);
  },

  async getById(id: string): Promise<ApiTreatmentPlan> {
    return apiClient.get(`/treatment-plans/${id}`);
  },

  async create(payload: CreateTreatmentPlanPayload): Promise<ApiTreatmentPlan> {
    return apiClient.post("/treatment-plans", payload);
  },

  async update(id: string, payload: UpdateTreatmentPlanPayload): Promise<ApiTreatmentPlan> {
    return apiClient.patch(`/treatment-plans/${id}`, payload);
  },

  async incrementProgress(
    id: string,
    incrementBy = 1,
  ): Promise<ApiTreatmentPlan> {
    return apiClient.patch(`/treatment-plans/${id}/progress`, { incrementBy });
  },
};
