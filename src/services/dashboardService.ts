import { apiClient } from "@/lib/apiClient";
import type {
  DashboardAdminSummaryData,
  DashboardDoctorSummaryData,
  DashboardPatientSummaryData,
  DashboardStaffSummaryData,
  DashboardSuperAdminSummaryData,
  DashboardSummaryResponse,
} from "@/types";

export interface DashboardSummaryFilters {
  startDate?: string;
  endDate?: string;
  period?: "day" | "week" | "month" | "quarter" | "year";
  topDoctorsLimit?: number;
}

function toQuery(filters?: DashboardSummaryFilters): string {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.period) params.set("period", filters.period);
  if (typeof filters.topDoctorsLimit === "number") {
    params.set("topDoctorsLimit", String(filters.topDoctorsLimit));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export const dashboardService = {
  async getSummary(filters?: DashboardSummaryFilters): Promise<DashboardSummaryResponse> {
    const qs = toQuery(filters);
    return apiClient.get(`/dashboard/summary${qs}`);
  },

  async getAdminSummary(filters?: DashboardSummaryFilters): Promise<DashboardAdminSummaryData> {
    const response = await this.getSummary(filters);
    return response.data as unknown as DashboardAdminSummaryData;
  },

  async getStaffSummary(filters?: DashboardSummaryFilters): Promise<DashboardStaffSummaryData> {
    const response = await this.getSummary(filters);
    return response.data as unknown as DashboardStaffSummaryData;
  },

  async getDoctorSummary(filters?: DashboardSummaryFilters): Promise<DashboardDoctorSummaryData> {
    const response = await this.getSummary(filters);
    return response.data as unknown as DashboardDoctorSummaryData;
  },

  async getSuperAdminSummary(filters?: DashboardSummaryFilters): Promise<DashboardSuperAdminSummaryData> {
    const response = await this.getSummary(filters);
    return response.data as unknown as DashboardSuperAdminSummaryData;
  },

  async getPatientSummary(filters?: DashboardSummaryFilters): Promise<DashboardPatientSummaryData> {
    const response = await this.getSummary(filters);
    return response.data as unknown as DashboardPatientSummaryData;
  },
};
