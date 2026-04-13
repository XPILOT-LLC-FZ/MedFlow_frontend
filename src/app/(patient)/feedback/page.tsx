"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { surveyService } from "@/services/surveyService";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiSurvey, SubmitSurveyPayload } from "@/types";

type SurveyDraft = SubmitSurveyPayload & {
  feedback: string;
};

const DEFAULT_DRAFT: SurveyDraft = {
  overallSatisfaction: 5,
  doctorRating: 5,
  wouldRecommend: true,
  feedback: "",
};

export default function FeedbackPage() {
  const { locale } = useTranslation();
  const toast = useToastStore();

  const [surveys, setSurveys] = useState<ApiSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingSurveyId, setSubmittingSurveyId] = useState<string | null>(null);
  const [draftBySurveyId, setDraftBySurveyId] = useState<Record<string, SurveyDraft>>({});

  const loadSurveys = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await surveyService.getMySurveys();
      setSurveys(data);
      setDraftBySurveyId((previous) => {
        const next = { ...previous };
        data.forEach((survey) => {
          if (!next[survey.id]) {
            next[survey.id] = { ...DEFAULT_DRAFT };
          }
        });
        return next;
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر تحميل طلبات التقييم"
            : "Failed to load feedback requests";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [locale, toast]);

  useEffect(() => {
    void loadSurveys();
  }, [loadSurveys]);

  const pending = useMemo(
    () => surveys.filter((survey) => survey.status === "PENDING"),
    [surveys],
  );
  const completed = useMemo(
    () => surveys.filter((survey) => survey.status === "COMPLETED"),
    [surveys],
  );

  const updateDraft = (surveyId: string, patch: Partial<SurveyDraft>) => {
    setDraftBySurveyId((previous) => ({
      ...previous,
      [surveyId]: {
        ...(previous[surveyId] || DEFAULT_DRAFT),
        ...patch,
      },
    }));
  };

  const submitFeedback = async (survey: ApiSurvey) => {
    const draft = draftBySurveyId[survey.id] || DEFAULT_DRAFT;
    setSubmittingSurveyId(survey.id);

    try {
      const updated = await surveyService.submitSurvey(survey.id, {
        overallSatisfaction: draft.overallSatisfaction,
        doctorRating: draft.doctorRating,
        wouldRecommend: draft.wouldRecommend,
        feedback: draft.feedback.trim() || undefined,
      });

      setSurveys((previous) =>
        previous.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry)),
      );

      toast.success(
        locale === "ar" ? "شكراً! تم إرسال التقييم" : "Thank you! Feedback submitted",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل إرسال التقييم"
            : "Failed to submit feedback";
      toast.error(message);
    } finally {
      setSubmittingSurveyId(null);
    }
  };

  const renderAppointmentContext = (survey: ApiSurvey) => {
    const appointment = survey.appointment;
    if (!appointment) {
      return (
        <p className="text-xs text-muted-foreground">
          {locale === "ar" ? "بيانات الموعد غير متاحة" : "Appointment details unavailable"}
        </p>
      );
    }

    return (
      <p className="text-xs text-muted-foreground">
        {appointment.date} • {appointment.startTime} • {appointment.doctorName || survey.doctorName || "-"}
      </p>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={locale === "ar" ? "التقييمات" : "Feedback"}
        description={
          locale === "ar"
            ? "قيّم تجربتك بعد كل جلسة مكتملة"
            : "Share your experience after completed sessions"
        }
        action={
          <Button variant="outline" className="gap-2" onClick={() => void loadSurveys()}>
            <RefreshCw className="h-4 w-4" />
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {locale === "ar" ? "بانتظار تقييمك" : "Pending Feedback"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "جاري تحميل الطلبات..." : "Loading requests..."}
            </p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "لا توجد طلبات تقييم حالياً" : "No pending feedback requests"}
            </p>
          ) : (
            pending.map((survey) => {
              const draft = draftBySurveyId[survey.id] || DEFAULT_DRAFT;

              return (
                <div key={survey.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-medium">{survey.doctorName || "Doctor"}</p>
                      {renderAppointmentContext(survey)}
                    </div>
                    <Badge variant="warning">
                      {locale === "ar" ? "بانتظار الإرسال" : "Pending"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="text-sm">
                      <span className="block mb-1">
                        {locale === "ar" ? "رضاك العام" : "Overall Satisfaction"}
                      </span>
                      <select
                        className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                        value={draft.overallSatisfaction}
                        onChange={(event) =>
                          updateDraft(survey.id, {
                            overallSatisfaction: Number(event.target.value),
                          })
                        }
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={`overall-${survey.id}-${value}`} value={value}>
                            {value}/5
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="block mb-1">
                        {locale === "ar" ? "تقييم الطبيب" : "Doctor Rating"}
                      </span>
                      <select
                        className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                        value={draft.doctorRating}
                        onChange={(event) =>
                          updateDraft(survey.id, {
                            doctorRating: Number(event.target.value),
                          })
                        }
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={`doctor-${survey.id}-${value}`} value={value}>
                            {value}/5
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.wouldRecommend}
                      onChange={(event) =>
                        updateDraft(survey.id, {
                          wouldRecommend: event.target.checked,
                        })
                      }
                    />
                    {locale === "ar"
                      ? "أوصي بهذه العيادة"
                      : "I would recommend this clinic"}
                  </label>

                  <textarea
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={draft.feedback}
                    onChange={(event) =>
                      updateDraft(survey.id, {
                        feedback: event.target.value,
                      })
                    }
                    placeholder={
                      locale === "ar"
                        ? "اكتب ملاحظاتك (اختياري)"
                        : "Write additional comments (optional)"
                    }
                  />

                  <Button
                    type="button"
                    onClick={() => void submitFeedback(survey)}
                    disabled={submittingSurveyId === survey.id}
                  >
                    {submittingSurveyId === survey.id
                      ? locale === "ar"
                        ? "جارٍ الإرسال..."
                        : "Submitting..."
                      : locale === "ar"
                        ? "إرسال التقييم"
                        : "Submit Feedback"}
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4" />
            {locale === "ar" ? "التقييمات المرسلة" : "Submitted Feedback"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد تقييمات مرسلة بعد"
                : "No submitted feedback yet"}
            </p>
          ) : (
            completed.map((survey) => (
              <div key={survey.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium">{survey.doctorName || "Doctor"}</p>
                  <Badge variant="success">
                    {locale === "ar" ? "مكتمل" : "Completed"}
                  </Badge>
                </div>
                {renderAppointmentContext(survey)}
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "ar" ? "الرضا العام" : "Overall"}: {survey.overallSatisfaction ?? "-"}/5 • {locale === "ar" ? "الطبيب" : "Doctor"}: {survey.doctorRating ?? "-"}/5
                </p>
                {survey.feedback && (
                  <p className="text-sm mt-2">{survey.feedback}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
