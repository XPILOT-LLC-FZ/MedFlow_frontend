"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StaffMember {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  role: "DOCTOR" | "RECEPTION";
  specialty?: string;
  specialtyAr?: string;
  status: "active" | "on-leave" | "inactive";
  shift?: string;
  experience?: number;
  rating?: number;
  avatar?: string;
  joinDate: string;
}

const initialStaff: StaffMember[] = [
  {
    id: "staff-1",
    name: "Dr. Sarah Mitchell",
    nameAr: "د. سارة ميتشل",
    email: "sarah.mitchell@clinic.com",
    phone: "+1 555-0201",
    role: "DOCTOR",
    specialty: "Cardiology",
    specialtyAr: "أمراض القلب",
    status: "active",
    experience: 15,
    rating: 4.9,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4",
    joinDate: "2022-03-15",
  },
  {
    id: "staff-2",
    name: "Dr. Ahmed Hassan",
    nameAr: "د. أحمد حسن",
    email: "ahmed.hassan@clinic.com",
    phone: "+1 555-0202",
    role: "DOCTOR",
    specialty: "Dermatology",
    specialtyAr: "الأمراض الجلدية",
    status: "active",
    experience: 12,
    rating: 4.8,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed&backgroundColor=c0aede",
    joinDate: "2022-06-01",
  },
  {
    id: "staff-3",
    name: "Dr. Emily Chen",
    nameAr: "د. إيميلي تشين",
    email: "emily.chen@clinic.com",
    phone: "+1 555-0203",
    role: "DOCTOR",
    specialty: "Pediatrics",
    specialtyAr: "طب الأطفال",
    status: "active",
    experience: 10,
    rating: 4.9,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Emily&backgroundColor=ffd5dc",
    joinDate: "2023-01-10",
  },
  {
    id: "staff-4",
    name: "Dr. Michael Roberts",
    nameAr: "د. مايكل روبرتس",
    email: "michael.roberts@clinic.com",
    phone: "+1 555-0204",
    role: "DOCTOR",
    specialty: "Orthopedics",
    specialtyAr: "جراحة العظام",
    status: "active",
    experience: 18,
    rating: 4.7,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Michael&backgroundColor=d1d4f9",
    joinDate: "2021-09-20",
  },
  {
    id: "staff-5",
    name: "Emma Wilson",
    nameAr: "إيما ويلسون",
    email: "emma.wilson@clinic.com",
    phone: "+1 555-0301",
    role: "RECEPTION",
    status: "active",
    shift: "Morning",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Emma&backgroundColor=b6e3f4",
    joinDate: "2023-04-01",
  },
  {
    id: "staff-6",
    name: "Omar Khalid",
    nameAr: "عمر خالد",
    email: "omar.khalid@clinic.com",
    phone: "+1 555-0302",
    role: "RECEPTION",
    status: "active",
    shift: "Evening",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Omar&backgroundColor=c0aede",
    joinDate: "2023-07-15",
  },
  {
    id: "staff-7",
    name: "Lisa Chen",
    nameAr: "ليزا تشين",
    email: "lisa.chen@clinic.com",
    phone: "+1 555-0303",
    role: "RECEPTION",
    status: "on-leave",
    shift: "Morning",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Lisa&backgroundColor=ffd5dc",
    joinDate: "2024-01-10",
  },
  {
    id: "staff-8",
    name: "Dr. Noor El-Sayed",
    nameAr: "د. نور السيد",
    email: "noor.elsayed@clinic.com",
    phone: "+1 555-0205",
    role: "DOCTOR",
    specialty: "Endocrinology",
    specialtyAr: "الغدد الصماء",
    status: "active",
    experience: 11,
    rating: 4.8,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Noor&backgroundColor=fde68a",
    joinDate: "2024-02-14",
  },
  {
    id: "staff-9",
    name: "Dr. Youssef Nabil",
    nameAr: "د. يوسف نبيل",
    email: "youssef.nabil@clinic.com",
    phone: "+1 555-0206",
    role: "DOCTOR",
    specialty: "ENT",
    specialtyAr: "أنف وأذن وحنجرة",
    status: "active",
    experience: 9,
    rating: 4.7,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Youssef&backgroundColor=bfdbfe",
    joinDate: "2024-06-08",
  },
];

interface StaffState {
  staff: StaffMember[];
  addStaff: (member: Omit<StaffMember, "id" | "joinDate">) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  changeRole: (id: string, newRole: "DOCTOR" | "RECEPTION") => void;
  getDoctors: () => StaffMember[];
  getReception: () => StaffMember[];
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      staff: initialStaff,

      addStaff: (member) => {
        const newMember: StaffMember = {
          ...member,
          id: `staff-${Date.now()}`,
          joinDate: new Date().toISOString().split("T")[0],
        };
        set((state) => ({ staff: [...state.staff, newMember] }));
      },

      updateStaff: (id, updates) => {
        set((state) => ({
          staff: state.staff.map((staffMember) =>
            staffMember.id === id ? { ...staffMember, ...updates } : staffMember
          ),
        }));
      },

      deleteStaff: (id) => {
        set((state) => ({ staff: state.staff.filter((staffMember) => staffMember.id !== id) }));
      },

      changeRole: (id, newRole) => {
        set((state) => ({
          staff: state.staff.map((staffMember) =>
            staffMember.id === id
              ? {
                  ...staffMember,
                  role: newRole,
                  specialty: newRole === "RECEPTION" ? undefined : staffMember.specialty,
                  specialtyAr: newRole === "RECEPTION" ? undefined : staffMember.specialtyAr,
                  experience: newRole === "RECEPTION" ? undefined : staffMember.experience,
                  rating: newRole === "RECEPTION" ? undefined : staffMember.rating,
                  shift: newRole === "DOCTOR" ? undefined : staffMember.shift,
                }
              : staffMember
          ),
        }));
      },

      getDoctors: () => get().staff.filter((staffMember) => staffMember.role === "DOCTOR"),
      getReception: () => get().staff.filter((staffMember) => staffMember.role === "RECEPTION"),
    }),
    { name: "clinic-os-staff" }
  )
);
