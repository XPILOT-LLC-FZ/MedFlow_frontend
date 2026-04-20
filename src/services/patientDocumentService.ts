import { apiClient } from "@/lib/apiClient";
import type {
  ApiPatientDocument,
  CreatePatientDocumentPayload,
} from "@/types";

export const PATIENT_DOCUMENTS_ACCESS_BLOCKED =
  "PATIENT_DOCUMENTS_ACCESS_BLOCKED";

type PatientDocumentsApiShape =
  | ApiPatientDocument[]
  | { documents?: ApiPatientDocument[] | null }
  | null
  | undefined;

function toDocumentsArray(payload: PatientDocumentsApiShape): ApiPatientDocument[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray(payload.documents)
  ) {
    return payload.documents;
  }

  return [];
}

export const patientDocumentService = {
  async getAll(patientId: string): Promise<ApiPatientDocument[]> {
    return apiClient.get(`/patients/${patientId}/documents`);
  },

  async getCurrentPatientDocuments(): Promise<ApiPatientDocument[]> {
    try {
      const payload = await apiClient.get<PatientDocumentsApiShape>(
        `/patients/me/documents`,
      );
      return toDocumentsArray(payload);
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";

      const isRouteCompatibilityMiss =
        status === 404 ||
        (status === 403 && message.includes("forbidden resource"));

      if (!isRouteCompatibilityMiss) {
        throw error;
      }

      const blockedError = new Error(PATIENT_DOCUMENTS_ACCESS_BLOCKED) as Error & {
        status?: number;
      };
      blockedError.status = status;
      throw blockedError;
    }
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
    try {
      return await apiClient.post(
        `/patients/me/appointments/${appointmentId}/documents`,
        payload,
      );
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;

      if (status !== 404) {
        throw error;
      }

      return apiClient.post(`/patients/me/documents`, {
        ...payload,
        appointmentId,
      });
    }
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
