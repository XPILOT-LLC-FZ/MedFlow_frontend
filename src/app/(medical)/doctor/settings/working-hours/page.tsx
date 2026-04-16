"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Save, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";
import type { DoctorShift } from "@/types";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayLabelsAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const shortDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const shortDayLabelsAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getDayLabel(dayOfWeek: number, locale: string): string {
  return locale === "ar" ? dayLabelsAr[dayOfWeek] : dayLabels[dayOfWeek];
}

function getShortDayLabel(dayOfWeek: number, locale: string): string {
  return locale === "ar" ? shortDayLabelsAr[dayOfWeek] : shortDayLabels[dayOfWeek];
}

function buildDefaultShift(dayOfWeek: number): DoctorShift {
  return {
    dayOfWeek,
    shiftStart: "09:00",
    shiftEnd: "17:00",
    lunchStart: "13:00",
    lunchEnd: "14:00",
    isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
    branchId: null,
  };
}

function normalizeShifts(source: DoctorShift[]): DoctorShift[] {
  const map = new Map<number, DoctorShift>();
  source.forEach((shift) => {
    map.set(shift.dayOfWeek, {
      ...buildDefaultShift(shift.dayOfWeek),
      ...shift,
      shiftStart: shift.shiftStart?.slice(0, 5) || "09:00",
      shiftEnd: shift.shiftEnd?.slice(0, 5) || "17:00",
      lunchStart: shift.lunchStart ? shift.lunchStart.slice(0, 5) : "13:00",
      lunchEnd: shift.lunchEnd ? shift.lunchEnd.slice(0, 5) : "14:00",
    });
  });

  const normalized: DoctorShift[] = [];
  for (let day = 0; day < 7; day += 1) {
    normalized.push(map.get(day) || buildDefaultShift(day));
  }
  return normalized;
}

function toMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
}

function calculateDuration(start: string, end: string) {
  if (!start || !end) return "0 hrs";
  let diff = toMinutes(end) - toMinutes(start);
  if (diff < 0) diff += 24 * 60; // handle wrap around if someone puts weird times
  if (diff === 0) return "0 hrs";
  return `${(diff / 60).toFixed(0)} hrs`;
}

function validateShifts(shifts: DoctorShift[], locale: string): string | null {
  for (const shift of shifts) {
    if (!shift.isAvailable) continue;

    const label = getDayLabel(shift.dayOfWeek, locale);
    const shiftStart = shift.shiftStart?.trim();
    const shiftEnd = shift.shiftEnd?.trim();

    if (!shiftStart || !shiftEnd) {
      return locale === "ar"
        ? `الرجاء إدخال وقت بداية ونهاية صحيحين ليوم ${label}`
        : `Please provide valid shift start and end times for ${label}`;
    }

    if (toMinutes(shiftEnd) <= toMinutes(shiftStart)) {
      return locale === "ar"
        ? `وقت نهاية الدوام يجب أن يكون بعد البداية ليوم ${label}`
        : `Shift end must be after shift start for ${label}`;
    }

    const hasLunchStart = Boolean(shift.lunchStart);
    const hasLunchEnd = Boolean(shift.lunchEnd);

    if (hasLunchStart !== hasLunchEnd) {
      return locale === "ar"
        ? `الرجاء إدخال بداية ونهاية الاستراحة معًا ليوم ${label}`
        : `Provide both lunch start and lunch end for ${label}`;
    }

    if (hasLunchStart && hasLunchEnd) {
      const lunchStart = shift.lunchStart as string;
      const lunchEnd = shift.lunchEnd as string;

      if (toMinutes(lunchEnd) <= toMinutes(lunchStart)) {
        return locale === "ar"
          ? `وقت نهاية الاستراحة يجب أن يكون بعد البداية ليوم ${label}`
          : `Lunch end must be after lunch start for ${label}`;
      }

      if (toMinutes(lunchStart) < toMinutes(shiftStart) || toMinutes(lunchEnd) > toMinutes(shiftEnd)) {
        return locale === "ar"
          ? `الاستراحة يجب أن تكون ضمن وقت الدوام ليوم ${label}`
          : `Lunch time must be within shift bounds for ${label}`;
      }
    }
  }

  return null;
}

export default function WorkingHoursSettingsPage() {
  const { locale } = useTranslation();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();
  const { success, error } = useToastStore();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shifts, setShifts] = useState<DoctorShift[]>(
    Array.from({ length: 7 }).map((_, day) => buildDefaultShift(day))
  );

  // Preference fields
  const [consultationDuration, setConsultationDuration] = useState(20); // minutes
  const [bufferTime, setBufferTime] = useState(5); // minutes
  const [autoScheduling, setAutoScheduling] = useState(true);
  
  // Track global break duration to apply to all shifts
  const [globalBreakStart, setGlobalBreakStart] = useState("13:00");
  const [globalBreakEnd, setGlobalBreakEnd] = useState("14:00");

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDoctors();
      const doctors = useStaffStore.getState().doctors;
      const doctor = doctors.find((entry) =>
        entry.userId === user?.id ||
        entry.id === user?.id ||
        entry.email?.toLowerCase() === user?.email?.toLowerCase()
      );

      if (!doctor) {
        error(locale === "ar" ? "تعذر العثور على ملف الطبيب" : "Doctor profile not found");
        setDoctorId(null);
        return;
      }

      setDoctorId(doctor.id);

      const fetchedShifts = await staffService.getDoctorShifts(doctor.id);
      const normalized = normalizeShifts(fetchedShifts);
      setShifts(normalized);
      
      // Seed global breaks if the first available shift has them
      const firstAvailable = normalized.find(s => s.isAvailable);
      if (firstAvailable && firstAvailable.lunchStart && firstAvailable.lunchEnd) {
        setGlobalBreakStart(firstAvailable.lunchStart);
        setGlobalBreakEnd(firstAvailable.lunchEnd);
      }
    } catch {
      error(locale === "ar" ? "فشل تحميل أوقات العمل" : "Failed to load working hours");
    } finally {
      setIsLoading(false);
    }
  }, [error, fetchDoctors, locale, user?.email, user?.id]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Load local settings when doctorId is known
  useEffect(() => {
    if (doctorId && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`doctor-settings-${doctorId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.consultationDuration) setConsultationDuration(parsed.consultationDuration);
          if (parsed.bufferTime !== undefined) setBufferTime(parsed.bufferTime);
          if (parsed.autoScheduling !== undefined) setAutoScheduling(parsed.autoScheduling);
        }
      } catch (e) {
        console.error("Failed to parse local doctor settings", e);
      }
    }
  }, [doctorId]);

  const updateShift = (dayOfWeek: number, patch: Partial<DoctorShift>) => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.dayOfWeek === dayOfWeek
          ? { ...shift, ...patch }
          : shift
      )
    );
  };
  
  // Apply break globally when they change
  const handleBreakChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') setGlobalBreakStart(val);
    else setGlobalBreakEnd(val);
    
    setShifts(prev => prev.map(s => ({
      ...s,
      lunchStart: type === 'start' ? val : globalBreakStart,
      lunchEnd: type === 'end' ? val : globalBreakEnd,
    })));
  };

  const handleSave = async () => {
    if (!doctorId) return;

    const validationError = validateShifts(shifts, locale);
    if (validationError) {
      error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const payload = shifts
        .map((shift) => ({
          dayOfWeek: shift.dayOfWeek,
          shiftStart: shift.shiftStart,
          shiftEnd: shift.shiftEnd,
          lunchStart: shift.lunchStart || null,
          lunchEnd: shift.lunchEnd || null,
          isAvailable: shift.isAvailable,
          branchId: shift.branchId || null,
        }))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      await staffService.updateDoctorShifts(doctorId, payload);
      
      // Save local preferences
      localStorage.setItem(`doctor-settings-${doctorId}`, JSON.stringify({
        consultationDuration,
        bufferTime,
        autoScheduling
      }));
      
      success(locale === "ar" ? "تم حفظ أوقات العمل بنجاح" : "Working hours saved successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save working hours";
      error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const globalBreakDurationMins = (!globalBreakStart || !globalBreakEnd) 
    ? 0 
    : toMinutes(globalBreakEnd) - toMinutes(globalBreakStart);

  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-40">
          <p className="text-slate-500">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</p>
       </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      
      {/* Consultation Duration */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
               {locale === "ar" ? "مدة الاستشارة" : "Consultation Duration"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
               {locale === "ar" ? "قم بتعيين الوقت الافتراضي المخصص لكل استشارة مريض" : "Set the default time allocated for each patient consultation"}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full space-y-4">
              <input 
                type="range" 
                min="5" 
                max="60" 
                step="5"
                value={consultationDuration}
                onChange={(e) => setConsultationDuration(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex flex-wrap gap-3">
                {[15, 20, 30, 45].map((val) => (
                   <button 
                     key={val}
                     onClick={() => setConsultationDuration(val)}
                     className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        consultationDuration === val 
                        ? "bg-blue-600 text-white" 
                        : "bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                     }`}
                   >
                     {val} min
                   </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[80px]">
               <span className="text-3xl font-bold text-blue-600 dark:text-blue-500">{consultationDuration}</span>
               <span className="text-[10px] uppercase font-semibold text-slate-400">minutes</span>
            </div>
          </div>
          
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
               {locale === "ar" ? "وقت الفراغ بين المرضى" : "Buffer Time Between Patients"}
            </h3>
            <div className="relative max-w-sm">
               <select 
                 className="w-full h-10 px-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                 value={bufferTime}
                 onChange={(e) => setBufferTime(Number(e.target.value))}
               >
                 <option value={0}>0 minutes</option>
                 <option value={5}>5 minutes</option>
                 <option value={10}>10 minutes</option>
                 <option value={15}>15 minutes</option>
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                 {locale === "ar" ? "الجدولة التلقائية" : "Auto-Scheduling"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                 {locale === "ar" ? "جدولة المواعيد تلقائياً بناءً على التوفر" : "Automatically schedule appointments based on availability"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={autoScheduling} onChange={(e) => setAutoScheduling(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>
      
      {/* Break Duration */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-start">
             <div>
               <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {locale === "ar" ? "مدة الاستراحة" : "Break Duration"}
               </h3>
               <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {locale === "ar" ? "قم بتعيين الوقت الافتراضي المخصص للاستراحة" : "Set the default time allocated for breaks during your shift"}
               </p>
             </div>
             <div className="flex flex-col items-center justify-center min-w-[80px]">
                {globalBreakDurationMins > 0 ? (
                  <span className="text-3xl font-bold text-slate-800 dark:text-slate-200">{globalBreakDurationMins}</span>
                ) : (
                  <HelpCircle className="h-8 w-8 text-blue-600" />
                )}
                <span className="text-[10px] uppercase font-semibold text-slate-400 pt-1">minutes</span>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
             <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{locale === "ar" ? "بداية الاستراحة" : "Break Start"}</label>
                <Input 
                  type="time" 
                  value={globalBreakStart} 
                  onChange={(e) => handleBreakChange('start', e.target.value)}
                  className="h-10 bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-medium"
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{locale === "ar" ? "نهاية الاستراحة" : "Break End"}</label>
                <Input 
                  type="time" 
                  value={globalBreakEnd} 
                  onChange={(e) => handleBreakChange('end', e.target.value)}
                  className="h-10 bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-medium"
                />
             </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly Schedule */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <CardContent className="p-6 space-y-4">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
               {locale === "ar" ? "الجدول الأسبوعي" : "Weekly Schedule"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
               {locale === "ar" ? "قم بتعيين التوفر الخاص بك لكل يوم من أيام الأسبوع" : "Set your availability for each day of the week"}
            </p>
          </div>
          
          <div className="space-y-3">
             {shifts.map((shift) => (
               <div key={shift.dayOfWeek} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl gap-4">
                  <div className="flex items-center gap-3 w-[140px] shrink-0">
                     <label className="relative inline-flex items-center cursor-pointer shrink-0">
                       <input 
                         type="checkbox" 
                         className="sr-only peer" 
                         checked={shift.isAvailable} 
                         onChange={(e) => updateShift(shift.dayOfWeek, { isAvailable: e.target.checked })} 
                       />
                       <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                     </label>
                     <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{getDayLabel(shift.dayOfWeek, locale)}</span>
                        <span className="text-[10px] text-slate-400">{getShortDayLabel(shift.dayOfWeek, locale)}</span>
                     </div>
                  </div>
                  
                  {shift.isAvailable ? (
                    <>
                      <div className="flex items-center gap-2 flex-1 w-full justify-center">
                         <div className="w-full max-w-[120px]">
                            <label className="text-[10px] text-slate-400 mb-1 block">Start</label>
                            <Input 
                              type="time" 
                              value={shift.shiftStart} 
                              onChange={(e) => updateShift(shift.dayOfWeek, { shiftStart: e.target.value })}
                              className="h-8 text-xs bg-white dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 shadow-none px-2"
                            />
                         </div>
                         <span className="text-slate-300 mt-4">—</span>
                         <div className="w-full max-w-[120px]">
                            <label className="text-[10px] text-slate-400 mb-1 block">End</label>
                            <Input 
                              type="time" 
                              value={shift.shiftEnd} 
                              onChange={(e) => updateShift(shift.dayOfWeek, { shiftEnd: e.target.value })}
                              className="h-8 text-xs bg-white dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 shadow-none px-2"
                            />
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center w-[60px] shrink-0 mt-4 sm:mt-0">
                         <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{calculateDuration(shift.shiftStart, shift.shiftEnd)}</span>
                         <span className="text-[9px] text-slate-400">total</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 w-full flex justify-end xl:pr-5">
                       <div className="flex flex-col items-center justify-center w-[60px] shrink-0">
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Off</span>
                          <span className="text-[9px] text-slate-400/70">total</span>
                       </div>
                    </div>
                  )}
               </div>
             ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-2">
        <Button 
          onClick={() => void handleSave()} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving
            ? locale === "ar"
              ? "جارٍ الحفظ..."
              : "Saving..."
            : locale === "ar"
              ? "حفظ التغييرات"
              : "Save Changes"}
        </Button>
      </div>
      
    </div>
  );
}
