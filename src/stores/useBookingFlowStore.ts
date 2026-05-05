"use client";

import { create } from "zustand";
import type { ApiPublicDoctor } from "@/types";

export interface PendingBooking {
  date: string;
  time: string;
  mode: "ONSITE" | "ONLINE";
  branchId?: string;
  redeemPoints?: boolean;
}

interface BookingFlowState {
  isSpecOpen: boolean;
  isDocsOpen: boolean;
  isProfileOpen: boolean;
  isBookOpen: boolean;
  isCheckoutOpen: boolean;
  specTitleOverride: string | null;
  selectedSpecialization: string | null;
  selectedDoctor: ApiPublicDoctor | null;
  selectedBranchId: string | null;
  pendingBooking: PendingBooking | null;
  history: string[];

  setSpecOpen: (open: boolean) => void;
  setDocsOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setBookOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;

  openSpec: (title?: string) => void;
  openDocs: (spec: string | null) => void;
  openProfile: (doctor: ApiPublicDoctor) => void;
  openBook: (doctor: ApiPublicDoctor, branchId?: string) => void;
  openCheckout: (booking: PendingBooking) => void;
  closeAll: () => void;
  goBack: () => void;
}

export const useBookingFlowStore = create<BookingFlowState>((set) => ({
  isSpecOpen: false,
  isDocsOpen: false,
  isProfileOpen: false,
  isBookOpen: false,
  isCheckoutOpen: false,
  selectedSpecialization: null,
  selectedDoctor: null,
  selectedBranchId: null,
  specTitleOverride: null,
  pendingBooking: null,
  history: [],

  setSpecOpen: (open) => set({ isSpecOpen: open }),
  setDocsOpen: (open) => set({ isDocsOpen: open }),
  setProfileOpen: (open) => set({ isProfileOpen: open }),
  setBookOpen: (open) => set({ isBookOpen: open }),
  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),

  openSpec: (title) => set({
    isSpecOpen: true,
    isDocsOpen: false,
    isProfileOpen: false,
    isBookOpen: false,
    isCheckoutOpen: false,
    specTitleOverride: title || null,
    selectedSpecialization: null,
    selectedDoctor: null,
    pendingBooking: null,
    history: ["spec"],
  }),

  openDocs: (spec) => set((state) => {
    const nextHistory = state.isSpecOpen || state.history.includes("spec")
      ? [...state.history.filter(x => x !== "docs"), "docs"]
      : ["docs"];
    return {
      isSpecOpen: false,
      isDocsOpen: true,
      isProfileOpen: false,
      isBookOpen: false,
      isCheckoutOpen: false,
      selectedSpecialization: spec,
      selectedDoctor: null,
      pendingBooking: null,
      history: nextHistory,
    };
  }),

  openProfile: (doctor) => set((state) => {
    const nextHistory = state.isDocsOpen || state.history.includes("docs")
      ? [...state.history.filter(x => x !== "profile"), "profile"]
      : ["profile"];
    return {
      isSpecOpen: false,
      isDocsOpen: false,
      isProfileOpen: true,
      isBookOpen: false,
      isCheckoutOpen: false,
      selectedDoctor: doctor,
      pendingBooking: null,
      history: nextHistory,
    };
  }),

  openBook: (doctor, branchId) => set((state) => {
    const nextHistory = state.isDocsOpen || state.history.includes("docs")
      ? [...state.history.filter(x => x !== "book"), "book"]
      : ["book"];
    return {
      isSpecOpen: false,
      isDocsOpen: false,
      isProfileOpen: false,
      isBookOpen: true,
      isCheckoutOpen: false,
      selectedDoctor: doctor,
      selectedBranchId: branchId || null,
      pendingBooking: null,
      history: nextHistory,
    };
  }),

  openCheckout: (booking) => set((state) => {
    const nextHistory = state.isBookOpen || state.history.includes("book")
      ? [...state.history.filter(x => x !== "checkout"), "checkout"]
      : ["checkout"];
    return {
      isSpecOpen: false,
      isDocsOpen: false,
      isProfileOpen: false,
      isBookOpen: false,
      isCheckoutOpen: true,
      pendingBooking: booking,
      history: nextHistory,
    };
  }),

  closeAll: () => set({
    isSpecOpen: false,
    isDocsOpen: false,
    isProfileOpen: false,
    isBookOpen: false,
    isCheckoutOpen: false,
    specTitleOverride: null,
    selectedSpecialization: null,
    selectedDoctor: null,
    pendingBooking: null,
    history: [],
  }),

  goBack: () => set((state) => {
    const nextHistory = [...state.history];
    nextHistory.pop();
    if (nextHistory.length === 0) {
      return {
        isSpecOpen: false,
        isDocsOpen: false,
        isProfileOpen: false,
        isBookOpen: false,
        isCheckoutOpen: false,
        specTitleOverride: null,
        selectedSpecialization: null,
        selectedDoctor: null,
        pendingBooking: null,
        history: [],
      };
    }
    const prevScreen = nextHistory[nextHistory.length - 1];
    return {
      isSpecOpen: prevScreen === "spec",
      isDocsOpen: prevScreen === "docs",
      isProfileOpen: prevScreen === "profile",
      isBookOpen: prevScreen === "book",
      isCheckoutOpen: prevScreen === "checkout",
      history: nextHistory,
    };
  }),
}));
