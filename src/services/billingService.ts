import { apiClient } from "@/lib/apiClient";
import type { ApiInvoice } from "@/types";

export interface InvoiceListResponse {
  items: ApiInvoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceStats {
  totalBilled: number;
  outstandingBalance: number;
  collectionRate: number;
}

export const billingService = {
  async getAll(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<InvoiceListResponse> {
    const response = await apiClient.get<InvoiceListResponse>("/invoices", { params });
    return response;
  },

  async getStats(): Promise<InvoiceStats> {
    const response = await apiClient.get<InvoiceStats>("/invoices/stats");
    return response;
  },
};
