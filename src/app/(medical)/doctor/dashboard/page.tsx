"use client";

import React, { useEffect } from "react";
import { Calendar, Users, Clock, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/shared/StatsCard";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { ChartCard } from "@/components/shared/ChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { dashboardService } from "@/services/dashboardService";
import type { DashboardAppointmentStatus, DashboardDoctorSummaryData } from "@/types";
import Link from "next/link";

export default function DoctorDashboard() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = React.useState<DashboardDoctorSummaryData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const summary = await dashboardService.getDoctorSummary({ period: "month" });
        setDashboardData(summary);
      } catch (error) {
        console.error("Failed to load doctor dashboard summary", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const displayName = user
    ? locale === "ar" ? user.nameAr : user.name
    : "Doctor";

  const summaryCards = dashboardData?.summaryCards;
  const schedule = dashboardData?.schedule;
  const visibleAppointments = (schedule?.today ?? []).slice(0, 4);
  const highlightDates = schedule?.highlightDates ?? [];
  const weeklyData = dashboardData?.charts.weeklyPatients ?? [];

  const statusVariant = (status: DashboardAppointmentStatus) => {
    if (status === "COMPLETED" || status === "CONFIRMED") return "success" as const;
    if (status === "IN_PROGRESS") return "warning" as const;
    if (status === "CANCELLED" || status === "NO_SHOW") return "destructive" as const;
    return "info" as const;
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
        title={`${locale === "ar" ? "مرحبًا" : "Good morning"}, ${displayName}`}
        description={locale === "ar" ? "إليك جدولك لهذا اليوم" : "Here's your schedule for today"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("todayAppointments")} value={isLoading ? "..." : (summaryCards?.todayAppointments ?? 0)} icon={<Calendar className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("totalPatients")} value={isLoading ? "..." : (summaryCards?.totalPatients ?? 0)} change={summaryCards?.completionRate} icon={<Users className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "وقت الانتظار" : "Avg. Wait Time"} value={isLoading ? "..." : summaryCards?.averageWaitMinutes === null || summaryCards?.averageWaitMinutes === undefined ? "--" : `${summaryCards.averageWaitMinutes} min`} icon={<Clock className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={locale === "ar" ? "رضا المرضى" : "Satisfaction"} value={isLoading ? "..." : summaryCards?.satisfaction === null || summaryCards?.satisfaction === undefined ? "--" : `${summaryCards.satisfaction}/5`} icon={<Activity className="h-5 w-5" />} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("todaySchedule")}</h2>
            <Link href="/doctor/appointments">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">{t("viewAll")} <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              {visibleAppointments.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.patientName}</p>
                      <p className="text-xs text-muted-foreground">{p.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{p.time}</span>
                    <Badge variant={statusVariant(p.status)} className="text-xs">
                      {statusLabel(p.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <ChartCard title={locale === "ar" ? "المرضى هذا الأسبوع" : "Patients This Week"} type="bar" data={weeklyData} dataKey="patients" delay={0.3} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MiniCalendar locale={locale} highlightDates={highlightDates} />

          {/* Treatment Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("treatmentTimeline")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleAppointments.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${item.status === "COMPLETED" || item.status === "CONFIRMED" ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                    {i < visibleAppointments.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    <p className="text-sm font-medium">{item.patientName}</p>
                    <p className="text-xs text-muted-foreground">{item.type.replace("_", " ")}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
