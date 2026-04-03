"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Calendar, Clock, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { cn } from "@/lib/utils";

const specialties = ["All", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Ophthalmology", "Neurology"];

export default function AppointmentsPage() {
  const { t, locale } = useTranslation();
  const { appointments } = useBookingStore();
  const { staff } = useStaffStore();
  const doctors = staff.filter((s) => s.role === "DOCTOR").map((s) => ({ id: s.id, name: s.name, nameAr: s.nameAr, specialty: s.specialty || "", specialtyAr: s.specialtyAr || "", image: s.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=" + s.email, rating: s.rating || 0, reviewCount: 0, available: s.status === "active", experience: s.experience || 0, bio: "", schedule: [] }));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(0); // 0=browse, 1=select time, 2=confirm

  const filteredDoctors = doctors.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSpecialty = selectedSpecialty === "All" || d.specialty === selectedSpecialty;
    return matchSearch && matchSpecialty;
  });

  const doctor = doctors.find((d) => d.id === selectedDoctor);

  return (
    <div className="space-y-6 max-w-7xl">
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

        <TabsContent value="book" className="space-y-6 mt-4">
          {bookingStep === 0 && (
            <>
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={locale === "ar" ? "ابحث عن طبيب أو تخصص..." : "Search doctors or specialties..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rtl:pl-3 rtl:pr-10"
                  />
                </div>
              </div>

              {/* Specialty filter */}
              <div className="flex gap-2 flex-wrap">
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

              {/* Doctor cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5",
                        !doc.available && "opacity-60"
                      )}
                      onClick={() => {
                        if (doc.available) {
                          setSelectedDoctor(doc.id);
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
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {locale === "ar" ? doc.nameAr : doc.name}
                            </h3>
                            <p className="text-sm text-primary">
                              {locale === "ar" ? doc.specialtyAr : doc.specialty}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doctor info */}
                <Card className="p-6">
                  <div className="text-center space-y-3">
                    <img src={doctor.image} alt={doctor.name} className="h-24 w-24 rounded-full mx-auto" />
                    <h3 className="font-semibold text-lg">{locale === "ar" ? doctor.nameAr : doctor.name}</h3>
                    <Badge variant="info">{locale === "ar" ? doctor.specialtyAr : doctor.specialty}</Badge>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{doctor.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                  </div>
                </Card>

                {/* Calendar */}
                <div>
                  <h3 className="font-semibold mb-3">{locale === "ar" ? "اختر التاريخ" : "Select Date"}</h3>
                  <MiniCalendar
                    locale={locale}
                    selectedDate={selectedDate}
                    onDateSelect={(d) => setSelectedDate(d)}
                  />
                </div>

                {/* Time slots */}
                <div>
                  <h3 className="font-semibold mb-3">{locale === "ar" ? "اختر الوقت" : "Select Time"}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"].map((time) => (
                      <Button key={time} variant="outline" size="sm" className="justify-start gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {time}
                      </Button>
                    ))}
                  </div>
                  <Button className="w-full mt-4 gap-2" onClick={() => setBookingStep(2)}>
                    {t("confirm")} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {bookingStep === 2 && doctor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto space-y-6">
              <Card className="p-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                  <Calendar className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold">{locale === "ar" ? "تم تأكيد الحجز!" : "Booking Confirmed!"}</h2>
                <p className="text-muted-foreground">
                  {locale === "ar" ? "تم حجز موعدك بنجاح" : "Your appointment has been successfully booked."}
                </p>
                <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("doctor")}</span>
                    <span className="font-medium">{doctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("date")}</span>
                    <span className="font-medium">April 7, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("time")}</span>
                    <span className="font-medium">09:00 AM</span>
                  </div>
                </div>
                {/* Payment mock */}
                <div className="rounded-xl border p-4 space-y-2">
                  <h3 className="font-semibold text-sm">{locale === "ar" ? "ملخص الدفع" : "Payment Summary"}</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="font-medium">$150.00</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">$150.00</span>
                  </div>
                  <Button className="w-full mt-2" variant="success">
                    {locale === "ar" ? "ادفع الآن" : "Pay Now"} - $150.00
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setBookingStep(0)}>
                  {locale === "ar" ? "حجز آخر" : "Book Another"}
                </Button>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {appointments.filter((a) => a.status !== "completed" && a.status !== "cancelled").map((apt, i) => (
            <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.05} />
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {appointments.filter((a) => a.status === "completed" || a.status === "cancelled").map((apt, i) => (
            <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.05} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
