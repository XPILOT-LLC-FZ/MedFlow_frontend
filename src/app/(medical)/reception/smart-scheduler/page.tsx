"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Search, Sparkles, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { bookingService } from "@/services/bookingService";
import { patientService } from "@/services/patientService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import type { ApiPatient, ApiService, SmartRecommendation } from "@/types";

export default function ReceptionSmartSchedulerPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { doctors, fetchDoctors } = useStaffStore();
  const toast = useToastStore();

  const [patientSearch, setPatientSearch] = useState("");
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [patientResults, setPatientResults] = useState<ApiPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);

  const [services, setServices] = useState<ApiService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    void fetchDoctors();
    void servicesCatalogService
      .getAll({ isActive: "true" })
      .then((data) => setServices(data))
      .catch(() => setServices([]));
  }, [fetchDoctors]);

  useEffect(() => {
    let isAlive = true;

    const loadRecommendations = async () => {
      if (!selectedPatient?.id) {
        setRecommendations([]);
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        const response = await bookingService.getSmartRecommendations({
          patientId: selectedPatient.id,
          doctorId: selectedDoctorId || undefined,
          serviceId: selectedServiceId || undefined,
          horizonDays: 7,
          limit: 10,
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
  }, [locale, selectedDoctorId, selectedPatient?.id, selectedServiceId, toast]);

  const activeDoctors = doctors.filter((doctor) => doctor.status === "ACTIVE");

  const searchPatients = async () => {
    const query = patientSearch.trim();
    if (query.length < 2) {
      toast.error(
        locale === "ar"
          ? "أدخل حرفين على الأقل للبحث"
          : "Enter at least 2 characters to search",
      );
      return;
    }

    setIsSearchingPatients(true);
    try {
      const results = await patientService.getAll({ search: query });
      setPatientResults(results);

      if (results.length === 0) {
        toast.success(
          locale === "ar"
            ? "لا يوجد مريض مطابق، يمكنك إنشاء سجل جديد"
            : "No matching patient found. You can create a new patient record.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل البحث عن المرضى"
            : "Failed to search patients";
      toast.error(message);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const formatRecommendationDate = (dateValue: string) => {
    const date = new Date(`${dateValue}T00:00:00.000Z`);
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const openBookingWithRecommendation = (recommendation: SmartRecommendation) => {
    if (!selectedPatient?.id) {
      return;
    }

    const params = new URLSearchParams({
      patientId: selectedPatient.id,
      doctorId: recommendation.doctorId,
      date: recommendation.date,
      time: recommendation.startTime,
    });

    router.push(`/reception/booking?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={locale === "ar" ? "الجدولة الذكية" : "Smart Scheduler"}
        description={
          locale === "ar"
            ? "ابحث عن المريض ثم اختر أفضل موعد مقترح بسرعة"
            : "Search a patient, then pick the best recommended slot quickly"
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundPlus className="h-4 w-4 text-primary" />
            {locale === "ar" ? "اختيار المريض" : "Select Patient"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder={locale === "ar" ? "ابحث بالاسم أو الجوال" : "Search by name or phone"}
                className="pl-10"
              />
            </div>
            <Button onClick={searchPatients} disabled={isSearchingPatients}>
              {isSearchingPatients
                ? locale === "ar"
                  ? "جارٍ البحث..."
                  : "Searching..."
                : locale === "ar"
                  ? "بحث"
                  : "Search"}
            </Button>
          </div>

          {selectedPatient && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="font-medium">{selectedPatient.fullName}</span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-muted-foreground">{selectedPatient.phone || selectedPatient.email || "-"}</span>
            </div>
          )}

          {patientResults.length > 0 && (
            <div className="space-y-2">
              {patientResults.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left text-sm transition hover:bg-muted ${
                    selectedPatient?.id === patient.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <p className="font-medium">{patient.fullName}</p>
                  <p className="text-muted-foreground">{patient.phone || patient.email || "-"}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {locale === "ar" ? "تصفية التوصيات" : "Recommendation Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select
            value={selectedDoctorId}
            onChange={(event) => setSelectedDoctorId(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">{locale === "ar" ? "أي طبيب" : "Any doctor"}</option>
            {activeDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.fullName}
              </option>
            ))}
          </select>

          <select
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
          {!selectedPatient?.id ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "اختر مريضاً أولاً لعرض التوصيات."
                : "Select a patient first to view recommendations."}
            </p>
          ) : isLoadingRecommendations ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "جاري تحليل أفضل المواعيد المتاحة..."
                : "Analyzing the best available slots..."}
            </p>
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد توصيات حالياً. جرّب تغيير الفلاتر أو استخدم الحجز اليدوي."
                : "No recommendations right now. Try different filters or use manual booking."}
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

                  <Button className="mt-4 w-full" onClick={() => openBookingWithRecommendation(recommendation)}>
                    {locale === "ar" ? "فتح في صفحة الحجز" : "Open In Booking"}
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
