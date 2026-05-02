"use client";

import React from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { bookingService } from "@/services/bookingService";
import { formatDateKey } from "@/lib/dateUtils";
import type { ApiPublicDoctor, DoctorShift } from "@/types";
import { staffService } from "@/services/staffService";
import { surveyService } from "@/services/surveyService";

interface BookAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: ApiPublicDoctor | null;
  onConfirm: (data: {
    date: string;
    time: string;
    mode: "ONSITE" | "ONLINE";
  }) => void;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_NAMES_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];
const DAY_HEADERS = ["Mo","Tu","We","Th","Fr","Sa","Su"];
const DAY_HEADERS_AR = ["إث","ث","أر","خ","ج","س","أح"];

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function BookAppointmentDialog({
  isOpen,
  onOpenChange,
  doctor,
  onConfirm,
}: BookAppointmentDialogProps) {
  const { t, locale, isRTL } = useTranslation();

  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [timePeriod, setTimePeriod] = React.useState<"AM" | "PM">("AM");
  const [mode, setMode] = React.useState<"ONSITE" | "ONLINE">("ONSITE");
  const [slots, setSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [reviewsRating, setReviewsRating] = React.useState<number | null>(null);
  const [, setReviewsCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (isOpen) {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setSelectedDay(null);
      setSelectedTime(null);
      setSlots([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  React.useEffect(() => {
    if (!doctor || !selectedDay) {
      setSlots([]);
      return;
    }
    const dateStr = formatDateKey(new Date(viewYear, viewMonth, selectedDay));
    setLoadingSlots(true);
    bookingService
      .getAvailableSlots(doctor.id, dateStr)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctor, selectedDay, viewYear, viewMonth]);

  const [shifts, setShifts] = React.useState<DoctorShift[]>([]);
  React.useEffect(() => {
    if (isOpen && doctor) {
      staffService.getDoctorShifts(doctor.id)
        .then(setShifts)
        .catch(() => setShifts([]));

      surveyService.getPublicDoctorReviews(doctor.id)
        .then((res: unknown) => {
          const reviewsRes = res as { stats?: { averageRating?: number; totalReviews?: number } };
          if (reviewsRes?.stats?.averageRating !== undefined) {
            setReviewsRating(reviewsRes.stats.averageRating);
          }
          if (reviewsRes?.stats?.totalReviews !== undefined) {
            setReviewsCount(reviewsRes.stats.totalReviews);
          }
        })
        .catch(() => null);
    }
  }, [isOpen, doctor]);

  if (!doctor) return null;

  const cells = buildCalendarDays(viewYear, viewMonth);
  const todayDate = new Date();

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    return d < todayDate;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
    setSelectedTime(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const filteredSlots = slots.filter(slot => {
    const h = parseInt(slot.split(":")[0], 10);
    return timePeriod === "AM" ? h < 12 : h >= 12;
  });

  const displaySlots = filteredSlots.length > 0 ? filteredSlots : (
    selectedDay ? (timePeriod === "AM"
      ? ["09:00","10:00","11:00","09:30","10:30"]
      : ["13:00","14:00","15:00","16:00","17:00"]
    ) : []
  );

  const monthNames = locale === "ar" ? MONTH_NAMES_AR : MONTH_NAMES;
  const dayHeaders = locale === "ar" ? DAY_HEADERS_AR : DAY_HEADERS;

  const consultFee = doctor.consultationFee ?? 200;
  const sessionMin = 25;

  const canConfirm = !!selectedDay && !!selectedTime;

  const handleConfirm = () => {
    if (!selectedDay || !selectedTime) return;
    const dateStr = formatDateKey(new Date(viewYear, viewMonth, selectedDay));
    onConfirm({ date: dateStr, time: selectedTime, mode });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-y-auto no-scrollbar border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[90vh] md:max-w-md md:rounded-[40px]",
          "bg-white dark:bg-slate-900"
        )}
      >
        <div className="flex items-center px-6 py-4 bg-transparent shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className={cn("h-6 w-6", isRTL && "rotate-180")} />
          </button>
          <DialogTitle className="flex-1 text-center text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t("appointmentScheduler") || "Appointment Scheduler"}
          </DialogTitle>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-3 space-y-3">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-md">
            {(["ONSITE", "ONLINE"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 h-12 rounded-md text-sm font-black transition-all flex items-center justify-center gap-2",
                  mode === m
                    ? "bg-blue-200 dark:bg-slate-700 text-blue-600 shadow-sm"
                    : "text-slate-900 dark:text-slate-50"
                )}
              >
                {m === "ONSITE" ? (
                  <><MapPin className="h-4 w-4" /> {t("onClinic") || "On Clinic"}</>
                ) : (
                  <><Globe className="h-4 w-4" /> {t("onlineConsultation") || "Online"}</>
                )}
              </button>
            ))}
          </div>

          {
            (() => {
              const avgRating = reviewsRating ?? doctor.rating ?? 5.0;
              return (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <div className="h-16 w-16 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={doctor.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.fullName}`}
                      alt={doctor.fullName}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-slate-50 text-md truncate">
                      Dr. {doctor.fullName}
                    </h4>
                    <p className="text-sm font-bold text-slate-400">
                      {doctor.specialization} • {doctor.experienceYears} YRS EXP
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                        {Number(avgRating).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          }

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-base font-black text-slate-900 dark:text-slate-50">
                {monthNames[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {dayHeaders.map(d => (
                <div key={d} className="text-center text-[11px] font-black text-slate-400 uppercase py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const isToday =
                  day === todayDate.getDate() &&
                  viewMonth === todayDate.getMonth() &&
                  viewYear === todayDate.getFullYear();
                const isSelected = day === selectedDay;
                const past = isPast(day);
                
                // Color dots/points based on real working shifts
                const dObj = new Date(viewYear, viewMonth, day);
                const dayOfWeekNumber = dObj.getDay();
                const hasShift = shifts.length > 0
                  ? shifts.some(s => s.isAvailable && s.dayOfWeek === dayOfWeekNumber)
                  : (dayOfWeekNumber !== 5 && dayOfWeekNumber !== 6);

                const isOffDay = !hasShift;
                const isFull = false;
                const isAvailable = hasShift && !isFull;

                return (
                  <button
                    key={idx}
                    disabled={past || isOffDay || isFull}
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedTime(null);
                    }}
                    className={cn(
                      "h-11 w-11 mx-auto rounded-xl text-sm font-bold transition-all flex flex-col items-center justify-center gap-0.5 relative",
                      isSelected && "bg-blue-600 text-white shadow-md shadow-blue-500/30",
                      !isSelected && isToday && "text-blue-600 ring-2 ring-blue-600",
                      !isSelected && !isToday && !past && !isOffDay && "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200",
                      !isSelected && isOffDay && "opacity-40 cursor-not-allowed",
                      past && "text-slate-200 dark:text-slate-700 cursor-not-allowed"
                    )}
                  >
                    <span className="text-xs font-black">
                      {day}
                    </span>
                    {!past && (
                      <span className={cn("h-1.5 w-1.5 rounded-full",
                        isToday ? "bg-blue-600" : isAvailable ? "bg-emerald-500" : isFull ? "bg-rose-500" : "bg-slate-400"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Availability Legend */}
            <div className="flex justify-around mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/40 text-[11px] font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span>{locale === "ar" ? "اليوم" : "Today"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{t("available") || "Available"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>{locale === "ar" ? "ممتلئ" : "Full"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>{locale === "ar" ? "يوم عطلة" : "Off Day"}</span>
              </div>
            </div>
          </div>

          {selectedDay && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-50">
                  {t("availableSlots") || "Available Slots"}
                </h4>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                  {(["AM", "PM"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => { setTimePeriod(p); setSelectedTime(null); }}
                      className={cn(
                        "px-3 py-1 rounded-sm text-xs font-medium transition-all",
                        timePeriod === p
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : displaySlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {displaySlots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "h-10 rounded-lg text-sm font-black transition-all border",
                        selectedTime === slot
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm font-bold text-slate-400 py-4">
                  {t("noAvailableSlots") || "No slots available"}
                </p>
              )}
            </div>
          )}

          {selectedDay && selectedTime && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">
                {t("overview") || "Your visit will be"}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {selectedDay} {monthNames[viewMonth]}, {viewYear}
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {selectedTime}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-100 dark:border-blue-900/40">
                <span className="text-xl font-black text-blue-600">
                  {consultFee} L.E
                </span>
                <span className="text-sm font-bold text-slate-400">
                  {sessionMin} min
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 shrink-0 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 mt-auto">
          <Button
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("proceedToCheckout") || "Proceed to checkout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
