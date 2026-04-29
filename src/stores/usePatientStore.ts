"use client";

import { create } from "zustand";
import type { ApiPatient, CreatePatientPayload, PatientListFilters } from "@/types";
import { patientService } from "@/services/patientService";
import { useAuthStore } from "@/stores/useAuthStore";

interface PatientState {
  patients: ApiPatient[];
  currentPatient: ApiPatient | null;
  isLoading: boolean;
  error: string | null;
  favoriteDoctorIds: string[];
  fetchPatients: (filters?: PatientListFilters) => Promise<void>;
  fetchMe: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (doctorId: string) => Promise<void>;
  updatePatientLocal: (id: string, updates: Partial<ApiPatient>) => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  currentPatient: null,
  isLoading: false,
  error: null,
  favoriteDoctorIds: [],

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
            } as CreatePatientPayload);

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

  fetchFavorites: async () => {
    try {
      const favorites = await patientService.getFavoriteDoctors();
      set({ favoriteDoctorIds: favorites.map(f => f.id) });
    } catch {
      // Silently fail or handle error
    }
  },

  toggleFavorite: async (doctorId) => {
    const { favoriteDoctorIds } = get();
    const isFav = favoriteDoctorIds.includes(doctorId);

    // Optimistic update
    if (isFav) {
      set({ favoriteDoctorIds: favoriteDoctorIds.filter(id => id !== doctorId) });
      try {
        await patientService.removeFavoriteDoctor(doctorId);
      } catch {
        // Rollback
        set({ favoriteDoctorIds: [...get().favoriteDoctorIds, doctorId] });
      }
    } else {
      set({ favoriteDoctorIds: [...favoriteDoctorIds, doctorId] });
      try {
        await patientService.addFavoriteDoctor(doctorId);
      } catch {
        // Rollback
        set({ favoriteDoctorIds: get().favoriteDoctorIds.filter(id => id !== doctorId) });
      }
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
