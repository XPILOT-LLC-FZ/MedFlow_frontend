"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, Calendar, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { bookingService } from "@/services/bookingService";
import { cn } from "@/lib/utils";
import { staffService } from "@/services/staffService";
import type { Appointment, DoctorShift } from "@/types";

interface RescheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onConfirm?: (newDate: string, newTime: string) => void;
}

export function RescheduleDialog({
  isOpen,
  onOpenChange,
  appointment,
  onConfirm,
}: RescheduleDialogProps) {
  const { locale, isRTL } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [userHasSelectedDate, setUserHasSelectedDate] = useState<boolean>(false);
  const [userHasSelectedTime, setUserHasSelectedTime] = useState<boolean>(false);
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [dayStatus, setDayStatus] = useState<Record<string, "available" | "full" | "off">>({});
  const [shifts, setShifts] = useState<DoctorShift[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [, setIsLoadingSlots] = useState<boolean>(false);

  const now = React.useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    if (isOpen && appointment?.date) {
      const d = new Date(appointment.date.split("T")[0]);
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth() + 1);
        setSelectedDate(appointment.date.split("T")[0]);
      } else {
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth() + 1);
        setSelectedDate(now.toISOString().split("T")[0]);
      }
      setUserHasSelectedDate(false);
      setUserHasSelectedTime(false);
    } else if (isOpen) {
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth() + 1);
      setSelectedDate(now.toISOString().split("T")[0]);
      setUserHasSelectedDate(false);
      setUserHasSelectedTime(false);
    }
  }, [appointment?.date, isOpen, now]);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const monthName = new Date(viewYear, viewMonth - 1, 1).toLocaleString(
    locale === "ar" ? "ar-EG" : "en-US",
    { month: "long" }
  );

  const getDayDateString = (day: number) => {
    return `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth - 1, 1).getDay();
  // Adjust Monday-first week index (Monday = 0, Sunday = 6)
  const emptyDaysCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];


  useEffect(() => {
    if (isOpen && appointment?.doctorId) {
      staffService.getDoctorShifts(appointment.doctorId)
        .then(setShifts)
        .catch(() => setShifts([]));
    }
  }, [isOpen, appointment?.doctorId]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!isOpen || !appointment?.doctorId) return;
      const statusMap: Record<string, "available" | "full" | "off"> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
      const promises = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dObj = new Date(viewYear, viewMonth - 1, day);
        dObj.setHours(0, 0, 0, 0);

        const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayOfWeekNumber = dObj.getDay();

        // Check if doctor has a shift on this day of week
        const hasShift = shifts.length > 0
          ? shifts.some((s) => s.isAvailable && s.dayOfWeek === dayOfWeekNumber)
          : dayOfWeekNumber !== 5 && dayOfWeekNumber !== 6;

        if (dObj < today || !hasShift) {
          statusMap[dateStr] = "off";
          return Promise.resolve();
        }

        return bookingService.getAvailableSlots(appointment.doctorId, dateStr)
          .then((slots) => {
            if (slots && slots.length > 0) {
              statusMap[dateStr] = "available";
            } else {
              statusMap[dateStr] = "full";
            }
          })
          .catch(() => {
            statusMap[dateStr] = "off";
          });
      });

      await Promise.allSettled(promises);
      setDayStatus(statusMap);
    };
    void loadAvailability();
  }, [isOpen, appointment?.doctorId, viewMonth, viewYear, shifts, now]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !appointment?.doctorId) return;
      setIsLoadingSlots(true);
      try {
        const slots = await bookingService.getAvailableSlots(appointment.doctorId, selectedDate);
        setAvailableSlots(slots);
        if (slots && slots.length > 0) {
          setSelectedTime(slots[0]);
        } else {
          setSelectedTime("");
        }
      } catch (err) {
        console.error("Failed to load time slots", err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    void loadSlots();
  }, [appointment?.doctorId, selectedDate]);

  if (!appointment) return null;

  const handleConfirm = () => {
    if (selectedDate && selectedTime && onConfirm) {
      const convertAmPmTo24Hour = (timeStr: string) => {
        if (!timeStr.includes("AM") && !timeStr.includes("PM")) return timeStr;
        const [time, period] = timeStr.split(" ");
        const parts = time.split(":").map(Number);
        let h = parts[0];
        const m = parts[1];
        if (period === "PM" && h < 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      };

      const time24h = convertAmPmTo24Hour(selectedTime);
      onConfirm(selectedDate, time24h);
      onOpenChange(false);
    }
  };

  const convertTimeToAmPm = (slot: string) => {
    if (slot.includes("AM") || slot.includes("PM")) return slot;
    const [h, m] = slot.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const currentSlots = availableSlots.map(convertTimeToAmPm).filter((slot) => {
    return slot.endsWith(timePeriod);
  });

  const getDayStatus = (day: number) => {
    const dateStr = getDayDateString(day);
    return dayStatus[dateStr] || "off";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-y-auto no-scrollbar border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[90vh] md:max-w-md md:rounded-[40px] md:my-5",
          "bg-[#f8fafd] dark:bg-slate-900"
        )}
      >
        {/* Top Navigation */}
        <div className="flex items-center px-6 pt-4 ">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {isRTL ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </button>
          <DialogTitle className="flex-1 text-center text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {locale === "ar" ? "خيارات إعادة الجدولة" : "Reschedule options"}
          </DialogTitle>
          <div className="w-10" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-4">

          {/* Card 1: Current Appointment Info */}
          <div className="bg-white dark:bg-slate-800/40 rounded-xl p-4 space-y-4 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "تفاصيل الموعد" : "Details Appointment"}
            </h3>

            {/* Doctor Info */}
            <div className="bg-[#f8fafd] dark:bg-slate-800/40 rounded-xl p-3 flex items-center gap-3 border border-slate-100/40 dark:border-slate-800/40 shadow-sm">
              <div className="h-14 w-14 rounded-full overflow-hidden shrink-0">
                <Image
                  src={
                    appointment.patientAvatar ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${appointment.doctorId}`
                  }
                  alt={appointment.doctorName || "Doctor"}
                  width={564}
                  height={64}
                  className="h-full w-full object-cover rounded-full"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-50 text-md truncate">
                    Dr. {appointment.doctorName}
                  </h4>
                  <CheckCircle2 className="h-4 w-4 text-blue-500 fill-current" />
                </div>
                <p className="text-sm font-medium text-slate-400 mt-0.5">
                  {appointment.specialty || "Cardiologist"}
                </p>
              </div>
            </div>

            {/* Current Date & Time Grid */}
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
              <div className="bg-[#f8fafd] dark:bg-slate-800/40 border border-slate-100/40 dark:border-slate-800/40 rounded-2xl p-3.5 space-y-1">
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

          {/* Card 2: Custom Calendar */}
          <div className="bg-white dark:bg-slate-800/40 rounded-xl p-5 space-y-4 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {monthName} {viewYear}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="h-6 w-6 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="h-6 w-6 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-3 text-center text-xs font-bold pt-2">
              {/* Empty offsets for starting day of month */}
              {Array.from({ length: emptyDaysCount }, (_, i) => (
                <span key={`empty-${i}`} className="text-transparent">0</span>
              ))}

              {monthDays.map((day) => {
                const dateStr = getDayDateString(day);
                const isSelected = selectedDate === dateStr;
                const status = getDayStatus(day);
                const isClickable = status === "available";

                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (isClickable) {
                        setSelectedDate(dateStr);
                        setUserHasSelectedDate(true);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center select-none",
                      isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-11 rounded-lg flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-[#2b66ff] text-[#2b66ff]"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {day}
                    </div>
                    {/* Status Dot */}
                    <div className="flex items-center justify-center pt-1">
                      <span
                        className={cn(
                          "h-1 w-1 rounded-full",
                          status === "available" && "bg-emerald-500",
                          status === "full" && "bg-rose-500",
                          status === "off" && "bg-slate-300"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Color Legend exactly as requested */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-800/40">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-rose-500 rounded-full" />
                <span>Full</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
                <span>Off Day</span>
              </div>
            </div>
          </div>

          {/* Section 3: Available time */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Available time
              </span>
              <div className="flex bg-slate-100/80 dark:bg-slate-800/80 rounded-full p-1 h-9 backdrop-blur-md">
                <button
                  onClick={() => setTimePeriod("AM")}
                  className={cn(
                    "px-4 h-7 text-xs font-bold rounded-full transition-all",
                    timePeriod === "AM"
                      ? "bg-[#2b66ff] text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  AM
                </button>
                <button
                  onClick={() => setTimePeriod("PM")}
                  className={cn(
                    "px-4 h-7 text-xs font-bold rounded-full transition-all",
                    timePeriod === "PM"
                      ? "bg-[#2b66ff] text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="grid grid-cols-3 gap-3">
              {currentSlots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => {
                      setSelectedTime(slot);
                      setUserHasSelectedTime(true);
                    }}
                    className={cn(
                      "h-11 font-bold text-xs rounded-xl border transition-all flex items-center justify-center",
                      isSelected
                        ? "bg-[#2b66ff] border-[#2b66ff] text-white"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {slot.replace(" AM", "").replace(" PM", "")}
                  </button>
                );
              })}
              {currentSlots.length === 0 && (
                <p className="col-span-3 text-xs text-center text-slate-400 py-2">
                  {locale === "ar" ? "لا توجد أوقات متاحة" : "No available times"}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Summary You Reschedule to */}
          {userHasSelectedDate && userHasSelectedTime && selectedDate && selectedTime && (
            <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 space-y-2 text-center">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {locale === "ar" ? "تمت إعادة الجدولة إلى" : "You reschedule to"}
              </h4>
              <div className="flex justify-around text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>
                  {new Date(selectedDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
                <span>{selectedTime}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button exactly matching screenshot */}
        <div className="px-5 pb-6 pt-3 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800/40">
          <Button
            onClick={handleConfirm}
            className="w-full h-12 rounded-3xl font-bold bg-[#2b66ff] hover:bg-[#1c54e0] text-white transition-colors"
          >
            {locale === "ar" ? "تأكيد إعادة الجدولة" : "Reschedule appointment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
