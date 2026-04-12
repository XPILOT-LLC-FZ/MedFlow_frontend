"use client";

import { create } from "zustand";
import type {
  ApiDoctor,
  CreateDoctorPayload,
  DoctorListFilters,
  UpdateDoctorPayload,
} from "@/types";
import { staffService } from "@/services/staffService";

interface StaffState {
  doctors: ApiDoctor[];
  isLoading: boolean;
  error: string | null;
  lastDoctorFilters: DoctorListFilters;
  fetchDoctors: (filters?: DoctorListFilters) => Promise<void>;
  addDoctor: (data: CreateDoctorPayload) => Promise<void>;
  updateDoctor: (id: string, data: UpdateDoctorPayload) => Promise<void>;
  updateDoctorLocal: (id: string, updates: Partial<ApiDoctor>) => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  doctors: [],
  isLoading: false,
  error: null,
  lastDoctorFilters: {},

  fetchDoctors: async (filters) => {
    const effectiveFilters = filters ?? get().lastDoctorFilters;
    set({ isLoading: true, error: null });
    try {
      const doctors = await staffService.getDoctors(effectiveFilters);
      set({ doctors, isLoading: false, lastDoctorFilters: effectiveFilters });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch doctors";
      set({ error: message, isLoading: false });
    }
  },

  addDoctor: async (data) => {
    set({ isLoading: true });
    try {
      await staffService.createDoctor(data);
      await get().fetchDoctors(get().lastDoctorFilters);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add doctor";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateDoctor: async (id, data) => {
    set({ isLoading: true });
    try {
      await staffService.updateDoctor(id, data);
      await get().fetchDoctors(get().lastDoctorFilters);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update doctor";
      set({ error: message, isLoading: false });
      throw error;
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
