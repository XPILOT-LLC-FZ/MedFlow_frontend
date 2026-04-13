"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import { treatmentPlanService } from "@/services/treatmentPlanService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiTreatmentPlan, DashboardDoctorSummaryData } from "@/types";

function statusBadgeVariant(status: ApiTreatmentPlan["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "ACTIVE") return "info" as const;
  return "warning" as const;
}

export default function DoctorAnalyticsPage() {
  const { locale } = useTranslation();
  const toast = useToastStore();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [summary, setSummary] = useState<DashboardDoctorSummaryData | null>(null);
  const [plans, setPlans] = useState<ApiTreatmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnalytics = useCallback(
    async (targetDoctorId: string, refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const [doctorSummary, doctorPlans] = await Promise.all([
          dashboardService.getDoctorSummary({ period: "month" }),
          treatmentPlanService.getAll({ doctorId: targetDoctorId }),
        ]);

        setSummary(doctorSummary);
        setPlans(doctorPlans);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : locale === "ar"
              ? "فشل تحميل تحليلات الطبيب"
              : "Failed to load doctor analytics";
        toast.error(message);
      } finally {
        if (refresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [locale, toast],
  );

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await fetchDoctors();

        const doctors = useStaffStore.getState().doctors;
        const currentDoctor = doctors.find(
          (doctor) =>
            doctor.userId === user?.id ||
            doctor.id === user?.id ||
            doctor.email?.toLowerCase() === user?.email?.toLowerCase(),
        );

        if (!currentDoctor) {
          toast.error(
            locale === "ar"
              ? "لا يوجد ملف طبيب مرتبط بالحساب الحالي"
              : "No doctor profile linked to current account",
          );
          setIsLoading(false);
          return;
        }

        setDoctorId(currentDoctor.id);
        setDoctorName(currentDoctor.fullName);
        await loadAnalytics(currentDoctor.id);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : locale === "ar"
              ? "فشل تهيئة صفحة التحليلات"
              : "Failed to initialize analytics page";
        toast.error(message);
        setIsLoading(false);
      }
    };

    void initialize();
  }, [fetchDoctors, loadAnalytics, locale, toast, user?.email, user?.id]);

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === "ACTIVE").length,
    [plans],
  );

  const completedPlans = useMemo(
    () => plans.filter((plan) => plan.status === "COMPLETED").length,
    [plans],
  );

  const computedProgressRate = useMemo(() => {
    const totalSessions = plans.reduce(
      (acc, plan) => acc + Math.max(1, plan.totalSessions),
      0,
    );

    if (!totalSessions) return 0;

    const completedSessions = plans.reduce(
      (acc, plan) => acc + Math.max(0, plan.completedSessions),
      0,
    );

    return Math.round((completedSessions / totalSessions) * 100);
  }, [plans]);

  const progressRate = summary?.summaryCards.completionRate ?? computedProgressRate;
  const todayAppointments = summary?.summaryCards.todayAppointments ?? 0;
  const waitMinutes = summary?.summaryCards.averageWaitMinutes;
  const satisfaction = summary?.summaryCards.satisfaction;
  const weeklyPatients = summary?.charts.weeklyPatients ?? [];
  const maxWeeklyPatients = Math.max(
    1,
    ...weeklyPatients.map((entry) => entry.patients),
  );

  const recentPlans = useMemo(
    () =>
      [...plans]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, 6),
    [plans],
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title={locale === "ar" ? "التحليلات" : "Analytics"}
        description={
          locale === "ar"
            ? `مؤشرات أداء الطبيب${doctorName ? ` - ${doctorName}` : ""}`
            : `Doctor performance insights${doctorName ? ` - ${doctorName}` : ""}`
        }
        action={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => doctorId && void loadAnalytics(doctorId, true)}
            disabled={!doctorId || isLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "مواعيد اليوم" : "Today Appointments"}</p>
            <div className="mt-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <p className="text-2xl font-semibold">{isLoading ? "..." : todayAppointments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "خطط نشطة" : "Active Plans"}</p>
            <div className="mt-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-2xl font-semibold">{isLoading ? "..." : activePlans}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "نسبة الإنجاز" : "Completion Rate"}</p>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-2xl font-semibold">{isLoading ? "..." : `${progressRate}%`}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "متوسط الانتظار" : "Average Wait"}</p>
            <div className="mt-2 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <p className="text-2xl font-semibold">
                {isLoading ? "..." : waitMinutes === null || waitMinutes === undefined ? "-" : `${waitMinutes}m`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {locale === "ar" ? "اتجاه المرضى خلال الأسبوع" : "Weekly Patient Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "لا توجد بيانات كافية حتى الآن" : "Not enough data yet"}
              </p>
            ) : (
              weeklyPatients.map((entry) => {
                const width = Math.max(6, Math.round((entry.patients / maxWeeklyPatients) * 100));
                return (
                  <div key={entry.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{entry.name}</span>
                      <span className="text-muted-foreground">{entry.patients}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {locale === "ar" ? "ملخص الخطط" : "Plan Snapshot"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{locale === "ar" ? "إجمالي الخطط" : "Total Plans"}</span>
              <span className="font-semibold">{plans.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{locale === "ar" ? "مكتملة" : "Completed"}</span>
              <span className="font-semibold">{completedPlans}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{locale === "ar" ? "نشطة" : "Active"}</span>
              <span className="font-semibold">{activePlans}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{locale === "ar" ? "رضا المرضى" : "Satisfaction"}</span>
              <span className="font-semibold">
                {satisfaction === null || satisfaction === undefined ? "-" : `${satisfaction}%`}
              </span>
            </div>
            <Link href="/doctor/treatment-timelines" className="block pt-2">
              <Button className="w-full" size="sm">
                {locale === "ar" ? "إدارة الخطط العلاجية" : "Manage Treatment Timelines"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between gap-3">
            <span>{locale === "ar" ? "آخر تحديثات الخطط" : "Recent Plan Updates"}</span>
            <Badge variant="outline">
              {locale === "ar" ? `مكتمل ${completedPlans}/${plans.length}` : `Completed ${completedPlans}/${plans.length}`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          ) : recentPlans.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "لا توجد خطط علاجية حتى الآن" : "No treatment plans yet"}
              </p>
              <Link href="/doctor/treatment-timelines">
                <Button size="sm" variant="outline" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {locale === "ar" ? "إنشاء خطة جديدة" : "Create New Plan"}
                </Button>
              </Link>
            </div>
          ) : (
            recentPlans.map((plan) => {
              const progress = Math.min(
                100,
                Math.round((plan.completedSessions / Math.max(1, plan.totalSessions)) * 100),
              );

              return (
                <div key={plan.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{plan.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.patientName}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(plan.status)}>{plan.status}</Badge>
                  </div>

                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{locale === "ar" ? "التقدم" : "Progress"}: {progress}%</span>
                    <span>{plan.completedSessions}/{plan.totalSessions}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
