"use client";

import React, { useState, useEffect } from "react";
import { Users, Activity, Server, BarChart3 } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useBookingStore } from "@/stores/useBookingStore";
import { usePaymentsStore } from "@/stores/usePaymentsStore";
import { userService } from "@/services/userService";

export default function SuperAdminDashboard() {
  const { locale } = useTranslation();
  const { appointments } = useBookingStore();
  const { getYearIncome } = usePaymentsStore();

  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await userService.getStats();
        setStats(s);
      } catch (err) {
        console.error("Failed to load global stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const totalUsers = (stats?.total as number) || 0;
  const activeUsers = (stats?.active as number) || 0;
  const lowStockItems = null as number | null;

  const roleDistribution = [
    { name: locale === "ar" ? "مرضى" : "Patients", value: (stats?.byRole as Record<string, number>)?.PATIENT || 0 },
    { name: locale === "ar" ? "أطباء" : "Doctors", value: (stats?.byRole as Record<string, number>)?.DOCTOR || 0 },
    { name: locale === "ar" ? "استقبال" : "Reception", value: (stats?.byRole as Record<string, number>)?.STAFF || 0 },
    { name: locale === "ar" ? "إدارة" : "Admins", value: ((stats?.byRole as Record<string, number>)?.ADMIN || 0) + ((stats?.byRole as Record<string, number>)?.SUPER_ADMIN || 0) },
  ];

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
        <StatsCard title={locale === "ar" ? "إجمالي المستخدمين" : "Total Users"} value={isLoading ? "..." : totalUsers} change={15} icon={<Users className="h-5 w-5" />} delay={0} />
        <StatsCard title={locale === "ar" ? "الموظفون نشطون" : "Active Users"} value={isLoading ? "..." : activeUsers} change={8} icon={<Activity className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "إجمالي المواعيد" : "Total Appointments"} value={appointments.length} icon={<BarChart3 className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"} value={`$${getYearIncome().toLocaleString()}`} icon={<Server className="h-5 w-5" />} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={locale === "ar" ? "نمو المستخدمين" : "User Growth"} type="area" data={userGrowth} dataKey="users" delay={0.2} />
        <ChartCard title={locale === "ar" ? "توزيع الأدوار" : "Role Distribution"} type="pie" data={roleDistribution} dataKey="value" delay={0.3} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{locale === "ar" ? "حالة النظام" : "System Status"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "API Server", status: "operational" as const, uptime: "99.99%" },
              { name: "Database", status: "operational" as const, uptime: "99.95%" },
              {
                name: locale === "ar" ? "تنبيهات المخزون" : "Inventory Alerts",
                status: "operational" as const,
                uptime: lowStockItems === null ? "N/A (clinic-scoped)" : `${lowStockItems} alerts`,
              },
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
