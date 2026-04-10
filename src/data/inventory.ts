import type { ApiInventoryItem } from "@/types";

// Legacy seed kept for demos. Admin flows now fetch inventory from backend APIs.
export const inventory: ApiInventoryItem[] = [
  {
    id: "inv-legacy-1",
    name: "Surgical Gloves (Box)",
    category: "MEDICAL_SUPPLY",
    quantity: 250,
    minQuantity: 100,
    unitPrice: 12.99,
    supplierName: "MedSupply Co.",
    status: "IN_STOCK",
    branchId: null,
  },
];
