export type Role = "PATIENT" | "MEDICAL_ADMIN" | "DOCTOR" | "RECEPTION" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
}

export interface Doctor {
  id: string;
  name: string;
  nameAr: string;
  specialty: string;
  specialtyAr: string;
  image: string;
  rating: number;
  reviewCount: number;
  available: boolean;
  experience: number;
  bio: string;
  schedule: DaySchedule[];
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "in-progress";
  type: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  duration: number;
  category: string;
  icon: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  status: "in-stock" | "low" | "out-of-stock";
  lastUpdated: string;
  supplier: string;
  price: number;
}

export interface WhatsAppMessage {
  id: string;
  type: "confirmation" | "reminder" | "feedback";
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

export interface StatsCard {
  title: string;
  titleAr: string;
  value: string | number;
  change: number;
  icon: string;
}

export interface SystemLog {
  id: string;
  action: string;
  user: string;
  role: Role;
  timestamp: string;
  details: string;
  level: "info" | "warning" | "error";
}

export type Locale = "en" | "ar";
