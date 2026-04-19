"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarCheck2, Clock3, PlayCircle, Plus, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import type {
  DashboardAppointmentStatus,
  DashboardStaffSummaryData,
} from "@/types";

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
};

export default function ReceptionDashboard() {
  const { locale } = useTranslation();
  const [dashboardData, setDashboardData] = React.useState<DashboardStaffSummaryData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshDashboard = React.useCallback(async () => {
    try {
      setError(null);
      const summary = await dashboardService.getStaffSummary({ period: "day" });
      setDashboardData(summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load reception dashboard";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();

    const interval = setInterval(() => {
      void refreshDashboard();
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  const summaryCards = dashboardData?.summaryCards;
  const upcoming = useMemo(() => {
    const queue = dashboardData?.queue.upcoming ?? [];
    return [...queue].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  }, [dashboardData?.queue.upcoming]);
  const nextAppointment = dashboardData?.queue.nextAppointment ?? null;

  const statusVariant = (status: DashboardAppointmentStatus) => {
    if (status === "CONFIRMED") return "success" as const;
    if (status === "SCHEDULED") return "info" as const;
    if (status === "IN_PROGRESS") return "warning" as const;
    if (status === "COMPLETED") return "secondary" as const;
    if (status === "NO_SHOW" || status === "CANCELLED") return "destructive" as const;
    return "secondary" as const;
  };

  const statusLabel = (status: DashboardAppointmentStatus) => {
    if (locale === "ar") {
      const labels: Record<DashboardAppointmentStatus, string> = {
        SCHEDULED: "مجدول",
        CONFIRMED: "مؤكد",
        IN_PROGRESS: "جارٍ التنفيذ",
        COMPLETED: "مكتمل",
        CANCELLED: "ملغي",
        NO_SHOW: "لم يحضر",
        RESCHEDULED: "أعيد الجدولة",
      };
      return labels[status];
    }
    return status.replace("_", " ").toLowerCase();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "لوحة الاستقبال" : "Reception Operations Dashboard"}
        description={
          locale === "ar"
            ? "متابعة مواعيد اليوم وتدفق الاستقبال"
            : "Track today appointments and front-desk operations"
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void refreshDashboard()}
            >
              <RefreshCw className="h-4 w-4" />
              {locale === "ar" ? "تحديث" : "Refresh"}
            </Button>
            <Link href="/reception/booking">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {locale === "ar" ? "حجز جديد" : "New Booking"}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={locale === "ar" ? "إجمالي مواعيد اليوم" : "Total Today"}
          value={isLoading ? "..." : (summaryCards?.totalToday ?? 0)}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          delay={0}
        />
        <StatsCard
          title={locale === "ar" ? "قيد الانتظار" : "Scheduled / Confirmed"}
          value={isLoading ? "..." : (summaryCards?.scheduledConfirmed ?? 0)}
          icon={<Clock3 className="h-5 w-5" />}
          delay={0.1}
        />
        <StatsCard
          title={locale === "ar" ? "جارٍ التنفيذ" : "In Progress"}
          value={isLoading ? "..." : (summaryCards?.inProgress ?? 0)}
          icon={<PlayCircle className="h-5 w-5" />}
          delay={0.2}
        />
        <StatsCard
          title={locale === "ar" ? "مكتمل" : "Completed"}
          value={isLoading ? "..." : (summaryCards?.completed ?? 0)}
          icon={<UserRound className="h-5 w-5" />}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {locale === "ar" ? "قائمة المواعيد القادمة" : "Upcoming Queue"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "جارٍ تحميل المواعيد..." : "Loading appointments..."}
                </p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد مواعيد قادمة اليوم" : "No upcoming appointments for today"}
                </p>
              ) : (
                upcoming.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{appointment.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.doctorName} • {appointment.time}
                      </p>
                    </div>
                    <Badge
                      variant={statusVariant(appointment.status)}
                    >
                      {statusLabel(appointment.status)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{locale === "ar" ? "إجراء سريع" : "Quick Actions"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/reception/booking" className="block">
                  <Button className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    {locale === "ar" ? "إنشاء حجز" : "Create Booking"}
                  </Button>
                </Link>

                <Link href="/reception/profile" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <UserRound className="h-4 w-4" />
                    {locale === "ar" ? "تحديث الملف الشخصي" : "Update Profile"}
                  </Button>
                </Link>

                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {locale === "ar" ? "الموعد التالي" : "Next Appointment"}
                  </p>
                  {nextAppointment ? (
                    <>
                      <p className="font-medium mt-1">{nextAppointment.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {nextAppointment.doctorName} • {nextAppointment.time}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === "ar" ? "لا يوجد" : "None"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/10 shadow-sm">
              <CardHeader className="bg-primary/5 py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {locale === "ar" ? "حالة الأطباء وتوفرهم" : "Doctor Status & Availability"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[320px] overflow-y-auto custom-scrollbar">
                  {(dashboardData?.doctorsStatus ?? []).length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      {locale === "ar" ? "لا يوجد أطباء متاحون" : "No doctors available"}
                    </div>
                  ) : (
                    (dashboardData?.doctorsStatus ?? []).map((dr) => (
                      <div key={dr.doctorId} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Image
                              src={dr.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${dr.fullName}`}
                              alt={dr.fullName}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full border border-primary/10"
                              unoptimized
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                              dr.isAvailable ? "bg-emerald-500" : "bg-slate-300"
                            }`} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold leading-none">{dr.fullName}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{dr.specialization}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={dr.isAvailable ? "success" : "secondary"} 
                          className="px-1.5 h-5 text-[9px] uppercase tracking-wider"
                        >
                          {locale === "ar" 
                            ? (dr.isAvailable ? "متاح" : "غير متاح") 
                            : (dr.isAvailable ? "Available" : "Unavailable")
                          }
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 bg-muted/20 border-t">
                  <p className="text-[10px] text-muted-foreground text-center">
                    {locale === "ar"
                      ? "يتم تحديث الحالة في الوقت الفعلي"
                      : "Status updates in real-time."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
