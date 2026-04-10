/**
 * Inventory Service — backend API wrapper for inventory and restock operations.
 */
import { apiClient } from "@/lib/apiClient";
import type {
  ApiInventoryItem,
  ApiRestockRequest,
  CreateInventoryItemPayload,
  CreateRestockRequestPayload,
  RestockStatus,
  UpdateInventoryItemPayload,
  UpdateRestockStatusPayload,
} from "@/types";

export interface InventoryFilters {
  category?: string;
  status?: string;
  branchId?: string;
  search?: string;
}

export interface RestockRequestFilters {
  status?: RestockStatus;
  itemId?: string;
}

export const inventoryService = {
  async getAll(filters?: InventoryFilters): Promise<ApiInventoryItem[]> {
    const qs = filters
      ? `?${new URLSearchParams(filters as Record<string, string>).toString()}`
      : "";
    return apiClient.get(`/inventory${qs}`);
  },

  async getById(id: string): Promise<ApiInventoryItem> {
    return apiClient.get(`/inventory/${id}`);
  },

  async create(data: CreateInventoryItemPayload): Promise<ApiInventoryItem> {
    return apiClient.post("/inventory", data);
  },

  async update(id: string, data: UpdateInventoryItemPayload): Promise<ApiInventoryItem> {
    return apiClient.patch(`/inventory/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/inventory/${id}`);
  },

  async getLowStock(branchId?: string): Promise<ApiInventoryItem[]> {
    const qs = branchId ? `?${new URLSearchParams({ branchId }).toString()}` : "";
    return apiClient.get(`/inventory/low-stock${qs}`);
  },

  async listRestockRequests(filters?: RestockRequestFilters): Promise<ApiRestockRequest[]> {
    const qs = filters
      ? `?${new URLSearchParams(filters as unknown as Record<string, string>).toString()}`
      : "";
    return apiClient.get(`/inventory/restock-requests${qs}`);
  },

  async createRestockRequest(id: string, payload: CreateRestockRequestPayload): Promise<ApiRestockRequest> {
    return apiClient.post(`/inventory/${id}/restock-requests`, payload);
  },

  async updateRestockStatus(id: string, status: RestockStatus): Promise<ApiRestockRequest> {
    const payload: UpdateRestockStatusPayload = { status };
    return apiClient.patch(`/inventory/restock-requests/${id}/status`, payload);
  },
};
