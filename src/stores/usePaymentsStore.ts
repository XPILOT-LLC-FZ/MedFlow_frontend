"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Payment {
  id: string;
  patientName: string;
  service: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

const samplePayments: Payment[] = [
  { id: "pay-1", patientName: "John Smith", service: "Consultation", amount: 150, date: "2026-04-03" },
  { id: "pay-2", patientName: "Maria Garcia", service: "Pediatric Care", amount: 200, date: "2026-04-03" },
  { id: "pay-3", patientName: "David Lee", service: "Skin Treatment", amount: 300, date: "2026-04-02" },
  { id: "pay-4", patientName: "Sara Ali", service: "Cardiology Check", amount: 350, date: "2026-03-28" },
  { id: "pay-5", patientName: "Ali Mohammed", service: "X-Ray", amount: 120, date: "2026-03-15" },
  { id: "pay-6", patientName: "Jane Doe", service: "Blood Test", amount: 80, date: "2026-02-20" },
  { id: "pay-7", patientName: "Tom Brown", service: "Consultation", amount: 150, date: "2026-02-10" },
  { id: "pay-8", patientName: "Emily White", service: "Eye Exam", amount: 200, date: "2026-01-15" },
  { id: "pay-9", patientName: "Omar Hassan", service: "Orthopedic Consultation", amount: 250, date: "2025-12-20" },
  { id: "pay-10", patientName: "Lisa Johnson", service: "Dermatology", amount: 180, date: "2025-11-10" },
];

interface PaymentsState {
  payments: Payment[];
  addPayments: (newPayments: Omit<Payment, "id">[]) => void;
  clearPayments: () => void;
  getTodayIncome: () => number;
  getMonthIncome: () => number;
  getYearIncome: () => number;
  getMonthlyBreakdown: () => { name: string; revenue: number }[];
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const usePaymentsStore = create<PaymentsState>()(
  persist(
    (set, get) => ({
      payments: samplePayments,

      addPayments: (newPayments) => {
        const withIds = newPayments.map((p, i) => ({
          ...p,
          id: `pay-${Date.now()}-${i}`,
        }));
        set((state) => ({ payments: [...state.payments, ...withIds] }));
      },

      clearPayments: () => set({ payments: [] }),

      getTodayIncome: () => {
        const today = toDateStr(new Date());
        return get().payments.filter((p) => p.date === today).reduce((sum, p) => sum + p.amount, 0);
      },

      getMonthIncome: () => {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        return get()
          .payments.filter((p) => p.date.startsWith(yearMonth))
          .reduce((sum, p) => sum + p.amount, 0);
      },

      getYearIncome: () => {
        const year = String(new Date().getFullYear());
        return get()
          .payments.filter((p) => p.date.startsWith(year))
          .reduce((sum, p) => sum + p.amount, 0);
      },

      getMonthlyBreakdown: () => {
        const months = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const year = new Date().getFullYear();
        const breakdown = months.map((name, i) => {
          const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
          const revenue = get()
            .payments.filter((p) => p.date.startsWith(prefix))
            .reduce((sum, p) => sum + p.amount, 0);
          return { name, revenue };
        });
        return breakdown;
      },
    }),
    { name: "clinic-os-payments" }
  )
);

/** Parse CSV text into Payment objects */
export function parsePaymentsCSV(csvText: string): Omit<Payment, "id">[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const nameIdx = header.findIndex((h) => h.includes("patient") || h.includes("name"));
  const serviceIdx = header.findIndex((h) => h.includes("service"));
  const amountIdx = header.findIndex((h) => h.includes("amount"));
  const dateIdx = header.findIndex((h) => h.includes("date"));

  if (nameIdx === -1 || amountIdx === -1) return [];

  const results: Omit<Payment, "id">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 2) continue;

    const amount = parseFloat(cols[amountIdx] || "0");
    if (isNaN(amount) || amount <= 0) continue;

    results.push({
      patientName: cols[nameIdx] || "Unknown",
      service: serviceIdx !== -1 ? cols[serviceIdx] || "General" : "General",
      amount,
      date: dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : toDateStr(new Date()),
    });
  }

  return results;
}
