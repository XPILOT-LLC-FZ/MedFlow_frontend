"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { patientService } from "@/services/patientService";
import { aiChatService } from "@/services/aiChatService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { treatmentPlanService } from "@/services/treatmentPlanService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPatient, ApiService, ApiTreatmentPlan } from "@/types";

export default function DoctorTreatmentTimelinesPage() {
  const { locale } = useTranslation();
  const toast = useToastStore();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");

  const [plans, setPlans] = useState<ApiTreatmentPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [services, setServices] = useState<ApiService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [progressingPlanId, setProgressingPlanId] = useState<string | null>(
    null,
  );

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<ApiPatient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(
    null,
  );

  const [title, setTitle] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [predictedOutcome, setPredictedOutcome] = useState("");
  const [startDate, setStartDate] = useState("");
  const [totalSessions, setTotalSessions] = useState(1);

  const loadPlans = useCallback(
    async (targetDoctorId: string) => {
      setIsLoadingPlans(true);
      try {
        const data = await treatmentPlanService.getAll({
          doctorId: targetDoctorId,
        });
        setPlans(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : locale === "ar"
              ? "فشل تحميل الخطط العلاجية"
              : "Failed to load treatment timelines";
        toast.error(message);
      } finally {
        setIsLoadingPlans(false);
      }
    },
    [locale, toast],
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoadingServices(true);
        const fetchedServices = await servicesCatalogService
          .getAll({ isActive: "true" })
          .catch(() => [] as ApiService[]);
        setServices(fetchedServices);

        await fetchDoctors();

        const doctors = useStaffStore.getState().doctors;
        const currentDoctor = doctors.find(
          (doctor) =>
            doctor.userId === user?.id ||
            doctor.id === user?.id ||
            doctor.email?.toLowerCase() === user?.email?.toLowerCase(),
        );

        if (!currentDoctor) {
          setIsLoadingPlans(false);
          toast.error(
            locale === "ar"
              ? "لا يوجد ملف طبيب مرتبط بالحساب الحالي"
              : "No doctor profile linked to current account",
          );
          return;
        }

        setDoctorId(currentDoctor.id);
        setDoctorName(currentDoctor.fullName);
        await loadPlans(currentDoctor.id);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : locale === "ar"
              ? "فشل تهيئة صفحة الخطط العلاجية"
              : "Failed to initialize treatment timelines page";
        toast.error(message);
        setIsLoadingPlans(false);
      } finally {
        setIsLoadingServices(false);
      }
    };

    void initialize();
  }, [fetchDoctors, loadPlans, locale, toast, user?.email, user?.id]);

  const searchPatients = async () => {
    const normalized = patientQuery.trim();
    if (normalized.length < 2) {
      toast.error(
        locale === "ar"
          ? "أدخل حرفين على الأقل للبحث"
          : "Enter at least 2 characters to search",
      );
      return;
    }

    setIsSearchingPatients(true);
    try {
      const results = await patientService.getAll({ search: normalized });
      setPatientResults(results.slice(0, 8));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر البحث عن المرضى"
            : "Could not search patients";
      toast.error(message);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const createTimeline = async () => {
    if (!doctorId) {
      toast.error(
        locale === "ar"
          ? "لا يوجد ملف طبيب مرتبط بالحساب"
          : "No linked doctor profile found",
      );
      return;
    }

    if (!selectedPatient) {
      toast.error(locale === "ar" ? "اختر المريض أولاً" : "Select a patient first");
      return;
    }

    if (title.trim().length < 2) {
      toast.error(locale === "ar" ? "أدخل عنوان الخطة" : "Enter timeline title");
      return;
    }

    setIsSubmitting(true);
    try {
      await treatmentPlanService.create({
        patientId: selectedPatient.id,
        doctorId,
        title: title.trim(),
        serviceName: serviceName.trim() || undefined,
        description: description.trim() || undefined,
        predictedOutcome: predictedOutcome.trim() || undefined,
        totalSessions: Math.max(1, totalSessions),
        startDate: startDate || undefined,
      });

      toast.success(
        locale === "ar" ? "تم إنشاء الخطة العلاجية" : "Treatment timeline created",
      );

      setTitle("");
      setServiceName("");
      setDescription("");
      setPredictedOutcome("");
      setStartDate("");
      setTotalSessions(1);

      await loadPlans(doctorId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل إنشاء الخطة العلاجية"
            : "Failed to create treatment timeline";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAiDraft = async () => {
    if (!selectedPatient) {
      toast.error(locale === "ar" ? "اختر المريض أولاً" : "Select a patient first");
      return;
    }

    setIsGeneratingDraft(true);
    try {
      const prompt =
        locale === "ar"
          ? `أنشئ مسودة خطة علاجية قصيرة ومنظمة لمريض في عيادة.\nالبيانات:\n- اسم المريض: ${selectedPatient.fullName}\n- الخدمة: ${serviceName || "خطة عامة"}\n- العنوان المطلوب: ${title || "خطة علاج جديدة"}\n- عدد الجلسات: ${Math.max(1, totalSessions)}\n\nأعد النتيجة بصيغة JSON فقط بالمفاتيح التالية: description, predictedOutcome.`
          : `Generate a concise treatment timeline draft for a clinic patient.\nData:\n- Patient: ${selectedPatient.fullName}\n- Service: ${serviceName || "General plan"}\n- Requested title: ${title || "New treatment plan"}\n- Total sessions: ${Math.max(1, totalSessions)}\n\nReturn only valid JSON with keys: description, predictedOutcome.`;

      const response = await aiChatService.sendMessage(
        prompt,
        undefined,
        locale === "ar" ? "ar" : "en",
      );

      let nextDescription = response.message;
      let nextOutcome = predictedOutcome;

      const jsonStart = response.message.indexOf("{");
      const jsonEnd = response.message.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const maybeJson = response.message.slice(jsonStart, jsonEnd + 1);
        try {
          const parsed = JSON.parse(maybeJson) as {
            description?: string;
            predictedOutcome?: string;
          };

          if (parsed.description?.trim()) {
            nextDescription = parsed.description.trim();
          }

          if (parsed.predictedOutcome?.trim()) {
            nextOutcome = parsed.predictedOutcome.trim();
          }
        } catch {
          // Keep fallback text when model returns non-JSON content.
        }
      }

      setDescription(nextDescription);
      setPredictedOutcome(nextOutcome);

      toast.success(
        locale === "ar"
          ? "تم إنشاء مسودة بالذكاء الاصطناعي"
          : "AI draft generated",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل إنشاء مسودة AI"
            : "Failed to generate AI draft";
      toast.error(message);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const markSessionDone = async (plan: ApiTreatmentPlan) => {
    if (progressingPlanId === plan.id) {
      return;
    }

    setProgressingPlanId(plan.id);
    try {
      const updated = await treatmentPlanService.incrementProgress(plan.id, 1);
      setPlans((previous) =>
        previous.map((entry) => (entry.id === updated.id ? updated : entry)),
      );

      toast.success(
        locale === "ar" ? "تم تحديث تقدم الخطة" : "Timeline progress updated",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر تحديث التقدم"
            : "Could not update progress";
      toast.error(message);
    } finally {
      setProgressingPlanId(null);
    }
  };

  const completedCount = useMemo(
    () => plans.filter((plan) => plan.status === "COMPLETED").length,
    [plans],
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title={locale === "ar" ? "الخطط العلاجية" : "Treatment Timelines"}
        description={
          locale === "ar"
            ? "إنشاء ومتابعة خطط المرضى مع تثبيت الطبيب الحالي تلقائياً"
            : "Create and track patient timelines with doctor auto-locked to current profile"
        }
        action={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => doctorId && void loadPlans(doctorId)}
            disabled={!doctorId || isLoadingPlans}
          >
            <RefreshCw className="h-4 w-4" />
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              {locale === "ar" ? "إنشاء خطة جديدة" : "Create New Timeline"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "الطبيب" : "Doctor"}
              </label>
              <Input value={doctorName} disabled />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "بحث المريض" : "Patient Search"}
              </label>
              <div className="flex gap-2">
                <Input
                  value={patientQuery}
                  onChange={(event) => setPatientQuery(event.target.value)}
                  placeholder={
                    locale === "ar"
                      ? "ابحث بالاسم أو الهاتف"
                      : "Search by name or phone"
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void searchPatients()}
                  disabled={isSearchingPatients}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {patientResults.length > 0 && (
              <div className="rounded-lg border p-2 space-y-1">
                {patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full rounded-md border px-2 py-1.5 text-left text-sm ${
                      selectedPatient?.id === patient.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium">{patient.fullName}</p>
                    <p className="text-xs text-muted-foreground">{patient.phone || "-"}</p>
                  </button>
                ))}
              </div>
            )}

            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={locale === "ar" ? "عنوان الخطة" : "Timeline title"}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "الخدمة" : "Service"}
              </label>
              <select
                value={serviceName}
                onChange={(event) => setServiceName(event.target.value)}
                className="w-full border rounded-md bg-background px-3 py-2 text-sm"
                disabled={isLoadingServices}
              >
                <option value="">
                  {locale === "ar"
                    ? "خطة عامة (بدون خدمة محددة)"
                    : "General plan (no specific service)"}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.name} ({service.durationMinutes}m)
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              min={1}
              value={totalSessions}
              onChange={(event) => setTotalSessions(Number(event.target.value) || 1)}
              placeholder={locale === "ar" ? "عدد الجلسات" : "Total sessions"}
            />

            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />

            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={locale === "ar" ? "وصف الخطة" : "Timeline description"}
            />

            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={predictedOutcome}
              onChange={(event) => setPredictedOutcome(event.target.value)}
              placeholder={
                locale === "ar"
                  ? "النتيجة المتوقعة (اختياري)"
                  : "Predicted outcome (optional)"
              }
            />

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => void generateAiDraft()}
              disabled={isGeneratingDraft || !selectedPatient}
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingDraft
                ? locale === "ar"
                  ? "جارٍ التوليد..."
                  : "Generating..."
                : locale === "ar"
                  ? "توليد مسودة AI"
                  : "Generate AI Draft"}
            </Button>

            <Button
              className="w-full"
              onClick={() => void createTimeline()}
              disabled={isSubmitting || !doctorId}
            >
              {isSubmitting
                ? locale === "ar"
                  ? "جارٍ الإنشاء..."
                  : "Creating..."
                : locale === "ar"
                  ? "إنشاء الخطة"
                  : "Create Timeline"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{locale === "ar" ? "الخطط الحالية" : "Active Timelines"}</span>
              <Badge variant="outline">
                {locale === "ar"
                  ? `مكتمل ${completedCount}/${plans.length}`
                  : `Completed ${completedCount}/${plans.length}`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingPlans ? (
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "جاري تحميل الخطط..." : "Loading timelines..."}
              </p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد خطط علاجية بعد"
                  : "No treatment timelines yet"}
              </p>
            ) : (
              plans.map((plan) => {
                const percentage = Math.min(
                  100,
                  Math.round(
                    (plan.completedSessions / Math.max(1, plan.totalSessions)) * 100,
                  ),
                );

                return (
                  <div key={plan.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium text-sm">{plan.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {plan.patientName} •{" "}
                          {plan.serviceName ||
                            (locale === "ar" ? "خطة عامة" : "General Plan")}
                        </p>
                      </div>
                      <Badge variant={plan.status === "COMPLETED" ? "success" : "info"}>
                        {plan.status}
                      </Badge>
                    </div>

                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {locale === "ar" ? "الجلسات" : "Sessions"}: {plan.completedSessions}/
                        {plan.totalSessions}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {plan.startDate || "-"}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={
                        plan.status === "COMPLETED" || progressingPlanId === plan.id
                      }
                      onClick={() => void markSessionDone(plan)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {progressingPlanId === plan.id
                        ? locale === "ar"
                          ? "جارٍ التحديث..."
                          : "Updating..."
                        : locale === "ar"
                          ? "تسجيل جلسة مكتملة"
                          : "Mark Session Completed"}
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
