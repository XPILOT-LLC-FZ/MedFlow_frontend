/**
 * Payment Service — wraps usePaymentsStore.
 * Swap internals to fetch() when backend is ready.
 */
import { usePaymentsStore, parsePaymentsCSV, type Payment } from "@/stores/usePaymentsStore";

export const paymentService = {
  getAll(): Payment[] {
    return usePaymentsStore.getState().payments;
  },

  add(payments: Omit<Payment, "id">[]): void {
    usePaymentsStore.getState().addPayments(payments);
  },

  importCSV(csvText: string): { count: number; error?: string } {
    const parsed = parsePaymentsCSV(csvText);
    if (parsed.length === 0) return { count: 0, error: "noValidData" };
    usePaymentsStore.getState().addPayments(parsed);
    return { count: parsed.length };
  },

  clear(): void {
    usePaymentsStore.getState().clearPayments();
  },

  getTodayIncome(): number {
    return usePaymentsStore.getState().getTodayIncome();
  },

  getMonthIncome(): number {
    return usePaymentsStore.getState().getMonthIncome();
  },

  getYearIncome(): number {
    return usePaymentsStore.getState().getYearIncome();
  },

  getMonthlyBreakdown(): { name: string; revenue: number }[] {
    return usePaymentsStore.getState().getMonthlyBreakdown();
  },

  getStats() {
    const payments = usePaymentsStore.getState().payments;
    return {
      totalTransactions: payments.length,
      todayIncome: usePaymentsStore.getState().getTodayIncome(),
      monthIncome: usePaymentsStore.getState().getMonthIncome(),
      yearIncome: usePaymentsStore.getState().getYearIncome(),
    };
  },
};
