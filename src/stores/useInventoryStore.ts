"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InventoryItem } from "@/types";
import { inventory as seedInventory } from "@/data/inventory";

function calcStatus(stock: number, minStock: number): InventoryItem["status"] {
  if (stock <= 0) return "out-of-stock";
  if (stock <= minStock) return "low";
  return "in-stock";
}

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, "id" | "status" | "lastUpdated">) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: seedInventory,

      addItem: (item) => {
        const newItem: InventoryItem = {
          ...item,
          id: `inv-${Date.now()}`,
          status: calcStatus(item.stock, item.minStock),
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        set((s) => ({ items: [...s.items, newItem] }));
      },

      updateItem: (id, updates) => {
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const merged = { ...i, ...updates, lastUpdated: new Date().toISOString().split("T")[0] };
            merged.status = calcStatus(merged.stock, merged.minStock);
            return merged;
          }),
        }));
      },

      deleteItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },

      adjustStock: (id, delta) => {
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const newStock = Math.max(0, i.stock + delta);
            return {
              ...i,
              stock: newStock,
              status: calcStatus(newStock, i.minStock),
              lastUpdated: new Date().toISOString().split("T")[0],
            };
          }),
        }));
      },
    }),
    { name: "clinic-os-inventory" }
  )
);
