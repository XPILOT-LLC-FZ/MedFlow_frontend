"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Save, RefreshCcw } from "lucide-react";
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
import type { DoctorShift } from "@/types";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

export default function SchedulePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();
  const { success, error } = useToastStore();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shifts, setShifts] = useState<DoctorShift[]>(
    Array.from({ length: 7 }).map((_, day) => buildDefaultShift(day))
  );

  const hasDoctor = useMemo(() => Boolean(doctorId), [doctorId]);

  useEffect(() => {
    void initialize();
  }, []);

  const initialize = async () => {
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
      setShifts(normalizeShifts(fetchedShifts));
    } catch {
      error(locale === "ar" ? "فشل تحميل الجدول" : "Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  };

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
                  <p className="text-sm font-medium">{dayLabels[shift.dayOfWeek]}</p>
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
    </div>
  );
}
