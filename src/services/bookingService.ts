/**
 * Booking Service — wraps useBookingStore.
 * Swap internals to fetch() when backend is ready.
 */
import { useBookingStore } from "@/stores/useBookingStore";
import type { Appointment } from "@/types";

export const bookingService = {
  getAll(): Appointment[] {
    return useBookingStore.getState().appointments;
  },

  getById(id: string): Appointment | undefined {
    return useBookingStore.getState().appointments.find((a) => a.id === id);
  },

  getByPatient(patientId: string): Appointment[] {
    return useBookingStore.getState().appointments.filter((a) => a.patientId === patientId);
  },

  getByDoctor(doctorId: string): Appointment[] {
    return useBookingStore.getState().appointments.filter((a) => a.doctorId === doctorId);
  },

  getUpcoming(): Appointment[] {
    return useBookingStore.getState().appointments.filter(
      (a) => a.status === "scheduled" || a.status === "confirmed"
    );
  },

  getToday(): Appointment[] {
    const today = new Date().toISOString().split("T")[0];
    return useBookingStore.getState().appointments.filter((a) => a.date === today);
  },

  create(apt: Omit<Appointment, "id">): Appointment {
    return useBookingStore.getState().addAppointment(apt);
  },

  update(id: string, updates: Partial<Appointment>): void {
    useBookingStore.getState().updateAppointment(id, updates);
  },

  cancel(id: string): void {
    useBookingStore.getState().cancelAppointment(id);
  },

  getStats() {
    const apts = useBookingStore.getState().appointments;
    const today = new Date().toISOString().split("T")[0];
    return {
      total: apts.length,
      today: apts.filter((a) => a.date === today).length,
      upcoming: apts.filter((a) => a.status === "scheduled" || a.status === "confirmed").length,
      completed: apts.filter((a) => a.status === "completed").length,
      cancelled: apts.filter((a) => a.status === "cancelled").length,
    };
  },
};
