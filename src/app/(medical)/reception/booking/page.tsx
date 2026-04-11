"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Search, UserRoundPlus } from "lucide-react";
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
import type { ApiPatient } from "@/types";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BookingPage() {
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

  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<ApiPatient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  useEffect(() => {
    void fetchDoctors();
  }, [fetchDoctors]);

  const activeDoctors = doctors.filter((doctor) => doctor.status === "ACTIVE");

  useEffect(() => {
    let isAlive = true;

    const loadSlots = async () => {
      if (!selectedDoctor || !selectedDate || step !== 2) {
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
  }, [selectedDoctor, selectedDate, step]);

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
    } as Partial<ApiPatient>);

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
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل حجز الموعد"
            : "Failed to book appointment";
      toast.error(message);

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
          <MiniCalendar locale={locale} selectedDate={selectedDate} onDateSelect={setSelectedDate} />

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
