"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Save, RefreshCcw, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import type { ApiService, DoctorShift } from "@/types";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayLabelsAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getDayLabel(dayOfWeek: number, locale: string): string {
  return locale === "ar" ? dayLabelsAr[dayOfWeek] : dayLabels[dayOfWeek];
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
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
}

function normalizeAvailabilityResponse(response: unknown): string[] {
  if (Array.isArray(response)) {
    return response.map((slot) => String(slot));
  }

  if (typeof response === "object" && response !== null) {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.slots)) {
      return record.slots.map((slot) => String(slot));
    }

    if (Array.isArray(record.availableSlots)) {
      return record.availableSlots.map((slot) => String(slot));
    }
  }

  return [];
}

function validateShifts(shifts: DoctorShift[], locale: string): string | null {
  for (const shift of shifts) {
    if (!shift.isAvailable) {
      continue;
    }

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

export default function SchedulePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();
  const { success, error } = useToastStore();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [services, setServices] = useState<ApiService[]>([]);
  const [shifts, setShifts] = useState<DoctorShift[]>(
    Array.from({ length: 7 }).map((_, day) => buildDefaultShift(day))
  );

  const hasDoctor = Boolean(doctorId);

  const loadAvailability = useCallback(async (targetDoctorId: string) => {
    if (!targetDoctorId || !availabilityDate) {
      setAvailableSlots([]);
      return;
    }

    setIsLoadingAvailability(true);
    try {
      const response = await staffService.getDoctorAvailability(
        targetDoctorId,
        availabilityDate,
        selectedServiceId || undefined,
      );
      setAvailableSlots(normalizeAvailabilityResponse(response));
    } catch {
      setAvailableSlots([]);
      error(locale === "ar" ? "تعذر تحميل الأوقات المتاحة" : "Failed to load available slots");
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [availabilityDate, error, locale, selectedServiceId]);

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

      const [fetchedShifts, fetchedServices] = await Promise.all([
        staffService.getDoctorShifts(doctor.id),
        servicesCatalogService.getAll({ isActive: "true" }).catch(() => [] as ApiService[]),
      ]);

      setShifts(normalizeShifts(fetchedShifts));
      setServices(fetchedServices);
    } catch {
      error(locale === "ar" ? "فشل تحميل الجدول" : "Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  }, [error, fetchDoctors, locale, user?.email, user?.id]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!doctorId) {
      setAvailableSlots([]);
      return;
    }

    void loadAvailability(doctorId);
  }, [availabilityDate, doctorId, loadAvailability, selectedServiceId]);

  const updateShift = (dayOfWeek: number, patch: Partial<DoctorShift>) => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.dayOfWeek === dayOfWeek
          ? { ...shift, ...patch }
          : shift
      )
    );
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
      success(locale === "ar" ? "تم حفظ جدول الدوام" : "Schedule saved");
      void loadAvailability(doctorId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save schedule";
      error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("schedule")}
        description={locale === "ar" ? "إدارة جدولك الأسبوعي" : "Manage your weekly schedule"}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => void initialize()}>
              <RefreshCcw className="h-4 w-4" />
              {locale === "ar" ? "تحديث" : "Refresh"}
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={!hasDoctor || isSaving || isLoading}>
              <Save className="h-4 w-4" />
              {isSaving ? (locale === "ar" ? "جارٍ الحفظ..." : "Saving...") : t("save")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "ar" ? "الدوام الأسبوعي" : "Weekly Shift Configuration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "جارٍ تحميل الجدول..." : "Loading schedule..."}</p>
          ) : !hasDoctor ? (
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا يوجد ملف طبيب مرتبط بالحساب الحالي" : "No doctor profile linked to current account"}</p>
          ) : (
            shifts.map((shift) => (
              <div key={shift.dayOfWeek} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center rounded-lg border p-3">
                <div className="md:col-span-2">
                  <p className="text-sm font-medium">{getDayLabel(shift.dayOfWeek, locale)}</p>
                </div>
                <label className="md:col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={shift.isAvailable}
                    onChange={(e) => updateShift(shift.dayOfWeek, { isAvailable: e.target.checked })}
                  />
                  {locale === "ar" ? "متاح" : "Available"}
                </label>
                <Input
                  type="time"
                  value={shift.shiftStart}
                  onChange={(e) => updateShift(shift.dayOfWeek, { shiftStart: e.target.value })}
                  className="md:col-span-2"
                  disabled={!shift.isAvailable}
                />
                <Input
                  type="time"
                  value={shift.shiftEnd}
                  onChange={(e) => updateShift(shift.dayOfWeek, { shiftEnd: e.target.value })}
                  className="md:col-span-2"
                  disabled={!shift.isAvailable}
                />
                <Input
                  type="time"
                  value={shift.lunchStart || ""}
                  onChange={(e) => updateShift(shift.dayOfWeek, { lunchStart: e.target.value || null })}
                  className="md:col-span-2"
                  disabled={!shift.isAvailable}
                />
                <Input
                  type="time"
                  value={shift.lunchEnd || ""}
                  onChange={(e) => updateShift(shift.dayOfWeek, { lunchEnd: e.target.value || null })}
                  className="md:col-span-2"
                  disabled={!shift.isAvailable}
                />
              </div>
            ))
          )}

          {!isLoading && hasDoctor && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                {locale === "ar"
                  ? "يجب حفظ 7 أيام مع أوقات صالحة لتطبيقها"
                  : "All 7 days must be saved with valid time ranges"}
              </span>
              <Badge variant="outline">7 days</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {locale === "ar" ? "معاينة التوفر" : "Availability Preview"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "التاريخ" : "Date"}
              </label>
              <Input
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                disabled={!hasDoctor || isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "الخدمة (اختياري)" : "Service (optional)"}
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                disabled={!hasDoctor || isLoading}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  {locale === "ar" ? "كل الخدمات" : "All services"}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => doctorId && void loadAvailability(doctorId)}
                disabled={!hasDoctor || isLoadingAvailability || isLoading}
              >
                <RefreshCcw className="h-4 w-4" />
                {locale === "ar" ? "تحديث التوفر" : "Refresh Availability"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {locale === "ar"
                ? "الأوقات المعروضة تعتمد على الدوام، الاستراحة، والمواعيد المحجوزة"
                : "Slots reflect shifts, lunch breaks, and existing appointments"}
            </span>
            <Badge variant="outline">{availableSlots.length}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {isLoadingAvailability && (
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "جارٍ تحميل الأوقات..." : "Loading slots..."}
              </p>
            )}

            {!isLoadingAvailability && availableSlots.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "لا توجد أوقات متاحة لليوم المحدد" : "No slots available for the selected date"}
              </p>
            )}

            {!isLoadingAvailability && availableSlots.map((slot) => (
              <Badge key={slot} variant="outline" className="font-mono">
                {slot}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
