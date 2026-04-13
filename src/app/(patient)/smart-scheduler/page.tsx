"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePatientStore } from "@/stores/usePatientStore";
import { useToastStore } from "@/stores/useToastStore";
import { bookingService } from "@/services/bookingService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import type { ApiService, SmartRecommendation } from "@/types";

export default function PatientSmartSchedulerPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { user } = useAuthStore();
  const { currentPatient, fetchMe } = usePatientStore();
  const toast = useToastStore();

  const [services, setServices] = useState<ApiService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void fetchMe();
    void servicesCatalogService
      .getAll({ isActive: "true" })
      .then((data) => setServices(data))
      .catch(() => setServices([]));
  }, [fetchMe, user?.id]);

  useEffect(() => {
    let isAlive = true;

    const loadRecommendations = async () => {
      setIsLoadingRecommendations(true);
      try {
        const response = await bookingService.getSmartRecommendations({
          patientId: currentPatient?.id,
          serviceId: selectedServiceId || undefined,
          horizonDays: 7,
          limit: 12,
        });

        if (isAlive) {
          setRecommendations(response.recommendations || []);
        }
      } catch {
        if (isAlive) {
          setRecommendations([]);
          toast.error(
            locale === "ar"
              ? "تعذر تحميل التوصيات الذكية حالياً"
              : "Unable to load smart recommendations right now",
          );
        }
      } finally {
        if (isAlive) {
          setIsLoadingRecommendations(false);
        }
      }
    };

    void loadRecommendations();

    return () => {
      isAlive = false;
    };
  }, [currentPatient?.id, locale, selectedServiceId, toast]);

  const formatRecommendationDate = (dateValue: string) => {
    const date = new Date(`${dateValue}T00:00:00.000Z`);
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleUseRecommendation = (recommendation: SmartRecommendation) => {
    const params = new URLSearchParams({
      doctorId: recommendation.doctorId,
      date: recommendation.date,
      time: recommendation.startTime,
    });

    if (selectedServiceId) {
      params.set("serviceId", selectedServiceId);
    }

    router.push(`/appointments?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={locale === "ar" ? "الجدولة الذكية" : "Smart Scheduler"}
        description={
          locale === "ar"
            ? "أفضل الأوقات المقترحة بناء على توافر الأطباء"
            : "Best appointment options based on doctor availability"
        }
      />

      {!currentPatient?.id && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {locale === "ar"
            ? "لتحسين التوصيات، أكمل ملف المريض أولاً."
            : "Complete your patient profile first for better recommendations."}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {locale === "ar" ? "تصفية التوصيات" : "Recommendation Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm md:max-w-sm"
          >
            <option value="">{locale === "ar" ? "كل الخدمات" : "All services"}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            {locale === "ar" ? "الخيارات المقترحة" : "Suggested Time Slots"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecommendations ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "جاري تحليل أفضل المواعيد المتاحة..."
                : "Analyzing the best available slots..."}
            </p>
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد توصيات حالياً. جرّب تغيير الفلاتر أو الحجز اليدوي."
                : "No recommendations right now. Try changing filters or proceed with manual booking."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recommendations.map((recommendation) => (
                <div
                  key={`${recommendation.doctorId}-${recommendation.date}-${recommendation.startTime}`}
                  className="rounded-xl border p-4"
                >
                  <p className="font-medium">{recommendation.doctorName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {recommendation.specialization || (locale === "ar" ? "تخصص عام" : "General")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatRecommendationDate(recommendation.date)}
                  </p>
                  <p className="text-sm font-medium text-primary">{recommendation.startTime}</p>

                  {recommendation.reasons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recommendation.reasons.slice(0, 2).map((reason) => (
                        <Badge key={reason} variant="secondary">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button className="mt-4 w-full" onClick={() => handleUseRecommendation(recommendation)}>
                    {locale === "ar" ? "استخدام هذا الموعد" : "Use This Slot"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
