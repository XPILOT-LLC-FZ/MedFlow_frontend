"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, Star, ChevronRight, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { usePatientStore } from "@/stores/usePatientStore";
import { useToastStore } from "@/stores/useToastStore";
import { bookingService } from "@/services/bookingService";
import { patientDocumentService } from "@/services/patientDocumentService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { formatDateKey } from "@/lib/dateUtils";
import type { ApiService, SmartRecommendation, Appointment } from "@/types";

const specialtiesList = ["All", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Ophthalmology", "Neurology"];

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { appointments, addAppointment, updateAppointment, fetchAppointments } = useBookingStore();
  const { doctors: staffDoctors, fetchDoctors } = useStaffStore();
  const { currentPatient, fetchMe } = usePatientStore();
  const toast = useToastStore();

  const [services, setServices] = useState<ApiService[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchMe();

      void servicesCatalogService
        .getAll({ isActive: "true" })
        .then((data) => setServices(data))
        .catch(() => setServices([]));
    }
  }, [user?.id, fetchAppointments, fetchMe]);

  useEffect(() => {
    if (currentPatient?.id) {
      fetchAppointments({ patientId: currentPatient.id });
    }
  }, [currentPatient?.id, fetchAppointments]);

  const patientAppointments = appointments.filter((a) => a.patientId === (currentPatient?.id ?? "guest"));
  const selectableDoctors = staffDoctors
    .filter((doctor) => doctor.status === "ACTIVE")
    .map((s) => ({
      id: s.id,
      name: s.fullName,
      nameAr: s.fullName, // Fallback as ApiDoctor missing nameAr
      specialty: s.specialization || "",
      specialtyAr: s.specialization || "",
      image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${s.email}`,
      rating: s.rating || 4.8, 
      reviewCount: 12,
      experience: s.experienceYears || 5,
      bio: s.bio || "",
      schedule: [],
    }));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "onsite" | null>(null);
  const [bookingStep, setBookingStep] = useState(0); // 0=browse, 1=select time, 2=confirm
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotLoadFailed, setSlotLoadFailed] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [smartRecommendations, setSmartRecommendations] =
    useState<SmartRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [pendingUploadAppointmentId, setPendingUploadAppointmentId] = useState<string | null>(null);
  const [uploadingAppointmentId, setUploadingAppointmentId] = useState<string | null>(null);
  const prefillAppliedRef = useRef(false);
  const appointmentUploadInputRef = useRef<HTMLInputElement>(null);

  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
  const ALLOWED_UPLOAD_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];

  useEffect(() => {
    if (!selectedDoctor) return;

    const stillSelectable = selectableDoctors.some((doctor) => doctor.id === selectedDoctor);
    if (!stillSelectable) {
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setAvailableSlots([]);
      if (bookingStep > 0) {
        setBookingStep(0);
      }
    }
  }, [selectedDoctor, selectableDoctors, bookingStep]);

  useEffect(() => {
    if (!user?.id) return;

    const timeout = setTimeout(() => {
      const filters: Record<string, string> = {
        status: "ACTIVE",
      };

      if (searchQuery.trim().length > 0) {
        filters.search = searchQuery.trim();
      }

      if (selectedSpecialty !== "All") {
        filters.specialization = selectedSpecialty;
      }

      if (selectedServiceId) {
        filters.serviceId = selectedServiceId;
      }

      void fetchDoctors(filters);
    }, 250);

    return () => clearTimeout(timeout);
  }, [user?.id, searchQuery, selectedSpecialty, selectedServiceId, fetchDoctors]);

  const doctor = selectableDoctors.find((d) => d.id === selectedDoctor);

  useEffect(() => {
    if (prefillAppliedRef.current) {
      return;
    }

    if (selectableDoctors.length === 0) {
      return;
    }

    const prefilledDoctorId = searchParams.get("doctorId");
    const prefilledDate = searchParams.get("date");
    const prefilledTime = searchParams.get("time");
    const prefilledServiceId = searchParams.get("serviceId");

    if (!prefilledDoctorId && !prefilledDate && !prefilledTime && !prefilledServiceId) {
      prefillAppliedRef.current = true;
      return;
    }

    if (prefilledServiceId) {
      setSelectedServiceId(prefilledServiceId);
    }

    if (prefilledDoctorId) {
      const exists = selectableDoctors.some((doctorOption) => doctorOption.id === prefilledDoctorId);
      if (exists) {
        setSelectedDoctor(prefilledDoctorId);
      }
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

    if (prefilledDoctorId || prefilledDate || prefilledTime) {
      setBookingStep(1);
    }

    prefillAppliedRef.current = true;
  }, [searchParams, selectableDoctors]);

  useEffect(() => {
    let active = true;

    const loadSlots = async () => {
      if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        setSlotLoadFailed(false);
        return;
      }

      setSlotsLoading(true);
      setSlotLoadFailed(false);
      try {
        const slots = await bookingService.getAvailableSlots(
          selectedDoctor,
          formatDateKey(selectedDate),
          selectedServiceId ? { serviceId: selectedServiceId } : undefined,
        );
        if (active) {
          setAvailableSlots(slots);
          setSlotLoadFailed(false);
        }
      } catch {
        if (active) {
          setAvailableSlots([]);
          setSlotLoadFailed(true);
        }
      } finally {
        if (active) {
          setSlotsLoading(false);
        }
      }
    };

    void loadSlots();

    return () => {
      active = false;
    };
  }, [selectedDoctor, selectedDate, selectedServiceId]);

  useEffect(() => {
    let active = true;

    const loadRecommendations = async () => {
      if (bookingStep !== 0) {
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        const response = await bookingService.getSmartRecommendations({
          patientId: currentPatient?.id,
          serviceId: selectedServiceId || undefined,
          horizonDays: 7,
          limit: 9,
        });

        if (active) {
          setSmartRecommendations(response.recommendations || []);
        }
      } catch {
        if (active) {
          setSmartRecommendations([]);
        }
      } finally {
        if (active) {
          setIsLoadingRecommendations(false);
        }
      }
    };

    void loadRecommendations();

    return () => {
      active = false;
    };
  }, [bookingStep, currentPatient?.id, selectedServiceId]);

  const applySmartRecommendation = (recommendation: SmartRecommendation) => {
    const exists = selectableDoctors.some((doctorOption) => doctorOption.id === recommendation.doctorId);
    if (!exists) {
      toast.error(
        locale === "ar"
          ? "الطبيب غير متاح حالياً ضمن الفلاتر الحالية"
          : "The recommended doctor is not currently available with active filters",
      );
      return;
    }

    const [year, month, day] = recommendation.date.split("-").map(Number);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      setSelectedDate(new Date(year, month - 1, day));
    }

    setSelectedDoctor(recommendation.doctorId);
    setSelectedTime(recommendation.startTime);
    setBookingStep(1);
  };

  const formatRecommendationDate = (dateValue: string) => {
    const date = new Date(`${dateValue}T00:00:00.000Z`);
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };
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

  const handleConfirmBooking = async () => {
    if (isBooking) return;

    if (!user?.id) {
      toast.error(locale === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please log in first");
      return;
    }

    if (!currentPatient?.id) {
      toast.error(locale === "ar" ? "يرجى إكمال ملف المريض أولاً" : "Please complete your patient profile first");
      return;
    }

    if (!doctor || !selectedDate || !selectedTime) return;

    setIsBooking(true);
    try {
      const createdAppointment = await addAppointment({
        patientId: currentPatient.id,
        patientName: currentPatient.fullName || user.name || "Patient",
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        date: formatDateKey(selectedDate),
        time: selectedTime,
        status: "scheduled",
        type: "Consultation",
      });

      setCurrentBookingId(createdAppointment.id);
      setPaymentCompleted(false);
      setPaymentMethod(null);
      toast.success(locale === "ar" ? "تم حجز الموعد بنجاح" : "Appointment booked successfully");
      await fetchAppointments({ patientId: currentPatient.id });
      setBookingStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to book appointment";
      toast.error(message);
    } finally {
      setIsBooking(false);
    }
  };

  const handlePayment = async (method: "online" | "onsite") => {
    if (!currentBookingId || paymentCompleted) return;

    try {
      await updateAppointment(currentBookingId, { status: "confirmed" });
      setPaymentCompleted(true);
      setPaymentMethod(method);

      if (method === "online") {
        toast.success(locale === "ar" ? "تم الدفع أونلاين وتأكيد الموعد" : "Online payment completed and appointment confirmed");
        return;
      }

      toast.success(locale === "ar" ? "تم تأكيد الموعد والدفع عند الحضور" : "Appointment confirmed with onsite payment");
    } catch {
      toast.error("Payment update failed");
    }
  };

  const canUploadForAppointment = (appointment: Appointment) => {
    const normalizedStatus = String(appointment.status || "").toUpperCase().replace("-", "_");
    return normalizedStatus !== "CANCELLED" && normalizedStatus !== "NO_SHOW";
  };

  const triggerAppointmentUpload = (appointmentId: string) => {
    setPendingUploadAppointmentId(appointmentId);
    appointmentUploadInputRef.current?.click();
  };

  const handleAppointmentFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    const appointmentId = pendingUploadAppointmentId;
    const resetInput = () => {
      if (appointmentUploadInputRef.current) {
        appointmentUploadInputRef.current.value = "";
      }
    };

    if (!files || files.length === 0 || !appointmentId) {
      resetInput();
      return;
    }

    if (!currentPatient?.id) {
      toast.error(
        locale === "ar"
          ? "تعذر رفع الملف بدون ملف مريض مكتمل"
          : "Cannot upload files without a completed patient profile",
      );
      resetInput();
      setPendingUploadAppointmentId(null);
      return;
    }

    const validFiles = Array.from(files).filter((file) => {
      if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
        toast.error(
          locale === "ar"
            ? `نوع غير مدعوم: ${file.name}`
            : `Unsupported file type: ${file.name}`,
        );
        return false;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        toast.error(
          locale === "ar"
            ? `الملف كبير جداً: ${file.name}`
            : `File is too large: ${file.name}`,
        );
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      resetInput();
      setPendingUploadAppointmentId(null);
      return;
    }

    setUploadingAppointmentId(appointmentId);
    let uploadedCount = 0;

    try {
      for (const file of validFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (readerEvent) =>
            resolve(String(readerEvent.target?.result || ""));
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        await patientDocumentService.createForCurrentPatientAppointment(
          appointmentId,
          {
            name: file.name,
            fileUrl: dataUrl,
            fileType: file.type || null,
          },
        );
        uploadedCount += 1;
      }

      if (uploadedCount > 0) {
        toast.success(
          locale === "ar"
            ? `تم رفع ${uploadedCount} ملف بنجاح`
            : `Uploaded ${uploadedCount} file(s) successfully`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر رفع الملفات"
            : "Failed to upload files";
      toast.error(message);
    } finally {
      setUploadingAppointmentId(null);
      setPendingUploadAppointmentId(null);
      resetInput();
    }
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
          {!currentPatient?.id && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              {locale === "ar"
                ? "لا يمكن إكمال الحجز قبل إتمام ملف المريض. أكمل بيانات ملفك ثم حاول مرة أخرى."
                : "You need a completed patient profile before booking. Please finish your patient profile and try again."}
            </div>
          )}

          {bookingStep === 0 && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {locale === "ar" ? "الجدولة الذكية" : "Smart Scheduler"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRecommendations ? (
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "جاري تحليل أفضل المواعيد المتاحة..."
                        : "Analyzing best available booking options..."}
                    </p>
                  ) : smartRecommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "لا توجد توصيات حالياً. اختر الطبيب والوقت يدوياً."
                        : "No recommendations available right now. You can continue with manual booking."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      {smartRecommendations.map((recommendation) => (
                        <button
                          key={`${recommendation.doctorId}-${recommendation.date}-${recommendation.startTime}`}
                          type="button"
                          onClick={() => applySmartRecommendation(recommendation)}
                          className="rounded-lg border p-3 text-left transition hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{recommendation.doctorName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRecommendationDate(recommendation.date)}
                          </p>
                          <p className="text-xs text-primary mt-1">{recommendation.startTime}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">{locale === "ar" ? "كل الخدمات" : "All services"}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {specialtiesList.map((s) => (
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
                {selectableDoctors.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      onClick={() => {
                        setSelectedDoctor(doc.id);
                        setSelectedDate(undefined);
                        setSelectedTime(null);
                        setBookingStep(1);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Image
                            src={doc.image}
                            alt={doc.name}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-xl object-cover"
                            unoptimized
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
                          <Badge variant="success" className="self-start">
                            {t("available")}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {selectableDoctors.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {locale === "ar"
                      ? "لا يوجد أطباء متاحون حالياً بهذه الفلاتر. جرّب تغيير البحث أو التخصص أو الخدمة."
                      : "No available doctors match your current filters. Try changing your search, specialty, or service."}
                  </div>
                )}
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
                    <Image
                      src={doctor.image}
                      alt={doctor.name}
                      width={96}
                      height={96}
                      className="mx-auto h-24 w-24 rounded-full object-cover"
                      unoptimized
                    />
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
                    minDate={new Date()}
                  />
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">{locale === "ar" ? "اختر الوقت" : "Select Time"}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {slotsLoading && (
                      <p className="col-span-2 text-sm text-muted-foreground">
                        {locale === "ar" ? "جاري تحميل الأوقات المتاحة..." : "Loading available slots..."}
                      </p>
                    )}
                    {!slotsLoading && availableSlots.map((time) => (
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
                    {!slotsLoading && availableSlots.length === 0 && (
                      <p className="col-span-2 text-sm text-muted-foreground">
                        {slotLoadFailed
                          ? locale === "ar"
                            ? "تعذر تحميل المواعيد حالياً. أعد المحاولة بعد لحظات."
                            : "We could not load available slots right now. Please try again shortly."
                          : locale === "ar"
                            ? "لا توجد أوقات متاحة لهذا اليوم"
                            : "No slots available for this date"}
                      </p>
                    )}
                  </div>
                  <Button
                    className="mt-4 w-full gap-2"
                    onClick={handleConfirmBooking}
                    disabled={!selectedDate || !selectedTime || isBooking}
                  >
                    {isBooking
                      ? locale === "ar"
                        ? "جارٍ تأكيد الحجز..."
                        : "Confirming booking..."
                      : t("confirm")}
                    <ChevronRight className="h-4 w-4" />
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
            .filter((a) => {
              const status = String(a.status || "").toUpperCase();
              return status !== "COMPLETED" && status !== "CANCELLED";
            })
            .map((apt, i) => (
              <div key={apt.id} className="space-y-2">
                <AppointmentCard appointment={apt} delay={i * 0.05} />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={
                      !canUploadForAppointment(apt) ||
                      uploadingAppointmentId === apt.id
                    }
                    onClick={() => triggerAppointmentUpload(apt.id)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingAppointmentId === apt.id
                      ? locale === "ar"
                        ? "جارٍ الرفع..."
                        : "Uploading..."
                      : locale === "ar"
                        ? "رفع ملف لهذا الموعد"
                        : "Upload File For This Appointment"}
                  </Button>
                </div>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {patientAppointments
            .filter((a) => {
              const status = String(a.status || "").toUpperCase();
              return status === "COMPLETED" || status === "CANCELLED";
            })
            .map((apt, i) => (
              <div key={apt.id} className="space-y-2">
                <AppointmentCard appointment={apt} delay={i * 0.05} />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={
                      !canUploadForAppointment(apt) ||
                      uploadingAppointmentId === apt.id
                    }
                    onClick={() => triggerAppointmentUpload(apt.id)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingAppointmentId === apt.id
                      ? locale === "ar"
                        ? "جارٍ الرفع..."
                        : "Uploading..."
                      : locale === "ar"
                        ? "رفع ملف لهذا الموعد"
                        : "Upload File For This Appointment"}
                  </Button>
                </div>
              </div>
            ))}
        </TabsContent>
      </Tabs>

      <input
        ref={appointmentUploadInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        onChange={handleAppointmentFileUpload}
      />
    </div>
  );
}
