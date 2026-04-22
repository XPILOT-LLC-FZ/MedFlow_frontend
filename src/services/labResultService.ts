import { apiClient } from "@/lib/apiClient";
import type {
  ApiLabResult,
  CreateLabResultPayload,
  LabResultStatus,
  UpdateLabResultPayload,
} from "@/types";

type Query = {
  patientId?: string;
  appointmentId?: string;
  status?: LabResultStatus;
};

export const labResultService = {
  async getAll(query?: Query): Promise<ApiLabResult[]> {
    return apiClient.get("/lab-results", { params: query });
  },

  async create(payload: CreateLabResultPayload): Promise<ApiLabResult> {
    return apiClient.post("/lab-results", payload);
  },

  async update(id: string, payload: UpdateLabResultPayload): Promise<ApiLabResult> {
    return apiClient.patch(`/lab-results/${id}`, payload);
  },

  async remove(id: string): Promise<{ deleted: boolean }> {
    return apiClient.delete(`/lab-results/${id}`);
  },
};
