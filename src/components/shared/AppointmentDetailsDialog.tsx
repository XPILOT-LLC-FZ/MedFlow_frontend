"use client";

import Image from "next/image";
import { ChevronLeft, MapPin, Calendar, Clock, ClipboardList, Target, Pill, CheckCircle2, Award } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { ApiAppointment } from "@/types";

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: ApiAppointment | null;
  onBookAgain?: () => void;
}

export function AppointmentDetailsDialog({
  isOpen,
  onOpenChange,
  appointment,
  onBookAgain,
}: AppointmentDetailsDialogProps) {
  const { t, locale, isRTL } = useTranslation();

  if (!appointment) return null;

  const consultationNotes = appointment.consultationSession?.notes;
  const prescriptions = appointment.prescriptions || [];
  const investigations = appointment.investigationOrders || [];
  const visitReason = appointment.notes || "Routine medical checkup";

  // Parse symptoms string into tags
  const symptomTags = visitReason
    ? visitReason.split(",").map((s) => s.trim()).filter(Boolean)
    : ["General symptoms", "Follow up checkup"];

  // Fallback branch / location name
  const locationName = (appointment as unknown as { doctor?: { branch?: { name?: string } } }).doctor?.branch?.name || "Mercy Heart Institute";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-y-auto no-scrollbar border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[90vh] md:max-w-md md:rounded-[40px] md:my-6",
          "bg-[#f8fafd] dark:bg-slate-900"
        )}
      >
        {/* Top Navigation */}
        <div className="flex items-center px-6 pt-5 pb-1">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className={cn("h-6 w-6", isRTL && "rotate-180")} />
          </button>
          <DialogTitle className="flex-1 text-center text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {t("details") || "Details"}
          </DialogTitle>
          <div className="w-10" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-3">
          
          {/* Card 1: Details Appointment */}
          <div className="bg-white dark:bg-slate-800/40 rounded-xl p-4 space-y-3 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "تفاصيل الموعد" : "Details Appointment"}
            </h3>

            {/* Doctor Info */}
            <div className="bg-[#f8fafd] dark:bg-slate-800/40 rounded-xl p-3 flex items-center gap-3 border border-slate-100/40 dark:border-slate-800/40 shadow-sm">
              <div className="h-14 w-14 rounded-full overflow-hidden shrink-0">
                <Image
                  src={
                    appointment.doctor?.user?.avatarUrl ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${appointment.doctorId}`
                  }
                  alt={appointment.doctorName || "Doctor"}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover rounded-full"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-50 text-sm truncate">
                    Dr. {appointment.doctorName}
                  </h4>
                  <CheckCircle2 className="h-4 w-4 text-blue-500 fill-current" />
                </div>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  {appointment.serviceName || "Cardiologist"}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-[#f8fafd] dark:bg-slate-800/40 rounded-xl p-3 flex items-center gap-2 text-xs md:text-sm font-semibold border border-slate-100/40 dark:border-slate-800/40">
              <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "الموقع:" : "Location:"}{" "}
                <span className="text-blue-500 font-bold">{locationName}</span>
              </span>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f8fafd] dark:bg-slate-800/40 border border-slate-100/40 dark:border-slate-800/40 rounded-xl p-3.5 space-y-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-0.5 leading-snug">
                  {appointment.date}
                </p>
                <p className="text-[10px] font-medium text-blue-400">
                  {locale === "ar" ? "تاريخ الموعد" : "Appointments Date"}
                </p>
              </div>
              <div className="bg-[#f8fafd] dark:bg-slate-800/40 border border-slate-100/40 dark:border-slate-800/40 rounded-xl p-3.5 space-y-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-0.5 leading-snug">
                  {appointment.startTime} - {appointment.endTime || "30 min"}
                </p>
                <p className="text-[10px] font-medium text-blue-400">
                  {locale === "ar" ? "وقت الموعد" : "Appointments Time"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Visit Reason */}
          <div className="bg-white dark:bg-slate-800/40 rounded-xl p-4 space-y-3 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "سبب الزيارة" : "Visit Reason"}
            </h3>

            {/* Symptoms */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {locale === "ar" ? "الأعراض" : "Symptoms"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {symptomTags.map((symptom, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-100/80 dark:border-slate-800/80 rounded-full px-3 py-1 text-xs text-slate-600 dark:text-slate-300"
                  >
                    {symptom}
                  </div>
                ))}
              </div>
            </div>

            {/* Anamnesis */}
            {consultationNotes && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {locale === "ar" ? "السوابق المرضية" : "Anamnesis"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
                  {consultationNotes}
                </p>
              </div>
            )}

            {/* Diagnosis */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {locale === "ar" ? "التشخيص" : "Diagnosis"}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
                {appointment.serviceName || (locale === "ar" ? "استشارة طبية" : "Standard clinical consultation")}
              </p>
            </div>
          </div>

          {/* Card 3: Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="bg-white dark:bg-slate-800/40 rounded-3xl p-5 space-y-4 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {locale === "ar" ? "الأدوية الموصوفة" : "Prescriptions"}
              </h3>

              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="space-y-2">
                    {prescription.medications && prescription.medications.length > 0 ? (
                      prescription.medications.map((med, idx) => (
                        <div
                          key={`${prescription.id}-med-${idx}`}
                          className="p-4 bg-[#f8fafd] dark:bg-blue-900/20 rounded-2xl border border-slate-100/40 dark:border-slate-800/50 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                              {med.name || "Medication"}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-400 leading-normal">
                            {med.dosage || "As prescribed"} • {med.frequency || "As needed"}
                          </p>
                          <div className="flex gap-2 flex-wrap pt-1">
                            {med.duration && (
                              <span className="bg-slate-50/80 dark:bg-slate-800/80 rounded-full px-2.5 py-1 text-xs text-slate-400 border border-slate-100/80 dark:border-slate-800/80">
                                {med.duration}
                              </span>
                            )}
                            <span className="bg-slate-50/80 dark:bg-slate-800/80 rounded-full px-2.5 py-1 text-xs text-slate-400 border border-slate-100/80 dark:border-slate-800/80">
                              {med.frequency || "daily"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {locale === "ar" ? "لا توجد أدوية" : "No medications"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 4: Investigations */}
          {investigations.length > 0 && (
            <div className="bg-white dark:bg-slate-800/40 rounded-3xl p-5 space-y-4 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {locale === "ar" ? "الاختبارات" : "Lab Tests"}
              </h3>
              <div className="space-y-3">
                {investigations.map((investigation) => (
                  <div
                    key={investigation.id}
                    className="p-4 bg-[#f8fafd] dark:bg-slate-800/40 rounded-2xl border border-slate-100/40 dark:border-slate-800/50 space-y-1"
                  >
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      {investigation.testName || "Test"}
                    </p>
                    {investigation.category && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === "ar" ? "فئة" : "Category"}: {investigation.category}
                      </p>
                    )}
                    {investigation.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal pt-1">
                        {investigation.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="border-t border-slate-100/50 dark:border-slate-800/60 pt-4 space-y-2 text-xs font-bold">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>{locale === "ar" ? "المبلغ الإجمالي" : "Total Amount"}</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {appointment.amount} L.E
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 pt-2 shrink-0 border-t border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 mt-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-600 dark:text-slate-300"
            onClick={() => onOpenChange(false)}
          >
            {locale === "ar" ? "إغلاق" : "Close"}
          </Button>
          {onBookAgain && (
            <Button
              className="flex-1 h-12 rounded-2xl bg-[#2b66ff] hover:bg-[#1c54e0] text-white font-bold transition-colors"
              onClick={() => {
                onOpenChange(false);
                onBookAgain();
              }}
            >
              {locale === "ar" ? "حجز مجددًا" : "Book Again"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
