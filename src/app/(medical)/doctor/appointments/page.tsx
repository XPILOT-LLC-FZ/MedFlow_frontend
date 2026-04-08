"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";

export default function DoctorAppointmentsPage() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const { user } = useAuthStore();
  const { appointments, fetchAppointments } = useBookingStore();
  const { doctors, fetchDoctors } = useStaffStore();

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [fetchAppointments, fetchDoctors]);

  const doctorRecord = doctors.find((member) =>
    member.id === user?.id ||
    member.email.toLowerCase() === user?.email?.toLowerCase() ||
    member.fullName === user?.name
  );
  const doctorId = doctorRecord?.id ?? user?.id ?? "staff-1";
  const doctorNames = new Set(
    [doctorRecord?.fullName, user?.name].filter((value): value is string => Boolean(value))
  );

  const doctorAppts = appointments.filter(
    (a) => (a.doctorId === doctorId || doctorNames.has(a.doctorName)) &&
    (a.patientName.toLowerCase().includes(search.toLowerCase()) || search === "")
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={t("appointments")}
        description={locale === "ar" ? "إدارة مواعيد المرضى" : "Manage your patient appointments"}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={locale === "ar" ? "ابحث عن مريض..." : "Search patients..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rtl:pl-3 rtl:pr-10"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t("all")}</TabsTrigger>
          <TabsTrigger value="scheduled">{t("scheduled")}</TabsTrigger>
          <TabsTrigger value="completed">{t("completed")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {doctorAppts.map((apt, i) => (
            <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.05} />
          ))}
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4 space-y-3">
          {doctorAppts.filter((a) => a.status === "scheduled" || a.status === "confirmed").map((apt, i) => (
            <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.05} />
          ))}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-3">
          {doctorAppts.filter((a) => a.status === "completed").map((apt, i) => (
            <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.05} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
