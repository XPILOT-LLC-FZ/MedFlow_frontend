import type { Role } from "@/types";

export interface MockUser {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  phone?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "usr_patient_01",
    name: "Sarah Johnson",
    nameAr: "سارة جونسون",
    email: "patient@test.com",
    password: "123456",
    role: "PATIENT",
    phone: "+1 555-0101",
  },
  {
    id: "usr_admin_01",
    name: "Dr. Ahmed Hassan",
    nameAr: "د. أحمد حسن",
    email: "admin@clinic.com",
    password: "123456",
    role: "MEDICAL_ADMIN",
    phone: "+1 555-0102",
  },
  {
    id: "usr_doctor_01",
    name: "Dr. Lina Khalil",
    nameAr: "د. لينا خليل",
    email: "doctor@clinic.com",
    password: "123456",
    role: "DOCTOR",
    phone: "+1 555-0103",
  },
  {
    id: "usr_reception_01",
    name: "Nour Ali",
    nameAr: "نور علي",
    email: "reception@clinic.com",
    password: "123456",
    role: "RECEPTION",
    phone: "+1 555-0104",
  },
  {
    id: "usr_super_01",
    name: "System Admin",
    nameAr: "مدير النظام",
    email: "super@system.com",
    password: "123456",
    role: "SUPER_ADMIN",
    phone: "+1 555-0100",
  },
];

/** Map each role to its dashboard path */
export const roleDashboardMap: Record<Role, string> = {
  PATIENT: "/dashboard",
  MEDICAL_ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/dashboard",
  RECEPTION: "/reception/dashboard",
  SUPER_ADMIN: "/super-dashboard",
};
