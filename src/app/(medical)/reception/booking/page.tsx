"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Search, Sparkles, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useStaffStore } from "@/stores/useStaffStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { bookingService } from "@/services/bookingService";
import { patientService } from "@/services/patientService";
import { formatDateKey } from "@/lib/dateUtils";
import type { ApiPatient, CreatePatientPayload, SmartRecommendation } from "@/types";

function BookingPageContent() {
  const searchParams = useSearchParams();
  const { locale } = useTranslation();
  const { doctors, fetchDoctors } = useStaffStore();
  const { addAppointment } = useBookingStore();
  const toast = useToastStore();

  const [step, setStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smartRecommendations, setSmartRecommendations] = useState<SmartRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<ApiPatient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const prefilledScheduleAppliedRef = useRef(false);

  const prefilledPatientId = searchParams.get("patientId");
  const prefilledDoctorId = searchParams.get("doctorId");
  const prefilledDate = searchParams.get("date");
  const prefilledTime = searchParams.get("time");

  useEffect(() => {
    void fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    if (!prefilledPatientId) {
      return;
    }

    let isAlive = true;

    const loadPrefilledPatient = async () => {
      try {
        const patient = await patientService.getById(prefilledPatientId);
        if (!isAlive) {
          return;
        }

        setSelectedPatient(patient);
        setPatientName(patient.fullName || "");
        setPatientPhone(patient.phone || "");
        setPatientEmail(patient.email || "");
        setPatientSearch(patient.fullName || "");
        setStep(1);
      } catch {
        if (isAlive) {
          toast.error(
            locale === "ar"
              ? "تعذر تحميل بيانات المريض المحدد"
              : "Could not load selected patient details",
          );
        }
      }
    };

    void loadPrefilledPatient();

    return () => {
      isAlive = false;
    };
  }, [locale, prefilledPatientId, toast]);

  const activeDoctors = doctors.filter((doctor) => doctor.status === "ACTIVE");

  useEffect(() => {
    if (!prefilledDoctorId) {
      return;
    }

    const matchedDoctor = activeDoctors.find((doctor) => doctor.id === prefilledDoctorId);
    if (!matchedDoctor) {
      return;
    }

    setSelectedDoctor(matchedDoctor.id);

    if (selectedPatient) {
      setStep((currentStep) => (currentStep > 2 ? currentStep : 2));
    }
  }, [activeDoctors, prefilledDoctorId, selectedPatient]);

  useEffect(() => {
    if (prefilledScheduleAppliedRef.current || !selectedPatient) {
      return;
    }

    if (prefilledDate) {
      const [year, month, day] = prefilledDate.split("-").map(Number);
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        setSelectedDate(new Date(year, month - 1, day));
      }
    }

    if (prefilledTime) {
      setSelectedTime(prefilledTime);
    }

    if (prefilledDate || prefilledTime) {
      setStep((currentStep) => (currentStep > 2 ? currentStep : 2));
    }

    prefilledScheduleAppliedRef.current = true;
  }, [prefilledDate, prefilledTime, selectedPatient]);

  useEffect(() => {
    let isAlive = true;

    const loadSlots = async () => {
      if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setSlotsLoading(true);
      try {
        const slots = await bookingService.getAvailableSlots(
          selectedDoctor,
          formatDateKey(selectedDate),
        );

        if (isAlive) {
          setAvailableSlots(slots);
        }
      } catch {
        if (isAlive) {
          setAvailableSlots([]);
        }
      } finally {
        if (isAlive) {
          setSlotsLoading(false);
        }
      }
    };

    void loadSlots();

    return () => {
      isAlive = false;
    };
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    let isAlive = true;

    const loadRecommendations = async () => {
      if (step !== 2 || !selectedDoctor) {
        setSmartRecommendations([]);
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        const response = await bookingService.getSmartRecommendations({
          patientId: selectedPatient?.id,
          doctorId: selectedDoctor,
          horizonDays: 7,
          limit: 8,
        });

        if (isAlive) {
          setSmartRecommendations(response.recommendations || []);
        }
      } catch {
        if (isAlive) {
          setSmartRecommendations([]);
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
  }, [selectedDoctor, selectedPatient?.id, step]);

  const applySmartRecommendation = (recommendation: SmartRecommendation) => {
    const [year, month, day] = recommendation.date.split("-").map(Number);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      setSelectedDate(new Date(year, month - 1, day));
    }

    setSelectedTime(recommendation.startTime);
  };

  const formatRecommendationDate = (dateValue: string) => {
    const date = new Date(`${dateValue}T00:00:00.000Z`);
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

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

  const selectExistingPatient = (patient: ApiPatient) => {
    setSelectedPatient(patient);
    setPatientName(patient.fullName || "");
    setPatientPhone(patient.phone || "");
    setPatientEmail(patient.email || "");
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientResults([]);
    setPatientSearch("");
  };

  const proceedFromPatientStep = () => {
    if (selectedPatient) {
      setStep(1);
      return;
    }

    if (patientName.trim().length < 2) {
      toast.error(locale === "ar" ? "أدخل اسم المريض" : "Please enter patient name");
      return;
    }

    setStep(1);
  };

  const ensurePatientRecord = async (): Promise<ApiPatient> => {
    if (selectedPatient?.id) {
      return selectedPatient;
    }

    const normalizedName = patientName.trim();
    if (normalizedName.length < 2) {
      throw new Error(locale === "ar" ? "اسم المريض مطلوب" : "Patient name is required");
    }

    const searchSeed = patientSearch.trim() || normalizedName;
    const existing = await patientService.getAll({ search: searchSeed });
    const exactMatch = existing.find((patient) => {
      const sameName = patient.fullName?.toLowerCase() === normalizedName.toLowerCase();
      const sameEmail =
        patientEmail.trim().length > 0 &&
        patient.email?.toLowerCase() === patientEmail.trim().toLowerCase();
      const samePhone =
        patientPhone.trim().length > 0 &&
        patient.phone?.trim() === patientPhone.trim();

      return Boolean(sameName || sameEmail || samePhone);
    });

    if (exactMatch) {
      setSelectedPatient(exactMatch);
      return exactMatch;
    }

    const createdPatient = await patientService.create({
      fullName: normalizedName,
      phone: patientPhone.trim() || undefined,
      email: patientEmail.trim().toLowerCase() || undefined,
    } as CreatePatientPayload);

    setSelectedPatient(createdPatient);
    return createdPatient;
  };

  const handleBookAppointment = async () => {
    const doctor = activeDoctors.find((item) => item.id === selectedDoctor);

    if (!doctor || !selectedDate || !selectedTime) {
      toast.error(
        locale === "ar"
          ? "اختر الطبيب والتاريخ والوقت"
          : "Please select doctor, date, and time",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const patientRecord = await ensurePatientRecord();

      await addAppointment({
        patientId: patientRecord.id,
        patientName: patientRecord.fullName || patientName.trim(),
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialty: doctor.specialization || "General",
        date: formatDateKey(selectedDate),
        time: selectedTime,
        status: "scheduled",
        type: "Consultation",
      });

      toast.success(
        locale === "ar"
          ? "تم حجز الموعد بنجاح"
          : "Appointment booked successfully",
      );
      setStep(3);
    } catch (error) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل حجز الموعد"
            : "Failed to book appointment";

      const lowered = rawMessage.toLowerCase();
      const isDuplicateEmail = lowered.includes("email") && lowered.includes("already exists");
      const isDuplicatePhone = lowered.includes("phone") && lowered.includes("already exists");

      if (isDuplicateEmail || isDuplicatePhone) {
        toast.error(
          locale === "ar"
            ? "بيانات المريض موجودة بالفعل. اختر المريض من نتائج البحث بدل إنشاء سجل جديد."
            : "A matching patient already exists. Select the patient from search results instead of creating a new record.",
        );
      } else {
        toast.error(rawMessage);
      }

      // In case of conflict, refresh slots so reception can pick another slot quickly.
      if (selectedDoctor && selectedDate) {
        try {
          const refreshed = await bookingService.getAvailableSlots(
            selectedDoctor,
            formatDateKey(selectedDate),
          );
          setAvailableSlots(refreshed);
          setSelectedTime(null);
        } catch {
          // no-op
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBookingFlow = () => {
    setStep(0);
    setSelectedDoctor(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setAvailableSlots([]);

    setPatientSearch("");
    setPatientResults([]);
    setSelectedPatient(null);
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={locale === "ar" ? "حجز موعد جديد" : "New Booking"}
        description={
          locale === "ar"
            ? "بحث المريض ثم اختيار الطبيب والموعد"
            : "Search patient first, then choose doctor and slot"
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        {["Patient", "Doctor", "Schedule", "Done"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < step ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span className={`text-sm ${index <= step ? "font-medium" : "text-muted-foreground"}`}>
              {locale === "ar"
                ? index === 0
                  ? "المريض"
                  : index === 1
                    ? "الطبيب"
                    : index === 2
                      ? "الموعد"
                      : "اكتمل"
                : label}
            </span>
            {index < 3 && <div className={`w-8 h-px ${index < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {locale === "ar" ? "بحث/تسجيل المريض" : "Patient Search / Registration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    disabled={isSearchingPatients}
                    placeholder={
                      locale === "ar"
                        ? "ابحث بالاسم أو الهاتف أو البريد"
                        : "Search by name, phone, or email"
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void searchPatients()}
                  disabled={isSearchingPatients}
                >
                  {isSearchingPatients
                    ? locale === "ar"
                      ? "جاري البحث..."
                      : "Searching..."
                    : locale === "ar"
                      ? "بحث"
                      : "Search"}
                </Button>
              </div>

              {patientResults.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">
                    {locale === "ar" ? "نتائج البحث" : "Search Results"}
                  </p>
                  {patientResults.slice(0, 6).map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted"
                      onClick={() => selectExistingPatient(patient)}
                    >
                      <p className="text-sm font-medium">{patient.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.phone || "-"} {patient.email ? `• ${patient.email}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selectedPatient && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                  <p className="text-sm font-medium text-emerald-700">
                    {locale === "ar" ? "تم اختيار مريض موجود" : "Existing patient selected"}
                  </p>
                  <p className="text-sm mt-1">{selectedPatient.fullName}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-2 h-7 px-2 text-xs"
                    onClick={clearSelectedPatient}
                  >
                    {locale === "ar" ? "استخدام مريض جديد" : "Use a new patient instead"}
                  </Button>
                </div>
              )}

              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserRoundPlus className="h-4 w-4" />
                  {locale === "ar" ? "بيانات المريض" : "Patient Details"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                    placeholder={locale === "ar" ? "الاسم الكامل" : "Full name"}
                  />
                  <Input
                    value={patientPhone}
                    onChange={(event) => setPatientPhone(event.target.value)}
                    placeholder={locale === "ar" ? "رقم الهاتف" : "Phone number"}
                  />
                  <Input
                    value={patientEmail}
                    onChange={(event) => setPatientEmail(event.target.value)}
                    placeholder={locale === "ar" ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={proceedFromPatientStep}>
                  {locale === "ar" ? "التالي" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === "ar" ? "اختيار الطبيب" : "Select Doctor"}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeDoctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا يوجد أطباء متاحون حالياً" : "No active doctors available"}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      className={`rounded-lg border p-3 text-left transition ${
                        selectedDoctor === doctor.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedDoctor(doctor.id)}
                    >
                      <p className="font-medium text-sm">{doctor.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doctor.specialization || "General"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              {locale === "ar" ? "رجوع" : "Back"}
            </Button>
            <Button onClick={() => setStep(2)} disabled={!selectedDoctor}>
              {locale === "ar" ? "التالي" : "Next"}
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {locale === "ar" ? "الجدولة الذكية" : "Smart Scheduler"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRecommendations ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "جاري تجهيز أفضل المواعيد..."
                    : "Preparing best recommendations..."}
                </p>
              ) : smartRecommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "لا توجد توصيات حالياً. اختر التاريخ يدوياً."
                    : "No recommendations available right now. Select date manually."}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                  {smartRecommendations.map((recommendation) => {
                    const isSelected =
                      selectedTime === recommendation.startTime &&
                      selectedDate &&
                      formatDateKey(selectedDate) === recommendation.date;

                    return (
                      <button
                        key={`${recommendation.doctorId}-${recommendation.date}-${recommendation.startTime}`}
                        type="button"
                        onClick={() => applySmartRecommendation(recommendation)}
                        className={`rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "hover:bg-muted"
                        }`}
                      >
                        <p className="text-sm font-medium">{formatRecommendationDate(recommendation.date)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{recommendation.startTime}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {recommendation.doctorName}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <MiniCalendar
            locale={locale}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            minDate={new Date()}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {locale === "ar" ? "الأوقات المتاحة" : "Available Time Slots"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {slotsLoading && (
                <p className="col-span-3 text-sm text-muted-foreground">
                  {locale === "ar" ? "جاري تحميل الأوقات..." : "Loading available slots..."}
                </p>
              )}

              {!slotsLoading &&
                availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    size="sm"
                    variant={selectedTime === slot ? "default" : "outline"}
                    className="gap-1"
                    onClick={() => setSelectedTime(slot)}
                  >
                    <Clock className="h-3 w-3" />
                    {slot}
                  </Button>
                ))}

              {!slotsLoading && availableSlots.length === 0 && (
                <p className="col-span-3 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "لا توجد أوقات متاحة في هذا اليوم"
                    : "No available slots for this date"}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              {locale === "ar" ? "رجوع" : "Back"}
            </Button>
            <Button onClick={() => void handleBookAppointment()} disabled={!selectedTime || isSubmitting}>
              {isSubmitting
                ? locale === "ar"
                  ? "جارٍ الحجز..."
                  : "Booking..."
                : locale === "ar"
                  ? "تأكيد الحجز"
                  : "Confirm Booking"}
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center">
          <Card className="p-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">
              {locale === "ar" ? "تم الحجز بنجاح" : "Booking Confirmed"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "تم تسجيل الموعد وربطه بالمريض والطبيب"
                : "Appointment was created and linked to patient and doctor."}
            </p>
            <Button onClick={resetBookingFlow} variant="outline" className="w-full">
              {locale === "ar" ? "حجز جديد" : "Create Another Booking"}
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
