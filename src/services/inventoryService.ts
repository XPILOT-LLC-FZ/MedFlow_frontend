/**
 * Inventory Service — wraps useInventoryStore.
 * Swap internals to fetch() when backend is ready.
 */
import { useInventoryStore } from "@/stores/useInventoryStore";
import type { InventoryItem } from "@/types";

export const inventoryService = {
  getAll(): InventoryItem[] {
    return useInventoryStore.getState().items;
  },

  getById(id: string): InventoryItem | undefined {
    return useInventoryStore.getState().items.find((i) => i.id === id);
  },

  add(item: Omit<InventoryItem, "id" | "status" | "lastUpdated">): void {
    useInventoryStore.getState().addItem(item);
  },

  update(id: string, updates: Partial<InventoryItem>): void {
    useInventoryStore.getState().updateItem(id, updates);
  },

  remove(id: string): void {
    useInventoryStore.getState().deleteItem(id);
  },

  adjustStock(id: string, delta: number): void {
    useInventoryStore.getState().adjustStock(id, delta);
  },

  search(query: string, category?: string): InventoryItem[] {
    const items = useInventoryStore.getState().items;
    return items.filter((item) => {
      const matchSearch = !query || item.name.toLowerCase().includes(query.toLowerCase());
      const matchCat = !category || category === "All" || item.category === category;
      return matchSearch && matchCat;
    });
  },

  getStats() {
    const items = useInventoryStore.getState().items;
    return {
      totalItems: items.length,
      inStock: items.filter((i) => i.status === "in-stock").length,
      lowStock: items.filter((i) => i.status === "low").length,
      outOfStock: items.filter((i) => i.status === "out-of-stock").length,
      totalValue: items.reduce((sum, i) => sum + i.price * i.stock, 0),
    };
  },

  getCategories(): string[] {
    const items = useInventoryStore.getState().items;
    return [...new Set(items.map((i) => i.category))];
  },
};
