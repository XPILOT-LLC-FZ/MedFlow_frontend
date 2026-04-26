"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  TrendingUp,
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
  const { t, locale } = useTranslation();
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

  const activeCount = useMemo(
    () => plans.filter((plan) => plan.status !== "COMPLETED").length,
    [plans],
  );

  const completedSessions = useMemo(
    () => plans.reduce((total, plan) => total + Math.max(0, plan.completedSessions), 0),
    [plans],
  );

  const totalSessionTarget = useMemo(
    () => plans.reduce((total, plan) => total + Math.max(1, plan.totalSessions), 0),
    [plans],
  );

  const completionRate = useMemo(
    () => (plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0),
    [completedCount, plans.length],
  );

  return (
    <div className="max-w-6xl space-y-5 lg:space-y-6">
      <PageHeader
        title={t("treatmentTimelines")}
        description={t("treatmentTimelinesDesc")}
        action={
          <Button
            variant="outline"
            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => doctorId && void loadPlans(doctorId)}
            disabled={!doctorId || isLoadingPlans}
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("totalTimelines")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{plans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-300">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("activeTimelines")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("completed")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("completionRate")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1 rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-100">
              <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {t("createNewTimeline")}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("timelineFormDesc")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("dr")}
              </label>
              <Input
                value={doctorName}
                disabled
                className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("patientSearch")}
              </label>
              <div className="flex gap-2">
                <Input
                  value={patientQuery}
                  onChange={(event) => setPatientQuery(event.target.value)}
                  className="border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder={t("searchByNameOrPhone")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => void searchPatients()}
                  disabled={isSearchingPatients}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {selectedPatient && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-2.5 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {t("selectedPatient")}: {selectedPatient.fullName}
                </div>
              )}
            </div>

            {patientResults.length > 0 && (
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40 p-2 dark:border-slate-700 dark:bg-slate-800/40">
                {patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full rounded-md border px-2.5 py-2 text-left text-sm transition-colors ${
                      selectedPatient?.id === patient.id
                        ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/40"
                        : "border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-100">{patient.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{patient.phone || "-"}</p>
                  </button>
                ))}
              </div>
            )}

            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder={t("timelineTitle")}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("services")}
              </label>
              <select
                value={serviceName}
                onChange={(event) => setServiceName(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900/50"
                disabled={isLoadingServices}
              >
                <option value="">
                  {t("generalPlan")}
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
              className="border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder={t("totalSessions")}
            />

            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />

            <textarea
              className="min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/50"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("timelineDescription")}
            />

            <textarea
              className="min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/50"
              value={predictedOutcome}
              onChange={(event) => setPredictedOutcome(event.target.value)}
              placeholder={t("predictedOutcome")}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => void generateAiDraft()}
              disabled={isGeneratingDraft || !selectedPatient}
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingDraft
                ? t("generating")
                : t("generateAiDraft")}
            </Button>

            <Button className="w-full" onClick={() => void createTimeline()} disabled={isSubmitting || !doctorId}>
              {isSubmitting
                ? t("generating")
                : t("createTimeline")}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base text-slate-800 dark:text-slate-100">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{t("activeTimelines")}</span>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {t("completedPlans")
                  .replace("{completed}", String(completedCount))
                  .replace("{total}", String(plans.length))}
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("completedSessionsOf")
                .replace("{completed}", String(completedSessions))
                .replace("{total}", String(totalSessionTarget))}
            </p>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {isLoadingPlans ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((key) => (
                  <div
                    key={key}
                    className="h-[94px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/60"
                  />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
                <Stethoscope className="mx-auto h-5 w-5 text-slate-400 dark:text-slate-500" />
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("noTimelinesYet")}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("startByCreatingTimeline")}
                </p>
              </div>
            ) : (
              plans.map((plan) => {
                const percentage = Math.min(
                  100,
                  Math.round(
                    (plan.completedSessions / Math.max(1, plan.totalSessions)) * 100,
                  ),
                );

                return (
                  <div
                    key={plan.id}
                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{plan.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {plan.patientName} •{" "}
                          {plan.serviceName || t("generalPlan")}
                        </p>
                      </div>
                      <Badge variant={plan.status === "COMPLETED" ? "success" : "info"}>
                        {t(plan.status.toLowerCase() as Parameters<typeof t>[0])}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{t("progress")}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{percentage}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full transition-all ${
                          plan.status === "COMPLETED"
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-blue-500 dark:bg-blue-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                        {t("sessionsCount")}: {plan.completedSessions}/
                        {plan.totalSessions}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {plan.startDate || "-"}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                        {plan.description}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1 border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        disabled={
                          plan.status === "COMPLETED" || progressingPlanId === plan.id
                        }
                        onClick={() => void markSessionDone(plan)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {progressingPlanId === plan.id
                          ? t("updating")
                          : t("markSessionCompleted")}
                      </Button>
                    </div>
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
