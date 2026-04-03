"use client";

import React from "react";
import { Users, Shield, Activity, Server, Globe, BarChart3, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useStaffStore } from "@/stores/useStaffStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { usePaymentsStore } from "@/stores/usePaymentsStore";
import { useInventoryStore } from "@/stores/useInventoryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { mockUsers } from "@/data/mockUsers";

export default function SuperAdminDashboard() {
  const { t, locale } = useTranslation();
  const { staff } = useStaffStore();
  const { appointments } = useBookingStore();
  const { payments } = usePaymentsStore();
  const { items: inventoryItems } = useInventoryStore();
  const { registeredUsers } = useAuthStore();

  const totalUsers = mockUsers.length + staff.length + registeredUsers.length;
  const activeStaff = staff.filter((s) => s.status === "active").length;
  const lowStockItems = inventoryItems.filter((i) => i.status === "low" || i.status === "out-of-stock").length;

  // Dynamic role distribution
  const roleDistribution = [
    { name: locale === "ar" ? "مرضى" : "Patients", value: mockUsers.filter((u) => u.role === "PATIENT").length + registeredUsers.length },
    { name: locale === "ar" ? "أطباء" : "Doctors", value: staff.filter((s) => s.role === "DOCTOR").length },
    { name: locale === "ar" ? "استقبال" : "Reception", value: staff.filter((s) => s.role === "RECEPTION").length },
    { name: locale === "ar" ? "إدارة" : "Admins", value: mockUsers.filter((u) => u.role === "MEDICAL_ADMIN" || u.role === "SUPER_ADMIN").length },
  ];

  // Monthly user growth (simulated from real counts)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const userGrowth = months.map((name, i) => ({
    name,
    users: Math.round(totalUsers * (0.4 + (i * 0.12))),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "لوحة تحكم المسؤول" : "Super Admin Dashboard"}
        description={locale === "ar" ? "نظرة عامة شاملة على النظام" : "System-wide overview and management"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={locale === "ar" ? "إجمالي المستخدمين" : "Total Users"} value={totalUsers} change={15} icon={<Users className="h-5 w-5" />} delay={0} />
        <StatsCard title={locale === "ar" ? "الموظفون النشطون" : "Active Staff"} value={activeStaff} change={8} icon={<Activity className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "إجمالي المواعيد" : "Total Appointments"} value={appointments.length} icon={<BarChart3 className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={locale === "ar" ? "إجمالي المعاملات" : "Total Payments"} value={payments.length} icon={<Server className="h-5 w-5" />} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={locale === "ar" ? "نمو المستخدمين" : "User Growth"} type="area" data={userGrowth} dataKey="users" delay={0.2} />
        <ChartCard title={locale === "ar" ? "توزيع الأدوار" : "Role Distribution"} type="pie" data={roleDistribution} dataKey="value" delay={0.3} />
      </div>

      {/* System status */}
      <Card>
        <CardHeader><CardTitle className="text-base">{locale === "ar" ? "حالة النظام" : "System Status"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "API Server", status: "operational" as const, uptime: "99.99%" },
              { name: "Database", status: "operational" as const, uptime: "99.95%" },
              { name: locale === "ar" ? "المخزون" : "Inventory Alerts", status: lowStockItems > 0 ? "degraded" as const : "operational" as const, uptime: `${lowStockItems} alerts` },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">{svc.uptime}</p>
                </div>
                <Badge variant={svc.status === "operational" ? "success" : "warning"}>
                  {svc.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
