"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Video, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentDetailsDialog } from "@/components/shared/AppointmentDetailsDialog";
import { RescheduleDialog } from "@/components/shared/RescheduleDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore, mapToLocal } from "@/stores/useBookingStore";
import { usePatientStore } from "@/stores/usePatientStore";
import { useToastStore } from "@/stores/useToastStore";
import { useBookingFlowStore } from "@/stores/useBookingFlowStore";
import { staffService } from "@/services/staffService";
import { bookingService } from "@/services/bookingService";
import type { Appointment, ApiPublicDoctor } from "@/types";

interface MobilePatientCardProps {
  appointment: Appointment;
  isPast?: boolean;
  onReschedule?: () => void;
  onDetail?: () => void;
  onBookAgain?: () => void;
  onCancel?: () => void;
  doctorAvatar?: string;
  locale: string;
}

function MobilePatientAppointmentCard({
  appointment,
  isPast = false,
  onReschedule,
  onDetail,
  onBookAgain,
  onCancel,
  doctorAvatar,
  locale
}: MobilePatientCardProps) {
  const dateObj = new Date(appointment.date);
  const formattedDate = dateObj.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeStr = `${appointment.startTime} - ${appointment.endTime || "30 min"}`;

  return (
    <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
      {/* Date and Cancel */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs text-slate-400 font-normal">
            {locale === "ar" ? "تاريخ الموعد" : "Appointment date"}
          </span>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm md:text-base font-semibold">
              {formattedDate} • {timeStr}
            </span>
          </div>
        </div>

        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all rounded-full"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Doctor Info */}
      <div className="mt-5 flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-14 w-14 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-slate-50">
            <AvatarImage src={doctorAvatar || appointment.patientAvatar} alt={appointment.doctorName} className="object-cover" />
            <AvatarFallback className="bg-slate-50 dark:bg-slate-800 text-slate-400">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          {/* Circular check overlay exactly like the image */}
          <div className="absolute bottom-0 right-0 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
            <Video className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex flex-col">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {appointment.doctorName}
          </h4>
          <span className="text-xs md:text-sm font-medium text-slate-400 mt-0.5">
            {appointment.specialty || (locale === "ar" ? "طبيب متخصص" : "Specialist")}
          </span>
        </div>
      </div>

      {/* Buttons / Actions */}
      <div className="mt-5">
        {isPast ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                if (onDetail) onDetail();
              }}
              className="h-11 rounded-2xl font-bold border-[#2b66ff] text-[#2b66ff] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
            >
              {locale === "ar" ? "التفاصيل" : "Detail"}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (onBookAgain) onBookAgain();
              }}
              className="h-11 rounded-2xl font-bold bg-[#2b66ff] hover:bg-[#1c54e0] text-white transition-colors"
            >
              {locale === "ar" ? "حجز مجددًا" : "Book again"}
            </Button>
          </div>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (onReschedule) onReschedule();
            }}
            className="w-full h-11 rounded-2xl font-bold bg-[#2b66ff] hover:bg-[#1c54e0] text-white transition-colors"
          >
            {locale === "ar" ? "إعادة جدولة" : "Reschedule"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function AppointmentsPageContent() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { updateAppointment } = useBookingStore();
  const { currentPatient, fetchMe } = usePatientStore();
  const toast = useToastStore();
  const openBook = useBookingFlowStore((state) => state.openBook);

  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<Appointment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [doctorAvatars, setDoctorAvatars] = useState<Record<string, string>>({});
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);

  // Fetch patient, appointments, and doctors on mount
  useEffect(() => {
    if (user?.id) {
      fetchMe();
    }
  }, [user?.id, fetchMe]);

  // Extract fetch and distribute logic for reuse
  const fetchAndDistribute = React.useCallback(async () => {
    if (!currentPatient?.id) return;
    try {
      const [upcomingList, pastList] = await Promise.all([
        bookingService.getAll({ patientId: currentPatient.id, filterType: 'upcoming' }),
        bookingService.getAll({ patientId: currentPatient.id, filterType: 'past' })
      ]);

      const allFetched = [...(upcomingList || []), ...(pastList || [])].map(mapToLocal);
      
      // Deduplicate by ID
      const uniqueApts = Array.from(new Map(allFetched.map(a => [a.id, a])).values());
      
      const now = Date.now();
      
      const strictUpcoming = uniqueApts.filter(apt => {
        // Only include non-final statuses
        const isNotCompleted = ["scheduled", "confirmed", "in-progress"].includes(apt.status);
        if (!isNotCompleted) return false;
        
        // Check if it's in the future (including today's future hours)
        const aptTime = new Date(`${apt.date}T${apt.startTime || '00:00'}:00`).getTime();
        
        // If it's in progress, it's considered "current" if it's for today
        if (apt.status === "in-progress") {
          const todayString = new Date().toISOString().split('T')[0];
          return apt.date >= todayString;
        }

        return aptTime > now;
      }).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());
      
      const strictPast = uniqueApts.filter(apt => {
        const aptTime = new Date(`${apt.date}T${apt.startTime || '00:00'}:00`).getTime();
        const isCompleted = ["completed", "cancelled", "no-show", "rescheduled"].includes(apt.status);
        return isCompleted || aptTime <= now;
      }).sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

      setUpcomingAppointments(strictUpcoming);
      setPastAppointments(strictPast);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  }, [currentPatient]);

  useEffect(() => {
    if (currentPatient?.id) {
      const timer = setTimeout(() => {
        fetchAndDistribute();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentPatient?.id, fetchAndDistribute]);

  useEffect(() => {
    const loadDoctorAvatars = async () => {
      try {
        const publicDocs = await staffService.getPublicDoctors();
        const map: Record<string, string> = {};
        publicDocs.forEach((doc: ApiPublicDoctor) => {
          if (doc.user?.avatarUrl) {
            map[doc.id] = doc.user.avatarUrl;
          }
        });
        setDoctorAvatars(map);
      } catch (err) {
        console.error("Failed to fetch public doctors for avatars mapping", err);
      }
    };
    if (user?.id) {
      void loadDoctorAvatars();
    }
  }, [user?.id]);

  // Handle detail click - branches on status
  const handleDetailClick = (appointment: Appointment, forceDetails = false) => {
    const normalizedStatus = String(appointment.status || "").toUpperCase();
    if (forceDetails || normalizedStatus === "COMPLETED" || normalizedStatus === "CANCELLED" || normalizedStatus === "NO_SHOW" || normalizedStatus === "RESCHEDULED") {
      setSelectedAppointmentForDetails(appointment);
      setIsDetailsDialogOpen(true);
    } else {
      // Upcoming appointment - open reschedule
      setSelectedAppointmentForReschedule(appointment);
      setIsRescheduleDialogOpen(true);
    }
  };

  // Handle cancel click
  const handleCancelClick = async (appointment: Appointment) => {
    try {
      await updateAppointment(appointment.id, { status: "cancelled" });
      void fetchAndDistribute();
      toast.success(
        locale === "ar" ? "تم إلغاء الموعد بنجاح" : "Appointment cancelled successfully"
      );
    } catch {
      toast.error(locale === "ar" ? "فشل إلغاء الموعد" : "Failed to cancel appointment");
    }
  };

  // Handle book again - pre-select doctor and go to booking
  const handleBookAgain = (appointment: Appointment) => {
    setIsDetailsDialogOpen(false);
    if (appointment.doctor) {
      openBook(appointment.doctor as unknown as ApiPublicDoctor);
    } else if (appointment.doctorId) {
      openBook({
        id: appointment.doctorId,
        fullName: appointment.doctorName || "Doctor",
        specialization: appointment.specialty || "Generalist",
      } as unknown as ApiPublicDoctor);
    }
    toast.success(
      locale === "ar"
        ? `يمكنك الحجز مع ${appointment.doctorName}`
        : `You can now book with ${appointment.doctorName}`
    );
  };

  // Handle reschedule confirmation
  const handleReschedule = async (appointment: Appointment, newDate: string, newTime: string) => {
    try {
      setIsRescheduleDialogOpen(false);
      await bookingService.rescheduleAppointment(appointment.id, {
        date: newDate,
        startTime: newTime,
      });
      void fetchAndDistribute();
      toast.success(
        locale === "ar"
          ? `تم إعادة جدولة الموعد إلى ${newDate} في ${newTime}`
          : `Appointment rescheduled to ${newDate} at ${newTime}`
      );
    } catch {
      toast.error(
        locale === "ar" ? "فشل إعادة جدولة الموعد" : "Failed to reschedule appointment"
      );
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("appointments")}
        description={locale === "ar" ? "إدارة مواعيدك الطبية" : "Manage your appointments"}
      />

      {/* Empty State */}
      {upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center bg-white dark:bg-slate-900 shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Calendar className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
            {locale === "ar" ? "لا توجد مواعيد" : "No appointments"}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {locale === "ar"
              ? "لم تقم بحجز أي موعد بعد. ابدأ بالبحث عن طبيب متخصص."
              : "You haven't booked any appointments yet. Start by searching for a specialist."}
          </p>
        </motion.div>
      )}

      {/* Appointments Tabs */}
      {(upcomingAppointments.length > 0 || pastAppointments.length > 0) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full h-14 backdrop-blur-md">
            <TabsTrigger
              value="upcoming"
              className="rounded-full text-sm font-semibold transition-all h-12 data-[state=active]:bg-[#2b66ff] data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=active]:bg-[#2b66ff] dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 select-none data-[state=active]:shadow-lg"
            >
              {locale === "ar" ? "قادمة" : "Upcoming"}
              {upcomingAppointments.length > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50/20 text-xs font-semibold">
                  {upcomingAppointments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-full text-sm font-semibold transition-all h-12 data-[state=active]:bg-[#2b66ff] data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=active]:bg-[#2b66ff] dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 select-none data-[state=active]:shadow-lg"
            >
              {locale === "ar" ? "السجل" : "History"}
              {pastAppointments.length > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/20 text-xs font-semibold">
                  {pastAppointments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="mt-6 space-y-4">
            {upcomingAppointments.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {locale === "ar" ? "لا توجد مواعيد قادمة" : "No upcoming appointments"}
                </p>
              </Card>
            ) : (
              upcomingAppointments.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MobilePatientAppointmentCard
                    appointment={apt}
                    isPast={false}
                    locale={locale}
                    doctorAvatar={doctorAvatars[apt.doctorId]}
                    onReschedule={() => handleDetailClick(apt)}
                    onCancel={() => handleCancelClick(apt)}
                  />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6 space-y-4">
            {pastAppointments.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {locale === "ar" ? "لا توجد مواعيد سابقة" : "No past appointments"}
                </p>
              </Card>
            ) : (
              pastAppointments.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MobilePatientAppointmentCard
                    appointment={apt}
                    isPast={true}
                    locale={locale}
                    doctorAvatar={doctorAvatars[apt.doctorId]}
                    onDetail={() => handleDetailClick(apt, true)}
                    onBookAgain={() => handleBookAgain(apt)}
                    onCancel={() => handleCancelClick(apt)}
                  />
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Details Dialog */}
      <AppointmentDetailsDialog
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        appointment={selectedAppointmentForDetails as any}
        onBookAgain={() => {
          if (selectedAppointmentForDetails) {
            handleBookAgain(selectedAppointmentForDetails);
          }
        }}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        isOpen={isRescheduleDialogOpen}
        onOpenChange={setIsRescheduleDialogOpen}
        appointment={selectedAppointmentForReschedule}
        onConfirm={(newDate, newTime) => {
          if (selectedAppointmentForReschedule) {
            handleReschedule(selectedAppointmentForReschedule, newDate, newTime);
          }
        }}
      />
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <AppointmentsPageContent />
    </Suspense>
  );
}

