export type Role = "PATIENT" | "ADMIN" | "DOCTOR" | "STAFF" | "SUPER_ADMIN";

export interface TokenPair {
  accessToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
}

export interface ApiUser extends User {
  clinicId?: string;
  isActive: boolean;
  createdAt: string;
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

export interface ApiDoctor {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  experienceYears: number;
  consultationFee: number;
  branchId?: string;
  services: string[];
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  rating: number;
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
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "in-progress" | "no-show" | "rescheduled";
  type: string;
  notes?: string;
}

export interface ApiAppointment {
  id: string;
  patientId?: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  serviceId?: string;
  serviceName?: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
  type: "CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "EMERGENCY" | "VIRTUAL";
  mode: "ONSITE" | "ONLINE" | "PHONE_CALL";
  notes?: string;
  branchId?: string;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface ApiPatient {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies: string[];
  medicalHistory?: Record<string, unknown>;
  notes?: string;
  clinicId?: string;
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

export interface ApiService {
  id: string;
  name: string;
  description?: string;
  category: "CONSULTATION" | "DENTAL" | "DERMATOLOGY" | "LASER" | "AESTHETIC" | "SURGICAL" | "DIAGNOSTIC" | "WELLNESS" | "OTHER";
  price: number;
  duration: number; // minutes
  isActive: boolean;
  requiresSessions: boolean;
  totalSessions?: number;
}

export interface ApiPromotion {
  id: string;
  title: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableRole: Role;
  minAppointmentValue?: number;
  clinicId?: string;
}

export interface ApiClinic {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  workingHours?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface ApiBranch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
  isMain: boolean;
  isActive: boolean;
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
