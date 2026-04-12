"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck2, Clock3, PlayCircle, Plus, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDateKey } from "@/lib/dateUtils";
import { useBookingStore } from "@/stores/useBookingStore";

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
};

export default function ReceptionDashboard() {
  const { locale } = useTranslation();
  const { appointments, fetchAppointments, isLoading, error } = useBookingStore();

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  useEffect(() => {
    void fetchAppointments({ date: todayKey });

    const interval = setInterval(() => {
      void fetchAppointments({ date: todayKey });
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchAppointments, todayKey]);

  const scheduled = appointments.filter(
    (appointment) =>
      appointment.status === "scheduled" || appointment.status === "confirmed",
  );
  const inProgress = appointments.filter((appointment) => appointment.status === "in-progress");
  const completed = appointments.filter((appointment) => appointment.status === "completed");

  const upcoming = [...scheduled]
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
    .slice(0, 8);

  const nextAppointment = upcoming[0] ?? null;

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
              onClick={() => void fetchAppointments({ date: todayKey })}
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
          value={appointments.length}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          delay={0}
        />
        <StatsCard
          title={locale === "ar" ? "قيد الانتظار" : "Scheduled / Confirmed"}
          value={scheduled.length}
          icon={<Clock3 className="h-5 w-5" />}
          delay={0.1}
        />
        <StatsCard
          title={locale === "ar" ? "جارٍ التنفيذ" : "In Progress"}
          value={inProgress.length}
          icon={<PlayCircle className="h-5 w-5" />}
          delay={0.2}
        />
        <StatsCard
          title={locale === "ar" ? "مكتمل" : "Completed"}
          value={completed.length}
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
                      variant={
                        appointment.status === "confirmed"
                          ? "success"
                          : appointment.status === "scheduled"
                            ? "info"
                            : appointment.status === "in-progress"
                              ? "warning"
                              : "secondary"
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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

              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "يتم تحديث البيانات تلقائياً كل 15 ثانية"
                  : "Data refreshes automatically every 15 seconds."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
