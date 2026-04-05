"use client";

import React from "react";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { usePaymentsStore } from "@/stores/usePaymentsStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";

export default function AnalyticsPage() {
  const { t, locale } = useTranslation();
  const { getMonthlyBreakdown, getYearIncome } = usePaymentsStore();
  const { appointments } = useBookingStore();
  const { staff } = useStaffStore();

  const monthlyRevenue = getMonthlyBreakdown();
  const yearIncome = getYearIncome();
  const doctorCount = staff.filter((s) => s.role === "DOCTOR").length;
  const uniquePatients = new Set(appointments.map((a) => a.patientId)).size;

  // Patient growth (from appointment count per month)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = new Date().getFullYear();
  const patientGrowth = months.map((name, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
    return {
      name,
      count: appointments.filter((a) => a.date.startsWith(prefix)).length,
    };
  });

  // Appointments by day
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const appointmentsByDay = days.map((name, i) => ({
    name,
    count: appointments.filter((a) => {
      try { return new Date(a.date).getDay() === (i + 1) % 7; } catch { return false; }
    }).length,
  }));

  // Department revenue from staff specialties
  const specialties = [...new Set(staff.filter((s) => s.specialty).map((s) => s.specialty!))];
  const specialtyAppointmentCounts = specialties.map((name) => ({
    name,
    count: appointments.filter((a) => a.specialty === name).length,
  }));
  const totalSpecialtyAppointments = specialtyAppointmentCounts.reduce((sum, item) => sum + item.count, 0);
  const departmentRevenue = specialtyAppointmentCounts.map(({ name, count }) => ({
    name,
    value: Math.round(
      totalSpecialtyAppointments > 0
        ? (yearIncome * count) / totalSpecialtyAppointments
        : yearIncome / Math.max(specialties.length, 1)
    ),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("analytics")}
        description={locale === "ar" ? "تحليلات شاملة للعيادة" : "Comprehensive clinic analytics"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("totalRevenue")} value={`$${yearIncome.toLocaleString()}`} change={22} icon={<DollarSign className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("totalPatients")} value={uniquePatients} change={15} icon={<Users className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={t("totalAppointments")} value={appointments.length} change={18} icon={<Calendar className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={locale === "ar" ? "الأطباء" : "Doctors"} value={doctorCount} icon={<TrendingUp className="h-5 w-5" />} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={locale === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"} type="area" data={monthlyRevenue} dataKey="revenue" delay={0.2} />
        <ChartCard title={locale === "ar" ? "المواعيد الشهرية" : "Monthly Appointments"} type="area" data={patientGrowth} dataKey="count" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={locale === "ar" ? "المواعيد حسب اليوم" : "Appointments by Day"} type="bar" data={appointmentsByDay} dataKey="count" delay={0.4} />
        {departmentRevenue.length > 0 && (
          <ChartCard title={locale === "ar" ? "إيرادات الأقسام" : "Department Revenue"} type="pie" data={departmentRevenue} dataKey="value" delay={0.5} />
        )}
      </div>
    </div>
  );
}
