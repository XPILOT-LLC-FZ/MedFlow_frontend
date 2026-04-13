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
  userId?: string;
  clinicId?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  ministryOfHealthId?: string | null;
  experienceStartDate?: string | null;
  experienceYears: number;
  consultationFee: number;
  branchId?: string;
  services: string[];
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  rating: number;
  shifts?: DoctorShift[];
  user?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    isActive: boolean;
    clinicId?: string | null;
  } | null;
}

export interface DoctorListFilters {
  status?: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  branchId?: string;
  specialization?: string;
  search?: string;
  serviceId?: string;
  role?: string;
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
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  ministryOfHealthId?: string | null;
  experienceStartDate?: string | null;
  consultationFee: number;
  branchId?: string;
  services: string[];
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  password: string;
  clinicId: string;
}

export interface UpdateDoctorPayload {
  fullName?: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  clinicId?: string;
  ministryOfHealthId?: string | null;
  experienceStartDate?: string | null;
  consultationFee?: number;
  branchId?: string;
  services?: string[];
  status?: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
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
  consultationSession?: {
    id: string;
    notes?: string | null;
    savedToPatient: boolean;
    chatLog?: Record<string, unknown> | null;
    endedAt?: string | null;
  } | null;
}

export interface RescheduleAppointmentPayload {
  date: string;
  startTime: string;
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
    appointmentsCount: number;
    configuredDays: number[];
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
  patientName: string;
  doctorName: string;
  time: string;
  status: DashboardAppointmentStatus;
}

export interface DashboardStaffSummaryData {
  summaryCards: {
    totalToday: number;
    scheduledConfirmed: number;
    inProgress: number;
    completed: number;
  };
  queue: {
    upcoming: DashboardStaffQueueItem[];
    nextAppointment: DashboardStaffQueueItem | null;
  };
}

export interface DashboardDoctorScheduleItem {
  id: string;
  patientName: string;
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
  branchId?: string;
  vipTier?: "STANDARD" | "SILVER" | "GOLD" | "PLATINUM";
  loyaltyPoints?: number;
  totalVisits?: number;
  totalSpent?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    isOnboarded: boolean;
    isActive: boolean;
    createdAt: string;
  } | null;
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

export interface PaginatedPatientsResponse {
  data: ApiPatient[];
  meta: PatientsPaginationMeta;
}

export interface CreatePatientPayload {
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  allergies?: string[];
  medicalHistory?: Record<string, unknown> | null;
  notes?: string | null;
  clinicId?: string;
  createUserAccount?: boolean;
  password?: string;
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
  durationMinutes: number;
  isActive: boolean;
  requiresSessions: boolean;
  totalSessions?: number;
}

export interface CreateServicePayload {
  name: string;
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
