'use client';

import { create } from 'zustand';

interface ProfileUiState {
  isDeepFlow: boolean;
  setDeepFlow: (isDeepFlow: boolean) => void;
}

export const useProfileUiStore = create<ProfileUiState>((set) => ({
  isDeepFlow: false,
  setDeepFlow: (isDeepFlow) => set({ isDeepFlow }),
}));