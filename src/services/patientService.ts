/**
 * Patient Service — handles Patient-related API calls.
 */
import { apiClient } from "@/lib/apiClient";
import type {
  ApiDoctor,
  ApiLoyaltyTransaction,
  ApiPatient,
  ApiPublicDoctor,
  CreatePatientPayload,
  PaginatedPatientsResponse,
  PatientListFilters,
} from "@/types";

const normalizePagedPatientsResponse = (
  raw: unknown,
  filters?: PatientListFilters,
): PaginatedPatientsResponse => {
  const requestedPage = filters?.page ?? 1;
  const requestedTake = filters?.take ?? 20;

  if (Array.isArray(raw)) {
    const rows = raw as ApiPatient[];
    return {
      data: rows,
      meta: {
        page: requestedPage,
        take: requestedTake,
        total: rows.length,
        totalPages: rows.length === 0 ? 0 : 1,
      },
    };
  }

  if (raw && typeof raw === "object") {
    const record = raw as {
      data?: unknown;
      meta?: {
        page?: number;
        take?: number;
        total?: number;
        totalPages?: number;
      };
    };

    const rows = Array.isArray(record.data) ? (record.data as ApiPatient[]) : [];
    const total = record.meta?.total ?? rows.length;
    const take = record.meta?.take ?? requestedTake;
    const page = record.meta?.page ?? requestedPage;
    const totalPages =
      record.meta?.totalPages ?? (total === 0 ? 0 : Math.ceil(total / Math.max(1, take)));

    return {
      data: rows,
      meta: {
        page,
        take,
        total,
        totalPages,
      },
    };
  }

  return {
    data: [],
    meta: {
      page: requestedPage,
      take: requestedTake,
      total: 0,
      totalPages: 0,
    },
  };
};

const toQueryString = (filters?: PatientListFilters) => {
  if (!filters) return "";

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.set(key, String(value));
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const patientService = {
  async getAll(filters?: PatientListFilters): Promise<ApiPatient[]> {
    return apiClient.get(`/patients${toQueryString(filters)}`);
  },

  async getPage(filters?: PatientListFilters): Promise<PaginatedPatientsResponse> {
    const raw = await apiClient.get<unknown>(`/patients/paged${toQueryString(filters)}`);
    return normalizePagedPatientsResponse(raw, filters);
  },

  async getMe(): Promise<ApiPatient> {
    return apiClient.get("/patients/me");
  },

  async getById(id: string): Promise<ApiPatient> {
    return apiClient.get(`/patients/${id}`);
  },

  async create(data: CreatePatientPayload): Promise<ApiPatient> {
    return apiClient.post("/patients", data);
  },

  async update(id: string, data: Partial<ApiPatient>): Promise<ApiPatient> {
    return apiClient.patch(`/patients/${id}`, data);
  },

  async getStats() {
    const patients = await this.getAll();
    return {
      totalPatients: patients.length,
      // Add more client-side stats if needed
    };
  },

  async getDoctors(params?: { search?: string; specialization?: string }): Promise<ApiPublicDoctor[]> {
    return apiClient.get("/patients/doctors", { params });
  },

  async getFavoriteDoctors(): Promise<ApiDoctor[]> {
    return apiClient.get("/patients/me/favorites");
  },

  async addFavoriteDoctor(doctorId: string): Promise<void> {
    await apiClient.post("/patients/me/favorites", { doctorId });
  },

  async removeFavoriteDoctor(doctorId: string): Promise<void> {
    await apiClient.delete(`/patients/me/favorites/${doctorId}`);
  },
  
  async getLoyaltyHistory(): Promise<ApiLoyaltyTransaction[]> {
    return apiClient.get("/patients/me/loyalty-history");
  },

  async verifyInsurance(id: string, data: { status: 'verified' | 'rejected'; discountPercent?: number; discountNote?: string; verifiedBy: string }): Promise<ApiPatient> {
    return apiClient.patch(`/patients/${id}/insurance/verify`, data);
  },
};

