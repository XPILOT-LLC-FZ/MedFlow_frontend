"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Funnel, Plus, Clock3, Phone, MoreVertical, X, Check, ChevronDown, ChevronLeft, ChevronRight, User, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import type { Appointment } from "@/types";
import { cn } from "@/lib/utils";

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

  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());

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


  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(2024, 0, 7 + i); // 2024-01-07 is a Sunday
      return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" });
    });
  }, [locale]);

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [viewDate]);

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const relativeLabel = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const diffDays = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return locale === "ar" ? "اليوم" : "Today";
    if (diffDays === 1) return locale === "ar" ? "غداً" : "Tomorrow";
    if (diffDays === -1) return locale === "ar" ? "أمس" : "Yesterday";
    
    if (diffDays > 0) return locale === "ar" ? `بعد ${diffDays} يوم` : `In ${diffDays} days`;
    return locale === "ar" ? `منذ ${Math.abs(diffDays)} يوم` : `${Math.abs(diffDays)} days ago`;
  }, [selectedDate, locale]);

  const dateKey = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);
  const timelineDates = useMemo(() => {
    return Array.from({ length: 13 }).map((_, index) => {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() - 6 + index);
      return date;
    });
  }, [selectedDate]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

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

  return (
    <div className="doctor-dashboard space-y-4 max-w-7xl pb-10">
      <section className="space-y-4">
        <div className="rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-7 py-5 transition-all duration-300">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">
                {locale === "ar" ? "المواعيد" : "Appointments"}
              </h2>
              <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "إدارة جدولك اليومي" : "Manage your daily schedule"}
              </p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              placeholder={
                locale === "ar"
                  ? "ابحث عن المواعيد باسم المريض أو الهاتف أو السبب..."
                  : "Search appointments by patient name, phone, or reason..."
              }
              value={scheduleSearch}
              onChange={(event) => setScheduleSearch(event.target.value)}
              className="h-12 w-full rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-11"
            />
          </div>
        </div>
        
        {/* Horizontal Date Picker - Full Width */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-none mb-6">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isCalendarExpanded) setViewDate(selectedDate);
                  setIsCalendarExpanded(!isCalendarExpanded);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group"
              >
                <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">
                  {viewDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })}
                </h3>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-transform duration-300", isCalendarExpanded && "rotate-180")} />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {isCalendarExpanded && (
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedDate(now);
                  setViewDate(now);
                }}
                className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
              >
                {relativeLabel}
              </button>
            </div>
          </div>

          {isCalendarExpanded ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {/* Quick Jumps */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { label: locale === "ar" ? "أمس" : "Yesterday", offset: -1 },
                  { label: locale === "ar" ? "غداً" : "Tomorrow", offset: 1 },
                  { label: locale === "ar" ? "بعد 7 أيام" : "+7 Days", offset: 7 },
                  { label: locale === "ar" ? "بعد شهر" : "+1 Month", offset: 30 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + item.offset);
                      setSelectedDate(d);
                      setViewDate(d);
                    }}
                    className="whitespace-nowrap px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all"
                  >
                    {item.label}
                  </button>
                ))}
                
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800 ml-auto group focus-within:border-blue-200 dark:focus-within:border-blue-800 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-focus-within:text-blue-500">
                    {locale === "ar" ? "اقفز أيام:" : "Jump Days:"}
                  </span>
                  <input
                    type="number"
                    placeholder="±"
                    className="w-10 bg-transparent border-none text-[12px] font-black text-blue-600 focus:outline-none p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt((e.target as HTMLInputElement).value);
                        if (!isNaN(val)) {
                          const d = new Date();
                          d.setDate(d.getDate() + val);
                          setSelectedDate(d);
                          setViewDate(d);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((date, i) => {
                  const isSelected = date && date.toDateString() === selectedDate.toDateString();
                  const isToday = date && date.toDateString() === new Date().toDateString();
                  
                  const dStr = date ? date.toISOString().slice(0, 10) : "";
                  const dayAppts = appointments.filter(a => a.date.slice(0, 10) === dStr);
                  
                  let dotColor = "transparent";
                  if (dayAppts.length > 0) {
                    const hasConfirmed = dayAppts.some(a => a.status === "confirmed" || a.status === "completed");
                    dotColor = hasConfirmed ? "bg-emerald-500" : "bg-orange-500";
                  }

                  return (
                    <button
                      key={i}
                      disabled={!date}
                      onClick={() => date && setSelectedDate(date)}
                      className={cn(
                        "h-11 rounded-xl flex flex-col items-center justify-center transition-all relative",
                        !date && "opacity-0 pointer-events-none",
                        isSelected
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-105 z-10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <span className="text-[14px] font-bold">{date?.getDate()}</span>
                      {date && dotColor !== "transparent" && (
                        <div className={cn(
                          "absolute bottom-1.5 h-1 w-1 rounded-full transition-all",
                          isSelected ? "bg-white" : dotColor
                        )} />
                      )}
                      {isToday && !isSelected && dotColor === "transparent" && (
                        <div className="absolute bottom-1.5 h-1 w-1 rounded-full bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button 
                onClick={handlePrevDay}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              
              <div className="flex-1 flex items-center justify-between gap-1">
                {timelineDates.map((slot) => {
                  const isActive = slot.toISOString().slice(0, 10) === dateKey;
                  const dStr = slot.toISOString().slice(0, 10);
                  const dayAppts = appointments.filter(a => a.date.slice(0, 10) === dStr);
                  
                  let dotColor = "transparent";
                  if (dayAppts.length > 0) {
                    const hasConfirmed = dayAppts.some(a => a.status === "confirmed" || a.status === "completed");
                    dotColor = hasConfirmed ? "bg-emerald-500" : "bg-orange-500";
                  }

                  return (
                    <button
                      key={slot.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(slot)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-2xl py-3 px-1 transition-all duration-300 relative min-w-[64px]",
                        isActive 
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-200/50 dark:shadow-none scale-105 z-10" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500"
                      )}
                    >
                      <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-1.5", isActive ? "text-blue-100" : "text-slate-400")}>
                        {slot.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" })}
                      </p>
                      <p className="text-[20px] font-black leading-none mb-1.5">
                        {slot.getDate()}
                      </p>
                      <p className={cn("text-[10px] font-bold uppercase", isActive ? "text-blue-100" : "text-slate-400")}>
                        {slot.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "short" })}
                      </p>
                      <div className={cn(
                        "mt-2 h-1.5 w-1.5 rounded-full transition-all",
                        isActive ? "bg-white" : dotColor
                      )} />
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={handleNextDay}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-9 space-y-6">
            {/* Vertical Timeline List */}
            <div className="relative pl-24 space-y-6">
              {/* Vertical Line */}
              <div className="absolute left-16 top-0 bottom-0 w-px bg-blue-50 dark:bg-blue-900/10" />
              
              {dayAppointments.length === 0 && (
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-10 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    {locale === "ar" ? "لا توجد مواعيد لهذا اليوم" : "No appointments scheduled for this day"}
                  </p>
                </div>
              )}

              {dayAppointments.map((item, index) => {                
                const apptHourNum = parseInt(item.time.split(":")[0], 10);
                const apptPeriod = item.time.includes("PM") ? "PM" : "AM";
                const hourKey = `${apptHourNum} ${apptPeriod}`;
                
                const prevItem = index > 0 ? dayAppointments[index - 1] : null;
                const prevHourNum = prevItem ? parseInt(prevItem.time.split(":")[0], 10) : null;
                const prevPeriod = prevItem ? (prevItem.time.includes("PM") ? "PM" : "AM") : null;
                const prevHourKey = prevItem ? `${prevHourNum} ${prevPeriod}` : null;
                
                const showTimeMarker = hourKey !== prevHourKey;
                const timeMarkerText = `${apptHourNum}:00 ${apptPeriod}`;

                // Detection logic for "Current Appointment"
                const now = new Date();
                const [time, period] = item.time.split(" ");
                const [hours, minutes] = time.split(":").map(Number);
                let h = hours;
                if (period === "PM" && h < 12) h += 12;
                if (period === "AM" && h === 12) h = 0;
                
                const appointmentDate = new Date(selectedDate);
                appointmentDate.setHours(h, minutes, 0, 0);
                
                const duration = 30; // default duration
                const endTime = new Date(appointmentDate.getTime() + duration * 60000);
                
                const isCurrent = now >= appointmentDate && now < endTime && appointmentDate.toDateString() === now.toDateString();

                return (
                  <div key={item.id} className="relative group/slot">
                    {/* Time Marker */}
                    <div className={cn(
                      "absolute -left-24 top-[14px] text-[11px] font-bold text-right w-[60px] uppercase tracking-tight transition-colors duration-500",
                      "text-slate-400 dark:text-slate-500"
                    )}>
                      {showTimeMarker ? timeMarkerText : ""}
                    </div>
                    {/* Dot on Line */}
                    <div className={cn(
                      "absolute -left-[35px] top-[18px] h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950 z-10 transition-all duration-500",
                      isCurrent 
                        ? "bg-blue-600 scale-125 shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-4 ring-blue-600/10" 
                        : "bg-slate-300 dark:bg-slate-700"
                    )}>
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-25" />
                      )}
                    </div>

                    <article className={cn(
                      "rounded-[28px] border transition-all duration-500 relative",
                      isCurrent 
                        ? "border-blue-400 bg-gradient-to-br from-blue-50/80 via-white to-white dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950 shadow-[0_20px_50px_rgba(59,130,246,0.1)] z-10" 
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-200 dark:hover:border-blue-800/60"
                    )}>
                      {isCurrent && (
                        <div className="absolute -top-3 left-8 z-20">
                          <div className="bg-[#818cf8] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-200/50 dark:shadow-none flex items-center gap-1.5 border border-white/20">
                            {locale === "ar" ? "الموعد الحالي" : "Current Appointment"}
                          </div>
                        </div>
                      )}

                      <div className={cn("p-5", isCurrent ? "pt-10" : "")}>
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                              isCurrent 
                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 shadow-inner" 
                                : "bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover/slot:bg-blue-50 dark:group-hover/slot:bg-blue-900/30 group-hover/slot:text-blue-600"
                            )}>
                              <User className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <h4 className={cn(
                                "text-[15px] font-black tracking-tight",
                                isCurrent ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                              )}>
                                {item.patientName}
                              </h4>
                              <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500">
                                {item.patientAge || "Age N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionsDropdownId(actionsDropdownId === item.id ? null : item.id);
                              }}
                              className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            >
                              <MoreVertical className="h-5 w-5 text-slate-400" />
                            </button>
                            
                            {actionsDropdownId === item.id && (
                              <div className="absolute right-0 top-full mt-2 z-30 w-48 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                <button 
                                  onClick={() => openRescheduleForm(item)}
                                  disabled={activeActionId === item.id}
                                  className="flex w-full items-center px-4 py-2.5 text-[14px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                  <span className="ml-10">reschedule</span>
                                </button>
                                
                                <button 
                                  onClick={() => router.push(`/doctor/patients/${item.patientId}`)}
                                  className="flex w-full items-center px-4 py-2.5 text-[14px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <span className="ml-10">open file</span>
                                </button>

                                <button 
                                  onClick={() => router.push(`/doctor/patients/${item.patientId}?tab=clinical`)}
                                  className="flex w-full items-center px-4 py-2.5 text-[14px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative"
                                >
                                  <Check className="absolute left-4 h-4 w-4 text-slate-900 dark:text-slate-100" />
                                  <span className="ml-10">prescription</span>
                                </button>

                                <button 
                                  onClick={() => router.push(`/doctor/chat?appointmentId=${item.id}`)}
                                  disabled={activeActionId === item.id}
                                  className="flex w-full items-center px-4 py-2.5 text-[14px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                  <span className="ml-10">open chat</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Clock3 className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              {item.time} • 30 min
                            </div>
                            <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              {item.patientPhone || "-"}
                            </div>
                          </div>

                          <div className="flex items-start md:justify-end">
                            <span className={cn(
                              "inline-flex items-center rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-tight",
                              item.type?.toLowerCase().includes("follow") 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                : item.type?.toLowerCase().includes("new")
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                : item.type?.toLowerCase().includes("emergency") || item.type?.toLowerCase().includes("urgent")
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                                : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              {item.type}
                            </span>
                          </div>
                        </div>

                        <div className="pt-5 border-t border-slate-50 dark:border-slate-800/60">
                          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-400/80 tracking-widest shrink-0">Reason:</span> 
                            <span className="truncate">{item.notes || "Regular checkup"}</span>
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="xl:col-span-3 space-y-6">
            {/* Quick Filters */}
            <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-none">
              <div className="flex items-center gap-2 mb-5">
                <Funnel className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                  {locale === "ar" ? "فلاتر سريعة" : "Quick Filters"}
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 px-4 py-3 transition-all">
                  <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
                    {locale === "ar" ? "مؤكد" : "Confirmed"}
                  </span>
                  <Switch 
                    checked={showConfirmed} 
                    onCheckedChange={setShowConfirmed} 
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-xl bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3 transition-all">
                  <span className="text-[13px] font-bold text-amber-700 dark:text-amber-400">
                    {locale === "ar" ? "معلق" : "Pending"}
                  </span>
                  <Switch 
                    checked={showPending} 
                    onCheckedChange={setShowPending} 
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900 px-4 py-3 transition-all">
                  <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400">
                    {locale === "ar" ? "ملغي" : "Cancelled"}
                  </span>
                  <Switch 
                    checked={showCancelled} 
                    onCheckedChange={setShowCancelled} 
                  />
                </div>
              </div>
            </section>

            {/* Today's Summary */}
            <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 relative overflow-hidden group">
              {/* Subtle Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-6 relative z-10">
                {selectedDate.toDateString() === new Date().toDateString()
                  ? (locale === "ar" ? "ملخص اليوم" : "Today's Summary")
                  : (locale === "ar"
                    ? `ملخص يوم ${selectedDate.toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}`
                    : `Summary for ${selectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long" })}`)}
              </h3>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    {locale === "ar" ? "إجمالي المواعيد" : "Total Appointments"}
                  </span>
                  <span className="text-[18px] font-black text-slate-900 dark:text-slate-100">
                    {dayAppointments.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    {locale === "ar" ? "مكتمل" : "Completed"}
                  </span>
                  <span className="text-[18px] font-black text-emerald-600 dark:text-emerald-400">
                    {completedCount}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    {locale === "ar" ? "متبقي" : "Remaining"}
                  </span>
                  <span className="text-[18px] font-black text-blue-600 dark:text-blue-400">
                    {remainingCount}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <button
          type="button"
          aria-label="Add appointment"
          onClick={() => setShowAddAppointmentModal(true)}
          className="fixed right-6 bottom-24 md:right-10 md:bottom-28 z-20 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/40 dark:shadow-none transition-all hover:bg-blue-700 hover:scale-110 active:scale-95 group"
        >
          <Plus className="h-6 w-6 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </section>

      {showAddAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 px-10 py-6">
              <h3 className="flex items-center gap-3 text-[20px] font-black text-slate-900 dark:text-slate-100 tracking-tight">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
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

            <div className="space-y-6 px-10 py-8 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    {locale === "ar" ? "اسم المريض" : "Patient Name"}
                  </label>
                  <Input
                    value={newAppointmentForm.patientName}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, patientName: event.target.value }))}
                    placeholder={locale === "ar" ? "ادخل اسم المريض" : "Enter patient name"}
                    className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 focus:ring-4 focus:ring-blue-600/5 transition-all"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{locale === "ar" ? "العمر" : "Age"}</label>
                  <Input
                    value={newAppointmentForm.age}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, age: event.target.value }))}
                    placeholder={locale === "ar" ? "ادخل العمر" : "Enter age"}
                    className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === "ar" ? "رقم الهاتف" : "Phone Number"}
                </label>
                <Input
                  value={newAppointmentForm.phoneNumber}
                  onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                  placeholder="(555) 123-4567"
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    {locale === "ar" ? "التاريخ" : "Date"}
                  </label>
                  <Input
                    type="date"
                    value={newAppointmentForm.date}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, date: event.target.value }))}
                    className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 transition-all"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    <Clock3 className="h-3.5 w-3.5 text-blue-500" />
                    {locale === "ar" ? "الوقت" : "Time"}
                  </label>
                  <Input
                    type="time"
                    value={newAppointmentForm.time}
                    onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, time: event.target.value }))}
                    className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{locale === "ar" ? "نوع الزيارة" : "Visit Type"}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setVisitTypeOpen((prev) => !prev);
                        setDurationOpen(false);
                      }}
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{newAppointmentForm.visitType}</span>
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", visitTypeOpen && "rotate-180")} />
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
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{locale === "ar" ? "المدة (بالدقائق)" : "Duration (minutes)"}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setDurationOpen((prev) => !prev);
                        setVisitTypeOpen(false);
                      }}
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{`${newAppointmentForm.duration} minutes`}</span>
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", durationOpen && "rotate-180")} />
                    </button>
                    {durationOpen && (
                      <div className="absolute z-60 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        {["15", "30", "45", "60", "90"].map((option) => (
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
                            <span>{`${option} minutes`}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                  {locale === "ar" ? "سبب الزيارة" : "Reason for Visit"}
                </label>
                <textarea
                  value={newAppointmentForm.reason}
                  onChange={(event) => setNewAppointmentForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder={locale === "ar" ? "ادخل سبب الزيارة" : "Enter reason for visit"}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 px-10 py-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-50 dark:border-slate-800/50">
              <Button
                variant="ghost"
                onClick={() => setShowAddAppointmentModal(false)}
                className="flex-1 h-14 rounded-2xl font-black text-[15px] text-slate-500 hover:bg-white hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100 transition-all bg-[#E9EEF4] dark:bg-slate-800"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleCreateAppointment}
                disabled={isSubmittingAppointment}
                className="flex-[1.5] h-14 rounded-2xl bg-blue-600 text-white font-black text-[15px] hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isSubmittingAppointment ? (locale === "ar" ? "جارٍ الإضافة..." : "Adding...") : (locale === "ar" ? "إضافة موعد" : "Add Appointment")}
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
