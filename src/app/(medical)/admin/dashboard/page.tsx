"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, Calendar, DollarSign, Stethoscope, ArrowRight,
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
import { useStaffStore, type StaffMember } from "@/stores/useStaffStore";
import { usePaymentsStore } from "@/stores/usePaymentsStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useInventoryStore } from "@/stores/useInventoryStore";

function RoleBadge({ role, locale }: { role: StaffMember["role"]; locale: string }) {
  return (
    <Badge variant={role === "DOCTOR" ? "info" : "secondary"} className="text-xs">
      {role === "DOCTOR"
        ? locale === "ar" ? "طبيب" : "Doctor"
        : locale === "ar" ? "استقبال" : "Reception"}
    </Badge>
  );
}

function StatusBadge({ status, locale }: { status: StaffMember["status"]; locale: string }) {
  const v = status === "active" ? "success" : status === "on-leave" ? "warning" : "secondary";
  const label =
    status === "active"
      ? locale === "ar" ? "نشط" : "Active"
      : status === "on-leave"
      ? locale === "ar" ? "إجازة" : "On Leave"
      : locale === "ar" ? "غير نشط" : "Inactive";
  return <Badge variant={v} className="text-xs">{label}</Badge>;
}

export default function MedicalAdminDashboard() {
  const { t, locale } = useTranslation();
  const { staff, changeRole } = useStaffStore();
  const { getMonthlyBreakdown, getYearIncome } = usePaymentsStore();
  const { appointments } = useBookingStore();
  const { items: inventoryItems } = useInventoryStore();

  const doctors = staff.filter((s) => s.role === "DOCTOR");
  const receptionists = staff.filter((s) => s.role === "RECEPTION");
  const revenueData = getMonthlyBreakdown();

  // Dynamic weekly appointment counts
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const appointmentsData = days.map((name, i) => ({
    name,
    count: appointments.filter((a) => {
      try { return new Date(a.date).getDay() === i; } catch { return false; }
    }).length,
  }));
  const lowStockCount = inventoryItems.filter((i) => i.status === "low" || i.status === "out-of-stock").length;

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
        <StatsCard title={locale === "ar" ? "موظفو الاستقبال" : "Reception Staff"} value={receptionists.length} icon={<UserCog className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={t("totalRevenue")} value={`$${getYearIncome().toLocaleString()}`} change={18} icon={<DollarSign className="h-5 w-5" />} delay={0.3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={locale === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"} type="area" data={revenueData} dataKey="revenue" delay={0.2} />
        <ChartCard title={locale === "ar" ? "المواعيد الأسبوعية" : "Weekly Appointments"} type="bar" data={appointmentsData} dataKey="count" delay={0.3} />
      </div>

      {/* Staff table with role management */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                {locale === "ar" ? "إدارة الموظفين والأدوار" : "Staff & Role Management"}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/doctors">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  {t("manageDoctors")} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/admin/reception">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  {t("manageReception")} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "الموظف" : "Staff"}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right rtl:text-left">{locale === "ar" ? "تغيير الدور" : "Change Role"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.slice(0, 7).map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${member.email}`}
                            alt={member.name}
                            className="h-8 w-8 rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-sm">{locale === "ar" ? member.nameAr : member.name}</p>
                            {member.specialty && (
                              <p className="text-xs text-muted-foreground">
                                {locale === "ar" ? member.specialtyAr : member.specialty}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                      <TableCell><RoleBadge role={member.role} locale={locale} /></TableCell>
                      <TableCell><StatusBadge status={member.status} locale={locale} /></TableCell>
                      <TableCell className="text-right rtl:text-left">
                        <select
                          value={member.role}
                          onChange={(e) => changeRole(member.id, e.target.value as "DOCTOR" | "RECEPTION")}
                          className="text-xs border rounded-md px-2 py-1 bg-background hover:bg-muted transition-colors cursor-pointer"
                        >
                          <option value="DOCTOR">{locale === "ar" ? "طبيب" : "Doctor"}</option>
                          <option value="RECEPTION">{locale === "ar" ? "استقبال" : "Reception"}</option>
                        </select>
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
