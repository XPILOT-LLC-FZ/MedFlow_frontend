"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Appointment } from "@/types";
import { appointments as seedAppointments } from "@/data/appointments";

interface BookingState {
  appointments: Appointment[];
  addAppointment: (apt: Omit<Appointment, "id">) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      appointments: seedAppointments,

      addAppointment: (apt) => {
        const newApt: Appointment = { ...apt, id: `apt-${Date.now()}` };
        set((s) => ({ appointments: [...s.appointments, newApt] }));
        return newApt;
      },

      updateAppointment: (id, updates) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      cancelAppointment: (id) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status: "cancelled" as const } : a
          ),
        }));
      },
    }),
    { name: "clinic-os-bookings" }
  )
);
