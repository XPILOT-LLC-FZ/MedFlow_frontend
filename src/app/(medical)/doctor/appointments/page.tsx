"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { bookingService } from "@/services/bookingService";
import { aiChatService } from "@/services/aiChatService";
import type { Appointment } from "@/types";

type DoctorActionForm = "reschedule" | "manual-summary" | "ai-summary";

export default function DoctorAppointmentsPage() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<{
    appointmentId: string;
    type: DoctorActionForm;
  } | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    startTime: "",
    reason: "",
  });
  const [manualSummaryForm, setManualSummaryForm] = useState({
    content: "",
    sendToPatient: true,
  });
  const [aiSummaryForm, setAiSummaryForm] = useState({
    consultationNotes: "",
    format: "clinical" as "brief" | "detailed" | "clinical",
    sendToPatient: true,
  });
  const { user } = useAuthStore();
  const { appointments, fetchAppointments } = useBookingStore();
  const { doctors, fetchDoctors } = useStaffStore();
  const toast = useToastStore();

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [fetchAppointments, fetchDoctors]);

  const doctorRecord = doctors.find((member) =>
    member.id === user?.id ||
    member.email?.toLowerCase() === user?.email?.toLowerCase() ||
    member.fullName === user?.name
  );
  const doctorId = doctorRecord?.id ?? user?.id ?? "staff-1";
  const doctorNames = new Set(
    [doctorRecord?.fullName, user?.name].filter((value): value is string => Boolean(value))
  );

  const doctorAppts = appointments.filter(
    (a) => (a.doctorId === doctorId || doctorNames.has(a.doctorName)) &&
    (a.patientName?.toLowerCase().includes(search.toLowerCase()) || search === "")
  );

  const openRescheduleForm = (appointment: Appointment) => {
    setOpenForm({ appointmentId: appointment.id, type: "reschedule" });
    setRescheduleForm({
      date: appointment.date,
      startTime: appointment.time,
      reason: "",
    });
  };

  const openManualSummaryForm = (appointment: Appointment) => {
    setOpenForm({ appointmentId: appointment.id, type: "manual-summary" });
    setManualSummaryForm({
      content: appointment.notes ?? "",
      sendToPatient: true,
    });
  };

  const openAiSummaryForm = (appointment: Appointment) => {
    setOpenForm({ appointmentId: appointment.id, type: "ai-summary" });
    setAiSummaryForm({
      consultationNotes: appointment.notes ?? "",
      format: "clinical",
      sendToPatient: true,
    });
  };

  const handleRescheduleSubmit = async (appointment: Appointment) => {
    if (!rescheduleForm.date || !rescheduleForm.startTime) {
      toast.error(
        locale === "ar"
          ? "يرجى تعبئة التاريخ والوقت"
          : "Please fill both date and start time",
      );
      return;
    }

    setActiveActionId(appointment.id);
    try {
      await bookingService.rescheduleAppointment(appointment.id, {
        date: rescheduleForm.date,
        startTime: rescheduleForm.startTime,
        reason: rescheduleForm.reason.trim() || undefined,
      });
      await fetchAppointments();
      setOpenForm(null);
      toast.success(locale === "ar" ? "تمت إعادة الجدولة بنجاح" : "Appointment rescheduled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reschedule appointment";
      toast.error(message);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleManualSummarySubmit = async (appointment: Appointment) => {
    if (!manualSummaryForm.content || manualSummaryForm.content.trim().length < 5) {
      toast.error(
        locale === "ar"
          ? "الملخص الطبي يجب أن يكون 5 أحرف على الأقل"
          : "Medical summary must be at least 5 characters",
      );
      return;
    }

    setActiveActionId(appointment.id);
    try {
      await bookingService.saveManualSummary(appointment.id, {
        mode: "NORMAL",
        content: manualSummaryForm.content.trim(),
        sendToPatient: manualSummaryForm.sendToPatient,
      });
      await fetchAppointments();
      setOpenForm(null);
      toast.success(locale === "ar" ? "تم إرسال الملخص" : "Medical summary sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send summary";
      toast.error(message);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleAiSummarySubmit = async (appointment: Appointment) => {
    setActiveActionId(appointment.id);
    try {
      await aiChatService.generateMedicalSummary({
        appointmentId: appointment.id,
        consultationNotes: aiSummaryForm.consultationNotes.trim() || undefined,
        format: aiSummaryForm.format,
        language: locale === "ar" ? "ar" : "en",
        sendToPatient: aiSummaryForm.sendToPatient,
        saveSummary: true,
      });
      await fetchAppointments();
      setOpenForm(null);
      toast.success(locale === "ar" ? "تم إنشاء ملخص بالذكاء الاصطناعي" : "AI summary generated and sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate AI summary";
      toast.error(message);
    } finally {
      setActiveActionId(null);
    }
  };

  const renderAppointments = (items: Appointment[]) => {
    return items.map((appointment, index) => (
      <div key={appointment.id} className="space-y-2">
        <AppointmentCard appointment={appointment} delay={index * 0.05} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openRescheduleForm(appointment)}
            disabled={activeActionId === appointment.id}
          >
            {locale === "ar" ? "إعادة جدولة" : "Reschedule"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openManualSummaryForm(appointment)}
            disabled={activeActionId === appointment.id}
          >
            {locale === "ar" ? "إرسال ملخص يدوي" : "Send Manual Summary"}
          </Button>
          <Button
            size="sm"
            onClick={() => openAiSummaryForm(appointment)}
            disabled={activeActionId === appointment.id}
          >
            {locale === "ar" ? "إرسال ملخص AI" : "Send AI Summary"}
          </Button>
        </div>

        {openForm?.appointmentId === appointment.id && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            {openForm.type === "reschedule" && (
              <>
                <p className="text-sm font-medium">
                  {locale === "ar" ? "نموذج إعادة الجدولة" : "Reschedule Form"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={rescheduleForm.date}
                    onChange={(e) =>
                      setRescheduleForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                  <Input
                    type="time"
                    value={rescheduleForm.startTime}
                    onChange={(e) =>
                      setRescheduleForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                  />
                </div>
                <textarea
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={rescheduleForm.reason}
                  onChange={(e) =>
                    setRescheduleForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder={locale === "ar" ? "سبب إعادة الجدولة (اختياري)" : "Reschedule reason (optional)"}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleRescheduleSubmit(appointment)}
                    disabled={activeActionId === appointment.id}
                  >
                    {locale === "ar" ? "حفظ" : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenForm(null)}
                    disabled={activeActionId === appointment.id}
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </>
            )}

            {openForm.type === "manual-summary" && (
              <>
                <p className="text-sm font-medium">
                  {locale === "ar" ? "نموذج ملخص يدوي" : "Manual Summary Form"}
                </p>
                <textarea
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={manualSummaryForm.content}
                  onChange={(e) =>
                    setManualSummaryForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder={locale === "ar" ? "اكتب الملخص الطبي" : "Write the medical summary"}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manualSummaryForm.sendToPatient}
                    onChange={(e) =>
                      setManualSummaryForm((prev) => ({
                        ...prev,
                        sendToPatient: e.target.checked,
                      }))
                    }
                  />
                  {locale === "ar" ? "مشاركة مع المريض" : "Share with patient"}
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleManualSummarySubmit(appointment)}
                    disabled={activeActionId === appointment.id}
                  >
                    {locale === "ar" ? "إرسال" : "Send"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenForm(null)}
                    disabled={activeActionId === appointment.id}
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </>
            )}

            {openForm.type === "ai-summary" && (
              <>
                <p className="text-sm font-medium">
                  {locale === "ar" ? "نموذج ملخص AI" : "AI Summary Form"}
                </p>
                <textarea
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiSummaryForm.consultationNotes}
                  onChange={(e) =>
                    setAiSummaryForm((prev) => ({
                      ...prev,
                      consultationNotes: e.target.value,
                    }))
                  }
                  placeholder={locale === "ar" ? "ملاحظات إضافية (اختياري)" : "Additional notes (optional)"}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={aiSummaryForm.format}
                    onChange={(e) =>
                      setAiSummaryForm((prev) => ({
                        ...prev,
                        format: e.target.value as "brief" | "detailed" | "clinical",
                      }))
                    }
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="brief">Brief</option>
                    <option value="detailed">Detailed</option>
                    <option value="clinical">Clinical</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={aiSummaryForm.sendToPatient}
                      onChange={(e) =>
                        setAiSummaryForm((prev) => ({
                          ...prev,
                          sendToPatient: e.target.checked,
                        }))
                      }
                    />
                    {locale === "ar" ? "مشاركة مع المريض" : "Share with patient"}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleAiSummarySubmit(appointment)}
                    disabled={activeActionId === appointment.id}
                  >
                    {locale === "ar" ? "إنشاء وإرسال" : "Generate and Send"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenForm(null)}
                    disabled={activeActionId === appointment.id}
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    ));
  };

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
          {renderAppointments(doctorAppts)}
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4 space-y-3">
          {renderAppointments(doctorAppts.filter((a) => a.status === "scheduled" || a.status === "confirmed"))}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-3">
          {renderAppointments(doctorAppts.filter((a) => a.status === "completed"))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
