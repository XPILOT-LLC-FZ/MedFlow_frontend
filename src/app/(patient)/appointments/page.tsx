"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { cn } from "@/lib/utils";

const specialties = ["All", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Ophthalmology", "Neurology"];

export default function AppointmentsPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { appointments, addAppointment, updateAppointment } = useBookingStore();
  const { staff } = useStaffStore();
  const toast = useToastStore();
  const patientAppointments = appointments.filter((a) => a.patientId === (user?.id ?? "guest"));
  const doctors = staff
    .filter((s) => s.role === "DOCTOR")
    .map((s) => ({
      id: s.id,
      name: s.name,
      nameAr: s.nameAr,
      specialty: s.specialty || "",
      specialtyAr: s.specialtyAr || "",
      image: s.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${s.email}`,
      rating: s.rating || 0,
      reviewCount: 0,
      available: s.status === "active",
      experience: s.experience || 0,
      bio: "",
      schedule: [],
    }));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "onsite" | null>(null);
  const [bookingStep, setBookingStep] = useState(0); // 0=browse, 1=select time, 2=confirm

  const filteredDoctors = doctors.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSpecialty = selectedSpecialty === "All" || d.specialty === selectedSpecialty;
    return matchSearch && matchSpecialty;
  });

  const doctor = doctors.find((d) => d.id === selectedDoctor);
  const formatSelectedDate = (date?: Date) =>
    date
      ? date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";

  const resetBooking = () => {
    setBookingStep(0);
    setSelectedDoctor(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setCurrentBookingId(null);
    setPaymentCompleted(false);
    setPaymentMethod(null);
  };

  const handleConfirmBooking = () => {
    if (!doctor || !selectedDate || !selectedTime) return;

    const createdAppointment = addAppointment({
      patientId: user?.id ?? "guest",
      patientName: user?.name ?? "Guest Patient",
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: selectedDate.toISOString().split("T")[0],
      time: selectedTime,
      status: "scheduled",
      type: "Consultation",
    });

    setCurrentBookingId(createdAppointment.id);
    setPaymentCompleted(false);
    setPaymentMethod(null);
    toast.success(locale === "ar" ? "تم حجز الموعد بنجاح" : "Appointment booked successfully");
    setBookingStep(2);
  };

  const handlePayment = (method: "online" | "onsite") => {
    if (!currentBookingId || paymentCompleted) return;

    updateAppointment(currentBookingId, { status: "confirmed" });
    setPaymentCompleted(true);
    setPaymentMethod(method);

    if (method === "online") {
      toast.success(locale === "ar" ? "تم الدفع أونلاين وتأكيد الموعد" : "Online payment completed and appointment confirmed");
      return;
    }

    toast.success(locale === "ar" ? "تم تأكيد الموعد والدفع عند الحضور" : "Appointment confirmed with onsite payment");
  };

  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader
        title={t("appointments")}
        description={locale === "ar" ? "ابحث واحجز مع أفضل الأطباء" : "Search and book with top specialists"}
      />

      <Tabs defaultValue="book">
        <TabsList>
          <TabsTrigger value="book">{t("bookAppointment")}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("upcomingAppointments")}</TabsTrigger>
          <TabsTrigger value="history">{locale === "ar" ? "السجل" : "History"}</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="mt-4 space-y-6">
          {bookingStep === 0 && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
                  <Input
                    placeholder={locale === "ar" ? "ابحث عن طبيب أو تخصص..." : "Search doctors or specialties..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rtl:pl-3 rtl:pr-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <Button
                    key={s}
                    variant={selectedSpecialty === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSpecialty(s)}
                    className="rounded-full"
                  >
                    {s}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDoctors.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                        !doc.available && "opacity-60"
                      )}
                      onClick={() => {
                        if (doc.available) {
                          setSelectedDoctor(doc.id);
                          setSelectedDate(undefined);
                          setSelectedTime(null);
                          setBookingStep(1);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={doc.image}
                            alt={doc.name}
                            className="h-16 w-16 rounded-xl"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold">
                              {locale === "ar" ? doc.nameAr : doc.name}
                            </h3>
                            <p className="text-sm text-primary">
                              {locale === "ar" ? doc.specialtyAr : doc.specialty}
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium">{doc.rating}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {doc.experience} {t("yearsExp")}
                              </span>
                            </div>
                          </div>
                          <Badge variant={doc.available ? "success" : "secondary"} className="self-start">
                            {doc.available ? t("available") : t("unavailable")}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {bookingStep === 1 && doctor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setBookingStep(0)} className="gap-1">
                &larr; {t("back")}
              </Button>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="p-6">
                  <div className="space-y-3 text-center">
                    <img src={doctor.image} alt={doctor.name} className="mx-auto h-24 w-24 rounded-full" />
                    <h3 className="text-lg font-semibold">{locale === "ar" ? doctor.nameAr : doctor.name}</h3>
                    <Badge variant="info">{locale === "ar" ? doctor.specialtyAr : doctor.specialty}</Badge>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{doctor.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                  </div>
                </Card>

                <div>
                  <h3 className="mb-3 font-semibold">{locale === "ar" ? "اختر التاريخ" : "Select Date"}</h3>
                  <MiniCalendar
                    locale={locale}
                    selectedDate={selectedDate}
                    onDateSelect={(d) => setSelectedDate(d)}
                  />
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">{locale === "ar" ? "اختر الوقت" : "Select Time"}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"].map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => setSelectedTime(time)}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {time}
                      </Button>
                    ))}
                  </div>
                  <Button
                    className="mt-4 w-full gap-2"
                    onClick={handleConfirmBooking}
                    disabled={!selectedDate || !selectedTime}
                  >
                    {t("confirm")} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {bookingStep === 2 && doctor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-lg space-y-6">
              <Card className="space-y-4 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Calendar className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold">{locale === "ar" ? "تم تأكيد الحجز!" : "Booking Confirmed!"}</h2>
                <p className="text-muted-foreground">
                  {locale === "ar" ? "تم حجز موعدك بنجاح" : "Your appointment has been successfully booked."}
                </p>
                <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("doctor")}</span>
                    <span className="font-medium">{doctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("date")}</span>
                    <span className="font-medium">{formatSelectedDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("time")}</span>
                    <span className="font-medium">{selectedTime ?? "—"}</span>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border p-4">
                  <h3 className="text-sm font-semibold">{locale === "ar" ? "ملخص الدفع" : "Payment Summary"}</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {locale === "ar" ? "رسوم الاستشارة" : "Consultation Fee"}
                    </span>
                    <span className="font-medium">$150.00</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-sm">
                    <span className="font-semibold">{locale === "ar" ? "الإجمالي" : "Total"}</span>
                    <span className="font-bold text-primary">$150.00</span>
                  </div>
                  <p className="pt-2 text-sm font-medium">
                    {locale === "ar" ? "اختر طريقة الدفع" : "Choose payment method"}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      className="w-full"
                      variant="success"
                      onClick={() => handlePayment("online")}
                      disabled={paymentCompleted}
                    >
                      {paymentMethod === "online"
                        ? locale === "ar" ? "تم الدفع أونلاين" : "Paid Online"
                        : locale === "ar" ? "ادفع أونلاين" : "Pay Online"}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handlePayment("onsite")}
                      disabled={paymentCompleted}
                    >
                      {paymentMethod === "onsite"
                        ? locale === "ar" ? "الدفع عند الحضور" : "Pay Onsite"
                        : locale === "ar" ? "ادفع عند الحضور" : "Pay Onsite"}
                    </Button>
                  </div>
                  {paymentCompleted && (
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod === "onsite"
                        ? locale === "ar"
                          ? "تم تأكيد الموعد. ستدفع عند الوصول إلى العيادة."
                          : "Your appointment is confirmed. You can pay when you arrive at the clinic."
                        : locale === "ar"
                          ? "تم تأكيد الدفع والموعد."
                          : "Your payment and appointment have both been confirmed."}
                    </p>
                  )}
                </div>

                <Button variant="outline" onClick={resetBooking}>
                  {locale === "ar" ? "حجز آخر" : "Book Another"}
                </Button>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {patientAppointments
            .filter((a) => a.status !== "completed" && a.status !== "cancelled")
            .map((apt, i) => (
              <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.05} />
            ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {patientAppointments
            .filter((a) => a.status === "completed" || a.status === "cancelled")
            .map((apt, i) => (
              <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.05} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
