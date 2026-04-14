import { apiClient } from "@/lib/apiClient";
import type {
  ApiPrescription,
  CreatePrescriptionPayload,
  PrescriptionStatus,
  UpdatePrescriptionPayload,
} from "@/types";

type Query = {
  patientId?: string;
  appointmentId?: string;
  status?: PrescriptionStatus;
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

export const prescriptionService = {
  async getAll(query?: Query): Promise<ApiPrescription[]> {
    return apiClient.get(`/prescriptions${toQuery(query)}`);
  },

  async create(payload: CreatePrescriptionPayload): Promise<ApiPrescription> {
    return apiClient.post("/prescriptions", payload);
  },

  async update(
    id: string,
    payload: UpdatePrescriptionPayload,
  ): Promise<ApiPrescription> {
    return apiClient.patch(`/prescriptions/${id}`, payload);
  },

  async remove(id: string): Promise<{ deleted: boolean }> {
    return apiClient.delete(`/prescriptions/${id}`);
  },
};
