"use client";

import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const duration = toast.duration ?? 3500;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  success: (message) => {
    useToastStore.getState().addToast({ type: "success", message });
  },

  error: (message) => {
    useToastStore.getState().addToast({ type: "error", message });
  },

  info: (message) => {
    useToastStore.getState().addToast({ type: "info", message });
  },
}));
