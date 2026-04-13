"use client";

import { create } from "zustand";
import { inventoryService, type InventoryFilters, type RestockRequestFilters } from "@/services/inventoryService";
import type {
  ApiInventoryItem,
  ApiRestockRequest,
  CreateInventoryItemPayload,
  CreateRestockRequestPayload,
  RestockStatus,
  UpdateInventoryItemPayload,
} from "@/types";

interface InventoryState {
  items: ApiInventoryItem[];
  lowStockItems: ApiInventoryItem[];
  restockRequests: ApiRestockRequest[];
  isLoading: boolean;
  error: string | null;
  fetchItems: (filters?: InventoryFilters) => Promise<void>;
  fetchLowStock: (branchId?: string) => Promise<void>;
  fetchRestockRequests: (filters?: RestockRequestFilters) => Promise<void>;
  createItem: (payload: CreateInventoryItemPayload) => Promise<void>;
  updateItem: (id: string, payload: UpdateInventoryItemPayload) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  createRestockRequest: (id: string, payload: CreateRestockRequestPayload) => Promise<void>;
  updateRestockStatus: (id: string, status: RestockStatus) => Promise<void>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  lowStockItems: [],
  restockRequests: [],
  isLoading: false,
  error: null,

  fetchItems: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const items = await inventoryService.getAll(filters);
      set({ items, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch inventory";
      set({ error: message, isLoading: false });
    }
  },

  fetchLowStock: async (branchId) => {
    set({ isLoading: true, error: null });
    try {
      const lowStockItems = await inventoryService.getLowStock(branchId);
      set({ lowStockItems, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch low-stock items";
      set({ error: message, isLoading: false });
    }
  },

  fetchRestockRequests: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const restockRequests = await inventoryService.listRestockRequests(filters);
      set({ restockRequests, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch restock requests";
      set({ error: message, isLoading: false });
    }
  },

  createItem: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryService.create(payload);
      await get().fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create inventory item";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateItem: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryService.update(id, payload);
      await get().fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update inventory item";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryService.remove(id);
      await get().fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete inventory item";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  createRestockRequest: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryService.createRestockRequest(id, payload);
      await Promise.all([get().fetchItems(), get().fetchRestockRequests()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create restock request";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateRestockStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryService.updateRestockStatus(id, status);
      await Promise.all([get().fetchItems(), get().fetchRestockRequests()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update restock status";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
