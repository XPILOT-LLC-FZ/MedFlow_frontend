"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useStaffStore } from "@/stores/useStaffStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { bookingService } from "@/services/bookingService";

export default function BookingPage() {
  const { t, locale } = useTranslation();
  const { doctors, fetchDoctors } = useStaffStore();
  const { addAppointment } = useBookingStore();
  const toast = useToastStore();
  
  const [step, setStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const activeDoctors = doctors.filter((s) => s.status === "ACTIVE");

  useEffect(() => {
    let active = true;

    const loadSlots = async () => {
      if (!selectedDoctor || !selectedDate || step !== 2) {
        setAvailableSlots([]);
        return;
      }

      setSlotsLoading(true);
      try {
        const slots = await bookingService.getAvailableSlots(
          selectedDoctor,
          selectedDate.toISOString().split("T")[0]
        );
        if (active) {
          setAvailableSlots(slots);
        }
      } catch {
        if (active) {
          setAvailableSlots([]);
        }
      } finally {
        if (active) {
          setSlotsLoading(false);
        }
      }
    };

    loadSlots();

    return () => {
      active = false;
    };
  }, [selectedDoctor, selectedDate, step]);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={locale === "ar" ? "حجز موعد جديد" : "New Booking"}
        description={locale === "ar" ? "حجز موعد لمريض" : "Book an appointment for a patient"}
      />

      {/* Progress */}
      <div className="flex items-center gap-4 mb-4">
        {[locale === "ar" ? "المريض" : "Patient", locale === "ar" ? "الطبيب" : "Doctor", locale === "ar" ? "الموعد" : "Schedule", locale === "ar" ? "تأكيد" : "Confirm"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
            {i < 3 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader><CardTitle className="text-base">{locale === "ar" ? "بيانات المريض" : "Patient Information"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("fullName")}</label>
                  <Input placeholder="Patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("phone")}</label>
                  <Input placeholder="+1 (555) 000-0000" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <Input placeholder="patient@email.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("dateOfBirth")}</label>
                  <Input type="date" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(1)}>{t("next")}</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDoctors.map((doc) => (
              <Card
                key={doc.id}
                className={`cursor-pointer transition-all ${selectedDoctor === doc.id ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"}`}
                onClick={() => setSelectedDoctor(doc.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.email}`} alt={doc.fullName} className="h-12 w-12 rounded-xl object-cover" />
                  <div>
                    <p className="font-medium text-sm">{locale === "ar" ? (doc.fullName) : doc.fullName}</p>
                    <p className="text-xs text-primary">{doc.specialization || "General"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>{t("back")}</Button>
            <Button onClick={() => setStep(2)} disabled={!selectedDoctor}>{t("next")}</Button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MiniCalendar locale={locale} selectedDate={selectedDate} onDateSelect={(date) => setSelectedDate(date)} />
          <Card>
            <CardHeader><CardTitle className="text-base">{locale === "ar" ? "الأوقات المتاحة" : "Available Times"}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {slotsLoading && (
                <p className="col-span-3 text-sm text-muted-foreground">
                  {locale === "ar" ? "جاري تحميل الأوقات المتاحة..." : "Loading available slots..."}
                </p>
              )}
              {!slotsLoading && availableSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setSelectedTime(time)}
                >
                  <Clock className="h-3 w-3" /> {time}
                </Button>
              ))}
              {!slotsLoading && availableSlots.length === 0 && (
                <p className="col-span-3 text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد أوقات متاحة لهذا اليوم" : "No slots available for this date"}
                </p>
              )}
            </CardContent>
          </Card>
          <div className="lg:col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>{t("back")}</Button>
            <Button
              onClick={async () => {
                const doc = activeDoctors.find((d) => d.id === selectedDoctor);
                if (doc && patientName && selectedDate && selectedTime) {
                  try {
                    await addAppointment({
                      patientId: `p-${Date.now()}`,
                      patientName: patientName || "Walk-in Patient",
                      doctorId: doc.id,
                      doctorName: doc.fullName,
                      specialty: doc.specialization || "General",
                      date: selectedDate.toISOString().split("T")[0],
                      time: selectedTime,
                      status: "scheduled",
                      type: "Consultation",
                    });
                    toast.success(locale === "ar" ? "تم حجز الموعد بنجاح" : "Appointment booked successfully");
                    setStep(3);
                  } catch (err) {
                    toast.error("Failed to book appointment");
                  }
                }
              }}
              disabled={!selectedTime}
            >
              {t("confirm")}
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center">
          <Card className="p-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">{locale === "ar" ? "تم الحجز بنجاح!" : "Booking Confirmed!"}</h2>
            <p className="text-muted-foreground text-sm">
              {locale === "ar" ? "تم إرسال تأكيد عبر الواتساب" : "A WhatsApp confirmation has been sent to the patient."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  setStep(0);
                  setPatientName("");
                  setPatientPhone("");
                  setSelectedDoctor(null);
                  setSelectedTime(null);
                }}
                variant="outline"
              >
                {locale === "ar" ? "حجز جديد" : "New Booking"}
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  const phone = patientPhone.replace(/\D/g, "");
                  if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent("Your appointment has been confirmed! - MedFlow")}`, "_blank");
                }}
              >
                {locale === "ar" ? "إرسال واتساب" : "Send WhatsApp"}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
