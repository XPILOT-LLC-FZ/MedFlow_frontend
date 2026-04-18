"use client";

import React, { useEffect } from "react";
import {
  Users,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  UserPlus,
  CalendarPlus,
  FilePenLine,
  CalendarClock,
  SendHorizontal,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import type { DashboardDoctorSummaryData } from "@/types";
import { useBookingStore } from "@/stores/useBookingStore";
import Link from "next/link";

export default function DoctorDashboard() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [dashboardData, setDashboardData] = React.useState<DashboardDoctorSummaryData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isChatLoading, setIsChatLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refreshDashboard = React.useCallback(async () => {
    try {
      setError(null);
      const summary = await dashboardService.getDoctorSummary({ period: "month" });
      setDashboardData(summary);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load doctor dashboard summary";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  const { appointments } = useBookingStore();

  const dynamicNotifications = appointments
    .filter(a => a.status === "scheduled" || a.status === "in-progress")
    .slice(0, 3)
    .map(a => ({
      key: `appt-${a.id}`,
      tone: a.status === "in-progress" ? "critical" : "info",
      title: locale === "ar"
        ? (a.status === "in-progress" ? "جلسة قيد التنفيذ" : "موعد مخطط")
        : (a.status === "in-progress" ? "Session In Progress" : "Planned Appointment"),
      body: locale === "ar"
        ? `${a.patientName} - الساعة ${a.time}`
        : `${a.patientName} scheduled at ${a.time}`,
    }));

  const notificationItems = dynamicNotifications.length > 0
    ? dynamicNotifications
    : [
      {
        key: "welcome",
        tone: "success",
        title: locale === "ar" ? "مرحباً دكتور" : "Welcome Doctor",
        body: locale === "ar" ? "لا توجد تنبيهات عاجلة اليوم" : "You have no urgent alerts today.",
      }
    ];
  const [taskState, setTaskState] = React.useState<Record<string, boolean>>({
    "call-sarah": false,
    "sign-michael": false,
    "review-emma": false,
    "records": false,
    "afternoon": true,
  });

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

  const quickTasks = [
    {
      key: "call-sarah",
      title: locale === "ar" ? "الاتصال بصاحبة الموعد" : "Call pharmacy for Sarah Johnson's refill",
      due: locale === "ar" ? "الاستحقاق: 10:30 ص" : "Due: 10:30 AM",
      tone: "default",
      completed: taskState["call-sarah"],
    },
    {
      key: "sign-michael",
      title: locale === "ar" ? "توقيع وصفة مايكل" : "Sign prescription for Michael Chen",
      tone: "default",
      completed: taskState["sign-michael"],
    },
    {
      key: "review-emma",
      title: locale === "ar" ? "مراجعة نتائج إيما العاجلة" : "Review urgent lab results for Emma Williams",
      due: locale === "ar" ? "الاستحقاق: 11:00 ص" : "Due: 11:00 AM",
      tone: "alert",
      completed: taskState["review-emma"],
    },
    {
      key: "records",
      title: locale === "ar" ? "تحديث السجلات الصباحية" : "Update medical records for morning patients",
      tone: "default",
      completed: taskState["records"],
    },
    {
      key: "afternoon",
      title: locale === "ar" ? "تأكيد مواعيد العصر" : "Confirm afternoon appointments",
      tone: "success",
      completed: taskState["afternoon"],
    },
  ];
  const recentActivity = [
    {
      key: "routine",
      title: locale === "ar" ? "فحص روتيني مكتمل" : "Completed routine checkup",
      subtitle: locale === "ar" ? "سارة جونسون - منذ 5 دقائق" : "Sarah Johnson - 5 min ago",
    },
    {
      key: "prescription",
      title: locale === "ar" ? "تم وصف ليزينوبريل" : "Prescribed Lisinopril",
      subtitle: locale === "ar" ? "مايكل تشين - منذ 20 دقيقة" : "Michael Chen - 20 min ago",
    },
    {
      key: "blood",
      title: locale === "ar" ? "أمر بتحليل دم" : "Ordered Complete Blood Count",
      subtitle: locale === "ar" ? "إيما ويليامز - منذ 35 دقيقة" : "Emma Williams - 35 min ago",
    },
    {
      key: "follow",
      title: locale === "ar" ? "تمت جدولة متابعة" : "Scheduled follow-up for Apr 18",
      subtitle: locale === "ar" ? "جيمس براون - منذ ساعة" : "James Brown - 1 hour ago",
    },
  ];

  return (
    <div className="doctor-dashboard space-y-5 lg:space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{locale === "ar" ? "إجمالي المرضى اليوم" : "Total Patients Today"}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{isLoading ? "..." : (summaryCards?.totalPatients ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-500">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{locale === "ar" ? "قيد الانتظار حاليًا" : "Currently Waiting"}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{isLoading ? "..." : waitingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{locale === "ar" ? "مكتمل" : "Completed"}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{isLoading ? "..." : completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-500">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{locale === "ar" ? "الحالات العاجلة" : "Urgent Cases"}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{isLoading ? "..." : urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Today's schedule */}
        <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800">
                <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                {t("todaySchedule")}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {locale === "ar"
                  ? `${currentDate} • ${summaryCards?.todayAppointments ?? 0} مواعيد`
                  : `${currentDate} • ${summaryCards?.todayAppointments ?? 0} appointments`}
              </p>
            </div>
            <Link href="/doctor/schedule">
              <Button variant="ghost" size="sm" className="h-auto px-1 py-1 text-[11px] font-medium text-blue-600 hover:bg-transparent hover:text-blue-700">
                {t("viewAll")}
              </Button>
            </Link>
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardContent className="p-2 sm:p-2.5">
              {visibleAppointments.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد مواعيد لهذا اليوم" : "No appointments scheduled for today"}
                </p>
              ) : (
                visibleAppointments.map((p, i) => (
                  <div
                    key={i}
                    className={`mb-2.5 rounded-xl border p-3.5 last:mb-0 ${i === 1
                      ? "border-blue-500 bg-white shadow-[0_0_0_2px_rgba(59,130,246,0.10)]"
                      : i === 2
                        ? "border-blue-200 bg-sky-50/40"
                        : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex w-[58px] shrink-0 flex-col items-center pt-0.5">
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="mt-1 text-[10px] font-medium text-slate-400">{p.time}</span>
                          {i === 1 && (
                            <span className="mt-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                              {locale === "ar" ? "الآن" : "NOW"}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{p.patientName}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {`${Math.max(24, 30 + i * 7)} years • ${i % 2 === 0 ? "Female" : "Male"}`}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              BP: {120 + i * 3}/{80 - i}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              HR: {72 + i * 3} bpm
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              Temp: {`${(98 + i * 0.2).toFixed(1)}°F`}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {locale === "ar" ? "السبب:" : "Reason:"} {p.type.replace("_", " ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
                        {i === 2 ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            {locale === "ar" ? "التالي" : "Up Next"}
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() => handleChatWithPatient(p.id)}
                          disabled={isChatLoading === p.id}
                          className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${isChatLoading === p.id ? "text-slate-400" : "text-blue-600 hover:text-blue-700"}`}
                        >
                          <MessageSquare className="h-3 w-3" />
                          {locale === "ar" ? "دردشة" : "Chat"}
                        </button>
                      </div>
                      <Link href="/doctor/schedule" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700">
                        {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>)))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader className="px-4 pb-2 pt-4">
              <CardTitle className="text-[15px] font-semibold text-slate-800">
                {locale === "ar" ? "طابور المرضى" : "Patient Queue"}
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                {locale === "ar" ? "3 مرضى بانتظار المراجعة" : "3 patients waiting"}
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5 px-4 pb-4">
              {visibleAppointments.slice(0, 3).map((item, i) => (
                <div
                  key={`queue:${item.id}`}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${i === 1 ? "border-rose-100 bg-rose-50/40" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-600">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium leading-4 text-slate-800">{item.patientName}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{`${Math.max(24, 30 + i * 8)} years`}</p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {i === 1
                          ? locale === "ar"
                            ? "مراجعة قلب - طارئ"
                            : "Chest Pain - Emergency"
                          : locale === "ar"
                            ? "فحص دوري"
                            : "Annual Physical"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-400">
                      {locale === "ar" ? "الوصول" : "Checked in"} {`09:${(45 + i * 10).toString().padStart(2, "0")}`}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleChatWithPatient(item.id)}
                      disabled={isChatLoading === item.id}
                      className={`grid h-5 w-5 place-items-center rounded-md transition-colors ${isChatLoading === item.id ? "bg-slate-200 text-slate-400" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}
                      aria-label="Chat with patient"
                    >
                      <MessageSquare className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="grid h-5 w-5 place-items-center rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      aria-label="Open patient"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-1 text-center">
                <Link href="/doctor/schedule" className="text-[11px] font-medium text-blue-600 hover:text-blue-700">
                  {locale === "ar" ? "عرض كل المرضى" : "View All Patients"}
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader className="px-4 pb-2.5 pt-4">
              <CardTitle className="flex items-center justify-between text-[14px] font-semibold text-slate-800">
                <span>{locale === "ar" ? "الإشعارات" : "Notifications"}</span>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
                  {notificationItems.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {notificationItems.map((item) => (
                <div
                  key={item.key}
                  className={`rounded-lg border p-2.5 ${item.tone === "critical"
                    ? "border-rose-100 bg-rose-50/60"
                    : item.tone === "success"
                      ? "border-emerald-100 bg-emerald-50/60"
                      : "border-blue-100 bg-blue-50/60"}`}
                >
                  <div className="flex gap-2">
                    <div
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded-[4px] ${item.tone === "critical"
                        ? "bg-rose-200"
                        : item.tone === "success"
                          ? "bg-emerald-200"
                          : "bg-blue-200"}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-700">{item.title}</p>
                      <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-1 text-center">
                <Link href="/doctor/notifications" className="text-[11px] font-medium text-blue-600 hover:text-blue-700">
                  {locale === "ar" ? "عرض كل الإشعارات" : "View All Notifications"}
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader className="px-4 pb-2 pt-4">
              <CardTitle className="text-[14px] font-semibold text-slate-800">
                {locale === "ar" ? "المهام السريعة" : "Quick Tasks"}
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                {locale === "ar" ? "4 مهام معلقة" : "4 tasks pending"}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {quickTasks
                .filter((task) => !task.completed)
                .map((task) => (
                  <div
                    key={task.key}
                    onClick={() => toggleTask(task.key)}
                    className={`group cursor-pointer rounded-lg border p-2.5 transition-all hover:bg-slate-100 ${task.tone === "alert" ? "border-rose-100 bg-rose-50/50" : "border-slate-200 bg-slate-50/60"}`}
                  >
                    <div className="flex gap-2">
                      <div className="mt-0.5 h-3.5 w-3.5 rounded-[3px] border border-slate-300 bg-white group-hover:border-blue-500" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-700">{task.title}</p>
                        {task.due && <p className="mt-0.5 text-[10px] text-slate-500">{task.due}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              <div className="pt-1">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {locale === "ar" ? "مكتملة" : "Completed"}
                </p>
                {quickTasks
                  .filter((task) => task.completed)
                  .map((task) => (
                    <div
                      key={task.key}
                      onClick={() => toggleTask(task.key)}
                      className="group cursor-pointer rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5 transition-all hover:bg-emerald-50"
                    >
                      <div className="flex gap-2">
                        <div className="mt-0.5 grid h-3.5 w-3.5 place-items-center rounded-[3px] border border-emerald-300 bg-emerald-100">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 line-through decoration-slate-300">{task.title}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader className="px-4 pb-2 pt-4">
              <CardTitle className="text-[15px] font-semibold text-slate-800">
                {locale === "ar" ? "النشاط الأخير" : "Recent Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {recentActivity.map((activity) => (
                <div key={activity.key} className="rounded-lg border border-slate-200 bg-slate-50/40 px-2.5 py-2">
                  <div className="flex gap-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-blue-100" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-700">{activity.title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{activity.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-none">
          <CardHeader className="px-4 pb-2 pt-4">
            <CardTitle className="text-[15px] font-semibold text-slate-800">
              {locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: "patient", label: locale === "ar" ? "مريض جديد" : "New Patient", icon: UserPlus, href: "/doctor/patients" },
                { key: "appointment", label: locale === "ar" ? "إضافة موعد" : "Add Appointment", icon: CalendarPlus, href: "/doctor/schedule" },
                { key: "prescription", label: locale === "ar" ? "كتابة وصفة" : "Write Prescription", icon: FilePenLine, href: "/doctor/patients" },
                { key: "schedule", label: locale === "ar" ? "إدارة الجدول" : "Manage Schedule", icon: CalendarClock, href: "/doctor/schedule" },
              ].map((action) => (
                <Link
                  key={action.key}
                  href={action.href}
                  className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 transition hover:bg-slate-100 hover:border-blue-200 hover:text-blue-600 active:scale-95"
                >
                  <action.icon className="h-4 w-4 text-blue-600" />
                  <span className="text-[11px] font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardHeader className="px-4 pb-2 pt-4">
            <CardTitle className="flex items-center justify-between text-[15px] font-semibold text-slate-800">
              <span>{locale === "ar" ? "تخصيص الإشعارات" : "Customize notifications"}</span>
              <button
                type="button"
                className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-blue-700"
              >
                {locale === "ar" ? "إرسال" : "Send"}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 px-4 pb-4">
            <input
              type="text"
              placeholder={locale === "ar" ? "إلى:" : "to:"}
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <textarea
              placeholder={locale === "ar" ? "اكتب إشعارك..." : "Enter your notifications..."}
              className="min-h-[68px] w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <div className="flex justify-end">
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Send notification"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
