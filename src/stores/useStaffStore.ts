"use client";

import { create } from "zustand";
import type { ApiDoctor } from "@/types";
import { staffService } from "@/services/staffService";

interface StaffState {
  doctors: ApiDoctor[];
  isLoading: boolean;
  error: string | null;
  fetchDoctors: (filters?: Record<string, unknown>) => Promise<void>;
  addDoctor: (data: Partial<ApiDoctor>) => Promise<void>;
  updateDoctor: (id: string, data: Partial<ApiDoctor>) => Promise<void>;
  removeDoctor: (id: string) => Promise<void>;
  updateDoctorLocal: (id: string, updates: Partial<ApiDoctor>) => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  doctors: [],
  isLoading: false,
  error: null,

  fetchDoctors: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const doctors = await staffService.getDoctors(filters);
      set({ doctors, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch doctors";
      set({ error: message, isLoading: false });
    }
  },

  addDoctor: async (data) => {
    set({ isLoading: true });
    try {
      await staffService.createDoctor(data);
      await get().fetchDoctors();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add doctor";
      set({ error: message, isLoading: false });
    }
  },

  updateDoctor: async (id, data) => {
    set({ isLoading: true });
    try {
      await staffService.updateDoctor(id, data);
      await get().fetchDoctors();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update doctor";
      set({ error: message, isLoading: false });
    }
  },

  removeDoctor: async (id) => {
    set({ isLoading: true });
    try {
      await staffService.removeDoctor(id);
      await get().fetchDoctors();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove doctor";
      set({ error: message, isLoading: false });
    }
  },

  updateDoctorLocal: (id, updates) => {
    set((s) => ({
      doctors: s.doctors.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
  },
}));
