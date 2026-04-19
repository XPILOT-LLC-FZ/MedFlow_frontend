"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, MessageSquare, PlayCircle, RefreshCw, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDateKey } from "@/lib/dateUtils";
import { bookingService } from "@/services/bookingService";
import { surveyService } from "@/services/surveyService";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiReceptionHandoff, Appointment } from "@/types";

const QUEUE_STATUSES: Appointment["status"][] = [
  "scheduled",
  "confirmed",
  "in-progress",
];

const RESOLVED_STATUSES: Appointment["status"][] = [
  "completed",
  "cancelled",
  "no-show",
];

const toMinutes = (value: string): number | null => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours * 60) + minutes;
};

const getStatusVariant = (status: Appointment["status"]) => {
  if (status === "scheduled") return "info" as const;
  if (status === "confirmed") return "success" as const;
  if (status === "in-progress") return "warning" as const;
  if (status === "completed") return "success" as const;
  if (status === "cancelled") return "destructive" as const;
  return "secondary" as const;
};

const getStatusLabel = (
  status: Appointment["status"],
  locale: string,
  t: (key: "scheduled" | "confirmed" | "inProgress" | "completed" | "cancelled") => string,
) => {
  if (status === "scheduled") return t("scheduled");
  if (status === "confirmed") return t("confirmed");
  if (status === "in-progress") return t("inProgress");
  if (status === "completed") return t("completed");
  if (status === "cancelled") return t("cancelled");
  if (status === "no-show") return locale === "ar" ? "لم يحضر" : "No Show";
  return locale === "ar" ? "أعيدت الجدولة" : "Rescheduled";
};

const formatWait = (minutes: number, locale: string) => {
  if (minutes < 60) {
    return locale === "ar" ? `${minutes} د` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (locale === "ar") {
    return remainder === 0 ? `${hours} س` : `${hours} س ${remainder} د`;
  }

  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
};

export default function WaitingRoomPage() {
  const { t, locale } = useTranslation();
  const toast = useToastStore();
  const { appointments, fetchAppointments, updateAppointment, isLoading, error } =
    useBookingStore();

  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [feedbackRequestingId, setFeedbackRequestingId] = useState<string | null>(null);
  const [notifyWhatsAppKey, setNotifyWhatsAppKey] = useState<string | null>(null);
  const [feedbackRequestedByAppointmentId, setFeedbackRequestedByAppointmentId] =
    useState<Record<string, boolean>>({});
  const [handoffs, setHandoffs] = useState<ApiReceptionHandoff[]>([]);
  const [isLoadingHandoffs, setIsLoadingHandoffs] = useState(false);
  const [reviewingHandoffId, setReviewingHandoffId] = useState<string | null>(null);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const loadQueue = useCallback(async () => {
    await fetchAppointments({ date: todayKey });

    setIsLoadingHandoffs(true);
    try {
      const handoffItems = await bookingService.getReceptionHandoffs({
        status: "NEW",
        limit: 20,
      });
      setHandoffs(handoffItems);
    } catch {
      setHandoffs([]);
    } finally {
      setIsLoadingHandoffs(false);
    }
  }, [fetchAppointments, todayKey]);

  useEffect(() => {
    void loadQueue();

    const interval = setInterval(() => {
      void loadQueue();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadQueue]);

  const queue = useMemo(() => {
    return appointments
      .filter((appointment) => QUEUE_STATUSES.includes(appointment.status))
      .sort((left, right) => (toMinutes(left.time) ?? 9999) - (toMinutes(right.time) ?? 9999));
  }, [appointments]);

  const waiting = useMemo(
    () =>
      queue.filter(
        (appointment) =>
          appointment.status === "scheduled" || appointment.status === "confirmed",
      ),
    [queue],
  );

  const inProgress = useMemo(
    () => queue.filter((appointment) => appointment.status === "in-progress"),
    [queue],
  );

  const nextPatient = waiting[0] ?? queue[0] ?? null;

  const avgWaitMinutes = useMemo(() => {
    if (waiting.length === 0) return 0;

    const now = new Date();
    const nowMinutes = (now.getHours() * 60) + now.getMinutes();

    const totalWait = waiting.reduce((sum, appointment) => {
      const apptMinutes = toMinutes(appointment.time);
      if (apptMinutes === null) return sum;
      return sum + Math.max(0, nowMinutes - apptMinutes);
    }, 0);

    return Math.round(totalWait / waiting.length);
  }, [waiting]);

  const resolved = useMemo(() => {
    return appointments
      .filter((appointment) => RESOLVED_STATUSES.includes(appointment.status))
      .sort((left, right) => (toMinutes(right.time) ?? 0) - (toMinutes(left.time) ?? 0));
  }, [appointments]);

  const getPrimaryAction = (status: Appointment["status"]) => {
    if (status === "scheduled") {
      return {
        label: t("checkIn"),
        icon: CheckCircle2,
        nextStatus: "confirmed" as Appointment["status"],
        variant: "default" as const,
      };
    }

    if (status === "confirmed") {
      return {
        label: locale === "ar" ? "بدء الزيارة" : "Start Visit",
        icon: PlayCircle,
        nextStatus: "in-progress" as Appointment["status"],
        variant: "default" as const,
      };
    }

    if (status === "in-progress") {
      return {
        label: locale === "ar" ? "إنهاء" : "Complete",
        icon: CheckCircle2,
        nextStatus: "completed" as Appointment["status"],
        variant: "success" as const,
      };
    }

    return null;
  };

  const applyTransition = async (
    appointment: Appointment,
    nextStatus: Appointment["status"],
  ) => {
    const operationKey = `${appointment.id}:${nextStatus}`;
    setProcessingKey(operationKey);

    try {
      await updateAppointment(appointment.id, { status: nextStatus });
      toast.success(
        locale === "ar" ? "تم تحديث الحالة" : "Appointment status updated",
      );
    } catch (transitionError) {
      const message =
        transitionError instanceof Error
          ? transitionError.message
          : locale === "ar"
            ? "فشل تحديث الحالة"
            : "Failed to update status";
      toast.error(message);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    const confirmMessage =
      locale === "ar"
        ? `هل تريد إلغاء موعد ${appointment.patientName}؟`
        : `Cancel appointment for ${appointment.patientName}?`;

    if (!window.confirm(confirmMessage)) return;

    await applyTransition(appointment, "cancelled");
  };

  const handleNotifyWhatsApp = async (
    appointment: Appointment,
    waitMinutes: number,
  ) => {
    const operationKey = `${appointment.id}:notify-whatsapp`;
    setNotifyWhatsAppKey(operationKey);

    try {
      const apiStatus = appointment.status.toUpperCase().replace("-", "_");
      const result = await bookingService.notifyPatientOnWhatsApp(appointment.id, {
        status: apiStatus as
          | "SCHEDULED"
          | "CONFIRMED"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED"
          | "NO_SHOW"
          | "RESCHEDULED",
        estimatedWaitMinutes: waitMinutes,
      });

      if (result.sent) {
        toast.success(
          locale === "ar"
            ? "تم إرسال تحديث واتساب للمريض"
            : "WhatsApp update sent to patient",
        );
      } else {
        toast.info(
          result.reason ||
            (locale === "ar"
              ? "تعذر إرسال تحديث واتساب"
              : "Unable to send WhatsApp update"),
        );
      }
    } catch (notifyError) {
      const message =
        notifyError instanceof Error
          ? notifyError.message
          : locale === "ar"
            ? "فشل إرسال تحديث واتساب"
            : "Failed to send WhatsApp update";
      toast.error(message);
    } finally {
      setNotifyWhatsAppKey(null);
    }
  };

  const handleRequestFeedback = async (appointment: Appointment) => {
    if (appointment.status !== "completed") {
      return;
    }

    setFeedbackRequestingId(appointment.id);
    try {
      const result = await surveyService.requestFeedback({
        appointmentId: appointment.id,
      });

      setFeedbackRequestedByAppointmentId((previous) => ({
        ...previous,
        [appointment.id]: true,
      }));

      toast.success(
        result.created
          ? locale === "ar"
            ? "تم إرسال طلب التقييم للمريض"
            : "Feedback request sent to patient"
          : locale === "ar"
            ? "تم طلب التقييم مسبقاً لهذا الموعد"
            : "Feedback was already requested for this appointment",
      );
    } catch (feedbackError) {
      const message =
        feedbackError instanceof Error
          ? feedbackError.message
          : locale === "ar"
            ? "فشل إرسال طلب التقييم"
            : "Failed to request patient feedback";
      toast.error(message);
    } finally {
      setFeedbackRequestingId(null);
    }
  };

  const handleMarkHandoffReviewed = async (handoffId: string) => {
    setReviewingHandoffId(handoffId);
    try {
      await bookingService.markReceptionHandoffReviewed(handoffId);
      setHandoffs((previous) => previous.filter((item) => item.id !== handoffId));
      toast.success(
        locale === "ar"
          ? "تمت مراجعة المهمة"
          : "Handoff marked as reviewed",
      );
    } catch (reviewError) {
      const message =
        reviewError instanceof Error
          ? reviewError.message
          : locale === "ar"
            ? "تعذر تحديث حالة المهمة"
            : "Failed to update handoff status";
      toast.error(message);
    } finally {
      setReviewingHandoffId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={t("waitingRoom")}
        description={
          locale === "ar"
            ? "إدارة قائمة الانتظار في الوقت الفعلي"
            : "Real-time waiting room management"
        }
        action={
          <Button variant="outline" className="gap-2" onClick={() => void loadQueue()}>
            <RefreshCw className="h-4 w-4" />
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      <div className="flex gap-4 flex-wrap">
        <Badge variant="info" className="text-sm px-3 py-1">
          {locale === "ar" ? "قيد الانتظار" : "Waiting"}: {waiting.length}
        </Badge>
        <Badge variant="warning" className="text-sm px-3 py-1">
          {locale === "ar" ? "جارٍ التنفيذ" : "In Progress"}: {inProgress.length}
        </Badge>
        <Badge variant="success" className="text-sm px-3 py-1">
          {locale === "ar" ? "التالي" : "Next"}: {nextPatient?.patientName || (locale === "ar" ? "لا يوجد" : "None")}
        </Badge>
        <Badge variant="warning" className="text-sm px-3 py-1">
          {locale === "ar" ? "متوسط الانتظار" : "Avg. Wait"}: {formatWait(avgWaitMinutes, locale)}
        </Badge>
        <Badge variant="info" className="text-sm px-3 py-1">
          {locale === "ar" ? "مهام الاستقبال" : "Reception Handoffs"}: {handoffs.length}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "ar" ? "المهام الواردة من الأطباء" : "Doctor Handoffs"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoadingHandoffs && handoffs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "جارٍ تحميل المهام..." : "Loading handoffs..."}
            </p>
          ) : handoffs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد مهام جديدة من الأطباء"
                : "No new doctor handoffs"}
            </p>
          ) : (
            handoffs.slice(0, 8).map((handoff) => (
              <div
                key={handoff.id}
                className="rounded-lg border p-3 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{handoff.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {handoff.doctorName} • {new Date(handoff.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                  </p>
                  {handoff.diagnosis && (
                    <p className="text-xs text-foreground/80">{handoff.diagnosis}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={reviewingHandoffId === handoff.id}
                  onClick={() => void handleMarkHandoffReviewed(handoff.id)}
                >
                  {reviewingHandoffId === handoff.id
                    ? locale === "ar"
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : locale === "ar"
                      ? "تمت المراجعة"
                      : "Mark Reviewed"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && queue.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {locale === "ar" ? "جارٍ تحميل قائمة الانتظار..." : "Loading queue..."}
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!isLoading && queue.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noResults")}</p>
        )}

        {queue.map((appointment, index) => {
          const primaryAction = getPrimaryAction(appointment.status);
          const isNext = nextPatient?.id === appointment.id;
          const appointmentMinutes = toMinutes(appointment.time);
          const now = new Date();
          const nowMinutes = (now.getHours() * 60) + now.getMinutes();
          const waitMinutes = appointmentMinutes === null
            ? 0
            : Math.max(0, nowMinutes - appointmentMinutes);

          return (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={isNext ? "ring-2 ring-emerald-500/50 shadow-md" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-3 w-3 rounded-full shrink-0 ${
                          appointment.status === "in-progress"
                            ? "bg-blue-500"
                            : isNext
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-amber-500"
                        }`}
                      />
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{appointment.patientName}</p>
                          {isNext && appointment.status !== "in-progress" && (
                            <Badge variant="success" className="text-[10px]">
                              {locale === "ar" ? "التالي" : "Next"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            {appointment.doctorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appointment.time}
                          </span>
                          <span className="flex items-center gap-1">
                            {locale === "ar" ? "انتظار" : "Wait"}: {formatWait(waitMinutes, locale)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge variant={getStatusVariant(appointment.status)}>
                        {getStatusLabel(appointment.status, locale, t)}
                      </Badge>

                      {primaryAction && (
                        <Button
                          size="sm"
                          variant={primaryAction.variant}
                          className="text-xs h-8 gap-1"
                          disabled={processingKey === `${appointment.id}:${primaryAction.nextStatus}`}
                          onClick={() => void applyTransition(appointment, primaryAction.nextStatus)}
                        >
                          <primaryAction.icon className="h-3 w-3" />
                          {primaryAction.label}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 gap-1"
                        disabled={notifyWhatsAppKey === `${appointment.id}:notify-whatsapp`}
                        onClick={() =>
                          void handleNotifyWhatsApp(appointment, waitMinutes)
                        }
                      >
                        <MessageSquare className="h-3 w-3" />
                        {notifyWhatsAppKey === `${appointment.id}:notify-whatsapp`
                          ? locale === "ar"
                            ? "جارٍ الإرسال..."
                            : "Sending..."
                          : locale === "ar"
                            ? "إبلاغ واتساب"
                            : "Notify WhatsApp"}
                      </Button>

                      {(appointment.status === "scheduled" ||
                        appointment.status === "confirmed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1 text-destructive"
                          disabled={processingKey === `${appointment.id}:cancelled`}
                          onClick={() => void handleCancel(appointment)}
                        >
                          <XCircle className="h-3 w-3" />
                          {t("cancel")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "ar" ? "الحالات المنتهية (اليوم)" : "Resolved Today"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resolved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "لا توجد حالات منتهية بعد" : "No resolved appointments yet"}
            </p>
          ) : (
            resolved.slice(0, 8).map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg border p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium">{appointment.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.doctorName} • {appointment.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {appointment.status === "completed" && (
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        feedbackRequestedByAppointmentId[appointment.id]
                          ? "outline"
                          : "default"
                      }
                      className="h-8 gap-1 text-xs"
                      disabled={
                        feedbackRequestingId === appointment.id ||
                        feedbackRequestedByAppointmentId[appointment.id]
                      }
                      onClick={() => void handleRequestFeedback(appointment)}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {feedbackRequestedByAppointmentId[appointment.id]
                        ? locale === "ar"
                          ? "تم الطلب"
                          : "Requested"
                        : feedbackRequestingId === appointment.id
                          ? locale === "ar"
                            ? "جارٍ الإرسال..."
                            : "Requesting..."
                          : locale === "ar"
                            ? "طلب تقييم"
                            : "Request Feedback"}
                    </Button>
                  )}

                  <Badge variant={getStatusVariant(appointment.status)}>
                    {getStatusLabel(appointment.status, locale, t)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
