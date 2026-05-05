import { ReactNode } from "react";

export type Role = "PATIENT" | "ADMIN" | "DOCTOR" | "STAFF" | "SUPER_ADMIN";

export interface TokenPair {
  accessToken: string;
}

export interface PreviewFileInfo {
  name: string;
  fileUrl: string;
  fileType: string;
}

export type InAppNotification = {
  isRead: boolean;
  id: string;
  type: string;
  audience: "PATIENT" | "DOCTOR" | "RECEPTION" | "ADMIN";
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  loyaltyPoints?: number;
  specialDiscount?: number;
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
  userId?: string;
  clinicId?: string | null;
  fullName: string;
  fullNameAr?: string;
  email: string;
  phone?: string;
  specialization?: string;
  qualification?: string;
  bio?: string;
  ministryOfHealthId?: string | null;
  experienceStartDate?: string | null;
  experienceYears: number;
  consultationFee: number;
  branchId?: string;
  branches?: Array<{
    id: string;
    name: string;
    nameAr?: string;
    address?: string | null;
    phone?: string | null;
    isMain?: boolean;
  }>;
  services: string[];
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  rating: number;
  shifts?: DoctorShift[];
  preferences?: Record<string, unknown>;
  user?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    isActive: boolean;
    clinicId?: string | null;
  } | null;
}

export type DoctorCredentialType = "MINISTRY_OF_HEALTH_ID" | "QUALIFICATION" | "PERSONAL_SIGNATURE";

export interface ApiDoctorCredential {
  id: string;
  doctorId: string;
  credentialType: DoctorCredentialType;
  name: string;
  fileType?: string | null;
  storageMode?: string;
  storageProvider?: string | null;
  storageKey?: string | null;
  isVerified?: boolean;
  isVisibleToPatients?: boolean;
  isVisibleToPublic?: boolean;
  isRejected?: boolean;
  previewUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DoctorCredentialSummary {
  hasVerifiedMinistryId: boolean;
  ministryOfHealthId: {
    id: string;
    name: string;
    fileType?: string | null;
    previewUrl?: string;
    createdAt: string;
  } | null;
  qualificationCount: number;
  qualifications: ApiDoctorCredential[];
}

export interface ApiPublicDoctor {
  id: string;
  clinicId?: string | null;
  fullName: string;
  fullNameAr?: string;
  specialization?: string | null;
  bio?: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  experienceYears: number;
  rating: number;
  consultationFee: number;
  services: string[];
  availableModes?: ("ONSITE" | "ONLINE" | "PHONE_CALL")[];
  branch?: {
    id: string;
    name: string;
    nameAr?: string;
    address?: string | null;
  } | null;
  branches?: Array<{
    id: string;
    name: string;
    nameAr?: string;
    address?: string | null;
    phone?: string | null;
    isMain?: boolean;
  }>;
  isAvailableNow?: boolean;
  user?: {
    id: string;
    avatarUrl?: string | null;
    gender?: string | null;
  } | null;
  credentialSummary: DoctorCredentialSummary;
  qualification?: string | null;
  patientCount?: number;
  shifts?: DoctorShift[];
}

export interface CreateDoctorCredentialPayload {
  credentialType: DoctorCredentialType;
  name: string;
  fileUrl: string;
  fileType?: string | null;
  storageMode?: "r2" | "cloudinary" | "inline-data-url";
}

export interface UpdateDoctorCredentialPayload {
  name?: string;
  fileUrl?: string;
  fileType?: string | null;
  storageMode?: "r2" | "cloudinary" | "inline-data-url";
  isVerified?: boolean;
  isVisibleToPatients?: boolean;
  isVisibleToPublic?: boolean;
  isRejected?: boolean;
}

export interface DoctorListFilters {
  status?: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  branchId?: string;
  specialization?: string;
  search?: string;
  serviceId?: string;
  clinicId?: string;
  gender?: string;
  experienceYears?: number;
  availableNow?: boolean;
  role?: string;
  limit?: number;
  offset?: number;
}

export interface DoctorFilterData {
  specialties: string[];
  experience: string;
  gender: string;
  appointmentType: string;
  location: string;
  urgentOnly: boolean;
}

export interface DoctorShift {
  id?: string;
  doctorId?: string;
  dayOfWeek: number;
  shiftStart: string;
  shiftEnd: string;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  isAvailable: boolean;
  branchId?: string | null;
}

export interface CreateDoctorPayload {
  fullName: string;
  fullNameAr?: string;
  email: string;
  phone?: string;
  specialization?: string;
  qualification?: string;
  bio?: string;
  ministryOfHealthId?: string | null;
  experienceStartDate?: string | null;
  consultationFee: number;
  branchId?: string;
  branchIds?: string[];
  services: string[];
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  password: string;
  clinicId: string;
}

export interface UpdateDoctorPayload {
  fullName?: string;
  fullNameAr?: string;
  phone?: string;
  specialization?: string;
  qualification?: string;
  bio?: string;
  clinicId?: string;
  ministryOfHealthId?: string | null;
  experienceStartDate?: string | null;
  consultationFee?: number;
  branchId?: string;
  branchIds?: string[];
  services?: string[];
  status?: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  preferences?: Record<string, unknown>;
}

export interface ResetDoctorPasswordPayload {
  password: string;
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
  serviceId: string | undefined;
  serviceName: string;
  doctor?: ApiDoctor;
  endTime: string;
  startTime: string;
  id: string;
  patientId: string;
  patientName: string;
  patientNameAr?: string;
  patientPhone?: string;
  patientAge?: string;
  patientAvatar?: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  duration?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "in-progress" | "no-show" | "rescheduled";
  type: string;
  mode?: "ONSITE" | "ONLINE" | "PHONE_CALL";
  branchId?: string;
  branchName?: string;
  branchAddress?: string;
  notes?: string;
  redeemPoints?: boolean;
  amount?: number;
  paymentMethodType?: "ONSITE_CASH" | "ONSITE_CARD" | "ONLINE_CARD" | "ONLINE_WALLET" | null;
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL" | "REFUNDED" | "OVERDUE";
  invoiceNumber?: string | null;
  createdByName?: string;
  createdByRole?: "PATIENT" | "RECEPTION" | "STAFF" | "ADMIN";
}

export interface ApiAppointment {
  endTime?: string;
  time: string;
  createdAt: string;
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patient?: ApiPatient;
  doctorId?: string;
  doctorName?: string;
  doctor?: ApiDoctor;
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
  branch?: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
  redeemPoints?: boolean;
  amount: number;
  consultationSession?: {
    id: string;
    notes?: string | null;
    savedToPatient: boolean;
    chatLog?: Record<string, unknown> | null;
    endedAt?: string | null;
    medications?: PrescriptionMedicationItem[] | null;
  } | null;
  prescriptions?: ApiPrescription[];
  investigationOrders?: ApiInvestigation[];
  invoices?: ApiInvoice[];
  source?: string;
  paymentMethodType?: "ONSITE_CASH" | "ONSITE_CARD" | "ONLINE_CARD" | "ONLINE_WALLET" | null;
  createdById?: string;
  createdByName?: string;
  createdByRole?: "PATIENT" | "RECEPTION" | "STAFF" | "ADMIN";
}

export interface ApiInvoice {
  id: string;
  invoiceNumber?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  doctorName?: string | null;
  items?: Record<string, unknown>[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING" | "PARTIAL" | "REFUNDED" | "OVERDUE";
  paymentMethodType?: "ONSITE_CASH" | "ONSITE_CARD" | "ONLINE_CARD" | "ONLINE_WALLET" | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiPatientPaymentHistoryItem {
  id: string;
  invoiceNumber?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  doctorName?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING" | "PARTIAL" | "REFUNDED" | "OVERDUE";
  paymentMethodType?: "ONSITE_CASH" | "ONSITE_CARD" | "ONLINE_CARD" | "ONLINE_WALLET" | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  appointment?: Pick<ApiAppointment, "date" | "startTime" | "serviceName" | "type" | "status" | "amount"> | null;
}

export interface RescheduleAppointmentPayload {
  date: string;
  startTime: string;
  branchId?: string | null;
  mode?: "ONSITE" | "ONLINE";
  durationMinutes?: number;
  reason?: string;
}

export interface UpsertMedicalSummaryPayload {
  mode: "NORMAL" | "AI";
  content: string;
  sendToPatient?: boolean;
}

export interface AppointmentSummaryResponse {
  appointmentId: string;
  summary: string | null;
  mode: string | null;
  sendToPatient: boolean;
  savedAt?: string;
}

export interface NotifyAppointmentWhatsAppPayload {
  message?: string;
  estimatedWaitMinutes?: number;
  status?:
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";
}

export interface NotifyAppointmentWhatsAppResponse {
  sent: boolean;
  provider: string;
  reason?: string;
  to: string;
  response?: unknown;
  appointmentId: string;
  patientId?: string | null;
}

export interface CreateReceptionHandoffPayload {
  diagnosis?: string;
  notesSnapshot?: string;
}

export interface ApiReceptionHandoff {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorUserId: string;
  doctorName: string;
  diagnosis?: string | null;
  notesSnapshot?: string | null;
  status: "NEW" | "REVIEWED";
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
  appointment?: ApiAppointment;
}

export interface QueryReceptionHandoffsParams {
  status?: "NEW" | "REVIEWED";
  limit?: number;
  clinicId?: string;
}

export interface SmartRecommendation {
  doctorId: string;
  doctorName: string;
  specialization: string | null;
  date: string;
  startTime: string;
  score: number;
  activeLoad: number;
  continuityVisits: number;
  reasons: string[];
}

export interface SmartRecommendationsResponse {
  generatedAt: string;
  horizonDays: number;
  recommendations: SmartRecommendation[];
}

export type TreatmentPlanStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";

export interface TreatmentMilestone {
  title: string;
  dueDate?: string;
  completed?: boolean;
  notes?: string;
}

export interface ApiTreatmentPlan {
  id: string;
  patientId?: string | null;
  patientName: string;
  doctorId?: string | null;
  doctorName?: string | null;
  serviceName?: string | null;
  title: string;
  description?: string | null;
  totalSessions: number;
  completedSessions: number;
  startDate?: string | null;
  status: TreatmentPlanStatus;
  milestones?: TreatmentMilestone[] | null;
  predictedOutcome?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    fullName: string;
    clinicId?: string | null;
  } | null;
  doctor?: {
    id: string;
    fullName: string;
    user?: {
      clinicId?: string | null;
    } | null;
  } | null;
}

export interface CreateTreatmentPlanPayload {
  patientId: string;
  doctorId?: string;
  serviceName?: string;
  title: string;
  description?: string;
  totalSessions?: number;
  startDate?: string;
  status?: TreatmentPlanStatus;
  milestones?: TreatmentMilestone[];
  predictedOutcome?: string;
}

export interface UpdateTreatmentPlanPayload {
  doctorId?: string;
  serviceName?: string;
  title?: string;
  description?: string;
  totalSessions?: number;
  completedSessions?: number;
  startDate?: string;
  status?: TreatmentPlanStatus;
  milestones?: TreatmentMilestone[];
  predictedOutcome?: string;
}

export interface TreatmentPlanListFilters {
  patientId?: string;
  doctorId?: string;
  status?: TreatmentPlanStatus;
  startDate?: string;
  endDate?: string;
}

export type SurveyStatus = "PENDING" | "COMPLETED";

export interface ApiSurvey {
  id: string;
  patientId?: string | null;
  patientName?: string | null;
  appointmentId?: string | null;
  doctorName?: string | null;
  overallSatisfaction?: number | null;
  doctorRating?: number | null;
  wouldRecommend?: boolean | null;
  feedback?: string | null;
  status: SurveyStatus;
  createdAt: string;
  appointment?: {
    id: string;
    date: string;
    startTime: string;
    serviceName?: string | null;
    doctorName?: string | null;
  } | null;
}

export interface RequestSurveyPayload {
  appointmentId: string;
}

export interface RequestSurveyResponse {
  created: boolean;
  survey: ApiSurvey;
}

export interface SubmitSurveyPayload {
  overallSatisfaction: number;
  doctorRating: number;
  wouldRecommend: boolean;
  feedback?: string;
}

export interface DoctorSurveyStats {
  averageRating: number;
  totalReviews: number;
  distribution: Array<{ stars: number; count: number }>;
  wouldRecommendRate: number;
}

export interface ApiDoctorReview {
  id: string;
  patientName: string;
  doctorRating: number;
  overallSatisfaction?: number;
  wouldRecommend?: boolean;
  feedback?: string;
  createdAt: string;
}

export interface DoctorReviewsResponse {
  stats: DoctorSurveyStats;
  reviews: ApiDoctorReview[];
}

export interface DashboardRange {
  startDate: string;
  endDate: string;
}

export type DashboardAppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export interface DashboardAdminTopDoctor {
  doctorId: string;
  fullName: string;
  email: string;
  specialization: string;
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  appointmentsCount: number;
}

export interface DashboardAdminInventoryModule {
  summaryCards: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
  };
  needsRestockingCount: number;
  itemsNeedingRestock: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    minQuantity: number;
    status: StockStatus;
    hasPendingRequest: boolean;
  }>;
  restockAdvisor: {
    attentionCount: number;
    pendingRequests: number;
    generatedMessage: string;
    suppliers: Array<{
      supplierName: string;
      totalEstimated: number;
      itemsCount: number;
      items: Array<{
        itemId: string;
        itemName: string;
        currentStock: number;
        minQuantity: number;
        recommendedQuantity: number;
        estimatedTotal: number;
        status: StockStatus;
      }>;
    }>;
  };
}

export interface DashboardAdminServicesModule {
  summaryCards: {
    totalServices: number;
    activeServices: number;
    inactiveServices: number;
    averagePrice: number;
  };
  catalog: Array<{
    id: string;
    name: string;
    description: string;
    category: ApiService["category"];
    price: number;
    durationMinutes: number;
    requiresSessions: boolean;
    totalSessions: number | null;
    isActive: boolean;
  }>;
}

export interface DashboardAdminStaffAvailabilityModule {
  summaryCards: {
    activeDoctors: number;
    configuredShifts: number;
    totalDoctors: number;
    totalAppointments: number;
  };
  peakConsultationHours: Array<{
    name: string;
    count: number;
  }>;
  doctorSchedules: Array<{
    doctorId: string;
    fullName: string;
    specialization: string;
    status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
    isAvailable: boolean;
    avatarUrl?: string | null;
    appointmentsCount: number;
    configuredDays: number[];
  }>;
  otherStaffAvailability: Array<{
    id: string;
    fullName: string;
    email: string;
    isAvailable: boolean;
    avatarUrl?: string | null;
  }>;
}

export interface DashboardAdminStaffPerformanceModule {
  summaryCards: {
    totalProviders: number;
    patientsSeen: number;
    avgSatisfaction: number | null;
    totalRevenue: number;
  };
  providerRevenue: Array<{
    name: string;
    revenue: number;
    patients: number;
  }>;
  providers: Array<{
    doctorId: string;
    fullName: string;
    specialization: string;
    status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
    patientsSeen: number;
    avgDurationMinutes: number | null;
    revenue: number;
    surveysCount: number;
    avgSatisfaction: number | null;
    completionRate: number;
    noShowRate: number;
    alerts: {
      highNoShow: boolean;
    };
  }>;
}

export interface DashboardAdminSummaryData {
  summaryCards: {
    totalAppointments: number;
    totalDoctors: number;
    totalStaff: number;
    totalRevenue: number;
    lowStockAlerts: number;
  };
  statusBreakdown: Record<DashboardAppointmentStatus, number>;
  charts: {
    weeklyAppointments: Array<{ name: string; count: number }>;
    monthlyRevenue: Array<{ name: string; revenue: number }>;
  };
  topDoctors: DashboardAdminTopDoctor[];
  inventory?: DashboardAdminInventoryModule;
  services?: DashboardAdminServicesModule;
  staffAvailability?: DashboardAdminStaffAvailabilityModule;
  staffPerformance?: DashboardAdminStaffPerformanceModule;
}

export interface DashboardStaffQueueItem {
  id: string;
  patientId?: string;
  patientName: string;
  patientNameAr?: string;
  doctorName: string;
  serviceName: string;
  time: string;
  status: DashboardAppointmentStatus;
}

export interface DashboardStaffSummaryData {
  summaryCards: {
    totalToday: number;
    scheduledConfirmed: number;
    inProgress: number;
    completed: number;
    totalPatients: number;
    todayRevenue: number;
  };
  queue: {
    upcoming: DashboardStaffQueueItem[];
    nextAppointment: DashboardStaffQueueItem | null;
  };
  doctorsStatus: Array<{
    doctorId: string;
    fullName: string;
    specialization: string;
    isAvailable: boolean;
    avatarUrl?: string | null;
  }>;
  activityLog: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export interface DashboardDoctorScheduleItem {
  notes: string;
  patientPhone: string;
  id: string;
  patientName: string;
  patientNameAr?: string;
  patientGender?: string;
  patientDateOfBirth?: string;
  type: string;
  time: string;
  status: DashboardAppointmentStatus;
}

export interface DashboardDoctorSummaryData {
  summaryCards: {
    todayAppointments: number;
    totalPatients: number;
    averageWaitMinutes: number | null;
    satisfaction: number | null;
    completionRate: number;
  };
  schedule: {
    today: DashboardDoctorScheduleItem[];
    highlightDates: string[];
  };
  charts: {
    weeklyPatients: Array<{ name: string; patients: number }>;
    monthlyPatients: Array<{ name: string; patients: number }>;
  };
}

export interface DashboardSuperAdminSummaryData {
  summaryCards: {
    totalUsers: number;
    activeUsers: number;
    totalAppointments: number;
    totalClinics: number;
    totalRevenue: number;
  };
  roleDistribution: {
    PATIENT: number;
    DOCTOR: number;
    STAFF: number;
    ADMIN: number;
    SUPER_ADMIN: number;
  };
  charts?: {
    userGrowth?: Array<{ name: string; users: number }>;
  };
}

export interface DashboardPatientSummaryData {
  summaryCards: {
    upcomingAppointments: number;
    completedAppointments: number;
    myDoctors: number;
    healthScore: number | null;
  };
}

export interface DashboardSummaryResponse {
  role: Role;
  generatedAt: string;
  range: DashboardRange;
  data: Record<string, unknown>;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface InsuranceDetails {
  provider: string;
  category: string;
  policyNumber: string;
  memberId?: string;
  expiryDate: string;
  providerContact?: string;
  cardImageUrl?: string;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  discountPercent?: number;
  discountNote?: string;
}

export interface ApiPatient {
  address: string;
  id: string;
  fullName: string;
  fullNameAr?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies: string[];
  medicalHistory?: Record<string, unknown>;
  notes?: string;
  clinicId?: string;
  branchId?: string;
  vipTier?: "STANDARD" | "SILVER" | "GOLD" | "PLATINUM";
  loyaltyPoints?: number;
  specialDiscount?: number;
  totalVisits?: number;
  totalSpent?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    isOnboarded: boolean;
    isActive: boolean;
    createdAt: string;
    onboardingAnswers?: Array<{
      answer: string;
      question: {
        questionAr: string | null;
        fieldKey: string;
        question: string;
      };
    }>;
  } | null;
}

export interface ApiLoyaltyTransaction {
  id: string;
  patientId: string;
  amount: number;
  type: "EARN" | "REDEEM";
  description: string;
  descriptionAr?: string;
  createdAt: string;
}

export interface PatientListFilters {
  search?: string;
  vipTier?: "STANDARD" | "SILVER" | "GOLD" | "PLATINUM";
  gender?: string;
  portalStatus?:
  | "all"
  | "with_account"
  | "without_account"
  | "onboarding_pending"
  | "onboarding_completed";
  sortBy?: "fullName" | "createdAt" | "totalVisits" | "totalSpent";
  sortOrder?: "asc" | "desc";
  take?: number;
  page?: number;
}

export interface PatientsPaginationMeta {
  page: number;
  take: number;
  total: number;
  totalPages: number;
}

// Quick Task Types
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface ApiQuickTask {
  id: string;
  clinicId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  doctorId: string;
  createdByUserId: string;
  patientId?: string | null;
  appointmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  doctor?: ApiDoctor;
  patient?: ApiPatient;
  appointment?: ApiAppointment;
}

export interface CreateQuickTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  doctorId: string;
  patientId?: string;
  appointmentId?: string;
}

export interface UpdateQuickTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  doctorId?: string;
}

export interface QuickTaskListFilters {
  doctorId?: string;
  status?: TaskStatus;
}

export interface PaginatedPatientsResponse {
  data: ApiPatient[];
  meta: PatientsPaginationMeta;
}

export interface CreatePatientPayload {
  fullName: string;
  fullNameAr?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  address?: string | null;
  allergies?: string[];
  medicalHistory?: Record<string, unknown> | null;
  notes?: string | null;
  clinicId?: string;
  createUserAccount?: boolean;
  password?: string;
}

export type LabResultStatus = "PENDING" | "NORMAL" | "ABNORMAL" | "CRITICAL";

export interface ApiPatientDocument {
  type: ReactNode;
  uploadedByPatient: boolean;
  id: string;
  patientId: string;
  appointmentId?: string | null;
  name: string;
  fileUrl: string;
  fileType?: string | null;
  storageMode?: "r2" | "cloudinary" | "inline-data-url" | null;
  storageProvider?: "r2" | "cloudinary" | "inline-data-url" | null;
  storageKey?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
  appointment?: ApiAppointment;
}

export interface CreatePatientDocumentPayload {
  name: string;
  fileUrl: string;
  fileType?: string | null;
  appointmentId?: string | null;
  storageMode?: "r2" | "cloudinary" | "inline-data-url";
}

export interface ApiLabResult {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  testName: string;
  resultSummary?: string | null;
  status: LabResultStatus;
  resultDate: string;
  documentId?: string | null;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    name: string;
    fileUrl: string;
    fileType?: string | null;
  } | null;
}

export interface CreateLabResultPayload {
  patientId: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  testName: string;
  resultSummary?: string | null;
  status?: LabResultStatus;
  resultDate?: string;
  documentId?: string | null;
}

export interface UpdateLabResultPayload {
  testName?: string;
  resultSummary?: string | null;
  status?: LabResultStatus;
  resultDate?: string;
  documentId?: string | null;
}

export type PrescriptionStatus = "DRAFT" | "ISSUED" | "SENT" | "CANCELLED";

export interface PrescriptionMedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface ApiPrescription {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  medications: PrescriptionMedicationItem[];
  status: PrescriptionStatus;
  issuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  doctor?: {
    id: string;
    fullName: string;
  } | null;
  patient?: {
    id: string;
    fullName: string;
    clinicId?: string | null;
    clinic?: {
      name: string;
      logoUrl: string | null;
    } | null;
  } | null;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  medications: PrescriptionMedicationItem[];
  status?: PrescriptionStatus;
  issuedAt?: string;
}

export interface UpdatePrescriptionPayload {
  appointmentId?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  medications?: PrescriptionMedicationItem[];
  status?: PrescriptionStatus;
  issuedAt?: string | null;
}

export type InvestigationCategory = "LAB" | "IMAGING" | "CARDIOLOGY" | "OTHER";

export type InvestigationStatus =
  | "ORDERED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface ApiInvestigation {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  category: InvestigationCategory;
  testName: string;
  status: InvestigationStatus;
  priority: "NORMAL" | "URGENT" | "VIP";
  notes?: string | null;
  documentId?: string | null;
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    name: string;
    fileUrl: string;
    fileType?: string | null;
  } | null;
}

export interface CreateInvestigationPayload {
  patientId: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  category?: InvestigationCategory;
  testName: string;
  status?: InvestigationStatus;
  priority?: "NORMAL" | "URGENT" | "VIP";
  notes?: string | null;
  documentId?: string | null;
  orderedAt?: string;
}

export interface UpdateInvestigationPayload {
  appointmentId?: string | null;
  category?: InvestigationCategory;
  testName?: string;
  status?: InvestigationStatus;
  priority?: "NORMAL" | "URGENT" | "VIP";
  notes?: string | null;
  documentId?: string | null;
  orderedAt?: string | null;
}

export interface SendWhatsAppPayload {
  to: string;
  message?: string;
  mediaUrl?: string;
  patientId?: string;
}

export interface SendWhatsAppResponse {
  sent: boolean;
  provider: string;
  reason?: string;
  to: string;
  response?: unknown;
}

export interface CreateDiagnosticReportPayload {
  appointmentId?: string;
  hospitalName?: string;
  hospitalNameAr?: string;
  specialty?: string;
  serviceRequested: string;
  studyReason: string;
  findings: string;
  impression: string;
  advisedClinicalCorrelation?: boolean;
  examDateTime?: string;
  radiologistName?: string;
  radiologistTitle?: string;
  licenseNumber?: string;
  patientNumber?: string;
  referringDoctor?: string;
  whatsappCaption?: string;
  sendWhatsApp?: boolean;
  medications?: PrescriptionMedicationItem[];
}

export interface SendDiagnosticReportResponse {
  generated: boolean;
  documentId: string;
  documentName: string;
  downloadUrl: string;
  storageMode?: "r2" | "cloudinary" | "inline-data-url";
  mediaAttached?: boolean;
  mediaUrl?: string | null;
  mediaFallbackReason?: string | null;
  whatsapp: {
    sent: boolean;
    provider: string;
    reason?: string;
    to?: string;
    response?: unknown;
  };
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
  nameAr?: string;
  description?: string;
  category: "CONSULTATION" | "DENTAL" | "DERMATOLOGY" | "LASER" | "AESTHETIC" | "SURGICAL" | "DIAGNOSTIC" | "WELLNESS" | "OTHER";
  price: number;
  durationMinutes: number;
  isActive: boolean;
  requiresSessions: boolean;
  totalSessions?: number;
}

export interface CreateServicePayload {
  name: string;
  nameAr?: string;
  description?: string;
  category: ApiService["category"];
  price: number;
  durationMinutes: number;
  isActive: boolean;
  requiresSessions: boolean;
  totalSessions?: number | null;
}

export interface UpdateServicePayload {
  name?: string;
  nameAr?: string;
  description?: string;
  category?: ApiService["category"];
  price?: number;
  durationMinutes?: number;
  isActive?: boolean;
  requiresSessions?: boolean;
  totalSessions?: number | null;
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

export interface ClinicSettings {
  receptionWhatsAppNumber?: string;
  receptionReminderDelayMinutes?: number;
  doctorDailySummaryHour?: number;
  [key: string]: unknown;
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
  settings?: ClinicSettings;
}

export interface ApiNotificationTemplate {
  id: string;
  key: string;
  language: string;
  channel: "WHATSAPP" | "EMAIL" | "SMS";
  audience: "PATIENT" | "DOCTOR" | "RECEPTION";
  content: string;
  externalId?: string | null;
  isActive: boolean;
  createdAt: string;
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

export type InventoryCategory =
  | "MEDICAL_SUPPLY"
  | "COSMETIC"
  | "EQUIPMENT"
  | "PHARMACEUTICAL"
  | "CONSUMABLE"
  | "OTHER";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRED";

export type RestockStatus = "PENDING" | "ORDERED" | "RECEIVED" | "CANCELLED";

export interface ApiInventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  supplierName?: string | null;
  expiryDate?: string | null;
  status: StockStatus;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInventoryItemPayload {
  name: string;
  category: InventoryCategory;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  supplierName?: string | null;
  expiryDate?: string | null;
  branchId: string;
}

export interface UpdateInventoryItemPayload {
  name?: string;
  category?: InventoryCategory;
  quantity?: number;
  minQuantity?: number;
  unitPrice?: number;
  supplierName?: string | null;
  expiryDate?: string | null;
  branchId?: string;
}

export interface ApiRestockRequest {
  id: string;
  itemId: string;
  itemName: string;
  requestedQuantity: number;
  supplierName?: string | null;
  estimatedTotal: number;
  status: RestockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestockRequestPayload {
  requestedQuantity: number;
  supplierName?: string | null;
}

export interface UpdateRestockStatusPayload {
  status: RestockStatus;
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
