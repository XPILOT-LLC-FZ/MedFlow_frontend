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
  Phone,
  FileText,
  ClipboardCheck,
  CheckSquare,
  Clock,
  FlaskConical,
  Calendar,
  Mic,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { labResultService } from "@/services/labResultService";
import { prescriptionService } from "@/services/prescriptionService";
import type { DashboardDoctorSummaryData, InAppNotification } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { NotificationsDialog } from "@/components/shared/NotificationsDialog";

interface DashboardActivity {
  key: string;
  title: string;
  subtitle: string;
  type: string;
}

interface DashboardTask {
  key: string;
  title: string;
  due?: string;
  tone: string;
  completed: boolean;
}

export default function DoctorDashboard() {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [dashboardData, setDashboardData] = React.useState<DashboardDoctorSummaryData | null>(null);
  const [realNotifications, setRealNotifications] = useState<InAppNotification[]>([]);
  const [realActivity, setRealActivity] = useState<DashboardActivity[]>([]);
  const [realTasks, setRealTasks] = useState<DashboardTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isChatLoading, setIsChatLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refreshDashboard = React.useCallback(async () => {
    try {
      setError(null);
      const [summary, notifications, recentAppts, abnormalLabs, drafts] = await Promise.all([
        dashboardService.getDoctorSummary({ period: "month" }),
        notificationsService.getInAppNotifications({ limit: 8 }),
        bookingService.getAll({ status: "COMPLETED", limit: 5 }),
        labResultService.getAll({ status: "ABNORMAL" }),
        prescriptionService.getAll({ status: "DRAFT" }),
      ]);

      setDashboardData(summary);
      setRealNotifications(notifications);
      
      // Map Activity
      setRealActivity(recentAppts.map(a => ({
        key: a.id,
        title: locale === "ar" ? `اكتمل: ${a.type}` : `Completed ${a.type.replace("_", " ")}`,
        subtitle: `${a.patientName} - ${formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}`,
        type: a.type
      })));

      // Map Tasks
      const tasks = [
        ...abnormalLabs.map(l => ({
          key: `lab-${l.id}`,
          title: locale === "ar" ? `مراجعة: ${l.testName}` : `Review ${l.testName}`,
          due: locale === "ar" ? "عاجل" : "Urgent",
          tone: "alert",
          completed: false
        })),
        ...drafts.map(p => ({
          key: `pre-${p.id}`,
          title: locale === "ar" ? `توقيع وصفة: ${p.patientId}` : `Sign prescription for ${p.id.slice(0, 5)}`,
          tone: "default",
          completed: false
        }))
      ];
      setRealTasks(tasks.length > 0 ? tasks : [
        { key: "records", title: locale === "ar" ? "تحديث السجلات الصباحية" : "Update medical records", tone: "default", completed: false }
      ]);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

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
  const todayAppointments = schedule?.today ?? [];
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
        title: n.title,
        body: n.body,
        time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
        unread: !n.readAt
      }))
    : [
      {
        key: "welcome",
        tone: "success",
        title: locale === "ar" ? "مرحباً دكتور" : "Welcome Doctor",
        body: locale === "ar" ? "لا توجد تنبيهات عاجلة اليوم" : "You have no urgent alerts today.",
      }
    ];
  const [taskState, setTaskState] = React.useState<Record<string, boolean>>({});

  const toggleTask = (key: string) => {
    setTaskState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const quickTasks = realTasks.map(t => ({
    ...t,
    completed: !!taskState[t.key]
  }));
  
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
                {locale === "ar" ? "إجمالي المرضى اليوم" : "Total Patients Today"}
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
                {locale === "ar" ? "قيد الانتظار حاليًا" : "Currently Waiting"}
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
                {locale === "ar" ? "مكتمل" : "Completed"}
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
                {locale === "ar" ? "الحالات العاجلة" : "Urgent Cases"}
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
                <div className="flex flex-col">
                  <CardTitle className="text-[16px] font-bold text-slate-800 dark:text-slate-100">
                    {t("todaySchedule")}
                  </CardTitle>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {locale === "ar"
                      ? `${currentDate} • ${summaryCards?.todayAppointments ?? 0} مواعيد`
                      : `${currentDate} • ${summaryCards?.todayAppointments ?? 0} appointments`}
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
                    {locale === "ar" ? "لا توجد مواعيد لهذا اليوم" : "No appointments scheduled for today"}
                  </p>
                </div>
              ) : (
                visibleAppointments.map((p, i) => {
                  const isNow = i === 1;
                  const isNext = i === 2;

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "group relative rounded-2xl border p-4 transition-all duration-300",
                        isNow
                          ? "border-blue-500 bg-white dark:bg-slate-900 ring-1 ring-blue-500/20"
                          : isNext
                            ? "border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/10"
                            : "border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Time Column */}
                        <div className="flex flex-col items-center justify-center pt-1 w-20 shrink-0">
                          <Clock3 className={cn("h-4 w-4 mb-1.5", isNow ? "text-blue-600" : "text-slate-400")} />
                          <span className={cn(
                            "text-[13px] font-bold tracking-tight",
                            isNow ? "text-blue-600" : "text-slate-500 dark:text-slate-400"
                          )}>
                            {p.time}
                          </span>
                          {isNow && (
                            <span className="mt-2 rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                              {locale === "ar" ? "الآن" : "NOW"}
                            </span>
                          )}
                        </div>

                        {/* Patient Info Column */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">
                                {p.patientName}
                              </h3>
                              <p className="mt-1 text-[12px] font-medium text-slate-400 dark:text-slate-500">
                                {`${Math.max(24, 30 + i * 7)} years • ${i % 2 === 0 ? "Female" : "Male"}`}
                              </p>
                            </div>
                            {isNext && (
                              <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {locale === "ar" ? "التالي" : "Up Next"}
                              </span>
                            )}
                          </div>

                          {/* Vitals */}
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-bold">
                            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              BP: <span className="text-slate-400 dark:text-slate-500">120/80</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              HR: <span className="text-slate-400 dark:text-slate-500">72 bpm</span>
                            </span>
                            {isNow && (
                              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="h-2 w-2 rounded-full bg-amber-400" />
                                Temp: <span className="text-slate-400 dark:text-slate-500">98.6°F</span>
                              </span>
                            )}
                          </div>

                          {/* Footer: Reason & Link */}
                          <div className="mt-4 pt-3 border-t border-slate-100/60 dark:border-slate-800/60 flex items-center justify-between">
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mr-4">
                              <span className="text-slate-500 dark:text-slate-400 font-bold mr-1">Reason:</span>
                              {p.type.replace("_", " ")}
                            </p>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleChatWithPatient(p.id)}
                                disabled={isChatLoading === p.id}
                                className={cn(
                                  "inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors",
                                  isChatLoading === p.id ? "text-slate-400" : "text-blue-600 hover:text-blue-700"
                                )}
                              >
                                <MessageSquare className="h-4 w-4" />
                                {locale === "ar" ? "دردشة" : "Chat"}
                              </button>
                              <Link
                                href="/doctor/schedule"
                                className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors border-l border-slate-100 dark:border-slate-800 pl-4"
                              >
                                {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </div>
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
                    {locale === "ar" ? "طابور المرضى" : "Patient Queue"}
                  </CardTitle>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {locale === "ar" ? "3 مرضى بانتظار المراجعة" : "3 patients waiting"}
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
                              {item.patientName}
                            </h4>
                            <p className="mt-0.5 text-[12px] font-medium text-slate-400 dark:text-slate-500">
                              {`${Math.max(24, 30 + i * 8)} years`}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {locale === "ar" ? "الوصول" : "Checked in"}: {`09:${(45 + i * 10).toString().padStart(2, "0")}`}
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
                                ? locale === "ar" ? "مراجعة قلب - طارئ" : "Chest Pain - Emergency"
                                : locale === "ar" ? "فحص دوري" : "Annual Physical"}
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
                              <span className="hidden sm:inline">{locale === "ar" ? "دردشة" : "Chat"}</span>
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
                  {locale === "ar" ? "عرض كل المرضى" : "View All Patients"}
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
                      {locale === "ar" ? "طابور المرضى" : "Patient Queue"}
                    </DialogTitle>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {locale === "ar" ? "٥ مرضى بانتظار المراجعة • إدارة ترتيب الاستشارات" : "5 patients waiting • Manage consultation order"}
                    </p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                {todayAppointments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    {locale === "ar" ? "لا يوجد مرضى في الطابور" : "No patients in queue"}
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
                                <h4 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">{p.patientName}</h4>
                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Patient ID: {p.id.slice(0, 8)}</p>
                              </div>
                              {isUrgent && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 text-[11px] font-bold text-rose-500">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  {locale === "ar" ? "طوارئ" : "Urgent"}
                                </span>
                              )}
                            </div>
    
                            <div className="mt-5 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Reason</p>
                                <p className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-200">{p.type.replace("_", " ")}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Appt Time</p>
                                <div className="mt-1 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                                  <p className="text-[13px] font-bold">{p.time}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Status</p>
                                <p className="mt-1 text-[13px] font-bold text-blue-600 uppercase">{p.status}</p>
                              </div>
                            </div>
    
                            <button 
                              onClick={() => handleChatWithPatient(p.id)}
                              className="mt-6 w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {locale === "ar" ? "بدء الدردشة" : "Start Chat"}
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
                  {locale === "ar" ? "متوسط وقت الانتظار: ١٥ دقيقة" : "Average wait time: 15 minutes"}
                </p>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[13px] font-bold text-slate-600 hover:bg-slate-50">
                    {locale === "ar" ? "إغلاق" : "Close"}
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
            locale={locale}
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
                  {locale === "ar" ? "الإشعارات" : "Notifications"}
                </CardTitle>
              </div>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {notificationItems.length}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {notificationItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start gap-4 p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <div className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      item.tone === "critical" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500" :
                        item.tone === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" :
                          "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                    )}>
                      {item.tone === "critical" ? <AlertCircle className="h-5 w-5" /> :
                        item.tone === "success" ? <CheckCircle2 className="h-5 w-5" /> :
                          <Users className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                        {item.body}
                      </p>
                      <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {locale === "ar" ? "منذ ٥ دقائق" : "5 min ago"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-50 dark:border-slate-800/50 text-center">
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {locale === "ar" ? "عرض كل الإشعارات" : "View All Notifications"}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/40 overflow-hidden">
            <CardHeader className="px-5 pb-3 pt-5 border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <CheckSquare className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                    {locale === "ar" ? "المهام السريعة" : "Quick Tasks"}
                  </CardTitle>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {locale === "ar" ? "٤ مهام معلقة" : "4 tasks pending"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {quickTasks
                .filter((task) => !task.completed)
                .map((task) => {
                  const TaskIcon = task.key === "call-sarah" ? Phone :
                    task.key === "sign-michael" ? FileText :
                      task.key === "review-emma" ? AlertCircle :
                        ClipboardCheck;
                  return (
                    <div
                      key={task.key}
                      onClick={() => toggleTask(task.key)}
                      className={cn(
                        "group cursor-pointer rounded-xl border p-3.5 transition-all shadow-none",
                        task.tone === "alert"
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
                              task.tone === "alert" ? "text-rose-500" : "text-slate-400"
                            )} />
                            <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 leading-snug">
                              {task.title}
                            </p>
                          </div>
                          {task.due && (
                            <p className="mt-1.5 ml-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                              {task.due}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              <div className="pt-2">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {locale === "ar" ? "مكتملة" : "Completed"}
                </p>
                {quickTasks
                  .filter((task) => task.completed)
                  .map((task) => (
                    <div
                      key={task.key}
                      onClick={() => toggleTask(task.key)}
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
                      </div>
                    </div>
                  ))}
              </div>
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
              {locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="grid grid-cols-2 gap-4 sm:gap-4">
              {[
                { label: locale === "ar" ? "مريض جديد" : "New Patient", icon: UserPlus, color: "blue", href: "/doctor/patients" },
                { label: locale === "ar" ? "إضافة موعد" : "Add Appointment", icon: CalendarPlus, color: "blue", href: "/doctor/schedule" },
                { label: locale === "ar" ? "كتابة وصفة" : "Write Prescription", icon: FilePenLine, color: "blue", href: "/doctor/patients" },
                { label: locale === "ar" ? "إدارة الجدول" : "Manage Schedule", icon: CalendarDays, color: "blue", href: "/doctor/schedule" },
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
              {locale === "ar" ? "تخصيص الإشعارات" : "Customize notifications"}
            </CardTitle>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 px-4 text-[12px] font-bold text-white hover:bg-blue-700">
              {locale === "ar" ? "إرسال" : "send"}
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
                  placeholder={locale === "ar" ? "أدخل إشعاراتك هنا..." : "Enter your notifications..."}
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
    </div>
  );
}
