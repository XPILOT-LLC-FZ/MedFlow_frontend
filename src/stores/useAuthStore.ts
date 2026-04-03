"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";
import { mockUsers, roleDashboardMap } from "@/data/mockUsers";

export interface AuthUser {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  registeredUsers: { email: string; password: string; name: string; phone: string }[];
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (data: SignupData) => { success: boolean; error?: string };
  logout: () => void;
  getDashboardPath: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      registeredUsers: [],

      login: (email: string, password: string) => {
        // Check mock users first
        const found = mockUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (found) {
          const authUser: AuthUser = {
            id: found.id,
            name: found.name,
            nameAr: found.nameAr,
            email: found.email,
            role: found.role,
            phone: found.phone,
          };
          set({ user: authUser, isAuthenticated: true });
          return { success: true };
        }

        // Check registered users (from signup)
        const registered = get().registeredUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (registered) {
          const authUser: AuthUser = {
            id: `usr_patient_${Date.now()}`,
            name: registered.name,
            nameAr: registered.name,
            email: registered.email,
            role: "PATIENT",
            phone: registered.phone,
          };
          set({ user: authUser, isAuthenticated: true });
          return { success: true };
        }

        return { success: false, error: "invalidCredentials" };
      },

      signup: (data: SignupData) => {
        const { registeredUsers } = get();

        // Check if email already exists in mock users or registered users
        const existsInMock = mockUsers.some(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        );
        const existsInRegistered = registeredUsers.some(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        );

        if (existsInMock || existsInRegistered) {
          return { success: false, error: "emailAlreadyExists" };
        }

        set({
          registeredUsers: [...registeredUsers, {
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone,
          }],
        });

        // Auto-login after signup
        const authUser: AuthUser = {
          id: `usr_patient_${Date.now()}`,
          name: data.name,
          nameAr: data.name,
          email: data.email,
          role: "PATIENT",
          phone: data.phone,
        };
        set({ user: authUser, isAuthenticated: true });
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      getDashboardPath: () => {
        const { user } = get();
        if (!user) return "/login";
        return roleDashboardMap[user.role];
      },
    }),
    {
      name: "clinic-os-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        registeredUsers: state.registeredUsers,
      }),
    }
  )
);
