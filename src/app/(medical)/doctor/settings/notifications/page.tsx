"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Save, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";

interface NotificationPrefs {
  patientArrival: boolean;
  latePatients: boolean;
  patientMessages: boolean;
  emergencyCases: boolean;
  dailySummary: boolean;
  appointmentCancellations: boolean;
  appointmentReminders: boolean;
  followUpReminders: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  patientArrival: true,
  latePatients: true,
  patientMessages: true,
  emergencyCases: true,
  dailySummary: false,
  appointmentCancellations: true,
  appointmentReminders: true,
  followUpReminders: true,
};

export default function NotificationsSettingsPage() {
  const { locale } = useTranslation();
  const { success, error } = useToastStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the self-service endpoint — no clinic context needed
      const doctor = await staffService.getMyDoctorProfile();
      const storedPrefs = (doctor.preferences as Record<string, unknown> | undefined)
        ?.notificationSettings as Partial<NotificationPrefs> | undefined;

      if (storedPrefs && typeof storedPrefs === "object") {
        setPrefs((prev) => ({ ...prev, ...storedPrefs }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load settings";
      error(message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await staffService.updateMyPreferences({ notificationSettings: prefs });
      success(
        locale === "ar"
          ? "تم حفظ إعدادات الإشعارات بنجاح"
          : "Notification preferences saved successfully",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save preferences";
      error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationOptions: {
    id: keyof NotificationPrefs;
    title_en: string;
    desc_en: string;
    title_ar: string;
    desc_ar: string;
  }[] = [
    {
      id: "patientArrival",
      title_en: "Patient Arrival",
      desc_en: "Get notified when a patient arrives at the clinic",
      title_ar: "وصول المريض",
      desc_ar: "احصل على إشعار عند وصول المريض إلى العيادة",
    },
    {
      id: "latePatients",
      title_en: "Late Patients",
      desc_en: "Alert when a patient is running late for appointment",
      title_ar: "المرضى المتأخرين",
      desc_ar: "تنبيه عندما يتأخر المريض عن موعده",
    },
    {
      id: "patientMessages",
      title_en: "Patient Messages",
      desc_en: "Receive alerts when patients send messages",
      title_ar: "رسائل المرضى",
      desc_ar: "تلقي تنبيهات عندما يرسل المرضى رسائل",
    },
    {
      id: "emergencyCases",
      title_en: "Emergency Cases",
      desc_en: "Immediate notifications for urgent cases",
      title_ar: "الحالات الطارئة",
      desc_ar: "إشعارات فورية للحالات العاجلة",
    },
    {
      id: "dailySummary",
      title_en: "Daily Summary Report",
      desc_en: "End-of-day summary of consultations and stats",
      title_ar: "تقرير الملخص اليومي",
      desc_ar: "ملخص نهاية اليوم للاستشارات والإحصائيات",
    },
    {
      id: "appointmentCancellations",
      title_en: "Appointment Cancellations",
      desc_en: "Notify when patients cancel appointments",
      title_ar: "إلغاء المواعيد",
      desc_ar: "إشعار عند إلغاء المرضى لمواعيدهم",
    },
    {
      id: "appointmentReminders",
      title_en: "Appointment Reminders",
      desc_en: "Get notified before scheduled appointments",
      title_ar: "تذكيرات المواعيد",
      desc_ar: "احصل على إشعار قبل المواعيد المجدولة",
    },
    {
      id: "followUpReminders",
      title_en: "Follow-up Reminders",
      desc_en: "Reminders to schedule follow-up appointments",
      title_ar: "تذكيرات المتابعة",
      desc_ar: "تذكيرات لجدولة مواعيد المتابعة",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-slate-500">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10 fade-in">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          {locale === "ar" ? "تفضيلات الإشعارات" : "Notification Preferences"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {locale === "ar"
            ? "اختر أنواع الإشعارات التي تريد تلقيها"
            : "Choose which types of notifications you want to receive"}
        </p>
      </div>

      <div className="space-y-3">
        {notificationOptions.map((opt) => (
          <div
            key={opt.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl transition-colors duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {locale === "ar" ? opt.title_ar : opt.title_en}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {locale === "ar" ? opt.desc_ar : opt.desc_en}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={prefs[opt.id]}
                onChange={() => handleToggle(opt.id)}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving
            ? locale === "ar" ? "جارٍ الحفظ..." : "Saving..."
            : locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
