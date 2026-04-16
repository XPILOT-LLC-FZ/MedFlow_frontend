"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Save, RefreshCcw, CalendarDays, Search, Funnel, Plus, Clock3, Phone, MoreVertical, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { bookingService } from "@/services/bookingService";
import { aiChatService } from "@/services/aiChatService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApiService, Appointment, DoctorShift } from "@/types";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayLabelsAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getDayLabel(dayOfWeek: number, locale: string): string {
  return locale === "ar" ? dayLabelsAr[dayOfWeek] : dayLabels[dayOfWeek];
}

function buildDefaultShift(dayOfWeek: number): DoctorShift {
  return {
    dayOfWeek,
    shiftStart: "09:00",
    shiftEnd: "17:00",
    lunchStart: "13:00",
    lunchEnd: "14:00",
    isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
    branchId: null,
  };
}

function normalizeShifts(source: DoctorShift[]): DoctorShift[] {
  const map = new Map<number, DoctorShift>();
  source.forEach((shift) => {
    map.set(shift.dayOfWeek, {
      ...buildDefaultShift(shift.dayOfWeek),
      ...shift,
      shiftStart: shift.shiftStart?.slice(0, 5) || "09:00",
      shiftEnd: shift.shiftEnd?.slice(0, 5) || "17:00",
      lunchStart: shift.lunchStart ? shift.lunchStart.slice(0, 5) : "13:00",
      lunchEnd: shift.lunchEnd ? shift.lunchEnd.slice(0, 5) : "14:00",
    });
  });

  const normalized: DoctorShift[] = [];
  for (let day = 0; day < 7; day += 1) {
    normalized.push(map.get(day) || buildDefaultShift(day));
  }
  return normalized;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
}

function normalizeAvailabilityResponse(response: unknown): string[] {
  if (Array.isArray(response)) {
    return response.map((slot) => String(slot));
  }

  if (typeof response === "object" && response !== null) {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.slots)) {
      return record.slots.map((slot) => String(slot));
    }

    if (Array.isArray(record.availableSlots)) {
      return record.availableSlots.map((slot) => String(slot));
    }
  }

  return [];
}

function validateShifts(shifts: DoctorShift[], locale: string): string | null {
  for (const shift of shifts) {
    if (!shift.isAvailable) {
      continue;
    }

    const label = getDayLabel(shift.dayOfWeek, locale);
    const shiftStart = shift.shiftStart?.trim();
    const shiftEnd = shift.shiftEnd?.trim();

    if (!shiftStart || !shiftEnd) {
      return locale === "ar"
        ? `الرجاء إدخال وقت بداية ونهاية صحيحين ليوم ${label}`
        : `Please provide valid shift start and end times for ${label}`;
    }

    if (toMinutes(shiftEnd) <= toMinutes(shiftStart)) {
      return locale === "ar"
        ? `وقت نهاية الدوام يجب أن يكون بعد البداية ليوم ${label}`
        : `Shift end must be after shift start for ${label}`;
    }

    const hasLunchStart = Boolean(shift.lunchStart);
    const hasLunchEnd = Boolean(shift.lunchEnd);

    if (hasLunchStart !== hasLunchEnd) {
      return locale === "ar"
        ? `الرجاء إدخال بداية ونهاية الاستراحة معًا ليوم ${label}`
        : `Provide both lunch start and lunch end for ${label}`;
    }

    if (hasLunchStart && hasLunchEnd) {
      const lunchStart = shift.lunchStart as string;
      const lunchEnd = shift.lunchEnd as string;

      if (toMinutes(lunchEnd) <= toMinutes(lunchStart)) {
        return locale === "ar"
          ? `وقت نهاية الاستراحة يجب أن يكون بعد البداية ليوم ${label}`
          : `Lunch end must be after lunch start for ${label}`;
      }

      if (toMinutes(lunchStart) < toMinutes(shiftStart) || toMinutes(lunchEnd) > toMinutes(shiftEnd)) {
        return locale === "ar"
          ? `الاستراحة يجب أن تكون ضمن وقت الدوام ليوم ${label}`
          : `Lunch time must be within shift bounds for ${label}`;
      }
    }
  }

  return null;
}

export default function SchedulePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();
  const { appointments, fetchAppointments, addAppointment } = useBookingStore();
  const { success, error } = useToastStore();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [visitTypeOpen, setVisitTypeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    patientName: "",
    age: "",
    phoneNumber: "",
    date: "",
    time: "",
    visitType: "New patient",
    duration: "30",
    reason: "",
  });
  const [availabilityDate, setAvailabilityDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [services, setServices] = useState<ApiService[]>([]);
  const [shifts, setShifts] = useState<DoctorShift[]>(
    Array.from({ length: 7 }).map((_, day) => buildDefaultShift(day))
  );

  // Ported Actions State
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionsDropdownId, setActionsDropdownId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<{
    appointmentId: string;
    type: "reschedule" | "manual-summary" | "ai-summary";
  } | null>(null);
  
  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    startTime: "",
    reason: "",
  });
  const [manualSummaryForm, setManualSummaryForm] = useState({
    content: "",
    sendToPatient: true,
  });
  const [aiSummaryForm, setAiSummaryForm] = useState({
    consultationNotes: "",
    format: "clinical" as "brief" | "detailed" | "clinical",
    sendToPatient: true,
  });

  const hasDoctor = Boolean(doctorId);

  const loadAvailability = useCallback(async (targetDoctorId: string) => {
    if (!targetDoctorId || !availabilityDate) {
      setAvailableSlots([]);
      return;
    }

    setIsLoadingAvailability(true);
    try {
      const response = await staffService.getDoctorAvailability(
        targetDoctorId,
        availabilityDate,
        selectedServiceId || undefined,
      );
      setAvailableSlots(normalizeAvailabilityResponse(response));
    } catch {
      setAvailableSlots([]);
      error(locale === "ar" ? "تعذر تحميل الأوقات المتاحة" : "Failed to load available slots");
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [availabilityDate, error, locale, selectedServiceId]);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchDoctors(), fetchAppointments()]);
      const doctors = useStaffStore.getState().doctors;
      const doctor = doctors.find((entry) =>
        entry.userId === user?.id ||
        entry.id === user?.id ||
        entry.email?.toLowerCase() === user?.email?.toLowerCase()
      );

      if (!doctor) {
        error(locale === "ar" ? "تعذر العثور على ملف الطبيب" : "Doctor profile not found");
        setDoctorId(null);
        return;
      }

      setDoctorId(doctor.id);
      setDoctorName(doctor.fullName ?? user?.name ?? null);

      const [fetchedShifts, fetchedServices] = await Promise.all([
        staffService.getDoctorShifts(doctor.id),
        servicesCatalogService.getAll({ isActive: "true" }).catch(() => [] as ApiService[]),
      ]);

      setShifts(normalizeShifts(fetchedShifts));
      setServices(fetchedServices);
    } catch {
      error(locale === "ar" ? "فشل تحميل الجدول" : "Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  }, [error, fetchAppointments, fetchDoctors, locale, user?.email, user?.id, user?.name]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!doctorId) {
      setAvailableSlots([]);
      return;
    }

    void loadAvailability(doctorId);
  }, [availabilityDate, doctorId, loadAvailability, selectedServiceId]);

  const updateShift = (dayOfWeek: number, patch: Partial<DoctorShift>) => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.dayOfWeek === dayOfWeek
          ? { ...shift, ...patch }
          : shift
      )
    );
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (actionsDropdownId) {
        setActionsDropdownId(null);
      }
    };
    if (actionsDropdownId) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [actionsDropdownId]);

  const handleSave = async () => {
    if (!doctorId) return;

    const validationError = validateShifts(shifts, locale);
    if (validationError) {
      error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const payload = shifts
        .map((shift) => ({
          dayOfWeek: shift.dayOfWeek,
          shiftStart: shift.shiftStart,
          shiftEnd: shift.shiftEnd,
          lunchStart: shift.lunchStart || null,
          lunchEnd: shift.lunchEnd || null,
          isAvailable: shift.isAvailable,
          branchId: shift.branchId || null,
        }))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      await staffService.updateDoctorShifts(doctorId, payload);
      success(locale === "ar" ? "تم حفظ جدول الدوام" : "Schedule saved");
      void loadAvailability(doctorId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save schedule";
      error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAppointmentForm = () => {
    setNewAppointmentForm({
      patientName: "",
      age: "",
      phoneNumber: "",
      date: "",
      time: "",
      visitType: "New patient",
      duration: "30",
      reason: "",
    });
  };

  const handleCreateAppointment = async () => {
    if (!doctorId) {
      error(locale === "ar" ? "ملف الطبيب غير متاح" : "Doctor profile is not available");
      return;
    }
    if (!newAppointmentForm.patientName.trim() || !newAppointmentForm.date || !newAppointmentForm.time) {
      error(locale === "ar" ? "الرجاء إدخال اسم المريض والتاريخ والوقت" : "Please enter patient name, date, and time");
      return;
    }

    setIsSubmittingAppointment(true);
    try {
      await addAppointment({
        patientName: newAppointmentForm.patientName.trim(),
        patientId: newAppointmentForm.phoneNumber.trim() || `guest-${Date.now()}`,
        doctorId,
        doctorName: doctorName || user?.name || "Doctor",
        date: newAppointmentForm.date,
        time: newAppointmentForm.time,
        status: "scheduled",
        type: newAppointmentForm.visitType,
        specialty: "General Consultation",
        notes: `${newAppointmentForm.reason.trim()}${newAppointmentForm.age ? ` | Age: ${newAppointmentForm.age}` : ""}${newAppointmentForm.phoneNumber ? ` | Phone: ${newAppointmentForm.phoneNumber}` : ""}${newAppointmentForm.duration ? ` | Duration: ${newAppointmentForm.duration} min` : ""}`,
      });
      await fetchAppointments();
      success(locale === "ar" ? "تمت إضافة الموعد بنجاح" : "Appointment added successfully");
      setShowAddAppointmentModal(false);
      resetAppointmentForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add appointment";
      error(message);
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  // Ported Actions Handlers
  const openRescheduleForm = (appointment: Appointment) => {
    setOpenForm({ appointmentId: appointment.id, type: "reschedule" });
    setRescheduleForm({
      date: appointment.date,
      startTime: appointment.time,
      reason: "",
    });
    setActionsDropdownId(null);
  };

  const openManualSummaryForm = (appointment: Appointment) => {
    setOpenForm({ appointmentId: appointment.id, type: "manual-summary" });
    setManualSummaryForm({
      content: appointment.notes ?? "",
      sendToPatient: true,
    });
    setActionsDropdownId(null);
  };

  const openAiSummaryForm = (appointment: Appointment) => {
    setOpenForm({ appointmentId: appointment.id, type: "ai-summary" });
    setAiSummaryForm({
      consultationNotes: appointment.notes ?? "",
      format: "clinical",
      sendToPatient: true,
    });
    setActionsDropdownId(null);
  };

  const handleRescheduleSubmit = async (appointment: Appointment) => {
    if (!rescheduleForm.date || !rescheduleForm.startTime) {
      error(
        locale === "ar"
          ? "يرجى تعبئة التاريخ والوقت"
          : "Please fill both date and start time",
      );
      return;
    }

    setActiveActionId(appointment.id);
    try {
      await bookingService.rescheduleAppointment(appointment.id, {
        date: rescheduleForm.date,
        startTime: rescheduleForm.startTime,
        reason: rescheduleForm.reason.trim() || undefined,
      });
      await fetchAppointments();
      setOpenForm(null);
      success(locale === "ar" ? "تمت إعادة الجدولة بنجاح" : "Appointment rescheduled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reschedule appointment";
      error(message);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleManualSummarySubmit = async (appointment: Appointment) => {
    if (!manualSummaryForm.content || manualSummaryForm.content.trim().length < 5) {
      error(
        locale === "ar"
          ? "الملخص الطبي يجب أن يكون 5 أحرف على الأقل"
          : "Medical summary must be at least 5 characters",
      );
      return;
    }

    setActiveActionId(appointment.id);
    try {
      await bookingService.saveManualSummary(appointment.id, {
        mode: "NORMAL",
        content: manualSummaryForm.content.trim(),
        sendToPatient: manualSummaryForm.sendToPatient,
      });
      await fetchAppointments();
      setOpenForm(null);
      success(locale === "ar" ? "تم إرسال الملخص" : "Medical summary sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send summary";
      error(message);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleAiSummarySubmit = async (appointment: Appointment) => {
    setActiveActionId(appointment.id);
    try {
      await aiChatService.generateMedicalSummary({
        appointmentId: appointment.id,
        consultationNotes: aiSummaryForm.consultationNotes.trim() || undefined,
        format: aiSummaryForm.format,
        language: locale === "ar" ? "ar" : "en",
        sendToPatient: aiSummaryForm.sendToPatient,
        saveSummary: true,
      });
      await fetchAppointments();
      setOpenForm(null);
      success(locale === "ar" ? "تم إنشاء ملخص بالذكاء الاصطناعي" : "AI summary generated and sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate AI summary";
      error(message);
    } finally {
      setActiveActionId(null);
    }
  };

  const dateKey = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);
  const timelineDates = useMemo(() => {
    return Array.from({ length: 9 }).map((_, index) => {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() - 7 + index);
      return date;
    });
  }, [selectedDate]);

  const doctorAppointments = useMemo(() => {
    const aliases = new Set(
      [doctorName, user?.name].filter((value): value is string => Boolean(value))
    );
    return appointments.filter((appointment) => {
      return appointment.doctorId === doctorId || aliases.has(appointment.doctorName);
    });
  }, [appointments, doctorId, doctorName, user?.name]);

  const dayAppointments = useMemo(() => {
    const query = scheduleSearch.trim().toLowerCase();
    return doctorAppointments
      .filter((appointment) => appointment.date.slice(0, 10) === dateKey)
      .filter((appointment) => {
        if (!query) return true;
        return (
          appointment.patientName.toLowerCase().includes(query) ||
          appointment.type.toLowerCase().includes(query) ||
          (appointment.notes || "").toLowerCase().includes(query)
        );
      })
      .filter((appointment) => {
        if ((appointment.status === "confirmed" || appointment.status === "completed") && showConfirmed) return true;
        if (
          (appointment.status === "scheduled" || appointment.status === "in-progress" || appointment.status === "rescheduled") &&
          showPending
        ) return true;
        if ((appointment.status === "cancelled" || appointment.status === "no-show") && showCancelled) return true;
        return false;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [dateKey, doctorAppointments, scheduleSearch, showCancelled, showConfirmed, showPending]);

  const completedCount = dayAppointments.filter((appointment) => appointment.status === "completed").length;
  const remainingCount = Math.max(0, dayAppointments.length - completedCount);

  const getStatusTag = (appointment: Appointment) => {
    if (appointment.status === "completed" || appointment.status === "confirmed") {
      return { label: locale === "ar" ? "مؤكد" : "Confirmed", className: "bg-emerald-50 text-emerald-600" };
    }
    if (appointment.status === "cancelled" || appointment.status === "no-show") {
      return { label: locale === "ar" ? "ملغي" : "Cancelled", className: "bg-slate-100 text-slate-500" };
    }
    return { label: locale === "ar" ? "متابعة" : "Follow-up", className: "bg-blue-50 text-blue-600" };
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-[24px] font-semibold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays className="h-4 w-4" />
            </span>
            {locale === "ar" ? "المواعيد" : "Appointments"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {locale === "ar" ? "إدارة جدولك اليومي" : "Manage your daily schedule"}
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={
                locale === "ar"
                  ? "ابحث عن المواعيد باسم المريض أو الهاتف أو السبب..."
                  : "Search appointments by patient name, phone, or reason..."
              }
              value={scheduleSearch}
              onChange={(event) => setScheduleSearch(event.target.value)}
              className="h-10 border-slate-200 pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-9">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="grid grid-cols-9 items-center text-center text-xs text-slate-500">
                {timelineDates.map((slot) => {
                  const isActive = slot.toISOString().slice(0, 10) === dateKey;
                  return (
                    <button
                      key={slot.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(slot)}
                      className={`mx-0.5 rounded-lg py-2 ${isActive ? "bg-blue-600 text-white" : "hover:bg-slate-50"}`}
                    >
                      <p className="text-[10px]">{slot.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      <p className="text-lg font-semibold leading-5">{slot.getDate()}</p>
                      <p className={`text-[10px] ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                        {slot.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              {dayAppointments.length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                  {locale === "ar" ? "لا توجد مواعيد لهذا اليوم" : "No appointments for this day"}
                </p>
              )}
              {dayAppointments.map((item, index) => {
                const statusTag = getStatusTag(item);
                return (
                <div key={item.id} className="grid grid-cols-[72px_1fr] gap-2">
                  <p className="pt-4 text-[11px] font-medium text-slate-400">{item.time}</p>
                  <article className={`rounded-xl border p-3 ${index === 2 ? "border-blue-300 bg-[linear-gradient(135deg,rgba(219,234,254,0.8),rgba(255,255,255,0.9))]" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800">{item.patientName}</p>
                        <p className="text-xs text-slate-500">{item.specialty}</p>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionsDropdownId(actionsDropdownId === item.id ? null : item.id);
                          }}
                          className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </button>
                        {actionsDropdownId === item.id && (
                          <div className="absolute right-0 top-full mt-1 z-30 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                            <button 
                              onClick={() => openRescheduleForm(item)}
                              disabled={activeActionId === item.id}
                              className="flex w-full items-center px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {locale === "ar" ? "إعادة جدولة" : "Reschedule Appointment"}
                            </button>
                            <button 
                              onClick={() => openManualSummaryForm(item)}
                              disabled={activeActionId === item.id}
                              className="flex w-full items-center px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {locale === "ar" ? "إرسال ملخص يدوي" : "Send Manual Summary"}
                            </button>
                            <button 
                              onClick={() => openAiSummaryForm(item)}
                              disabled={activeActionId === item.id}
                              className="flex w-full items-center px-4 py-2 text-[13px] font-medium text-blue-600 hover:bg-blue-50/50 disabled:opacity-50"
                            >
                              {locale === "ar" ? "إنشاء ملخص AI" : "Generate AI Summary"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{item.time} • 30 min</p>
                      <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{item.patientId}</p>
                    </div>
                    <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTag.className}`}>{statusTag.label}</p>
                    <p className="mt-2 text-xs text-slate-500">Reason: {item.type}</p>
                  </article>
                </div>
              )})}
            </div>
          </div>

          <aside className="space-y-3 xl:col-span-3">
            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <Funnel className="h-3.5 w-3.5 text-sky-500" />
                {locale === "ar" ? "فلاتر سريعة" : "Quick Filters"}
              </p>
              <div className="mt-2.5 space-y-2">
                <label className="flex items-center justify-between rounded-md bg-emerald-50 px-2.5 py-2 text-xs"><span>{locale === "ar" ? "مؤكد" : "Confirmed"}</span><input type="checkbox" checked={showConfirmed} onChange={(event) => setShowConfirmed(event.target.checked)} /></label>
                <label className="flex items-center justify-between rounded-md bg-amber-50 px-2.5 py-2 text-xs"><span>{locale === "ar" ? "معلق" : "Pending"}</span><input type="checkbox" checked={showPending} onChange={(event) => setShowPending(event.target.checked)} /></label>
                <label className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-2 text-xs"><span>{locale === "ar" ? "ملغي" : "Cancelled"}</span><input type="checkbox" checked={showCancelled} onChange={(event) => setShowCancelled(event.target.checked)} /></label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_-20px_rgba(30,64,175,0.55)]">
              <p className="text-sm font-semibold text-slate-800">{locale === "ar" ? "ملخص اليوم" : "Today's Summary"}</p>
              <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between"><span>{locale === "ar" ? "إجمالي المواعيد" : "Total Appointments"}</span><span className="font-semibold">{dayAppointments.length}</span></div>
                <div className="flex items-center justify-between"><span>{locale === "ar" ? "مكتمل" : "Completed"}</span><span className="font-semibold text-emerald-600">{completedCount}</span></div>
                <div className="flex items-center justify-between"><span>{locale === "ar" ? "متبقي" : "Remaining"}</span><span className="font-semibold text-sky-600">{remainingCount}</span></div>
              </div>
            </section>

            <button
              type="button"
              aria-label="Add appointment"
              onClick={() => setShowAddAppointmentModal(true)}
              className="fixed right-6 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl bg-[#1d72f3] text-white shadow-[0_14px_30px_-12px_rgba(29,114,243,0.9)] transition-all hover:bg-[#1867df] hover:shadow-[0_16px_34px_-12px_rgba(24,103,223,0.95)] active:scale-95"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </button>
          </aside>
        </div>
      </section>



      {showAddAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                {locale === "ar" ? "إضافة موعد جديد" : "Add New Appointment"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAppointmentModal(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "اسم المريض" : "Patient Name"}</label>
                  <Input
                    value={newAppointmentForm.patientName}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, patientName: event.target.value }))}
                    placeholder={locale === "ar" ? "ادخل اسم المريض" : "Enter patient name"}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "العمر" : "Age"}</label>
                  <Input
                    value={newAppointmentForm.age}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, age: event.target.value }))}
                    placeholder={locale === "ar" ? "ادخل العمر" : "Enter age"}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
                <Input
                  value={newAppointmentForm.phoneNumber}
                  onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "التاريخ" : "Date"}</label>
                  <Input
                    type="date"
                    value={newAppointmentForm.date}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, date: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "الوقت" : "Time"}</label>
                  <Input
                    type="time"
                    value={newAppointmentForm.time}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, time: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "نوع الزيارة" : "Visit Type"}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setVisitTypeOpen((prev) => !prev);
                        setDurationOpen(false);
                      }}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <span>{newAppointmentForm.visitType}</span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                    {visitTypeOpen && (
                      <div className="absolute z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        {["New patient", "Follow up", "Emergency", "Consultation"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setNewAppointmentForm((prev) => ({ ...prev, visitType: option }));
                              setVisitTypeOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="w-4">
                              {newAppointmentForm.visitType === option ? <Check className="h-4 w-4" /> : null}
                            </span>
                            <span>{option}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "المدة (بالدقائق)" : "Duration (minutes)"}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setDurationOpen((prev) => !prev);
                        setVisitTypeOpen(false);
                      }}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <span>{`${newAppointmentForm.duration} minutes`}</span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                    {durationOpen && (
                      <div className="absolute z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        {["10", "20", "30", "40", "50", "60"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setNewAppointmentForm((prev) => ({ ...prev, duration: option }));
                              setDurationOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="w-4">
                              {newAppointmentForm.duration === option ? <Check className="h-4 w-4" /> : null}
                            </span>
                            <span>{option} minutes</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{locale === "ar" ? "سبب الزيارة" : "Reason for Visit"}</label>
                <textarea
                  value={newAppointmentForm.reason}
                  onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder={locale === "ar" ? "ادخل سبب الزيارة" : "Enter reason for visit"}
                  className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 pb-6 pt-1">
              <Button
                variant="secondary"
                className="h-11 flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
                onClick={() => setShowAddAppointmentModal(false)}
                disabled={isSubmittingAppointment}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                className="h-11 flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => void handleCreateAppointment()}
                disabled={isSubmittingAppointment}
              >
                {isSubmittingAppointment
                  ? (locale === "ar" ? "جارٍ الإضافة..." : "Adding...")
                  : (locale === "ar" ? "إضافة موعد" : "Add Appointment")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialogs */}
      {openForm && (
        <Dialog open={!!openForm} onOpenChange={(open) => !open && setOpenForm(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {openForm.type === "reschedule" && (locale === "ar" ? "إعادة جدولة الموعد" : "Reschedule Appointment")}
                {openForm.type === "manual-summary" && (locale === "ar" ? "إرسال ملخص طبي يدوي" : "Send Manual Medical Summary")}
                {openForm.type === "ai-summary" && (locale === "ar" ? "إنشاء ملخص بالذكاء الاصطناعي" : "Generate AI Medical Summary")}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {openForm.type === "reschedule" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{locale === "ar" ? "التاريخ الجديد" : "New Date"}</label>
                      <Input
                        type="date"
                        value={rescheduleForm.date}
                        onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{locale === "ar" ? "الوقت الجديد" : "New Start Time"}</label>
                      <Input
                        type="time"
                        value={rescheduleForm.startTime}
                        onChange={(e) => setRescheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "سبب إعادة الجدولة (اختياري)" : "Reason for rescheduling (optional)"}</label>
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={rescheduleForm.reason}
                      onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder={locale === "ar" ? "أدخل السبب هنا..." : "Enter reason here..."}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setOpenForm(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                    <Button 
                      onClick={() => {
                        const appt = appointments.find(a => a.id === openForm.appointmentId);
                        if (appt) handleRescheduleSubmit(appt);
                      }}
                      disabled={activeActionId === openForm.appointmentId}
                    >
                      {activeActionId === openForm.appointmentId ? (locale === "ar" ? "جارٍ الحفظ..." : "Scheduling...") : (locale === "ar" ? "تأكيد الموعد الجديد" : "Confirm New Schedule")}
                    </Button>
                  </div>
                </div>
              )}

              {openForm.type === "manual-summary" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "محتوى الملخص الطبي" : "Medical Summary Content"}</label>
                    <textarea
                      className="min-h-40 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={manualSummaryForm.content}
                      onChange={(e) => setManualSummaryForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={locale === "ar" ? "اكتب ملاحظاتك الطبية وتوصياتك هنا..." : "Write your medical notes and recommendations here..."}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={manualSummaryForm.sendToPatient}
                      onChange={(e) => setManualSummaryForm(prev => ({ ...prev, sendToPatient: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-600 font-medium">{locale === "ar" ? "إرسال نسخة للمريض عبر البريد/التطبيق" : "Send a copy to the patient via Email/App"}</span>
                  </label>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setOpenForm(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                    <Button 
                      onClick={() => {
                        const appt = appointments.find(a => a.id === openForm.appointmentId);
                        if (appt) handleManualSummarySubmit(appt);
                      }}
                      disabled={activeActionId === openForm.appointmentId}
                    >
                      {activeActionId === openForm.appointmentId ? (locale === "ar" ? "جارٍ الإرسال..." : "Sending...") : (locale === "ar" ? "إرسال الملخص" : "Send Summary")}
                    </Button>
                  </div>
                </div>
              )}

              {openForm.type === "ai-summary" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "ملاحظات إضافية للذكاء الاصطناعي (اختياري)" : "Additional notes for AI (optional)"}</label>
                    <textarea
                      className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={aiSummaryForm.consultationNotes}
                      onChange={(e) => setAiSummaryForm(prev => ({ ...prev, consultationNotes: e.target.value }))}
                      placeholder={locale === "ar" ? "أي سياق إضافي تريده في الملخص..." : "Any extra context you want included in the summary..."}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{locale === "ar" ? "تنسيق الملخص" : "Summary Format"}</label>
                      <select
                        value={aiSummaryForm.format}
                        onChange={(e) => setAiSummaryForm(prev => ({ ...prev, format: e.target.value as any }))}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="brief">Brief (Core points only)</option>
                        <option value="detailed">Detailed (Comprehensive explanation)</option>
                        <option value="clinical">Clinical (Structured medical report)</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={aiSummaryForm.sendToPatient}
                          onChange={(e) => setAiSummaryForm(prev => ({ ...prev, sendToPatient: e.target.checked }))}
                        />
                        <span className="text-sm text-slate-600 font-medium">{locale === "ar" ? "مشاركة مع المريض" : "Share with patient"}</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setOpenForm(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 font-semibold"
                      onClick={() => {
                        const appt = appointments.find(a => a.id === openForm.appointmentId);
                        if (appt) handleAiSummarySubmit(appt);
                      }}
                      disabled={activeActionId === openForm.appointmentId}
                    >
                      {activeActionId === openForm.appointmentId ? (locale === "ar" ? "جارٍ التوليد..." : "Generating...") : (locale === "ar" ? "توليد بالذكاء الاصطناعي" : "Generate with AI")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
