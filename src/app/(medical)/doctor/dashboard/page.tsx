"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Clock3,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  UserPlus,
  CalendarPlus,
  FilePenLine,
  MessageSquare,
  Bell,
  FileText,
  ClipboardCheck,
  CheckSquare,
  Clock,
  FlaskConical,
  Calendar,
  Mic,
  Plus,
  Loader2,
  Trash2,
  Stethoscope,
  User,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import { notificationsService } from "@/services/notificationsService";
import { bookingService } from "@/services/bookingService";
import type { ApiQuickTask, DashboardDoctorSummaryData, InAppNotification, TaskPriority, TaskStatus } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { NotificationsDialog } from "@/components/shared/NotificationsDialog";
import { tasksService } from "@/services/tasksService";
import { useAuthStore } from "@/stores/useAuthStore";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ar } from "date-fns/locale";
import { TranslationKey } from "@/lib/i18n";

interface DashboardActivity {
  key: string;
  title: string;
  subtitle: string;
  type: string;
}



export default function DoctorDashboard() {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();
  const [dashboardData, setDashboardData] = React.useState<DashboardDoctorSummaryData | null>(null);
  const [realNotifications, setRealNotifications] = useState<InAppNotification[]>([]);
  const [realActivity, setRealActivity] = useState<DashboardActivity[]>([]);
  const [tasks, setTasks] = useState<ApiQuickTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isChatLoading, setIsChatLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // New task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("NORMAL");

  const normalizeKey = (key: string) =>
    key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());

  const translateNotificationTitle = (title: string) => {
    if (title === "Appointment status updated") return t("appointmentStatusUpdated");
    return title;
  };

  const translateNotificationBody = (body: string) => {
    const match = body.match(/Patient (.*) moved from (.*) to (.*)/);
    if (match) {
      const [, name, oldStatus, newStatus] = match;
      const cleanOld = oldStatus.replace(/\.$/, "").trim();
      const cleanNew = newStatus.replace(/\.$/, "").trim();
      const translatedOld = t(normalizeKey(cleanOld) as TranslationKey) || cleanOld;
      const translatedNew = t(normalizeKey(cleanNew) as TranslationKey) || cleanNew;
      return t("patientMoved")
        .replace("{name}", name)
        .replace("{old}", translatedOld)
        .replace("{new}", translatedNew);
    }
    return body;
  };

  const refreshDashboard = React.useCallback(async () => {
    try {
      setError(null);
      const [summary, notifications, recentAppts, allTasks] = await Promise.all([
        dashboardService.getDoctorSummary({ period: "month" }),
        notificationsService.getInAppNotifications({ limit: 8 }),
        bookingService.getAll({ status: "COMPLETED", limit: 5 }),
        tasksService.getAll({}),
      ]);

      setDashboardData(summary);
      setRealNotifications(notifications);
      setTasks(allTasks);

      setRealActivity(recentAppts.map(a => ({
        key: a.id,
        title: locale === "ar" ? `${t("completed")}: ${t(normalizeKey(a.type) as TranslationKey) || a.type.replace("_", " ")}` : `Completed ${a.type.replace("_", " ")}`,
        subtitle: `${a.patientName} - ${formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: locale === "ar" ? ar : undefined })}`,
        type: a.type
      })));

      // Map Tasks
      // (Removed mock tasks logic as it is now handled by QuickTaskWidget)

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    void refreshDashboard();

    const interval = setInterval(() => {
      void refreshDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  const summaryCards = dashboardData?.summaryCards;
  const schedule = dashboardData?.schedule;
  const visibleAppointments = (schedule?.today ?? []).slice(0, 4);

  const isTimeExpired = (timeStr: string) => {
    if (!timeStr) return false;
    try {
      const [time, modifier] = timeStr.split(" ");
      const [hoursStr, minutesStr] = time.split(":");
      let hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      const now = new Date();
      const apptTime = new Date();
      apptTime.setHours(hours, minutes, 0, 0);
      // More than 30 minutes past = expired
      return now.getTime() - apptTime.getTime() > 30 * 60 * 1000;
    } catch { return false; }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const todayAppointments = schedule?.today ?? [];
  const inProgressAppt = todayAppointments.find(p => p.status === "IN_PROGRESS");
  const inProgressIndex = inProgressAppt ? todayAppointments.findIndex(a => a.id === inProgressAppt.id) : -1;

  const nextAppt = todayAppointments.find((p, index) => {
    // If someone is inside, next must be after them in the schedule
    if (inProgressIndex !== -1) {
      if (index <= inProgressIndex) return false;
      // When someone is inside, the very next upcoming patient is "NEXT" 
      // even if the doctor is running late (don't check isTimeExpired)
      return p.status === "CONFIRMED" || p.status === "SCHEDULED";
    }

    // Otherwise, find the first upcoming patient that isn't significantly in the past
    return (p.status === "CONFIRMED" || p.status === "SCHEDULED") && !isTimeExpired(p.time);
  });

  const lastDoneAppt = todayAppointments.filter(p => p.status === "COMPLETED").pop() || null;

  const waitingCount = todayAppointments.filter((item) => item.status === "SCHEDULED" || item.status === "IN_PROGRESS").length;
  const completedCount = todayAppointments.filter((item) => item.status === "COMPLETED" || item.status === "CONFIRMED").length;
  const urgentCount = todayAppointments.filter((item) => /urgent|emergency/i.test(item.type)).length;
  const currentDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  // const { appointments } = useBookingStore();

  const notificationItems = realNotifications.length > 0
    ? realNotifications.map(n => ({
      key: n.id,
      tone: n.type === "CRITICAL" ? "critical" : n.type === "SUCCESS" ? "success" : "info",
      type: n.type,
      title: translateNotificationTitle(n.title),
      body: translateNotificationBody(n.body),
      time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: locale === "ar" ? ar : undefined }),
      unread: !n.readAt,
      role: n.payload?.role as string | undefined,
      isFallback: false
    }))
    : [
      {
        key: "welcome",
        tone: "success",
        type: "SUCCESS",
        title: locale === "ar" ? "مرحباً دكتور" : "Welcome Doctor",
        body: locale === "ar" ? "لا توجد تنبيهات عاجلة اليوم" : "You have no urgent alerts today.",
        time: "",
        unread: false,
        role: "System",
        isFallback: true
      }
    ];

  const handleChatWithPatient = async (appointmentId: string) => {
    setIsChatLoading(appointmentId);
    try {
      router.push(`/doctor/chat?appointmentId=${appointmentId}`);
    } catch (err) {
      console.error("Failed to open chat:", err);
    } finally {
      setIsChatLoading(null);
    }
  };

  const toggleTask = async (task: ApiQuickTask) => {
    const newStatus: TaskStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await tasksService.update(task.id, { status: newStatus });
    } catch (err) {
      console.error("Failed to toggle task:", err);
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user?.id) return;

    setIsSubmittingTask(true);
    try {
      const newTask = await tasksService.create({
        title: newTaskTitle,
        priority: newTaskPriority,
        doctorId: ""
      });
      setTasks(prev => [newTask, ...prev]);
      setIsCreateTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskPriority("NORMAL");
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== id));
      await tasksService.delete(id);
    } catch (err) {
      console.error("Failed to delete task:", err);
      // Refresh list on failure
      void refreshDashboard();
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  const recentActivity = realActivity;

  return (
    <div className="doctor-dashboard space-y-4 lg:space-y-5">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Patients Today */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-none hover:border-slate-200 dark:hover:border-slate-700 transition-all dark:bg-slate-900/40">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("totalPatientsToday")}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {isLoading ? "..." : (summaryCards?.totalPatients ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Currently Waiting */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-none hover:border-slate-200 dark:hover:border-slate-700 transition-all dark:bg-slate-900/40">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500">
              <Clock3 className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("currentlyWaiting")}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {isLoading ? "..." : waitingCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-none hover:border-slate-200 dark:hover:border-slate-700 transition-all dark:bg-slate-900/40">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("completed")}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {isLoading ? "..." : completedCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Cases */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-none hover:border-slate-200 dark:hover:border-slate-700 transition-all dark:bg-slate-900/40">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("urgentCases")}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {isLoading ? "..." : urgentCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Today's schedule */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="rounded-xl border-slate-100 dark:border-slate-800/60 shadow-none dark:bg-slate-900/40 overflow-hidden">
            <CardHeader className="px-5 pb-3.5 pt-5 flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-none font-bold text-[13px] rounded-lg">
                      {t("todaySchedule")}
                    </Badge>
                    <div className="flex items-center gap-1.5 ml-1">
                      {inProgressAppt && (
                        <button
                          onClick={() => handleChatWithPatient(inProgressAppt.id)}
                          className="transition-transform hover:scale-105 active:scale-95"
                        >
                          <Badge variant="info" className="cursor-pointer bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            {t("inside")}: {locale === "ar" && inProgressAppt.patientNameAr ? inProgressAppt.patientNameAr : inProgressAppt.patientName}
                          </Badge>
                        </button>
                      )}
                      {nextAppt && (
                        <Link href="/doctor/schedule" className="transition-transform hover:scale-105 active:scale-95">
                          <Badge variant="warning" className="cursor-pointer bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight">
                            {t("next")}: {locale === "ar" && nextAppt.patientNameAr ? nextAppt.patientNameAr : nextAppt.patientName}
                          </Badge>
                        </Link>
                      )}
                      {lastDoneAppt && (
                        <Link href="/doctor/schedule" className="transition-transform hover:scale-105 active:scale-95">
                          <Badge variant="success" className="cursor-pointer bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight">
                            {t("done")}: {locale === "ar" && lastDoneAppt.patientNameAr ? lastDoneAppt.patientNameAr : lastDoneAppt.patientName}
                          </Badge>
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 ml-1">
                    <CalendarDays className="h-3 w-3" />
                    {currentDate} • {summaryCards?.todayAppointments ?? 0} {t("appointments")}
                  </p>
                </div>
              </div>
              <Link href="/doctor/schedule">
                <Button variant="ghost" size="sm" className="h-auto px-0 py-0 text-[12px] font-bold text-blue-600 hover:bg-transparent hover:text-blue-700">
                  {t("viewAll")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3">
              {visibleAppointments.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 mb-3">
                    <Calendar className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    {t("noUpcomingAppointments")}
                  </p>
                </div>
              ) : (
                visibleAppointments.map((p) => {
                  const isNow = p.status === "IN_PROGRESS";
                  const isNext = p.id === nextAppt?.id;
                  const isDone = p.status === "COMPLETED";
                  // A patient is only "expired" if they aren't the current or next one
                  const expired = p.status === "SCHEDULED" && isTimeExpired(p.time) && !isNext;
                  const isPast = ["COMPLETED", "CANCELLED", "RESCHEDULED"].includes(p.status) || expired;
                  const isNormal = !isPast && !isNow && !isNext;

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "group relative rounded-2xl border transition-all duration-300",
                        isPast && !isDone && "border-slate-100 bg-slate-50/20 dark:border-slate-800/50 dark:bg-slate-900/10 opacity-60 grayscale",
                        isDone && "border-emerald-100 bg-emerald-50/10 dark:border-emerald-900/20 dark:bg-emerald-900/5",
                        isNow && "border-blue-500 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(59,130,246,0.12)] ring-1 ring-blue-500/20",
                        isNext && "border-amber-200 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-900/10",
                        isNormal && "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start gap-4 p-4 sm:p-5">
                        {/* Time Column */}
                        <div className="flex flex-col items-center justify-center pt-1 w-20 shrink-0">
                          <Clock3 className={cn(
                            "h-4 w-4 mb-1.5",
                            isNow ? "text-blue-600" :
                              isNext ? "text-amber-500" :
                                isDone ? "text-emerald-500" :
                                  "text-slate-400"
                          )} />
                          <span className={cn(
                            "text-[13px] font-bold tracking-tight",
                            isNow ? "text-blue-600" :
                              isNext ? "text-amber-600" :
                                isDone ? "text-emerald-600" :
                                  "text-slate-500 dark:text-slate-400"
                          )}>
                            {p.time}
                          </span>
                          {isNow && (
                            <span className="mt-2 rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm shadow-blue-200">
                              {t("now")}
                            </span>
                          )}
                          {isNext && (
                            <span className="mt-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm shadow-amber-200">
                              {t("next")}
                            </span>
                          )}
                          {isDone && (
                            <span className="mt-2 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm shadow-emerald-200">
                              {t("done")}
                            </span>
                          )}
                        </div>

                        {/* Patient Info Column */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 truncate">
                                {locale === "ar" && p.patientNameAr ? p.patientNameAr : p.patientName}
                              </h3>
                              <p className="mt-1 text-[12px] font-medium text-slate-400 dark:text-slate-500">
                                {(() => {
                                  const age = calculateAge(p.patientDateOfBirth);
                                  const gender = p.patientGender || t("ageNotAvailable");
                                  const translatedGender = gender === "MALE" || gender === "Male" ? t("male") :
                                    gender === "FEMALE" || gender === "Female" ? t("female") :
                                      gender;

                                  if (age !== null) {
                                    return `${age} ${t("years")} • ${translatedGender}`;
                                  }
                                  return translatedGender;
                                })()}
                              </p>
                            </div>
                            {isNext && (
                              <span className="rounded-full bg-blue-100/80 dark:bg-blue-900/40 px-3 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {t("upNext")}
                              </span>
                            )}
                          </div>

                          {/* Vitals */}
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-bold">
                            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              {t("bloodPressure")}: <span className="text-slate-400 dark:text-slate-500">120/80</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              {t("heartRate")}: <span className="text-slate-400 dark:text-slate-500">72 bpm</span>
                            </span>
                            {(isNow || isNormal) && (
                              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="h-2 w-2 rounded-full bg-amber-400" />
                                {t("temperature")}: <span className="text-slate-400 dark:text-slate-500">98.6°F</span>
                              </span>
                            )}
                          </div>

                          {/* Footer: Reason & Actions */}
                          <div className="mt-5 pt-4 border-t border-slate-100/60 dark:border-slate-800/60 flex items-center justify-between">
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mr-4">
                              <span className="text-slate-500 dark:text-slate-400 font-bold mr-1">{t("reason")}:</span>
                              {p.notes || t(normalizeKey(p.type) as TranslationKey) || p.type.replace("_", " ")}
                            </p>

                            {!isPast && (
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() => handleChatWithPatient(p.id)}
                                  disabled={isChatLoading === p.id}
                                  className={cn(
                                    "hidden sm:inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors",
                                    isChatLoading === p.id ? "text-slate-400" : "text-blue-600 hover:text-blue-700"
                                  )}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  {t("chat")}
                                </button>
                                <Link
                                  href="/doctor/schedule"
                                  className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-4"
                                >
                                  {t("viewDetails")}
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/40 overflow-hidden">
            <CardHeader className="px-5 pb-3 pt-5 border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                    {t("patientQueue")}
                  </CardTitle>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {`3 ${t("patientsWaiting")}`}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {visibleAppointments.slice(0, 3).map((item, i) => {
                  const isUrgent = i === 1;
                  return (
                    <div
                      key={`queue:${item.id}`}
                      className={cn(
                        "flex items-start gap-4 p-5 transition-all",
                        isUrgent ? "bg-rose-50/30 dark:bg-rose-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      )}
                    >
                      {/* Queue Number */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-[13px] font-bold text-blue-600">
                        {i + 1}
                      </div>

                      {/* Info & Actions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate">
                              {locale === "ar" && item.patientNameAr ? item.patientNameAr : item.patientName}
                            </h4>
                            <p className="mt-0.5 text-[12px] font-medium text-slate-400 dark:text-slate-500">
                              {(() => {
                                const age = calculateAge(item.patientDateOfBirth);
                                if (age !== null) {
                                  return `${age} ${t("years")}`;
                                }
                                return t("ageNotAvailable");
                              })()}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {t("arrival")}: {item.time}
                          </span>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-2">
                          <div className="flex flex-col gap-1.5 min-w-0">
                            {isUrgent && (
                              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                                <AlertCircle className="h-2 w-2" />
                                {locale === "ar" ? "طارئ" : "Urgent"}
                              </span>
                            )}
                            <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400 truncate">
                              {i === 1
                                ? t("chestPainEmergency")
                                : t("annualPhysical")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleChatWithPatient(item.id)}
                              disabled={isChatLoading === item.id}
                              className={cn(
                                "flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-bold transition-all",
                                isChatLoading === item.id
                                  ? "bg-slate-100 text-slate-400"
                                  : "text-blue-600 hover:bg-blue-100 dark:text-blue-400"
                              )}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t("chat")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsQueueOpen(true)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-slate-50 dark:border-slate-800/50 text-center">
                <button
                  onClick={() => setIsQueueOpen(true)}
                  className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t("viewAllPatients")}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Queue Dialog */}
          <Dialog open={isQueueOpen} onOpenChange={setIsQueueOpen}>
            <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden border-none dark:bg-slate-900">
              <DialogHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <DialogTitle className="text-[18px] font-bold text-slate-800 dark:text-slate-100">
                      {t("patientQueue")}
                    </DialogTitle>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {`5 ${t("patientsWaiting")} • ${t("manageConsultationOrder")}`}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                {todayAppointments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    {t("noPatientsInQueue")}
                  </div>
                ) : (
                  todayAppointments.map((p, i) => {
                    const isUrgent = /urgent|emergency/i.test(p.type);
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "rounded-2xl border p-5 transition-all",
                          isUrgent
                            ? "border-rose-100 bg-rose-50/40 dark:border-rose-900/20 dark:bg-rose-900/10"
                            : "border-slate-100 bg-white dark:border-slate-800/50 dark:bg-slate-900 shadow-sm"
                        )}
                      >
                        <div className="flex items-start gap-5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-[14px] font-bold text-blue-600">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">{locale === "ar" && p.patientNameAr ? p.patientNameAr : p.patientName}</h4>
                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("patientId")}: {p.id.slice(0, 8)}</p>
                              </div>
                              {isUrgent && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 text-[11px] font-bold text-rose-500">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  {t("urgent")}
                                </span>
                              )}
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{t("ageAndGender")}</p>
                                <p className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-200">
                                  {(() => {
                                    const age = calculateAge(p.patientDateOfBirth);
                                    const gender = p.patientGender || t("ageNotAvailable");
                                    const translatedGender = gender === "MALE" || gender === "Male" ? t("male") :
                                      gender === "FEMALE" || gender === "Female" ? t("female") :
                                        gender;
                                    return age !== null ? `${age}${t("years").charAt(0)} • ${translatedGender}` : translatedGender;
                                  })()}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{t("reason")}</p>
                                <p className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-200">{t(normalizeKey(p.type) as TranslationKey) || p.type.replace("_", " ")}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{t("apptTime")}</p>
                                <div className="mt-1 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                                  <p className="text-[13px] font-bold">{p.time}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{t("status")}</p>
                                <p className="mt-1 text-[13px] font-bold text-blue-600 uppercase">{t(normalizeKey(p.status) as TranslationKey) || p.status}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleChatWithPatient(p.id)}
                              className="mt-6 w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {t("startChat")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-white dark:bg-slate-900 sticky bottom-0 z-10">
                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                  {`${t("averageWaitTime")}: 15 ${t("minutes")}`}
                </p>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[13px] font-bold text-slate-600 hover:bg-slate-50">
                    {t("close")}
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <NotificationsDialog
            isOpen={isNotificationsOpen}
            onOpenChange={setIsNotificationsOpen}
            notifications={realNotifications}
            onRefresh={refreshDashboard}
          />

        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-none dark:bg-slate-900/40 overflow-hidden">
            <CardHeader className="px-5 pb-3 pt-5 flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <Bell className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                  {t("notifications")}
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t("viewAll")}
                </button>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {notificationItems.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {notificationItems.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => {
                      if (item.unread && !item.isFallback) {
                        notificationsService.markInAppRead(item.key).then(() => refreshDashboard());
                      }
                    }}
                    className={cn(
                      "group relative flex items-start gap-4 p-5 transition-colors cursor-pointer border-l-4",
                      item.unread
                        ? "bg-blue-50/20 dark:bg-blue-900/10 border-l-blue-600"
                        : "bg-transparent border-l-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                      item.role === "ADMIN" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" :
                        item.role === "DOCTOR" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" :
                          item.role === "PATIENT" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                            item.tone === "critical" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500" :
                              "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                      {item.role === "ADMIN" ? <ShieldCheck className="h-4 w-4" /> :
                        item.role === "DOCTOR" ? <Stethoscope className="h-4 w-4" /> :
                          item.role === "PATIENT" ? <User className="h-4 w-4" /> :
                            <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.1em] mb-1 px-1.5 py-0.5 rounded-md w-fit",
                            item.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                              item.role === "DOCTOR" ? "bg-blue-100 text-blue-700" :
                                item.role === "PATIENT" ? "bg-emerald-100 text-emerald-700" :
                                  "bg-slate-100 text-slate-500"
                          )}>
                            {item.role ? t(item.role.toLowerCase() as TranslationKey) :
                              item.type ? t(normalizeKey(item.type) as TranslationKey) || item.type.replace("_", " ") :
                                t("system")}
                          </span>
                          <p className={cn(
                            "text-[13px] text-slate-800 dark:text-slate-100 leading-tight truncate",
                            item.unread ? "font-bold" : "font-medium"
                          )}>
                            {translateNotificationTitle(item.title)}
                          </p>
                        </div>
                        {item.unread && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                        {translateNotificationBody(item.body)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        {item.time && (
                          <p
                            title={!item.isFallback ? new Date(realNotifications.find(n => n.id === item.key)?.createdAt || "").toLocaleString() : ""}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-tight"
                          >
                            {item.time}
                          </p>
                        )}
                        {!item.isFallback && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.unread && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notificationsService.markInAppRead(item.key).then(() => refreshDashboard());
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                              >
                                {t("read")}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notificationsService.deleteInAppNotification(item.key).then(() => refreshDashboard());
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-600"
                            >
                              {locale === "ar" ? "حذف" : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/40 overflow-hidden">
            <CardHeader className="px-5 pb-3 pt-5 border-b border-slate-50 dark:border-slate-800/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <CheckSquare className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                    {t("quickTasks")}
                  </CardTitle>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {pendingTasks.length} {t("tasksPending")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateTaskOpen(true)}
                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {pendingTasks.map((task) => {
                const TaskIcon = task.priority === "URGENT" ? AlertCircle : ClipboardCheck;
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task)}
                    className={cn(
                      "group cursor-pointer rounded-xl border p-3.5 transition-all shadow-none",
                      task.priority === "URGENT"
                        ? "border-rose-100 bg-rose-50/40 dark:border-rose-900/30 dark:bg-rose-900/10"
                        : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 group-hover:border-blue-500 transition-colors" />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <TaskIcon className={cn(
                            "h-4 w-4 shrink-0",
                            task.priority === "URGENT" ? "text-rose-500" : "text-slate-400"
                          )} />
                          <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 leading-snug">
                            {task.title}
                          </p>
                        </div>
                        <p className="mt-1.5 ml-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                          {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: locale === "ar" ? ar : undefined })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-300 hover:text-rose-500 transition-all ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {completedTasks.length > 0 && (
                <div className="pt-2">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {t("completed_f")}
                  </p>
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task)}
                      className="group cursor-pointer rounded-xl border border-transparent bg-slate-50/30 dark:bg-slate-900/10 p-3.5 transition-all hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <ClipboardCheck className="h-3.5 w-3.5 text-slate-300" />
                          <p className="text-[12px] font-medium text-slate-400 line-through decoration-slate-300 truncate">
                            {task.title}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteTask(task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-300 hover:text-rose-500 transition-all ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/40 overflow-hidden">
            <CardHeader className="px-5 pb-3 pt-5 border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                  {locale === "ar" ? "النشاط الأخير" : "Recent Activity"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4">
              {recentActivity.map((activity) => {
                const ActivityIcon = activity.type?.includes("LAB") ? FlaskConical :
                  activity.type?.includes("PRESCRIPTION") ? FileText :
                    CheckCircle2;
                return (
                  <div key={activity.key} className="group flex items-start gap-4 p-3.5 rounded-xl border border-slate-50 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 shadow-none">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                      <ActivityIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
                        {activity.title}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {activity.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-none dark:bg-slate-900/40 overflow-hidden">
          <CardHeader className="px-5 pb-3.5 pt-5">
            <CardTitle className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
              {t("quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="grid grid-cols-2 gap-4 sm:gap-4">
              {[
                { label: t("newPatient"), icon: UserPlus, color: "blue", href: "/doctor/patients" },
                { label: t("addAppointment"), icon: CalendarPlus, color: "blue", href: "/doctor/schedule" },
                { label: t("writePrescription"), icon: FilePenLine, color: "blue", href: "/doctor/patients" },
                { label: t("manageSchedule"), icon: CalendarDays, color: "blue", href: "/doctor/schedule" },
              ].map((action, idx) => (
                <Link
                  key={idx}
                  href={action.href}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 p-6 transition-all hover:bg-slate-50 hover:shadow-sm dark:hover:bg-slate-900/50 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 transition-transform group-hover:scale-110">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/40 overflow-hidden">
          <CardHeader className="px-4 pb-3.5 pt-5 flex flex-row items-center justify-between">
            <CardTitle className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
              {t("customizeNotifications")}
            </CardTitle>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 px-4 text-[12px] font-bold text-white hover:bg-blue-700">
              {t("submit")}
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800/60 p-4 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="to : @"
                  className="w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
              <div className="relative">
                <textarea
                  placeholder={t("enterNotificationsHere")}
                  className="min-h-[140px] w-full resize-none rounded-xl border-none bg-transparent px-0 py-0 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none"
                />
                <button className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-transform hover:scale-105">
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-none dark:bg-slate-900">
          <form onSubmit={handleCreateTask}>
            <DialogHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <Plus className="h-5 w-5" />
                </div>
                <DialogTitle className="text-[18px] font-bold text-slate-800 dark:text-slate-100">
                  {t("addNewTask")}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {t("taskTitle")}
                </label>
                <Input
                  placeholder={locale === "ar" ? "مثلاً: الاتصال بالمريض" : "e.g. Follow up with patient"}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {t("priority")}
                </label>
                <Select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  options={[
                    { value: "LOW", label: t("low") },
                    { value: "NORMAL", label: t("normal") },
                    { value: "HIGH", label: t("high") },
                    { value: "URGENT", label: t("urgent") },
                  ]}
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateTaskOpen(false)}
                className="flex-1 rounded-xl font-bold"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingTask || !newTaskTitle.trim()}
                className="flex-1 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                {isSubmittingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
