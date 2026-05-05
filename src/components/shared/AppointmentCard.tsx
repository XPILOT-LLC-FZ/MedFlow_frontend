"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Phone, User, MessageSquare, Trash2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import type { Appointment } from "@/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFavorites } from "@/hooks/useFavorites";
import { useTranslation } from "@/hooks/useTranslation";
import { RescheduleDialog } from "@/components/shared/RescheduleDialog";
import { bookingService } from "@/services/bookingService";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
  confirmed: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50",
  completed: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50",
  "in-progress": "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
  "no-show": "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50",
  rescheduled: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50",
};

export function AppointmentCard({
  appointment,
  delay = 0,
  isPatientView = false,
  onDetailClick,
  onBookAgainClick,
}: {
  appointment: Appointment;
  delay?: number;
  isPatientView?: boolean;
  onDetailClick?: () => void;
  onBookAgainClick?: () => void;
}) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { locale } = useTranslation();
  const isFav = isFavorite(appointment.doctorId);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const { fetchAppointments } = useBookingStore();
  const toast = useToastStore();

  const displayName = isPatientView ? appointment.doctorName : appointment.patientName;
  const { user } = useAuthStore();

  const handleReschedule = async (newDate: string, newTime: string, branchId?: string, mode?: "ONSITE" | "ONLINE") => {
    try {
      await bookingService.rescheduleAppointment(appointment.id, {
        date: newDate,
        startTime: newTime,
        branchId,
        mode,
      });
      await fetchAppointments();
      toast.success(
        locale === "ar"
          ? `تم إعادة جدولة الموعد إلى ${newDate} في ${newTime}`
          : `Appointment rescheduled to ${newDate} at ${newTime}`
      );
    } catch{
      toast.error(
        locale === "ar" ? "فشل إعادة جدولة الموعد" : "Failed to reschedule appointment"
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="w-full"
    >
      <Card className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Top Section: Avatar & Name */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
                <AvatarFallback className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight group-hover:text-blue-600 transition-colors">
                  {displayName}
                </h3>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-0.5">
                  {isPatientView ? (appointment.specialty || (locale === 'ar' ? 'طبيب' : 'Doctor')) : (appointment.patientAge || "Age N/A")}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 -mr-2">
              {isPatientView && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8 transition-all",
                    isFav ? "text-rose-500 hover:text-rose-600" : "text-slate-300 hover:text-rose-500"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite({ id: appointment.doctorId, fullName: appointment.doctorName });
                  }}
                >
                  <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
                </Button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-2.5 pl-1">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">
                {appointment.time} • {appointment.duration || "30 min"}
              </span>
            </div>

            {(appointment.branchName || appointment.branchAddress) && (
              <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">
                  {appointment.branchAddress || appointment.branchName}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">
                  {appointment.patientPhone || "-"}
                </span>
              </div>
              {appointment.patientPhone && !appointment.patientPhone.includes("placeholder") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    const phone = appointment.patientPhone?.replace(/\s+/g, "");
                    window.open(`https://wa.me/${phone}`, "_blank");
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Type Badge */}
          <div className="pt-1">
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "rounded-full px-3 py-0.5 font-semibold text-[11px] border-none",
                  statusStyles[appointment.status] || statusStyles.scheduled
                )}
              >
                {appointment.type || (locale === "ar" ? "متابعة" : "Follow-up")}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "rounded-full px-3 py-0.5 font-semibold text-[11px] border-none",
                  appointment.mode === "ONLINE" 
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                    : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                )}
              >
                {appointment.mode === "ONLINE" 
                  ? (locale === "ar" ? "أونلاين" : "Online") 
                  : (locale === "ar" ? "في العيادة" : "On-Clinic")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Footer Section: Actions */}
        <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-400 dark:text-slate-500 font-normal">{locale === "ar" ? "الملاحظات:" : "Notes: "}</span>
            {appointment.notes || (locale === "ar" ? "فحص عام" : "General checkup")}
          </p>

          {appointment.createdByName || appointment.createdByRole ? (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
              {appointment.createdByRole === "PATIENT" && user?.id === appointment.patientId
                ? (locale === "ar" ? "تم الحجز بواسطة: أنت" : "Booked by: You")
                : (locale === "ar" 
                    ? `تم الحجز بواسطة: ${appointment.createdByName || (appointment.createdByRole === "PATIENT" ? "المريض" : appointment.createdByRole)}` 
                    : `Booked by: ${appointment.createdByName || (appointment.createdByRole === "PATIENT" ? "Patient" : appointment.createdByRole)}`)}
            </p>
          ) : (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
              {locale === "ar" ? "تم الحجز بواسطة: المريض" : "Booked by: Patient"}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 items-center">
            {/* Reschedule for Upcoming, Detail + Book Again for Past */}
            {appointment.status === "completed" ? (
              <>
                {onDetailClick && (
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-sm font-bold rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDetailClick();
                    }}
                  >
                    {locale === "ar" ? "التفاصيل" : "Detail"}
                  </Button>
                )}
                {onBookAgainClick && (
                  <Button
                    className="flex-1 h-10 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookAgainClick();
                    }}
                  >
                    {locale === "ar" ? "حجز مجددًا" : "Book again"}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  className="flex-1 h-10 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRescheduleDialogOpen(true);
                  }}
                >
                  {locale === "ar" ? "إعادة جدولة" : "Reschedule"}
                </Button>
              </>
            )}
            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      <RescheduleDialog
        isOpen={isRescheduleDialogOpen}
        onOpenChange={setIsRescheduleDialogOpen}
        appointment={appointment}
        onConfirm={handleReschedule}
      />
    </motion.div>
  );
}
