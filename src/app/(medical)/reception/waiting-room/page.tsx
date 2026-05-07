"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Clock,
  UserCheck,
  CheckCircle2,
  CalendarDays,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Stethoscope,
  FileText,
  ChevronRight,
  ChevronLeft,
  Zap,
  Filter,
  X,
  AlertCircle,
  ClipboardList,
  Edit2,
  Activity,
  CreditCard,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateKey } from "@/lib/dateUtils";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { useRouter } from "next/navigation";
import type { Appointment, ApiPatient, ApiDoctor } from "@/types";
import { patientService } from "@/services/patientService";
import { staffService } from "@/services/staffService";
import { bookingService } from "@/services/bookingService";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationKey } from "@/lib/i18n";

const toMinutes = (value: string): number | null => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const formatWait = (minutes: number, isRTL: boolean) => {
  if (minutes < 60) return `${minutes}${isRTL ? "د" : "m"}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}${isRTL ? "س" : "h"}` : `${h}${isRTL ? "س" : "h"} ${m}${isRTL ? "د" : "m"}`;
};


export default function QueueManagementPage() {
  const { t, isRTL } = useTranslation();
  const toast = useToastStore();
  const router = useRouter();
  const { appointments, fetchAppointments, updateAppointment, isLoading } = useBookingStore();
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const loadQueue = useCallback(async () => {
    await fetchAppointments({ date: todayKey });
  }, [fetchAppointments, todayKey]);

  useEffect(() => {
    void loadQueue();
    const interval = setInterval(() => void loadQueue(), 30000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  const booked = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "scheduled")
        .sort((a, b) => (toMinutes(a.time) ?? 9999) - (toMinutes(b.time) ?? 9999)),
    [appointments]
  );

  const waiting = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "confirmed")
        .sort((a, b) => (toMinutes(a.time) ?? 9999) - (toMinutes(b.time) ?? 9999)),
    [appointments]
  );

  const inProgress = useMemo(
    () => appointments.filter((a) => a.status === "in-progress"),
    [appointments]
  );

  const completed = useMemo(
    () => appointments.filter((a) => a.status === "completed" && (a.paymentStatus as string)?.toUpperCase() !== "PAID"),
    [appointments]
  );

  const cancelled = useMemo(
    () => appointments.filter((a) => a.status === "cancelled" || a.status === "no-show"),
    [appointments]
  );

  const avgWaitMinutes = useMemo(() => {
    if (waiting.length === 0) return 0;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const total = waiting.reduce((sum, a) => {
      const m = toMinutes(a.time);
      return m === null ? sum : sum + Math.max(0, nowMin - m);
    }, 0);
    return Math.round(total / waiting.length);
  }, [waiting]);

  const applyTransition = async (appt: Appointment, nextStatus: Appointment["status"]) => {
    const key = `${appt.id}:${nextStatus}`;
    setProcessingKey(key);
    try {
      await updateAppointment(appt.id, { status: nextStatus });
      toast.success(t("statusUpdatedSuccessfully"));
    } catch {
      toast.error(t("error"));
    } finally {
      setProcessingKey(null);
    }
  };

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  if (checkInOpen) {
    return (
      <AddToQueueView 
        appointment={selectedAppointment}
        onBack={() => {
          setCheckInOpen(false);
          setSelectedAppointment(null);
        }} 
      />
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{t("queueManagement")}</h1>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
          </div>
          <p className="text-slate-400 text-sm font-medium">{t("managePatientRecords")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span className="text-[13px] font-bold text-slate-700">{new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button
            onClick={() => setCheckInOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 px-7 font-bold shadow-lg shadow-blue-500/10 flex items-center gap-2 text-[13px]"
          >
            <Plus className="h-5 w-5" />
            {t("addToQueue")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users} label={t("totalInQueue")} value={String(waiting.length + inProgress.length)} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard icon={Clock} label={t("avgWaitTime")} value={formatWait(avgWaitMinutes, isRTL)} iconBg="bg-orange-50" iconColor="text-orange-500" />
        <StatCard icon={UserCheck} label={t("inProgress")} value={String(inProgress.length)} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard icon={CheckCircle2} label={t("completedToday")} value={String(completed.length)} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* Kanban Board */}
      <div className="space-y-8">
        {/* Active Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {/* BOOKED Column */}
          <KanbanColumn dot="bg-slate-300" title={t("booked")} count={booked.length} onFilter={() => setFilterOpen(true)}>
            {booked.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">{t("noPatientsInQueue")}</div>
            ) : (
              booked.map((appt) => (
                <WaitingCard
                  key={appt.id}
                  priority="standard"
                  name={appt.patientName}
                  pid={`#PT-${appt.id.slice(-5).toUpperCase()}`}
                  time={appt.time}
                  waitMin={0}
                  doctor={appt.doctorName}
                  dept={appt.type || t("generalVisit")}
                  loading={processingKey === `${appt.id}:confirmed`}
                  actionLabel={t("checkIn")}
                  onAction={() => {
                    setSelectedAppointment(appt);
                    setCheckInOpen(true);
                  }}
                  onCancel={() => void applyTransition(appt, "cancelled")}
                />
              ))
            )}
          </KanbanColumn>

          {/* WAITING Column */}
          <KanbanColumn dot="bg-amber-400" title={t("liveQueue")} count={waiting.length} onFilter={() => setFilterOpen(true)}>
            {waiting.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">{t("noPatientsInQueue")}</div>
            ) : (
              waiting.map((appt, i) => {
                const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                const apptMin = toMinutes(appt.time) ?? nowMin;
                const waitMin = Math.max(0, nowMin - apptMin);
                return (
                  <WaitingCard
                    key={appt.id}
                    priority={i === 0 ? "high" : "standard"}
                    name={appt.patientName}
                    pid={`#PT-${appt.id.slice(-5).toUpperCase()}`}
                    time={appt.time}
                    waitMin={waitMin}
                    doctor={appt.doctorName}
                    dept={appt.type || t("generalVisit")}
                    loading={processingKey === `${appt.id}:in-progress`}
                    actionLabel={t("startSession")}
                    onAction={() => void applyTransition(appt, "in-progress")}
                    onCancel={() => void applyTransition(appt, "cancelled")}
                  />
                );
              })
            )}
          </KanbanColumn>

          {/* IN PROGRESS Column */}
          <KanbanColumn dot="bg-blue-500" title={t("inProgress")} count={inProgress.length} onFilter={() => setFilterOpen(true)}>
            {inProgress.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">{t("noPatientsInQueue")}</div>
            ) : (
              inProgress.map((appt) => (
                <InProgressCard
                  key={appt.id}
                  room={isRTL ? "غرفة 3" : "Room 3"}
                  name={appt.patientName}
                  pid={`#PT-${appt.id.slice(-5).toUpperCase()}`}
                  sessionMin={15}
                  doctor={appt.doctorName}
                  dept={appt.type || t("generalVisit")}
                  loading={processingKey === `${appt.id}:completed`}
                  onAction={() => void applyTransition(appt, "completed")}
                />
              ))
            )}
          </KanbanColumn>

          {/* DONE Column */}
          <KanbanColumn dot="bg-emerald-500" title={t("completed")} count={completed.length} onFilter={() => setFilterOpen(true)}>
            {completed.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">{t("noRecentActivity")}</div>
            ) : (
              completed.slice(0, 10).map((appt) => (
                <DoneCard
                  key={appt.id}
                  name={appt.patientName}
                  pid={`#PT-${appt.id.slice(-5).toUpperCase()}`}
                  completedAt={appt.endTime || appt.time}
                  doctor={appt.doctorName}
                  dept={appt.type || t("generalVisit")}
                  prescription
                  isPaid={appt.paymentStatus === "PAID"}
                  onAction={() => router.push(`/reception/payments?appointmentId=${appt.id}`)}
                />
              ))
            )}
          </KanbanColumn>
        </div>

        {/* Separated Columns (Cancelled) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          <KanbanColumn dot="bg-red-400" title={t("cancelled")} count={cancelled.length} onFilter={() => setFilterOpen(true)}>
            {cancelled.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">{t("noRecentActivity")}</div>
            ) : (
              cancelled.slice(0, 10).map((appt) => (
                <DoneCard
                  key={appt.id}
                  name={appt.patientName}
                  pid={`#PT-${appt.id.slice(-5).toUpperCase()}`}
                  completedAt={appt.time}
                  doctor={appt.doctorName}
                  dept={appt.type || t("generalVisit")}
                  statusLabel={appt.status === "no-show" ? t("noShow") : t("cancelled")}
                  isCancelled
                  onAction={() => void applyTransition(appt, "scheduled")}
                />
              ))
            )}
          </KanbanColumn>
        </div>
      </div>

      {/* Filter Modal */}
      {filterOpen && <FilterModal onClose={() => setFilterOpen(false)} />}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────── */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="border-none shadow-[0_2px_16px_rgb(0,0,0,0.04)] rounded-[24px] bg-white">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-7 w-7", iconColor)} />
        </div>
        <div className="overflow-hidden">
          <p className="text-[13px] font-bold text-slate-400 truncate">{label}</p>
          <h3 className="text-[30px] font-black text-slate-900 tracking-tighter leading-none mt-1 truncate">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Kanban Column Container ───────────────────────────────────── */
interface KanbanColumnProps {
  dot: string;
  title: string;
  count: number;
  children: React.ReactNode;
  onFilter?: () => void;
}

function KanbanColumn({ dot, title, count, children, onFilter }: KanbanColumnProps) {
  return (
    <div className="bg-white rounded-[28px] shadow-[0_4px_24px_rgb(0,0,0,0.05)] p-5 space-y-4">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", dot)} />
          <span className="text-[15px] font-bold text-slate-800 truncate">{title}</span>
          <span className="h-6 min-w-[26px] px-2 bg-slate-100 rounded-full text-[11px] font-black text-slate-500 flex items-center justify-center shrink-0">
            {count}
          </span>
        </div>
        <button
          onClick={onFilter}
          className="h-7 w-7 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors shrink-0"
        >
          <MoreHorizontal className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/* ── Patient Avatar ────────────────────────────────────────────── */
function PatientAvatar({ name }: { name: string }) {
  return (
    <Avatar className="h-11 w-11 border-2 border-white shadow-sm shrink-0">
      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name}`} />
      <AvatarFallback className="bg-slate-100 text-slate-500 text-[12px] font-bold">{name.substring(0, 2)}</AvatarFallback>
    </Avatar>
  );
}

/* ── Doctor Avatar ─────────────────────────────────────────────── */
function DoctorAvatar({ name }: { name: string }) {
  return (
    <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name}doc`} />
      <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-bold">{name.substring(0, 2)}</AvatarFallback>
    </Avatar>
  );
}

/* ── Quick Action Row ──────────────────────────────────────────── */
interface QuickActionRowProps {
  onAction: () => void;
  onCancel?: () => void;
  loading?: boolean;
  doctorName: string;
  actionLabel?: string;
}

function QuickActionRow({ onAction, onCancel, loading, doctorName, actionLabel = "Quick action" }: QuickActionRowProps) {
  const { t, isRTL } = useTranslation();
  return (
    <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
      <div className="flex items-center gap-2 overflow-hidden">
        <DoctorAvatar name={doctorName} />
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-[11px] font-bold text-red-400 hover:text-red-500 transition-colors truncate"
          >
            {t("cancel")}
          </button>
        )}
      </div>
      <button
        onClick={onAction}
        disabled={loading}
        className="flex items-center gap-1 text-[12px] font-black text-[#3B82F6] hover:text-blue-700 transition-colors shrink-0"
      >
        {loading ? t("saving") : actionLabel}
        {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/* ── Waiting Card ──────────────────────────────────────────────── */
interface WaitingCardProps {
  priority: "high" | "standard";
  name: string;
  pid: string;
  time: string;
  waitMin: number;
  doctor: string;
  dept: string;
  onAction: () => void;
  onCancel?: () => void;
  loading?: boolean;
  actionLabel?: string;
}

function WaitingCard({ priority, name, pid, time, waitMin, doctor, dept, onAction, onCancel, loading, actionLabel }: WaitingCardProps) {
  const { t, isRTL } = useTranslation();
  return (
    <div className="bg-white rounded-[18px] border border-slate-100 p-5 space-y-4 shadow-[0_1px_8px_rgb(0,0,0,0.03)]">
      {/* Priority */}
      {priority === "high" ? (
        <span className="inline-flex px-3 py-1 rounded-lg bg-red-50 border border-red-100 text-[11px] font-bold text-red-500">
          {t("urgent")}
        </span>
      ) : (
        <p className="text-[12px] font-bold text-slate-400">{t("standard")}</p>
      )}

      {/* Patient */}
      <div className="flex items-center gap-3 overflow-hidden">
        <PatientAvatar name={name} />
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-900 truncate">{name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5 truncate">ID: {pid}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 overflow-hidden">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{time} {waitMin > 0 && `(${t("waiting")} ${waitMin}${isRTL ? "د" : "m"})`}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 overflow-hidden">
          <Stethoscope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{doctor} • {dept}</span>
        </div>
      </div>

      <QuickActionRow
        onAction={onAction}
        onCancel={onCancel}
        loading={loading}
        doctorName={doctor}
        actionLabel={actionLabel}
      />
    </div>
  );
}

/* ── In Progress Card ──────────────────────────────────────────── */
interface InProgressCardProps {
  room: string;
  name: string;
  pid: string;
  sessionMin: number;
  doctor: string;
  dept: string;
  onAction: () => void;
  loading?: boolean;
}

function InProgressCard({ room, name, pid, sessionMin, doctor, dept, onAction, loading }: InProgressCardProps) {
  const { t, isRTL } = useTranslation();
  return (
    <div className="bg-white rounded-[18px] border border-slate-100 p-5 space-y-4 shadow-[0_1px_8px_rgb(0,0,0,0.03)]">
      {/* Room Badge */}
      <span className="inline-flex px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-600">
        {room}
      </span>

      {/* Patient */}
      <div className="flex items-center gap-3 overflow-hidden">
        <PatientAvatar name={name} />
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-900 truncate">{name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5 truncate">ID: {pid}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] font-bold text-blue-500 overflow-hidden">
          <Zap className="h-3.5 w-3.5 shrink-0 fill-blue-400 text-blue-400" />
          <span className="truncate">{t("inProgress")}: {sessionMin}${isRTL ? "د" : "m"}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 overflow-hidden">
          <Stethoscope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{doctor} • {dept}</span>
        </div>
      </div>

      <QuickActionRow onAction={onAction} loading={loading} doctorName={doctor} actionLabel={t("completed")} />
    </div>
  );
}

/* ── Done Card ─────────────────────────────────────────────────── */
interface DoneCardProps {
  name: string;
  pid: string;
  completedAt: string;
  doctor: string;
  dept: string;
  prescription?: boolean;
  onAction: () => void;
  statusLabel?: string;
  isCancelled?: boolean;
  isPaid?: boolean;
}

function DoneCard({ name, pid, completedAt, doctor, dept, prescription, onAction, statusLabel, isCancelled, isPaid }: DoneCardProps) {
  const { t } = useTranslation();
  const displayLabel = statusLabel || (isPaid ? t("paid") : t("collectPayment"));
  
  return (
    <div className="bg-white rounded-[18px] border border-slate-100 p-5 space-y-4 shadow-[0_1px_8px_rgb(0,0,0,0.03)]">
      {/* Badge */}
      <span className={cn(
        "inline-flex px-3 py-1 rounded-lg border text-[11px] font-bold",
        isCancelled
          ? "bg-red-50 border-red-100 text-red-600"
          : isPaid 
            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
            : "bg-amber-50 border-amber-100 text-amber-600"
      )}>
        {displayLabel}
      </span>

      {/* Patient */}
      <div className="flex items-center gap-3 overflow-hidden">
        <PatientAvatar name={name} />
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-500 truncate">{name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5 truncate">ID: {pid}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 overflow-hidden">
          <Clock className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span className="truncate">{isCancelled ? `${t("cancelled")} ${completedAt}` : `${t("completed")} ${completedAt}`}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 overflow-hidden">
          <Stethoscope className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span className="truncate">{doctor} • {dept}</span>
        </div>
        {prescription && !isCancelled && (
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 overflow-hidden">
            <FileText className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            <span className="truncate">{t("prescriptions")} {t("sent")}</span>
          </div>
        )}
      </div>

      <QuickActionRow
        onAction={onAction}
        loading={false}
        doctorName={doctor}
        actionLabel={isCancelled ? t("reschedule") : isPaid ? t("details") : t("collectPayment")}
      />
    </div>
  );
}

/* ── Filter Modal ──────────────────────────────────────────────── */
function FilterModal({ onClose }: { onClose: () => void }) {
  const { t, isRTL } = useTranslation();
  const [selectedPriority, setSelectedPriority] = useState<"standard" | "high" | "low">("high");
  const [showAll, setShowAll] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({
    "General Practitioner": true,
    "Dentist": false,
    "Gastroenterologist": false,
    "Neurologist": false,
    "Pulmonologist": false,
    "Cardiologist": false,
    "Dermatologist": false,
  });

  const specializations = showAll
    ? Object.keys(checked)
    : Object.keys(checked).slice(0, 5);

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Filter className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-[17px] font-bold text-slate-900">{t("filter")}</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-7">
          {/* Specializations */}
          <div className="space-y-4">
            <p className="text-[13px] font-black text-slate-900 uppercase tracking-widest">{t("specialties")}</p>
            <div className="space-y-3">
              {specializations.map((spec) => (
                <label key={spec} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggle(spec)}
                    className={cn(
                      "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                      checked[spec]
                        ? "bg-blue-600 border-[#3B82F6]"
                        : "border-slate-200 bg-white group-hover:border-blue-300"
                    )}
                  >
                    {checked[spec] && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={cn("text-[14px] font-medium", checked[spec] ? "text-slate-900" : "text-slate-500")}>
                    {spec}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
              {showAll ? t("showLess") : t("showAll")}
            </button>
          </div>

          {/* Priority */}
          <div className="space-y-4">
            <p className="text-[13px] font-black text-slate-900 uppercase tracking-widest">{t("priority")}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["standard", "high", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={cn(
                    "h-11 rounded-xl text-[12px] font-bold transition-all",
                    selectedPriority === p
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {p === "standard" ? t("standard") : p === "high" ? t("urgent") : t("routine")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-500 font-bold bg-white hover:bg-slate-50 text-[14px]"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[14px]"
          >
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddToQueueView({ appointment, onBack }: { appointment: Appointment | null; onBack: () => void }) {
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const toast = useToastStore();
  const { updateAppointment, fetchAppointments } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [priority, setPriority] = useState<"routine" | "standard" | "urgent">("standard");
  const [consentSigned, setConsentSigned] = useState(false);

  // Walk-in State
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  useEffect(() => {
    if (!appointment) {
      void staffService.getDoctors().then(setDoctors);
    }
  }, [appointment]);

  useEffect(() => {
    if (!appointment && searchQuery.length > 2) {
      setSearchingPatients(true);
      const delay = setTimeout(async () => {
        try {
          const results = await patientService.getAll({ search: searchQuery });
          setPatients(results);
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingPatients(false);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setPatients([]);
    }
  }, [searchQuery, appointment]);

  const handleConfirmCheckIn = async () => {
    setLoading(true);
    try {
      if (appointment) {
        await updateAppointment(appointment.id, { 
          status: "confirmed",
          notes: "Patient checked-in at reception"
        });
      } else {
        if (!selectedPatient || !selectedDoctor) {
          toast.error(t("fillRequired"));
          return;
        }
        const now = new Date();
        const startTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        await bookingService.create({
          patientId: selectedPatient.id,
          patientName: selectedPatient.fullName,
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.fullName,
          date: formatDateKey(now),
          startTime: startTime,
          type: "CONSULTATION",
          notes: `Walk-in patient check-in (${priority} priority)`,
          amount: selectedDoctor.consultationFee || 0,
          status: "CONFIRMED"
        });
      }
      toast.success(t("patientAddedSuccessfully"));
      await fetchAppointments({ date: formatDateKey(new Date()) });
      onBack();
    } catch (error) {
      toast.error(t("error"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentPatientName = appointment?.patientName || selectedPatient?.fullName || "";
  const currentPatientPhone = appointment?.patientPhone || selectedPatient?.phone || "";
  const currentPatientId = appointment?.id || selectedPatient?.id || "";
  const currentDoctorName = appointment?.doctorName || selectedDoctor?.fullName || "";
  const currentSpecialty = appointment?.specialty || selectedDoctor?.specialization || "";
  const currentAmount = appointment?.amount || selectedDoctor?.consultationFee || 0;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20 font-sans space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={onBack}>{t("waitingRoom")}</span>
          {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="text-slate-900">{t("patientCheckIn")}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-slate-200 font-bold text-slate-500 hover:bg-slate-50 h-11 px-8 text-[13px] bg-white order-2 sm:order-1">
            {t("cancel")}
          </Button>
          <Button 
            disabled={loading || (!appointment && (!selectedPatient || !selectedDoctor))}
            onClick={handleConfirmCheckIn}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/10 text-[13px] order-1 sm:order-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("confirmCheckIn")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Patient Selection (Walk-in only) */}
          {!appointment && !selectedPatient && (
            <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-5">
              <h3 className="text-[16px] font-bold text-slate-900">{t("selectPatient")}</h3>
              <div className="relative">
                {searchingPatients ? (
                  <Loader2 className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin", isRTL ? "right-4" : "left-4")} />
                ) : (
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300", isRTL ? "right-4" : "left-4")} />
                )}
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPatientsPlaceholder")} 
                  className={cn("h-14 rounded-2xl border-slate-100 bg-slate-50", isRTL ? "pr-11 pl-4" : "pl-11 pr-4")} 
                />
                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar">
                    {patients.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedPatient(p)}
                        className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-none"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${p.fullName}`} />
                          <AvatarFallback>{p.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{p.fullName}</span>
                          <span className="text-[11px] text-slate-500">{p.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center py-4">
                 <Button 
                   variant="ghost" 
                   onClick={() => router.push("/reception/patients")}
                   className="text-blue-600 font-bold hover:bg-blue-50 rounded-xl"
                 >
                   <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t("addNewPatient")}
                 </Button>
              </div>
            </div>
          )}

          {/* Patient Hero */}
          {(appointment || selectedPatient) && (
            <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 md:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                    <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${currentPatientName}`} />
                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-lg">{currentPatientName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("space-y-1", isRTL ? "sm:text-right" : "sm:text-left")}>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                      <h2 className="text-[18px] md:text-[19px] font-bold text-slate-900">{currentPatientName}</h2>
                      {!appointment && (
                        <button onClick={() => setSelectedPatient(null)} className="text-[11px] font-bold text-blue-600 hover:underline">{t("change")}</button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[11px] md:text-[12px] font-bold text-slate-400">
                      <span>ID: #PT-{currentPatientId.toString().slice(-5).toUpperCase()}</span>
                      <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />
                      <span className="font-mono">{currentPatientPhone || "---"}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] md:text-[12px] font-bold text-slate-500 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      {appointment ? `${t("scheduled")}: ${appointment.time}` : t("walkIn")}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                  <span className="inline-flex px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] md:text-[11px] font-black rounded-xl uppercase tracking-wide">
                    {appointment ? t(appointment.status.toLowerCase() as TranslationKey) : t("walkIn")} · {t("pending")}
                  </span>
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400">{t("date")}: {appointment ? new Date(appointment.date).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US")}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                  <ClipboardList className="h-4 w-4 text-slate-400" />
                  <span className="text-[12px] font-bold text-slate-600">{appointment?.type || t("generalVisit")}</span>
                </div>
                {currentDoctorName && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${currentDoctorName}`} />
                      <AvatarFallback className="text-[10px]">{currentDoctorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-[12px] font-bold text-slate-600">{t("doctor")} {currentDoctorName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check-in Requirements */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">{t("requirements")}</h3>
              </div>
              <span className="text-[12px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                {consentSigned ? `3 ${t("of")} 3 ${t("completed")}` : `2 ${t("of")} 3 ${t("completed")}`}
              </span>
            </div>

            {/* Requirement Items */}
            <div className="space-y-5">
              {/* 1. Verify Identity */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-50">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{t("verifyIdentity")}</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">{t("idAndDetailsConfirmed")}</p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg whitespace-nowrap">{t("verified")}</span>
              </div>

              {/* 2. Consent Forms */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-50">
                <div className="flex items-start gap-4">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", consentSigned ? "bg-emerald-50" : "bg-red-50")}>
                    {consentSigned
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <AlertCircle className="h-5 w-5 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{t("signConsentForms")}</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">{t("consentDescription")}</p>
                    {!consentSigned && (
                      <button onClick={() => setConsentSigned(true)} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 mt-2 hover:text-blue-700 transition-colors">
                        {t("openDigitalForm")} {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                {consentSigned
                  ? <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg whitespace-nowrap">{t("verified")}</span>
                  : <span className="text-[11px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-lg whitespace-nowrap">{t("required")}</span>
                }
              </div>

              {/* 3. Contact Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{t("updateContactInformation")}</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">{t("confirmPhoneAndEmail")}</p>
                  </div>
                </div>
                <button className="text-[11px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap flex items-center gap-1">
                  <Edit2 className="h-3 w-3" /> {t("edit")}
                </button>
              </div>
            </div>
          </div>

          {/* Initial Vitals */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">{t("vitalsTrend")} <span className="text-slate-300 font-normal">({t("optional")})</span></h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <VitalInput label={t("bloodPressure")} value="--" unit="mmhg" />
              <VitalInput label={t("heartRate")} value="--" unit="bpm" />
              <VitalInput label={isRTL ? "الحرارة" : "Temperature"} value="--" unit={isRTL ? "م°" : "°C"} />
              <VitalInput label={t("weight") || (isRTL ? "الوزن" : "Weight")} value="--" unit="kg" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Queue Assignment (Dynamic for Walk-in) */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900">{t("queueAssignment")}</h3>

            {/* Assigned Doctor */}
            <div className="space-y-2">
              <label className={cn("text-[11px] font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("assignedDoctor")}</label>
              {!appointment ? (
                <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto no-scrollbar">
                  {doctors.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        selectedDoctor?.id === doc.id ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`} />
                        <AvatarFallback>{doc.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-slate-900 truncate">{doc.fullName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{doc.specialization}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${currentDoctorName}`} />
                      <AvatarFallback>{currentDoctorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{t("doctor")} {currentDoctorName}</p>
                      <p className="text-[11px] font-bold text-slate-400">{currentSpecialty}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Priority Level */}
            <div className="space-y-3">
              <label className={cn("text-[11px] font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("priority")}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["routine", "standard", "urgent"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                       "h-10 rounded-xl text-[11px] font-bold capitalize transition-all",
                       priority === p
                         ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                         : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {p === "routine" ? t("routine") : p === "urgent" ? t("urgent") : t("standard")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Copay Summary */}
          <div className="rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-5 relative overflow-hidden bg-slate-900">
            {paid && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="border-4 border-emerald-400 text-emerald-400 text-[40px] font-black px-6 py-2 rounded-xl opacity-60 rotate-[-15deg] tracking-widest">
                  {t("paid").toUpperCase()}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-300" />
                <span className="text-[13px] font-bold text-white">{t("paymentSummary")}</span>
              </div>
              <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg", paid ? "bg-emerald-400/20 text-emerald-400" : "bg-amber-400/20 text-amber-400")}>
                {paid ? t("paid").toUpperCase() : t("pending").toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-blue-300">{t("amountDue")}</span>
                <span className="text-[12px] font-bold text-white">{currentAmount} {isRTL ? "ج.م" : "LE"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-blue-300">{t("type")}</span>
                <span className="text-[12px] font-bold text-white capitalize">{appointment?.type || t("walkIn")}</span>
              </div>
            </div>

            {!paid && (
              <Button
                onClick={() => setPaid(true)}
                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] shadow-lg shadow-blue-900/30"
              >
                <CreditCard className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t("collectPayment")}
              </Button>
            )}
          </div>

          <Button 
            onClick={handleConfirmCheckIn}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("confirmCheckIn")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VitalInput({ label, value, unit }: { label: string; value: string; unit: string }) {
  const { isRTL } = useTranslation();
  return (
    <div className="space-y-2">
      <label className={cn("text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{label}</label>
      <div className="flex items-center gap-2 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl">
        <input
          defaultValue={value}
          className={cn("flex-1 bg-transparent text-[14px] font-bold text-slate-800 outline-none w-full", isRTL && "text-right")}
        />
        <span className="text-[11px] font-bold text-slate-400 shrink-0">{unit}</span>
      </div>
    </div>
  );
}
