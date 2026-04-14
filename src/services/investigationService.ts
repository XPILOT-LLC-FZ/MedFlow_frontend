import { apiClient } from "@/lib/apiClient";
import type {
  ApiInvestigation,
  CreateInvestigationPayload,
  InvestigationCategory,
  InvestigationStatus,
  UpdateInvestigationPayload,
} from "@/types";

type Query = {
  patientId?: string;
  appointmentId?: string;
  category?: InvestigationCategory;
  status?: InvestigationStatus;
  priority?: "NORMAL" | "URGENT" | "VIP";
};

const toQuery = (query?: Query) => {
  if (!query) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export const investigationService = {
  async getAll(query?: Query): Promise<ApiInvestigation[]> {
    return apiClient.get(`/investigations${toQuery(query)}`);
  },

  async create(payload: CreateInvestigationPayload): Promise<ApiInvestigation> {
    return apiClient.post("/investigations", payload);
  },

  async update(
    id: string,
    payload: UpdateInvestigationPayload,
  ): Promise<ApiInvestigation> {
    return apiClient.patch(`/investigations/${id}`, payload);
  },

  async remove(id: string): Promise<{ deleted: boolean }> {
    return apiClient.delete(`/investigations/${id}`);
  },
};
