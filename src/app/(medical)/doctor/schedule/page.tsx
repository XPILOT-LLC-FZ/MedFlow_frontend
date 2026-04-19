"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Funnel, Plus, Clock3, Phone, MoreVertical, X, Check, ChevronDown, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";
import { bookingService } from "@/services/bookingService";
import { aiChatService } from "@/services/aiChatService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Appointment, DoctorShift } from "@/types";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayLabelsAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

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



export default function SchedulePage() {
  const { locale } = useTranslation();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();
  const { appointments, fetchAppointments, addAppointment } = useBookingStore();
  const { success, error } = useToastStore();
  const router = useRouter();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
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



  const initialize = useCallback(async () => {
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

      await staffService.getDoctorShifts(doctor.id);
    } catch {
      error(locale === "ar" ? "فشل تحميل الجدول" : "Failed to load schedule");
    }
  }, [error, fetchAppointments, fetchDoctors, locale, user?.email, user?.id, user?.name]);

  useEffect(() => {
    void initialize();
  }, [initialize]);



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
    <div className="doctor-dashboard space-y-6 max-w-7xl pb-10">
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors duration-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-[24px] font-semibold text-slate-900 dark:text-slate-100">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <CalendarDays className="h-4 w-4" />
            </span>
            {locale === "ar" ? "المواعيد" : "Appointments"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
              className="h-10 border-slate-100 dark:border-slate-800 pl-10 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-9">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm transition-colors duration-200">
              <div className="grid grid-cols-9 items-center text-center text-xs text-slate-500">
                {timelineDates.map((slot) => {
                  const isActive = slot.toISOString().slice(0, 10) === dateKey;
                  return (
                    <button
                      key={slot.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(slot)}
                      className={`mx-0.5 rounded-lg py-2 transition-all duration-200 ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500"}`}
                    >
                      <p className="text-[10px]">{slot.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      <p className="text-lg font-semibold leading-5">{slot.getDate()}</p>
                      <p className={`text-[10px] ${isActive ? "text-blue-100" : "text-slate-400 dark:text-slate-500"}`}>
                        {slot.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              {dayAppointments.length === 0 && (
                <p className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm text-slate-500 dark:text-slate-400 shadow-sm transition-colors duration-200">
                  {locale === "ar" ? "لا توجد مواعيد لهذا اليوم" : "No appointments for this day"}
                </p>
              )}
              {dayAppointments.map((item, index) => {
                const statusTag = getStatusTag(item);

                return (
                <div key={item.id} className="grid grid-cols-[72px_1fr] gap-2">
                  <p className="pt-4 text-[11px] font-medium text-slate-400 dark:text-slate-500">{item.time}</p>
                  <article className={`rounded-xl border p-4 transition-colors duration-200 shadow-sm ${index === 2 ? "border-blue-200 dark:border-blue-800/60 bg-[linear-gradient(135deg,rgba(219,234,254,0.6),rgba(255,255,255,0.8))] dark:bg-[linear-gradient(135deg,rgba(30,58,138,0.2),rgba(15,23,42,0.4))]" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.patientName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.specialty}</p>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionsDropdownId(actionsDropdownId === item.id ? null : item.id);
                          }}
                          className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </button>
                        {actionsDropdownId === item.id && (
                          <div className="absolute right-0 top-full mt-1 z-30 w-52 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
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
                               onClick={() => router.push(`/doctor/chat?appointmentId=${item.id}`)}
                              disabled={activeActionId === item.id}
                              className="flex w-full items-center gap-2 px-4 py-2 text-[13px] font-bold text-blue-600 hover:bg-blue-50/50 disabled:opacity-50"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {locale === "ar" ? "دردشة مع المريض" : "Chat with Patient"}
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
                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{item.time} • 30 min</p>
                      <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{item.patientId}</p>
                    </div>
                    <p className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusTag.className === "bg-emerald-50 text-emerald-600" ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : statusTag.className === "bg-slate-100 text-slate-500" ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" : "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"}`}>{statusTag.label}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">Reason: {item.type}</p>
                  </article>
                </div>
              )})}
            </div>
          </div>

          <aside className="space-y-3 xl:col-span-3">
            <section className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm transition-colors duration-200">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Funnel className="h-3.5 w-3.5 text-sky-500" />
                {locale === "ar" ? "فلاتر سريعة" : "Quick Filters"}
              </p>
              <div className="mt-2.5 space-y-2">
                <label className="flex items-center justify-between rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium"><span>{locale === "ar" ? "مؤكد" : "Confirmed"}</span><input type="checkbox" checked={showConfirmed} onChange={(event) => setShowConfirmed(event.target.checked)} className="rounded border-emerald-200" /></label>
                <label className="flex items-center justify-between rounded-md bg-amber-50 dark:bg-amber-900/20 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400 font-medium"><span>{locale === "ar" ? "معلق" : "Pending"}</span><input type="checkbox" checked={showPending} onChange={(event) => setShowPending(event.target.checked)} className="rounded border-amber-200" /></label>
                <label className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-slate-800/40 px-2.5 py-2 text-xs text-slate-600 dark:text-slate-400 font-medium"><span>{locale === "ar" ? "ملغي" : "Cancelled"}</span><input type="checkbox" checked={showCancelled} onChange={(event) => setShowCancelled(event.target.checked)} className="rounded border-slate-200" /></label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm transition-colors duration-200">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{locale === "ar" ? "ملخص اليوم" : "Today's Summary"}</p>
              <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center justify-between"><span>{locale === "ar" ? "إجمالي المواعيد" : "Total Appointments"}</span><span className="font-bold text-slate-900 dark:text-slate-100">{dayAppointments.length}</span></div>
                <div className="flex items-center justify-between"><span>{locale === "ar" ? "مكتمل" : "Completed"}</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</span></div>
                <div className="flex items-center justify-between"><span>{locale === "ar" ? "متبقي" : "Remaining"}</span><span className="font-bold text-blue-600 dark:text-blue-400">{remainingCount}</span></div>
              </div>
            </section>

             <button
               type="button"
               aria-label="Add appointment"
               onClick={() => setShowAddAppointmentModal(true)}
               className="fixed right-6 bottom-6 md:right-10 md:bottom-10 z-20 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30 transition-all hover:bg-blue-700 hover:scale-110 active:scale-95 group"
             >
               <Plus className="h-6 w-6 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
             </button>
           </aside>
        </div>
      </section>



      {showAddAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 px-8 py-5">
              <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                {locale === "ar" ? "إضافة موعد جديد" : "Add New Appointment"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAppointmentModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-8 py-7 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "اسم المريض" : "Patient Name"}</label>
                  <Input
                    value={newAppointmentForm.patientName}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, patientName: event.target.value }))}
                    placeholder={locale === "ar" ? "ادخل اسم المريض" : "Enter patient name"}
                    className="h-11 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "العمر" : "Age"}</label>
                  <Input
                    value={newAppointmentForm.age}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, age: event.target.value }))}
                    placeholder={locale === "ar" ? "ادخل العمر" : "Enter age"}
                    className="h-11 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
              </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
                  <Input
                    value={newAppointmentForm.phoneNumber}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                    placeholder="(555) 123-4567"
                    className="h-11 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "التاريخ" : "Date"}</label>
                  <Input
                    type="date"
                    value={newAppointmentForm.date}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, date: event.target.value }))}
                    className="h-11 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "الوقت" : "Time"}</label>
                  <Input
                    type="time"
                    value={newAppointmentForm.time}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, time: event.target.value }))}
                    className="h-11 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "نوع الزيارة" : "Visit Type"}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setVisitTypeOpen((prev) => !prev);
                        setDurationOpen(false);
                      }}
                      className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{newAppointmentForm.visitType}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${visitTypeOpen ? "rotate-180" : ""}`} />
                    </button>
                    {visitTypeOpen && (
                      <div className="absolute z-60 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        {["New patient", "Follow up", "Emergency", "Consultation"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setNewAppointmentForm((prev) => ({ ...prev, visitType: option }));
                              setVisitTypeOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span className="w-4 flex items-center justify-center">
                              {newAppointmentForm.visitType === option ? <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : null}
                            </span>
                            <span>{option}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "المدة (بالدقائق)" : "Duration (minutes)"}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setDurationOpen((prev) => !prev);
                        setVisitTypeOpen(false);
                      }}
                      className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{`${newAppointmentForm.duration} minutes`}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${durationOpen ? "rotate-180" : ""}`} />
                    </button>
                    {durationOpen && (
                      <div className="absolute z-60 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        {["10", "20", "30", "40", "50", "60"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setNewAppointmentForm((prev) => ({ ...prev, duration: option }));
                              setDurationOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span className="w-4 flex items-center justify-center">
                              {newAppointmentForm.duration === option ? <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : null}
                            </span>
                            <span>{option} minutes</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

               <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "سبب الزيارة" : "Reason for Visit"}</label>
                <textarea
                  value={newAppointmentForm.reason}
                  onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder={locale === "ar" ? "ادخل سبب الزيارة" : "Enter reason for visit"}
                  className="min-h-[100px] w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-8 pb-8 pt-2">
              <Button
                variant="ghost"
                className="h-12 flex-1 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                onClick={() => setShowAddAppointmentModal(false)}
                disabled={isSubmittingAppointment}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                className="h-12 flex-1 rounded-2xl bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg shadow-blue-500/20 text-white font-bold transition-all"
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
          <DialogContent className="max-w-2xl rounded-3xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="px-8 py-5 border-b border-slate-50 dark:border-slate-800/50">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {openForm.type === "reschedule" && (locale === "ar" ? "إعادة جدولة الموعد" : "Reschedule Appointment")}
                {openForm.type === "manual-summary" && (locale === "ar" ? "إرسال ملخص طبي يدوي" : "Send Manual Medical Summary")}
                {openForm.type === "ai-summary" && (locale === "ar" ? "إنشاء ملخص بالذكاء الاصطناعي" : "Generate AI Medical Summary")}
              </DialogTitle>
            </DialogHeader>

            <div className="px-8 py-6">
              {openForm.type === "reschedule" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "التاريخ الجديد" : "New Date"}</label>
                      <Input
                        type="date"
                        value={rescheduleForm.date}
                        className="h-11 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                        onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "الوقت الجديد" : "New Start Time"}</label>
                      <Input
                        type="time"
                        value={rescheduleForm.startTime}
                        className="h-11 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                        onChange={(e) => setRescheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "سبب إعادة الجدولة (اختياري)" : "Reason for rescheduling (optional)"}</label>
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all"
                      value={rescheduleForm.reason}
                      onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder={locale === "ar" ? "أدخل السبب هنا..." : "Enter reason here..."}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" className="h-12 px-6 rounded-2xl font-bold font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOpenForm(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                    <Button 
                      className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/20"
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "محتوى الملخص الطبي" : "Medical Summary Content"}</label>
                    <textarea
                      className="min-h-40 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all"
                      value={manualSummaryForm.content}
                      onChange={(e) => setManualSummaryForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={locale === "ar" ? "اكتب ملاحظاتك الطبية وتوصياتك هنا..." : "Write your medical notes and recommendations here..."}
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`flex items-center justify-center h-5 w-5 rounded border-2 transition-colors ${manualSummaryForm.sendToPatient ? "bg-blue-600 border-blue-600" : "border-slate-200 dark:border-slate-800"}`}>
                      {manualSummaryForm.sendToPatient && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={manualSummaryForm.sendToPatient}
                        onChange={(e) => setManualSummaryForm(prev => ({ ...prev, sendToPatient: e.target.checked }))}
                      />
                    </div>
                    <span className="text-[14px] text-slate-600 dark:text-slate-400 font-bold group-hover:text-slate-900 dark:group-hover:text-slate-200">{locale === "ar" ? "إرسال نسخة للمريض عبر البريد/التطبيق" : "Send a copy to the patient via Email/App"}</span>
                  </label>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" className="h-12 px-6 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" onClick={() => setOpenForm(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                    <Button 
                      className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/20"
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "ملاحظات إضافية للذكاء الاصطناعي (اختياري)" : "Additional notes for AI (optional)"}</label>
                    <textarea
                      className="min-h-32 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all"
                      value={aiSummaryForm.consultationNotes}
                      onChange={(e) => setAiSummaryForm(prev => ({ ...prev, consultationNotes: e.target.value }))}
                      placeholder={locale === "ar" ? "أي سياق إضافي تريده في الملخص..." : "Any extra context you want included in the summary..."}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{locale === "ar" ? "تنسيق الملخص" : "Summary Format"}</label>
                      <select
                        value={aiSummaryForm.format}
                        onChange={(e) => setAiSummaryForm(prev => ({ ...prev, format: e.target.value as "brief" | "detailed" | "clinical" }))}
                        className="h-11 w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all"
                      >
                        <option value="brief">Brief (Core points only)</option>
                        <option value="detailed">Detailed (Comprehensive explanation)</option>
                        <option value="clinical">Clinical (Structured medical report)</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`flex items-center justify-center h-5 w-5 rounded border-2 transition-colors ${aiSummaryForm.sendToPatient ? "bg-blue-600 border-blue-600" : "border-slate-200 dark:border-slate-800"}`}>
                          {aiSummaryForm.sendToPatient && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={aiSummaryForm.sendToPatient}
                            onChange={(e) => setAiSummaryForm(prev => ({ ...prev, sendToPatient: e.target.checked }))}
                          />
                        </div>
                        <span className="text-[14px] text-slate-600 dark:text-slate-400 font-bold group-hover:text-slate-900 dark:group-hover:text-slate-200">{locale === "ar" ? "مشاركة مع المريض" : "Share with patient"}</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" className="h-12 px-6 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" onClick={() => setOpenForm(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                    <Button 
                      className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/20"
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
