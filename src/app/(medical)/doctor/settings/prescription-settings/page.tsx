"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, Pill, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";

interface FavoriteMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

const FREQUENCY_OPTIONS_EN = ["Once daily", "Twice daily", "Three times daily", "As needed", "With meals"];
const FREQUENCY_OPTIONS_AR = ["مرة يومياً", "مرتين يومياً", "ثلاث مرات يومياً", "عند الحاجة", "مع الوجبات"];

function generateId() {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function PrescriptionSettingsPage() {
  const { locale } = useTranslation();
  const { success, error } = useToastStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [medications, setMedications] = useState<FavoriteMedication[]>([]);
  const [autoSuggestion, setAutoSuggestion] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState(FREQUENCY_OPTIONS_EN[0]);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the self-service endpoint — no clinic context needed
      const doctor = await staffService.getMyDoctorProfile();
      const rawPrefs = doctor.preferences;
      const prefs = (typeof rawPrefs === 'string' ? JSON.parse(rawPrefs) : rawPrefs) as Record<string, unknown> | undefined;
      const prescriptionSettings = prefs?.prescriptionSettings as Record<string, unknown> | undefined;
      
      console.log('Loaded API preferences:', prefs);
      
      if (prescriptionSettings) {
        if (Array.isArray(prescriptionSettings.favoriteMedications)) {
          setMedications(prescriptionSettings.favoriteMedications as FavoriteMedication[]);
        } else {
          console.warn('favoriteMedications is not an array:', prescriptionSettings.favoriteMedications);
        }
        if (typeof prescriptionSettings.autoSuggestion === "boolean") {
          setAutoSuggestion(prescriptionSettings.autoSuggestion);
        }
      } else {
        console.warn('No prescriptionSettings found in prefs:', prefs);
      }
    } catch {
      error(locale === "ar" ? "فشل تحميل الإعدادات" : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, [error, locale]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleSave = async (updatedMedications?: FavoriteMedication[]) => {
    const medsToSave = updatedMedications || medications;
    setIsSaving(true);
    try {
      await staffService.updateMyPreferences({
        prescriptionSettings: {
          favoriteMedications: medsToSave,
          autoSuggestion,
        },
      });
      success(locale === "ar" ? "تم الحفظ بنجاح" : "Saved successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMedication = () => {
    if (!newName.trim() || !newDosage.trim()) {
      error(locale === "ar" ? "الرجاء تعبئة اسم الدواء والجرعة" : "Please fill in medication name and dosage");
      return;
    }
    const med: FavoriteMedication = {
      id: generateId(),
      name: newName.trim(),
      dosage: newDosage.trim(),
      frequency: newFrequency,
    };
    
    const updated = [...medications, med];
    setMedications(updated);
    
    setNewName("");
    setNewDosage("");
    setNewFrequency(locale === "ar" ? FREQUENCY_OPTIONS_AR[0] : FREQUENCY_OPTIONS_EN[0]);
    setShowModal(false);
    
    // Auto-save instantly
    void handleSave(updated);
  };

  const handleDeleteMedication = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    setMedications(updated);
    
    // Auto-save instantly
    void handleSave(updated);
  };

  const frequencyOptions = locale === "ar" ? FREQUENCY_OPTIONS_AR : FREQUENCY_OPTIONS_EN;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-slate-500">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Favorite Medications */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {locale === "ar" ? "الأدوية المفضلة" : "Favorite Medications"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "الأدوية الموصوفة بشكل متكرر مع الجرعة" : "Frequently prescribed medications with dosage"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setNewFrequency(frequencyOptions[0]);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-lg h-9 px-4 text-xs font-semibold shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              {locale === "ar" ? "إضافة دواء" : "Add Medication"}
            </Button>
          </div>

          {/* Medications Grid */}
          {medications.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="group relative flex items-start gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200"
                >
                  <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-500">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{med.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{med.dosage}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{med.frequency}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMedication(med.id)}
                    className="absolute top-3 right-3 rtl:right-auto rtl:left-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Pill className="h-5 w-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {locale === "ar" ? "لا توجد أدوية مفضلة بعد" : "No favorite medications yet"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {locale === "ar" ? "اضغط «إضافة دواء» لإضافة أول وصفة دوائية" : "Click «Add Medication» to add your first entry"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Suggestion Toggle */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {locale === "ar" ? "الاقتراح التلقائي" : "Auto-Suggestion"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "تفعيل اقتراحات الدواء بناءً على التشخيص" : "Enable medication suggestions based on diagnosis"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoSuggestion}
                onChange={(e) => setAutoSuggestion(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Save (for Auto-Suggestion toggle) */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving
            ? locale === "ar" ? "جارٍ الحفظ..." : "Saving..."
            : locale === "ar" ? "حفظ الإعدادات" : "Save Settings"}
        </Button>
      </div>

      {/* Add Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50 dark:border-slate-900">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {locale === "ar" ? "إضافة دواء مفضل" : "Add Favorite Medication"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "ar" ? "اضف دواء شائع الاستخدام لقائمتك" : "Add a commonly prescribed medication"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-6 pt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {locale === "ar" ? "اسم الدواء" : "Medication Name"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder={locale === "ar" ? "مثال: ميتفورمين" : "e.g. Metformin"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {locale === "ar" ? "الجرعة" : "Dosage"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder={locale === "ar" ? "مثال: 500 ملغ" : "e.g. 500mg"}
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                  className="h-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {locale === "ar" ? "معدل التناول" : "Frequency"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {frequencyOptions.map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setNewFrequency(freq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        newFrequency === freq
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-800"
                >
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={handleAddMedication}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {locale === "ar" ? "إضافة" : "Add Medication"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
