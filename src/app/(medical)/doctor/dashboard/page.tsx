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
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";
import Link from "next/link";

const weeklyData = [
  { name: "Mon", patients: 8 }, { name: "Tue", patients: 6 }, { name: "Wed", patients: 10 },
  { name: "Thu", patients: 9 }, { name: "Fri", patients: 7 },
];

export default function DoctorDashboard() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { appointments, fetchAppointments } = useBookingStore();
  const { doctors, fetchDoctors } = useStaffStore();

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [fetchAppointments, fetchDoctors]);

  const displayName = user
    ? locale === "ar" ? user.nameAr : user.name
    : "Doctor";

  const doctorRecord = doctors.find((member) =>
    member.id === user?.id ||
    member.email?.toLowerCase() === user?.email?.toLowerCase() ||
    member.fullName === user?.name
  );
  const doctorId = doctorRecord?.id ?? user?.id ?? "staff-1";
  const doctorNames = new Set(
    [doctorRecord?.fullName, user?.name].filter((value): value is string => Boolean(value))
  );
  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === doctorId || doctorNames.has(a.doctorName)
  );
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = doctorAppointments.filter((a) => a.date === today);
  const visibleAppointments = (todayAppts.length > 0 ? todayAppts : doctorAppointments).slice(0, 4);
  const highlightDates = [...new Set(doctorAppointments.map((a) => a.date))];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={`${locale === "ar" ? "مرحبًا" : "Good morning"}, ${displayName}`}
        description={locale === "ar" ? "إليك جدولك لهذا اليوم" : "Here's your schedule for today"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("todayAppointments")} value={todayAppts.length} icon={<Calendar className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("totalPatients")} value={new Set(doctorAppointments.map((a) => a.patientId)).size} change={8} icon={<Users className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "وقت الانتظار" : "Avg. Wait Time"} value="12 min" icon={<Clock className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={locale === "ar" ? "رضا المرضى" : "Satisfaction"} value="4.9/5" change={2} icon={<Activity className="h-5 w-5" />} delay={0.3} />
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
                      <p className="text-xs text-muted-foreground">{p.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{p.time}</span>
                    <Badge variant={p.status === "completed" ? "success" : p.status === "in-progress" ? "warning" : "info"} className="text-xs">
                      {p.status}
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
                    <div className={`h-3 w-3 rounded-full ${item.status === "completed" || item.status === "confirmed" ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                    {i < visibleAppointments.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    <p className="text-sm font-medium">{item.patientName}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
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
