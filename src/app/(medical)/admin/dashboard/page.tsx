"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronRight,
  DollarSign,
  Package,
  Shield,
  Star,
  Stethoscope,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsCard } from "@/components/shared/StatsCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import type { DashboardAdminSummaryData } from "@/types";

function StatusBadge({ status, locale }: { status: "ACTIVE" | "ON_LEAVE" | "INACTIVE"; locale: string }) {
  const v = status === "ACTIVE" ? "success" : status === "ON_LEAVE" ? "warning" : "secondary";
  const label =
    status === "ACTIVE"
      ? locale === "ar" ? "نشط" : "Active"
      : status === "ON_LEAVE"
      ? locale === "ar" ? "إجازة" : "On Leave"
      : locale === "ar" ? "غير نشط" : "Inactive";
  return <Badge variant={v} className="text-xs">{label}</Badge>;
}

function StockBadge({ status, locale }: { status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRED"; locale: string }) {
  if (status === "LOW_STOCK") {
    return <Badge variant="warning" className="text-xs">{locale === "ar" ? "مخزون منخفض" : "Low Stock"}</Badge>;
  }
  if (status === "OUT_OF_STOCK") {
    return <Badge variant="destructive" className="text-xs">{locale === "ar" ? "نفاد" : "Out"}</Badge>;
  }
  if (status === "EXPIRED") {
    return <Badge variant="secondary" className="text-xs">{locale === "ar" ? "منتهي" : "Expired"}</Badge>;
  }
  return <Badge variant="success" className="text-xs">{locale === "ar" ? "متاح" : "In Stock"}</Badge>;
}

function formatConfiguredDays(days: number[], locale: string): string {
  if (days.length === 0) {
    return locale === "ar" ? "لا يوجد جدول" : "No schedule";
  }

  const labelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labelsAr = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  const labels = locale === "ar" ? labelsAr : labelsEn;
  return days.map((day) => labels[day] ?? "-").join(" • ");
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function MedicalAdminDashboard() {
  const { t, locale } = useTranslation();
  const [dashboardData, setDashboardData] = React.useState<DashboardAdminSummaryData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const summary = await dashboardService.getAdminSummary({
          period: "month",
          topDoctorsLimit: 7,
        });
        setDashboardData(summary);
      } catch (error) {
        console.error("Failed to load admin dashboard summary", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const summaryCards = dashboardData?.summaryCards;
  const revenueData = dashboardData?.charts.monthlyRevenue ?? [];
  const appointmentsData = dashboardData?.charts.weeklyAppointments ?? [];
  const topDoctors = dashboardData?.topDoctors ?? [];
  const lowStockCount = summaryCards?.lowStockAlerts ?? 0;

  const inventoryData = dashboardData?.inventory;
  const serviceData = dashboardData?.services;
  const availabilityData = dashboardData?.staffAvailability;
  const performanceData = dashboardData?.staffPerformance;

  const availabilitySummary = availabilityData?.summaryCards;
  const performanceSummary = performanceData?.summaryCards;

  const coveragePercent =
    availabilitySummary && availabilitySummary.totalDoctors > 0
      ? Math.round((availabilitySummary.configuredShifts / availabilitySummary.totalDoctors) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "لوحة تحكم الإدارة الطبية" : "Medical Admin Dashboard"}
        description={locale === "ar" ? "نظرة عامة على عمليات العيادة وإدارة الموظفين" : "Clinic operations overview & staff management"}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("totalAppointments")} value={isLoading ? "..." : (summaryCards?.totalAppointments ?? 0)} icon={<Calendar className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("totalDoctors")} value={isLoading ? "..." : (summaryCards?.totalDoctors ?? 0)} icon={<Stethoscope className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "موظفو الاستقبال" : "Reception Staff"} value={isLoading ? "..." : (summaryCards?.totalStaff ?? 0)} icon={<UserCog className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={t("totalRevenue")} value={isLoading ? "..." : formatCurrency(summaryCards?.totalRevenue ?? 0)} change={lowStockCount > 0 ? -lowStockCount : undefined} icon={<DollarSign className="h-5 w-5" />} delay={0.3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={locale === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"} type="area" data={revenueData} dataKey="revenue" delay={0.2} />
        <ChartCard title={locale === "ar" ? "المواعيد الأسبوعية" : "Weekly Appointments"} type="bar" data={appointmentsData} dataKey="count" delay={0.3} />
      </div>

      {/* Inventory & Services */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-primary" />
                  {locale === "ar" ? "نظرة عامة على المخزون" : "Inventory Overview"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === "ar" ? "العناصر منخفضة المخزون وتوصيات إعادة الطلب" : "Low stock alerts and restock advisor suggestions"}
                </CardDescription>
              </div>
              <Link href="/admin/inventory">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  {locale === "ar" ? "إدارة المخزون" : "Manage Inventory"} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "إجمالي العناصر" : "Total Items"}</p>
                  <p className="text-lg font-semibold">{inventoryData?.summaryCards.totalItems ?? 0}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "منخفض" : "Low"}</p>
                  <p className="text-lg font-semibold text-amber-600">{inventoryData?.summaryCards.lowStock ?? 0}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "نفاد" : "Out"}</p>
                  <p className="text-lg font-semibold text-red-600">{inventoryData?.summaryCards.outOfStock ?? 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{locale === "ar" ? "أولوية إعادة الطلب" : "Restock Priority"}</p>
                {(inventoryData?.itemsNeedingRestock ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    {locale === "ar" ? "لا توجد عناصر بحاجة إلى إعادة طلب" : "No items currently need restocking"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(inventoryData?.itemsNeedingRestock ?? []).slice(0, 5).map((item) => (
                      <div key={item.itemId} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{item.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            {locale === "ar" ? "الحالي" : "Current"}: {item.quantity} • {locale === "ar" ? "الحد الأدنى" : "Min"}: {item.minQuantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StockBadge status={item.status} locale={locale} />
                          {item.hasPendingRequest ? (
                            <Badge variant="info" className="text-xs">{locale === "ar" ? "طلب مفتوح" : "Pending"}</Badge>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(inventoryData?.restockAdvisor.suppliers ?? []).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{locale === "ar" ? "مستشار إعادة الطلب" : "Restock Advisor"}</p>
                  {(inventoryData?.restockAdvisor.suppliers ?? []).slice(0, 3).map((supplier) => (
                    <div key={supplier.supplierName} className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{supplier.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{supplier.itemsCount} {locale === "ar" ? "عناصر" : "items"}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(supplier.totalEstimated)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4 text-primary" />
                  {locale === "ar" ? "وحدات الخدمات" : "Services Module"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === "ar" ? "حالة الخدمات والأسعار والأنواع" : "Service catalog activity, pricing, and categories"}
                </CardDescription>
              </div>
              <Link href="/admin/services">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  {locale === "ar" ? "إدارة الخدمات" : "Manage Services"} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "إجمالي الخدمات" : "Total Services"}</p>
                  <p className="text-lg font-semibold">{serviceData?.summaryCards.totalServices ?? 0}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "متوسط السعر" : "Avg Price"}</p>
                  <p className="text-lg font-semibold">{formatCurrency(serviceData?.summaryCards.averagePrice ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "نشطة" : "Active"}</p>
                  <p className="text-lg font-semibold text-emerald-600">{serviceData?.summaryCards.activeServices ?? 0}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "غير نشطة" : "Inactive"}</p>
                  <p className="text-lg font-semibold text-muted-foreground">{serviceData?.summaryCards.inactiveServices ?? 0}</p>
                </div>
              </div>

              {(serviceData?.catalog ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد خدمات بعد" : "No services found yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {(serviceData?.catalog ?? []).slice(0, 6).map((service) => (
                    <div key={service.id} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {service.category} • {service.durationMinutes} {locale === "ar" ? "دقيقة" : "min"}
                        </p>
                      </div>
                      <div className="text-right rtl:text-left">
                        <p className="text-sm font-semibold">{formatCurrency(service.price)}</p>
                        <Badge variant={service.isActive ? "success" : "secondary"} className="text-xs mt-1">
                          {service.isActive ? (locale === "ar" ? "نشطة" : "Active") : (locale === "ar" ? "غير نشطة" : "Inactive")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Staff Availability + Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={locale === "ar" ? "الأطباء النشطون" : "Active Doctors"}
          value={isLoading ? "..." : (availabilitySummary?.activeDoctors ?? 0)}
          icon={<Users className="h-5 w-5" />}
          delay={0.15}
        />
        <StatsCard
          title={locale === "ar" ? "تغطية الجداول" : "Shift Coverage"}
          value={isLoading ? "..." : `${coveragePercent}%`}
          icon={<Activity className="h-5 w-5" />}
          delay={0.2}
        />
        <StatsCard
          title={locale === "ar" ? "المرضى المخدومون" : "Patients Seen"}
          value={isLoading ? "..." : (performanceSummary?.patientsSeen ?? 0)}
          icon={<UserCog className="h-5 w-5" />}
          delay={0.25}
        />
        <StatsCard
          title={locale === "ar" ? "متوسط الرضا" : "Avg Satisfaction"}
          value={isLoading ? "..." : (performanceSummary?.avgSatisfaction === null || performanceSummary?.avgSatisfaction === undefined ? "--" : `${performanceSummary.avgSatisfaction}/5`)}
          icon={<Star className="h-5 w-5" />}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title={locale === "ar" ? "ساعات الذروة للاستشارات" : "Peak Consultation Hours"}
          type="bar"
          data={availabilityData?.peakConsultationHours ?? []}
          dataKey="count"
          delay={0.2}
        />
        <ChartCard
          title={locale === "ar" ? "إيراد مقدمي الخدمة" : "Provider Revenue"}
          type="bar"
          data={performanceData?.providerRevenue ?? []}
          dataKey="revenue"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === "ar" ? "توفر الطاقم" : "Staff Availability"}</CardTitle>
              <CardDescription>
                {locale === "ar" ? "جداول الأطباء الحالية وحجم المواعيد اليومية" : "Current doctor schedules and same-day workload"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(availabilityData?.doctorSchedules ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد بيانات جداول حالياً" : "No schedule data available"}
                </div>
              ) : (
                (availabilityData?.doctorSchedules ?? []).slice(0, 7).map((doctor) => (
                  <div key={doctor.doctorId} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{doctor.fullName}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatConfiguredDays(doctor.configuredDays, locale)}</p>
                    </div>
                    <div className="text-right rtl:text-left">
                      <StatusBadge status={doctor.status} locale={locale} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {locale === "ar" ? "اليوم" : "Today"}: {doctor.appointmentsCount}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{locale === "ar" ? "أداء الطاقم" : "Staff Performance"}</CardTitle>
                <CardDescription>
                  {locale === "ar" ? "مقارنة الإيراد والرضا ومعدلات عدم الحضور" : "Revenue, satisfaction, and no-show comparison"}
                </CardDescription>
              </div>
              <Link href="/admin/analytics">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  {locale === "ar" ? "المزيد" : "Details"} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {(performanceData?.providers ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد بيانات أداء" : "No performance data available"}
                </div>
              ) : (
                (performanceData?.providers ?? []).slice(0, 6).map((provider) => (
                  <div key={provider.doctorId} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{provider.fullName}</p>
                      <p className="text-xs text-muted-foreground">{provider.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[11px]">
                          {locale === "ar" ? "مرضى" : "Patients"}: {provider.patientsSeen}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {locale === "ar" ? "اكتمال" : "Completion"}: {provider.completionRate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="text-sm font-semibold">{formatCurrency(provider.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar" ? "الرضا" : "Satisfaction"}: {provider.avgSatisfaction ?? "--"}
                      </p>
                      {provider.alerts.highNoShow ? (
                        <div className="flex items-center justify-end rtl:justify-start gap-1 text-[11px] text-amber-600 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          {locale === "ar" ? "ارتفاع عدم الحضور" : "High no-show"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Doctors table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                {locale === "ar" ? "إدارة الأطباء" : "Doctor Management"}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/doctors">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  {t("manageDoctors")} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "الطبيب" : "Doctor"}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("specialty")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right rtl:text-left">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDoctors.map((doctor) => (
                    <TableRow key={doctor.doctorId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.email || doctor.doctorId}`}
                            alt={doctor.fullName}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-lg"
                            unoptimized
                          />
                          <div>
                            <p className="font-medium text-sm">{doctor.fullName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doctor.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {doctor.specialization || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell><StatusBadge status={doctor.status} locale={locale} /></TableCell>
                      <TableCell className="text-right rtl:text-left">
                        <Link href={`/admin/doctors?id=${doctor.doctorId}`}>
                           <Button variant="ghost" size="sm" className="h-8 text-xs">View Profile</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {topDoctors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        {locale === "ar" ? "لا توجد بيانات أطباء في الفترة المحددة" : "No doctor activity found for the selected period"}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
