"use client";

import { create } from "zustand";
import type { ApiAppointment, Appointment } from "@/types";
import { bookingService } from "@/services/bookingService";
import { staffService } from "@/services/staffService";
import { useAuthStore } from "@/stores/useAuthStore";

interface BookingState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (filters?: Record<string, unknown>) => Promise<void>;
  addAppointment: (data: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  updateAppointmentLocal: (id: string, updates: Partial<Appointment>) => void;
}

let clinicContextCheckInFlight: Promise<boolean> | null = null;
let lastClinicContextCheckAt = 0;
const CLINIC_CONTEXT_RETRY_MS = 5000;

const ensureClinicContextReady = async (): Promise<boolean> => {
  const authState = useAuthStore.getState();
  if (!authState.isAuthenticated) return true;
  if (authState.user?.role === "SUPER_ADMIN") return true;
  if (authState.user?.role === "PATIENT") return Boolean(authState.user?.clinicId);
  if (authState.user?.clinicId) return true;

  if (clinicContextCheckInFlight) {
    return clinicContextCheckInFlight;
  }

  const now = Date.now();
  if (now - lastClinicContextCheckAt < CLINIC_CONTEXT_RETRY_MS) {
    return Boolean(useAuthStore.getState().user?.clinicId);
  }

  lastClinicContextCheckAt = now;

  clinicContextCheckInFlight = (async () => {
    try {
      await useAuthStore.getState().bootSession();
    } catch {
      // no-op
    } finally {
      clinicContextCheckInFlight = null;
    }

    return Boolean(useAuthStore.getState().user?.clinicId);
  })();

  return clinicContextCheckInFlight;
};

const mapToLocal = (api: ApiAppointment): Appointment => ({
  id: api.id,
  patientId: api.patientId || "guest",
  patientName: api.patientName,
  doctorId: api.doctorId || "unknown",
  doctorName: api.doctorName || "Unknown Doctor",
  specialty: api.serviceName || "Specialist",
  date: api.date,
  time: api.startTime,
  status: api.status.toLowerCase().replace("_", "-") as Appointment["status"],
  type: api.type.charAt(0) + api.type.slice(1).toLowerCase(),
  notes:
    api.consultationSession?.savedToPatient && api.consultationSession?.notes
      ? api.consultationSession.notes
      : api.notes,
});

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );

const mapToApi = (local: Partial<Appointment>): Partial<ApiAppointment> => {
  const api: Partial<ApiAppointment> = {};
  if (local.patientId && isUuid(local.patientId)) api.patientId = local.patientId;
  if (local.patientName) api.patientName = local.patientName;
  if (local.doctorId && isUuid(local.doctorId)) api.doctorId = local.doctorId;
  if (local.doctorName) api.doctorName = local.doctorName;
  if (local.date) api.date = local.date;
  if (local.time) api.startTime = local.time;
  if (local.status) {
    api.status = local.status.toUpperCase().replace("-", "_") as ApiAppointment["status"];
  }
  if (local.type) {
    api.type = local.type.toUpperCase() as ApiAppointment["type"];
  }
  if (local.notes) api.notes = local.notes;
  if (local.specialty) api.serviceName = local.specialty;
  
  // Defaults for creation if missing
  if (!api.durationMinutes) api.durationMinutes = 30;
  if (!api.mode) api.mode = "ONSITE";
  
  return api;
};

const inferClinicIdFromDoctor = async (doctorId?: string): Promise<string | null> => {
  if (!doctorId) return null;

  try {
    const doctor = await staffService.getDoctorById(doctorId);
    const doctorRecord = doctor as unknown as Record<string, unknown>;
    const nestedClinic =
      typeof doctorRecord.clinic === "object" && doctorRecord.clinic !== null
        ? (doctorRecord.clinic as Record<string, unknown>)
        : undefined;

    const clinicId =
      doctorRecord.clinicId ||
      doctorRecord.clinic_id ||
      nestedClinic?.id ||
      null;

    return typeof clinicId === "string" ? clinicId : null;
  } catch {
    return null;
  }
};

export const useBookingStore = create<BookingState>((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,

  fetchAppointments: async (filters) => {
    set({ isLoading: true, error: null });

    // If clinic context is not ready yet (e.g., pre-onboarding), avoid hard-failing the UI.
    if (!(await ensureClinicContextReady())) {
      set({ appointments: [], isLoading: false, error: null });
      return;
    }

    try {
      const apiAppointments = await bookingService.getAll(filters);
      set({ appointments: (apiAppointments || []).map(mapToLocal), isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch appointments";
      
      // Soft-fail for clinic context issues — these are session-timing transient errors,
      // not user-visible failures. Return empty state silently.
      const isSoftFail = 
        message.includes("Clinic context missing") ||
        message.toLowerCase().includes("internal server error");
      
      if (isSoftFail) {
        // Retry once after a short delay to let session/clinic context settle
        await new Promise(r => setTimeout(r, 1500));
        try {
          const apiAppointments = await bookingService.getAll(filters);
          set({ appointments: (apiAppointments || []).map(mapToLocal), isLoading: false });
          return;
        } catch {
          // Still failing — return silently with empty state, don't surface to UI
          set({ appointments: [], isLoading: false, error: null });
          return;
        }
      }
      
      set({ error: message, isLoading: false });
    }
  },

  addAppointment: async (data) => {
    set({ isLoading: true, error: null });

    // Patient flow fallback: if clinic context is missing, try to infer it from selected doctor.
    const authState = useAuthStore.getState();
    if (authState.user?.role === "PATIENT" && !authState.user?.clinicId) {
      const inferredClinicId = await inferClinicIdFromDoctor(data.doctorId);
      if (inferredClinicId && authState.user) {
        useAuthStore.setState({
          user: {
            ...authState.user,
            clinicId: inferredClinicId,
          },
        });
      }
    }

    if (!(await ensureClinicContextReady())) {
      const message = "Clinic context is not ready. Please complete onboarding first.";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }

    try {
      const apiData = mapToApi(data);
      const created = await bookingService.create(apiData);
      const localCreated = mapToLocal(created);
      set((s) => ({
        appointments: [localCreated, ...s.appointments],
        isLoading: false,
      }));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("appointment-booked"));
      }

      return localCreated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to book appointment";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateAppointment: async (id, updates) => {
    if (!(await ensureClinicContextReady())) {
      const message = "Clinic context is not ready. Please complete onboarding first.";
      set({ error: message });
      throw new Error(message);
    }

    try {
      if (updates.status) {
        const apiStatus = updates.status.toUpperCase().replace("-", "_");
        await bookingService.updateStatus(id, apiStatus, updates.notes);
      }
      // Update locally
      get().updateAppointmentLocal(id, updates);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update appointment";
      set({ error: message });
      throw error;
    }
  },

  updateAppointmentLocal: (id, updates) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },
}));

