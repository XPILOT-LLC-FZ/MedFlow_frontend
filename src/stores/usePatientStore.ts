"use client";

import { create } from "zustand";
import type { ApiPatient } from "@/types";
import { patientService } from "@/services/patientService";
import { useAuthStore } from "@/stores/useAuthStore";

interface PatientState {
  patients: ApiPatient[];
  currentPatient: ApiPatient | null;
  isLoading: boolean;
  error: string | null;
  fetchPatients: (filters?: Record<string, unknown>) => Promise<void>;
  fetchMe: () => Promise<void>;
  updatePatientLocal: (id: string, updates: Partial<ApiPatient>) => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  currentPatient: null,
  isLoading: false,
  error: null,

  fetchPatients: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const patients = await patientService.getAll(filters);
      set({ patients, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch patients";
      set({ error: message, isLoading: false });
    }
  },

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentPatient = await patientService.getMe();
      set({ currentPatient, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch patient profile";

      // Some authenticated patients may not have a materialized /patients/me row yet.
      if (message.toLowerCase().includes("patient profile not found")) {
        const authUser = useAuthStore.getState().user;

        if (authUser && authUser.role === "PATIENT" && authUser.isOnboarded && authUser.clinicId) {
          try {
            const createdPatient = await patientService.create({
              fullName: authUser.name,
              email: authUser.email,
              phone: authUser.phone,
              clinicId: authUser.clinicId,
            } as Partial<ApiPatient>);

            set({ currentPatient: createdPatient, isLoading: false, error: null });
            return;
          } catch {
            // If auto-create is not allowed by backend policy, keep app usable without surfacing hard error.
            set({ currentPatient: null, isLoading: false, error: null });
            return;
          }
        }

        set({ currentPatient: null, isLoading: false, error: null });
        return;
      }

      set({ error: message, isLoading: false });
    }
  },

  updatePatientLocal: (id, updates) => {
    set((s) => ({
      patients: s.patients.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentPatient: s.currentPatient?.id === id ? { ...s.currentPatient, ...updates } : s.currentPatient,
    }));
  },
}));
