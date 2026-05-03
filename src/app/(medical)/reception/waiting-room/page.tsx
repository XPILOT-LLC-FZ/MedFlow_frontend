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
  Zap,
  Filter,
  X,
  AlertCircle,
  ClipboardList,
  Edit2,
  Activity,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateKey } from "@/lib/dateUtils";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/types";

const toMinutes = (value: string): number | null => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const formatWait = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const RESOLVED_STATUSES: Appointment["status"][] = ["completed", "cancelled", "no-show"];

export default function QueueManagementPage() {
  const toast = useToastStore();
  const router = useRouter();
  const { appointments, fetchAppointments, updateAppointment, isLoading } = useBookingStore();
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  // ── All hooks must be declared before any early return ──
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const loadQueue = useCallback(async () => {
    await fetchAppointments({ date: todayKey });
  }, [fetchAppointments, todayKey]);

  useEffect(() => {
    void loadQueue();
    const interval = setInterval(() => void loadQueue(), 30000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  const waiting = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "scheduled" || a.status === "confirmed")
        .sort((a, b) => (toMinutes(a.time) ?? 9999) - (toMinutes(b.time) ?? 9999)),
    [appointments]
  );

  const inProgress = useMemo(
    () => appointments.filter((a) => a.status === "in-progress"),
    [appointments]
  );

  const completed = useMemo(
    () => appointments.filter((a) => RESOLVED_STATUSES.includes(a.status)),
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
      toast.success("Appointment status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setProcessingKey(null);
    }
  };

  const showDemo = false; // Force real data

  // ── Early return AFTER all hooks ──
  if (checkInOpen) {
    return <AddToQueueView onBack={() => setCheckInOpen(false)} />;
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F3F4F8] min-h-screen pb-20 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Queue Management</h1>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
          </div>
          <p className="text-slate-400 text-sm font-medium">Real-time tracking of patient status across the clinic.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span className="text-[13px] font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button
            onClick={() => setCheckInOpen(true)}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl h-11 px-7 font-bold shadow-lg shadow-blue-100 flex items-center gap-2 text-[13px]"
          >
            <Plus className="h-5 w-5" />
            Add to Queue
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Total in Queue" value={String(waiting.length + inProgress.length)} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard icon={Clock} label="Avg. Wait Time" value={formatWait(avgWaitMinutes)} iconBg="bg-orange-50" iconColor="text-orange-500" />
        <StatCard icon={UserCheck} label="In Progress" value={String(inProgress.length)} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard icon={CheckCircle2} label="Completed Today" value={String(completed.length)} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* ── Kanban Board ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* WAITING Column */}
        <KanbanColumn dot="bg-amber-400" title="Waiting" count={waiting.length} onFilter={() => setFilterOpen(true)}>
          {waiting.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm italic">No patients waiting</div>
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
                  dept={appt.type || "General"}
                  loading={processingKey === `${appt.id}:in-progress`}
                  onAction={() => void applyTransition(appt, "in-progress")}
                />
              );
            })
          )}
        </KanbanColumn>

        {/* IN PROGRESS Column */}
        <KanbanColumn dot="bg-blue-500" title="In Progress" count={inProgress.length} onFilter={() => setFilterOpen(true)}>
          {inProgress.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm italic">No patients in session</div>
          ) : (
            inProgress.map((appt) => (
              <InProgressCard
                key={appt.id}
                room="Room 3"
                name={appt.patientName}
                pid={`#PT-${appt.id.slice(-5).toUpperCase()}`}
                sessionMin={15}
                doctor={appt.doctorName}
                dept="Cardiology"
                loading={processingKey === `${appt.id}:completed`}
                onAction={() => void applyTransition(appt, "completed")}
              />
            ))
          )}
        </KanbanColumn>

        {/* DONE Column */}
        <KanbanColumn dot="bg-emerald-500" title="Done" count={completed.length} onFilter={() => setFilterOpen(true)}>
          {completed.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm italic">No patients completed yet</div>
          ) : (
            completed.slice(0, 10).map((appt) => (
              <DoneCard
                key={appt.id}
                name={appt.patientName}
                pid={`#PT-${appt.id.slice(-5).toUpperCase()}`}
                completedAt={appt.endTime || appt.time}
                doctor={appt.doctorName}
                dept={appt.type || "General"}
                prescription
                onAction={() => router.push(`/reception/payments?appointmentId=${appt.id}`)}
              />
            ))
          )}
        </KanbanColumn>
      </div>

      {/* ── Filter Modal ── */}
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
        <div>
          <p className="text-[13px] font-bold text-slate-400">{label}</p>
          <h3 className="text-[30px] font-black text-slate-900 tracking-tighter leading-none mt-1">{value}</h3>
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
        <div className="flex items-center gap-2.5">
          <div className={cn("h-2.5 w-2.5 rounded-full", dot)} />
          <span className="text-[15px] font-bold text-slate-800">{title}</span>
          <span className="h-6 min-w-[26px] px-2 bg-slate-100 rounded-full text-[11px] font-black text-slate-500 flex items-center justify-center">
            {count}
          </span>
        </div>
        <button
          onClick={onFilter}
          className="h-7 w-7 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors"
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
  loading?: boolean;
  doctorName: string;
}

function QuickActionRow({ onAction, loading, doctorName }: QuickActionRowProps) {
  return (
    <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
      <DoctorAvatar name={doctorName} />
      <button
        onClick={onAction}
        disabled={loading}
        className="flex items-center gap-1 text-[12px] font-black text-[#3B82F6] hover:text-blue-700 transition-colors"
      >
        {loading ? "Updating..." : "Quick action"}
        <ChevronRight className="h-3.5 w-3.5" />
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
  loading?: boolean;
}

function WaitingCard({ priority, name, pid, time, waitMin, doctor, dept, onAction, loading }: WaitingCardProps) {
  return (
    <div className="bg-white rounded-[18px] border border-slate-100 p-5 space-y-4 shadow-[0_1px_8px_rgb(0,0,0,0.03)]">
      {/* Priority */}
      {priority === "high" ? (
        <span className="inline-flex px-3 py-1 rounded-lg bg-red-50 border border-red-100 text-[11px] font-bold text-red-500">
          High priority
        </span>
      ) : (
        <p className="text-[12px] font-bold text-slate-400">Standard</p>
      )}

      {/* Patient */}
      <div className="flex items-center gap-3">
        <PatientAvatar name={name} />
        <div>
          <p className="text-[15px] font-bold text-slate-900">{name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">ID: {pid}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          Appt: {time} (Waiting {waitMin}m)
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
          <Stethoscope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {doctor} • {dept}
        </div>
      </div>

      <QuickActionRow onAction={onAction} loading={loading} doctorName={doctor} />
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
  return (
    <div className="bg-white rounded-[18px] border border-slate-100 p-5 space-y-4 shadow-[0_1px_8px_rgb(0,0,0,0.03)]">
      {/* Room Badge */}
      <span className="inline-flex px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600">
        {room}
      </span>

      {/* Patient */}
      <div className="flex items-center gap-3">
        <PatientAvatar name={name} />
        <div>
          <p className="text-[15px] font-bold text-slate-900">{name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">ID: {pid}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] font-bold text-blue-500">
          <Zap className="h-3.5 w-3.5 shrink-0 fill-blue-400 text-blue-400" />
          In session: {sessionMin}m
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
          <Stethoscope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {doctor} • {dept}
        </div>
      </div>

      <QuickActionRow onAction={onAction} loading={loading} doctorName={doctor} />
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
}

function DoneCard({ name, pid, completedAt, doctor, dept, prescription, onAction }: DoneCardProps) {
  return (
    <div className="bg-white rounded-[18px] border border-slate-100 p-5 space-y-4 shadow-[0_1px_8px_rgb(0,0,0,0.03)]">
      {/* Checkout Badge */}
      <span className="inline-flex px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-600">
        Checkout Req.
      </span>

      {/* Patient */}
      <div className="flex items-center gap-3">
        <PatientAvatar name={name} />
        <div>
          <p className="text-[15px] font-bold text-slate-500">{name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">ID: {pid}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          Completed at {completedAt}
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
          <Stethoscope className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          {doctor} • {dept}
        </div>
        {prescription && (
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
            <FileText className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            E-Prescription Sent
          </div>
        )}
      </div>

      <QuickActionRow onAction={onAction} loading={false} doctorName={doctor} />
    </div>
  );
}

/* ── Filter Modal ──────────────────────────────────────────────── */
function FilterModal({ onClose }: { onClose: () => void }) {
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Filter className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-[17px] font-bold text-slate-900">Filter</h2>
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
            <p className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Specializations</p>
            <div className="space-y-3">
              {specializations.map((spec) => (
                <label key={spec} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggle(spec)}
                    className={cn(
                      "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                      checked[spec]
                        ? "bg-[#3B82F6] border-[#3B82F6]"
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
              {showAll ? "Show less" : "Show all"}
            </button>
          </div>

          {/* Priority */}
          <div className="space-y-4">
            <p className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Priority</p>
            <div className="grid grid-cols-3 gap-2">
              {(["standard", "high", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={cn(
                    "h-11 rounded-xl text-[12px] font-bold transition-all",
                    selectedPriority === p
                      ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-100"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {p === "standard" ? "Standard" : p === "high" ? "High priority" : "Low priority"}
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
            Cancel
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-lg shadow-blue-100 text-[14px]"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Add To Queue / Patient Check-in View ──────────────────────── */
function AddToQueueView({ onBack }: { onBack: () => void }) {
  const [paid, setPaid] = useState(false);
  const [priority, setPriority] = useState<"routine" | "standard" | "urgent">("standard");
  const [consentSigned, setConsentSigned] = useState(false);

  return (
    <div className="p-4 lg:p-8 bg-[#F3F4F8] min-h-screen pb-20 font-sans space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={onBack}>Patient Queue</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900">Patient Check-in</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-slate-200 font-bold text-slate-500 hover:bg-slate-50 h-11 px-8 text-[13px] bg-white">
            Cancel
          </Button>
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-100 text-[13px]">
            Confirm check in
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-7 space-y-6">
          {/* Patient Hero */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                  <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Michael" />
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-lg">MR</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-[19px] font-bold text-slate-900">Michael R. Harrison</h2>
                  <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400">
                    <span>Ex: APT-84729</span>
                    <span>DOB: 14 Aug 1983 (43y)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    Scheduled: 10:30 AM
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <span className="inline-flex px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-black rounded-xl uppercase tracking-wide">
                  Arrived · Pending Check-in
                </span>
                <p className="text-[11px] font-bold text-slate-400">Wait time 5 mins</p>
              </div>
            </div>
            <div className="flex items-center gap-6 pt-3 border-t border-slate-50">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                <span className="text-[12px] font-bold text-slate-600">Follow-up Visit</span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Aarav" />
                  <AvatarFallback className="text-[10px]">AA</AvatarFallback>
                </Avatar>
                <span className="text-[12px] font-bold text-slate-600">Dr. Aarav Mehta</span>
              </div>
            </div>
          </div>

          {/* Check-in Requirements */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">Check-in Requirements</h3>
              </div>
              <span className="text-[12px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                {consentSigned ? "3 of 3 Completed" : "2 of 3 Completed"}
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
                    <p className="text-[14px] font-bold text-slate-900">Verify Patient Identity</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">Driver&apos;s License or ID scanned and confirmed</p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg whitespace-nowrap">Verified</span>
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
                    <p className="text-[14px] font-bold text-slate-900">Sign Consent Forms</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">HIPAA and General Consent for treatment</p>
                    {!consentSigned && (
                      <button onClick={() => setConsentSigned(true)} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 mt-2 hover:text-blue-700 transition-colors">
                        Open Digital Form <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {consentSigned
                  ? <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg whitespace-nowrap">Verified</span>
                  : <span className="text-[11px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-lg whitespace-nowrap">Required</span>
                }
              </div>

              {/* 3. Contact Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">Update Contact Information</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">Confirm phone number and email address are current</p>
                  </div>
                </div>
                <button className="text-[11px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap flex items-center gap-1">
                  <Edit2 className="h-3 w-3" /> Edit
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
                <h3 className="text-[16px] font-bold text-slate-900">Initial Vitals <span className="text-slate-300 font-normal">(Optional at Desk)</span></h3>
              </div>
              <button className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors">Skip to Triage</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <VitalInput label="Blood Pressure" value="120/80" unit="mmhg" />
              <VitalInput label="Heart Rate" value="72" unit="bpm" />
              <VitalInput label="Temperature" value="98.6" unit="°F" />
              <VitalInput label="Weight" value="185" unit="kg" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Queue Assignment */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900">Queue Assignment</h3>

            {/* Assigned Doctor */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Assigned Doctor</label>
              <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-all">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Aarav" />
                    <AvatarFallback>AA</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">Dr. Aarav Mehta</p>
                    <p className="text-[11px] font-bold text-slate-400">Cardiology Dept.</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Priority Level */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Priority Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(["routine", "standard", "urgent"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "h-10 rounded-xl text-[11px] font-bold capitalize transition-all",
                      priority === p
                        ? "bg-[#3B82F6] text-white shadow-md shadow-blue-100"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {p === "routine" ? "Routine" : p === "standard" ? "Standard" : "Urgent"}
                  </button>
                ))}
              </div>
            </div>

            {/* Room / Zone */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Room / Zone</label>
              <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-all">
                <span className="text-[13px] font-bold text-slate-700">Waiting Area A</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Copay Summary */}
          <div className={cn("rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-5 relative overflow-hidden", paid ? "bg-[#1E3A5F]" : "bg-[#1E3A5F]")}>
            {/* Paid watermark */}
            {paid && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="border-4 border-emerald-400 text-emerald-400 text-[40px] font-black px-6 py-2 rounded-xl opacity-60 rotate-[-15deg] tracking-widest">
                  PAID
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-300" />
                <span className="text-[13px] font-bold text-white">Copay Summary</span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/20 px-2.5 py-1 rounded-lg">Verified</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-blue-300">Insurance</span>
                <span className="text-[12px] font-bold text-white">BlueCross PPO</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-blue-300">Visit Type</span>
                <span className="text-[12px] font-bold text-white">Specialist Follow-up</span>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-white/10">
              <p className="text-[12px] font-bold text-blue-300">Copay Due</p>
              <p className="text-[36px] font-black text-white tracking-tight leading-none">40.00 <span className="text-[20px]">LE</span></p>
            </div>

            {!paid && (
              <>
                <Button
                  onClick={() => setPaid(true)}
                  className="w-full h-12 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[14px] shadow-lg shadow-blue-900/30"
                >
                  <CreditCard className="h-4 w-4 mr-2" /> Collect Payment Now
                </Button>
                <button className="w-full text-[12px] font-bold text-blue-300 hover:text-white transition-colors text-center py-1">
                  Defer to checkout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalInput({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2 h-12 px-4 bg-[#F9FAFB] border border-slate-100 rounded-xl">
        <input
          defaultValue={value}
          className="flex-1 bg-transparent text-[14px] font-bold text-slate-800 outline-none w-full"
        />
        <span className="text-[11px] font-bold text-slate-400 shrink-0">{unit}</span>
      </div>
    </div>
  );
}
