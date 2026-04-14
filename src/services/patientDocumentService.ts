import { apiClient } from "@/lib/apiClient";
import type {
  ApiPatientDocument,
  CreatePatientDocumentPayload,
} from "@/types";

export const patientDocumentService = {
  async getAll(patientId: string): Promise<ApiPatientDocument[]> {
    return apiClient.get(`/patients/${patientId}/documents`);
  },

  async create(
    patientId: string,
    payload: CreatePatientDocumentPayload,
  ): Promise<ApiPatientDocument> {
    return apiClient.post(`/patients/${patientId}/documents`, payload);
  },

  async remove(
    patientId: string,
    documentId: string,
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete(`/patients/${patientId}/documents/${documentId}`);
  },
};
