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
import { useStaffStore } from "@/stores/useStaffStore";
import { usePaymentsStore } from "@/stores/usePaymentsStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useInventoryStore } from "@/stores/useInventoryStore";
import type { ApiDoctor } from "@/types";

function StatusBadge({ status, locale }: { status: ApiDoctor["status"]; locale: string }) {
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
  const { doctors, fetchDoctors } = useStaffStore();
  const { getMonthlyBreakdown, getYearIncome } = usePaymentsStore();
  const { appointments, fetchAppointments } = useBookingStore();
  const { items: inventoryItems, fetchItems: fetchInventoryItems } = useInventoryStore();

  useEffect(() => {
    void fetchDoctors();
    void fetchAppointments();
    void fetchInventoryItems();
  }, []);

  const revenueData = getMonthlyBreakdown();

  // Dynamic weekly appointment counts
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const appointmentsData = days.map((name, i) => ({
    name,
    count: appointments.filter((a) => {
      try { return new Date(a.date).getDay() === i; } catch { return false; }
    }).length,
  }));
  const lowStockCount = inventoryItems.filter(
    (i) => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK" || i.status === "EXPIRED"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "لوحة تحكم الإدارة الطبية" : "Medical Admin Dashboard"}
        description={locale === "ar" ? "نظرة عامة على عمليات العيادة وإدارة الموظفين" : "Clinic operations overview & staff management"}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("totalAppointments")} value={appointments.length} change={appointments.length > 0 ? 8 : 0} icon={<Calendar className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("totalDoctors")} value={doctors.length} icon={<Stethoscope className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "موظفو الاستقبال" : "Reception Staff"} value={"Real-time"} icon={<UserCog className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={t("totalRevenue")} value={`$${getYearIncome().toLocaleString()}`} change={lowStockCount > 0 ? -lowStockCount : 18} icon={<DollarSign className="h-5 w-5" />} delay={0.3} />
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
                  {doctors.slice(0, 7).map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.email}`}
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
                        <Link href={`/admin/doctors?id=${doctor.id}`}>
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
