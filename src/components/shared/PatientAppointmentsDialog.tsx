"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  MessageSquare as MessageIcon,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { Appointment } from "@/types";

interface PatientAppointmentsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
}

export function PatientAppointmentsDialog({
  isOpen,
  onOpenChange,
  appointments,
}: PatientAppointmentsDialogProps) {
  const router = useRouter();
  const { t, locale, isRTL } = useTranslation();
  const [search, setSearch] = React.useState("");

  const filteredAppointments = React.useMemo(() => {
    return appointments
      .filter(apt => {
        const name = apt.doctorName || "";
        const dateStr = new Date(apt.date).toLocaleDateString();
        return name.toLowerCase().includes(search.toLowerCase()) ||
          dateStr.includes(search);
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.startTime || '00:00'}:00`).getTime();
        const timeB = new Date(`${b.date}T${b.startTime || '00:00'}:00`).getTime();
        return timeA - timeB; // Ascending (closest first for upcoming appointments)
      });
  }, [appointments, search]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-[40px]",
          "bg-slate-50 dark:bg-slate-950"
        )}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center px-6 py-5 bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            {isRTL ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </button>
          <DialogTitle className="flex-1 text-center text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t("upcomingAppointments")}
          </DialogTitle>
          <LanguageToggle variant="ghost" className="h-10 w-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900" />
        </div>

        <div className="md:hidden px-6 py-4 bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <div className="relative group">
            <Search className="absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600 start-4" />
            <input
              type="text"
              placeholder={t("searchAnything")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all ps-12 pe-10 text-start"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-slate-500 end-2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <DialogHeader className="hidden md:block px-8 pt-8 pb-6 bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {t("upcomingAppointments")}
                </DialogTitle>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {appointments.length} {t("scheduled").toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle variant="ghost" className="h-11 w-11 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800" />
              <DialogClose className="h-11 w-11 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </DialogClose>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600 start-5" />
            <input
              type="text"
              placeholder={t("searchAnything")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 rounded-[20px] border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all ps-14 pe-6 text-start"
            />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 no-scrollbar p-4 md:px-6 space-y-3">
          {filteredAppointments.map((apt, idx) => (
            <div
              key={idx}
              className="bg-blue-600 rounded-[32px] py-4 px-5 text-white shadow-sm shadow-blue-500/10 relative overflow-hidden group active:scale-[0.98] transition-all"
            >
              <div className="relative z-10">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex flex-col gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black leading-tight">
                        {new Date(apt.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </span>
                      <span className="text-[9px] opacity-60 font-bold uppercase tracking-wider mt-0.5">{t("appointmentsDate")}</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex flex-col gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black leading-tight">
                        {apt.startTime} - {apt.endTime}
                      </span>
                      <span className="text-[9px] opacity-60 font-bold uppercase tracking-wider mt-0.5">{t("appointmentsTime")}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 border-slate-50 dark:border-slate-800">
                    <Image
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.doctorName}`}
                      alt={apt.doctorName || "Doctor"}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-slate-900 dark:text-slate-50 font-black text-sm truncate">Dr. {apt.doctorName}</span>
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-tight">{t("internistSpecialistDoctor")}</span>
                    {(apt.branchName || apt.branchAddress) && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {apt.branchAddress || apt.branchName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chat?appointmentId=${apt.id}`);
                      onOpenChange(false);
                    }}
                    className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
                  >
                    <MessageIcon className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
              <div className="absolute top-[-10%] right-[-5%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                <Calendar className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold">{t("noUpcomingAppointments")}</p>
            </div>
          )}
        </div>

        <div className="hidden md:flex p-6 bg-white dark:bg-slate-950 border-t border-slate-50 dark:border-slate-800 items-center justify-between shrink-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredAppointments.length} {t("appointments").toLowerCase()} {t("found")}
          </p>
          <DialogClose asChild>
            <Button className="h-12 rounded-2xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 px-8 font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-transform active:scale-95">
              {t("close")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
