"use client";

import { create } from "zustand";
import type { ApiClinic, ApiBranch } from "@/types";
import { clinicService } from "@/services/clinicService";

interface ClinicState {
  clinic: ApiClinic | null;
  branches: ApiBranch[];
  isLoading: boolean;
  error: string | null;
  fetchClinic: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  updateClinicLocal: (updates: Partial<ApiClinic>) => void;
  updateBranchLocal: (id: string, updates: Partial<ApiBranch>) => void;
}

export const useClinicStore = create<ClinicState>((set) => ({
  clinic: null,
  branches: [],
  isLoading: false,
  error: null,

  fetchClinic: async () => {
    set({ isLoading: true, error: null });
    try {
      const clinic = await clinicService.getClinic();
      set({ clinic, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch clinic details";
      set({ error: message, isLoading: false });
    }
  },

  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    try {
      const branches = await clinicService.getBranches();
      set({ branches, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch branches";
      set({ error: message, isLoading: false });
    }
  },

  updateClinicLocal: (updates) => {
    set((s) => ({
      clinic: s.clinic ? { ...s.clinic, ...updates } : null,
    }));
  },

  updateBranchLocal: (id, updates) => {
    set((s) => ({
      branches: s.branches.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  },
}));
