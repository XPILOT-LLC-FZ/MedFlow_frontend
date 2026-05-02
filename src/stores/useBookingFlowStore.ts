"use client";

import { create } from "zustand";
import type { ApiPublicDoctor } from "@/types";

export interface PendingBooking {
  date: string;
  time: string;
  mode: "ONSITE" | "ONLINE";
}

interface BookingFlowState {
  isSpecOpen: boolean;
  isDocsOpen: boolean;
  isProfileOpen: boolean;
  isBookOpen: boolean;
  isCheckoutOpen: boolean;
  selectedSpecialization: string | null;
  selectedDoctor: ApiPublicDoctor | null;
  pendingBooking: PendingBooking | null;

  setSpecOpen: (open: boolean) => void;
  setDocsOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setBookOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;

  openSpec: () => void;
  openDocs: (spec: string | null) => void;
  openProfile: (doctor: ApiPublicDoctor) => void;
  openBook: (doctor: ApiPublicDoctor) => void;
  openCheckout: (booking: PendingBooking) => void;
  closeAll: () => void;
}

export const useBookingFlowStore = create<BookingFlowState>((set) => ({
  isSpecOpen: false,
  isDocsOpen: false,
  isProfileOpen: false,
  isBookOpen: false,
  isCheckoutOpen: false,
  selectedSpecialization: null,
  selectedDoctor: null,
  pendingBooking: null,

  setSpecOpen: (open) => set({ isSpecOpen: open }),
  setDocsOpen: (open) => set({ isDocsOpen: open }),
  setProfileOpen: (open) => set({ isProfileOpen: open }),
  setBookOpen: (open) => set({ isBookOpen: open }),
  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),

  openSpec: () => set({
    isSpecOpen: true,
    isDocsOpen: false,
    isProfileOpen: false,
    isBookOpen: false,
    isCheckoutOpen: false,
    selectedSpecialization: null,
    selectedDoctor: null,
    pendingBooking: null,
  }),

  openDocs: (spec) => set({
    isSpecOpen: false,
    isDocsOpen: true,
    isProfileOpen: false,
    isBookOpen: false,
    isCheckoutOpen: false,
    selectedSpecialization: spec,
    selectedDoctor: null,
    pendingBooking: null,
  }),

  openProfile: (doctor) => set({
    isSpecOpen: false,
    isDocsOpen: false,
    isProfileOpen: true,
    isBookOpen: false,
    isCheckoutOpen: false,
    selectedDoctor: doctor,
    pendingBooking: null,
  }),

  openBook: (doctor) => set({
    isSpecOpen: false,
    isDocsOpen: false,
    isProfileOpen: false,
    isBookOpen: true,
    isCheckoutOpen: false,
    selectedDoctor: doctor,
    pendingBooking: null,
  }),

  openCheckout: (booking) => set(() => ({
    isSpecOpen: false,
    isDocsOpen: false,
    isProfileOpen: false,
    isBookOpen: false,
    isCheckoutOpen: true,
    pendingBooking: booking,
  })),

  closeAll: () => set({
    isSpecOpen: false,
    isDocsOpen: false,
    isProfileOpen: false,
    isBookOpen: false,
    isCheckoutOpen: false,
    selectedSpecialization: null,
    selectedDoctor: null,
    pendingBooking: null,
  }),
}));
