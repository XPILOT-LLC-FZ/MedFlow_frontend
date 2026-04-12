"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, DollarSign, Stethoscope,
  UserCog, Shield, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <StatsCard title={t("totalRevenue")} value={isLoading ? "..." : `$${(summaryCards?.totalRevenue ?? 0).toLocaleString()}`} change={lowStockCount > 0 ? -lowStockCount : undefined} icon={<DollarSign className="h-5 w-5" />} delay={0.3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={locale === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"} type="area" data={revenueData} dataKey="revenue" delay={0.2} />
        <ChartCard title={locale === "ar" ? "المواعيد الأسبوعية" : "Weekly Appointments"} type="bar" data={appointmentsData} dataKey="count" delay={0.3} />
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
                          <img
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.email || doctor.doctorId}`}
                            alt={doctor.fullName}
                            className="h-8 w-8 rounded-lg"
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
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
