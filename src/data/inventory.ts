import { InventoryItem } from "@/types";

export const inventory: InventoryItem[] = [
  { id: "inv-1", name: "Surgical Gloves (Box)", category: "PPE", stock: 250, minStock: 100, unit: "boxes", status: "in-stock", lastUpdated: "2026-04-01", supplier: "MedSupply Co.", price: 12.99 },
  { id: "inv-2", name: "Face Masks N95", category: "PPE", stock: 80, minStock: 100, unit: "boxes", status: "low", lastUpdated: "2026-04-02", supplier: "SafeGuard Medical", price: 24.99 },
  { id: "inv-3", name: "Bandages (Assorted)", category: "Wound Care", stock: 500, minStock: 200, unit: "packs", status: "in-stock", lastUpdated: "2026-03-28", supplier: "MedSupply Co.", price: 8.50 },
  { id: "inv-4", name: "Syringes 5ml", category: "Disposables", stock: 1000, minStock: 300, unit: "units", status: "in-stock", lastUpdated: "2026-04-01", supplier: "QuickMed Supplies", price: 0.35 },
  { id: "inv-5", name: "Ibuprofen 400mg", category: "Medication", stock: 0, minStock: 50, unit: "bottles", status: "out-of-stock", lastUpdated: "2026-04-03", supplier: "PharmaDirect", price: 15.00 },
  { id: "inv-6", name: "Blood Pressure Monitor", category: "Equipment", stock: 12, minStock: 5, unit: "units", status: "in-stock", lastUpdated: "2026-03-25", supplier: "MedTech Devices", price: 89.99 },
  { id: "inv-7", name: "Stethoscope", category: "Equipment", stock: 3, minStock: 5, unit: "units", status: "low", lastUpdated: "2026-04-01", supplier: "MedTech Devices", price: 145.00 },
  { id: "inv-8", name: "Antiseptic Solution", category: "Wound Care", stock: 120, minStock: 50, unit: "bottles", status: "in-stock", lastUpdated: "2026-03-30", supplier: "CleanMed", price: 6.75 },
  { id: "inv-9", name: "Examination Table Paper", category: "Disposables", stock: 45, minStock: 50, unit: "rolls", status: "low", lastUpdated: "2026-04-02", supplier: "MedSupply Co.", price: 4.25 },
  { id: "inv-10", name: "Paracetamol 500mg", category: "Medication", stock: 300, minStock: 100, unit: "bottles", status: "in-stock", lastUpdated: "2026-03-29", supplier: "PharmaDirect", price: 8.99 },
];
