import { apiClient } from "@/lib/apiClient";
import type {
  ApiPatientDocument,
  CreatePatientDocumentPayload,
} from "@/types";

export const patientDocumentService = {
  async getAll(patientId: string): Promise<ApiPatientDocument[]> {
    return apiClient.get(`/patients/${patientId}/documents`);
  },

  async getCurrentPatientDocuments(): Promise<ApiPatientDocument[]> {
    return apiClient.get(`/patients/me/documents`);
  },

  async getDocumentDownloadUrl(documentId: string): Promise<{ downloadUrl: string }> {
    return apiClient.get(`/patients/me/documents/${documentId}/download-token`);
  },

  async getDocumentDownloadUrlForPatient(
    patientId: string,
    documentId: string,
  ): Promise<{ downloadUrl: string }> {
    return apiClient.get(
      `/patients/${patientId}/documents/${documentId}/download-token`,
    );
  },

  async create(
    patientId: string,
    payload: CreatePatientDocumentPayload,
  ): Promise<ApiPatientDocument> {
    return apiClient.post(`/patients/${patientId}/documents`, payload);
  },

  async createForCurrentPatient(
    payload: CreatePatientDocumentPayload,
  ): Promise<ApiPatientDocument> {
    return apiClient.post(`/patients/me/documents`, payload);
  },

  async createForCurrentPatientAppointment(
    appointmentId: string,
    payload: CreatePatientDocumentPayload,
  ): Promise<ApiPatientDocument> {
    return apiClient.post(
      `/patients/me/appointments/${appointmentId}/documents`,
      payload,
    );
  },

  async remove(
    patientId: string,
    documentId: string,
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete(`/patients/${patientId}/documents/${documentId}`);
  },

  async removeForCurrentPatient(
    documentId: string,
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete(`/patients/me/documents/${documentId}`);
  },
};
