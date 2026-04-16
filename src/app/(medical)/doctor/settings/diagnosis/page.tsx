"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";

interface DiagnosisTemplate {
  id: string;
  title: string;
  description: string;
}

function generateId() {
  return `diag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function DiagnosisPreferencesPage() {
  const { locale } = useTranslation();
  const { success, error } = useToastStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [templates, setTemplates] = useState<DiagnosisTemplate[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const doctor = await staffService.getMyDoctorProfile();
      const rawPrefs = doctor.preferences;
      const prefs = (typeof rawPrefs === 'string' ? JSON.parse(rawPrefs) : rawPrefs) as Record<string, unknown> | undefined;
      const diagnosisSettings = prefs?.diagnosisSettings as Record<string, unknown> | undefined;
      
      if (diagnosisSettings && Array.isArray(diagnosisSettings.templates)) {
        setTemplates(diagnosisSettings.templates as DiagnosisTemplate[]);
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

  const handleSave = async (updatedTemplates?: DiagnosisTemplate[]) => {
    const templatesToSave = updatedTemplates || templates;
    setIsSaving(true);
    try {
      await staffService.updateMyPreferences({
        diagnosisSettings: {
          templates: templatesToSave,
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

  const handleAddTemplate = () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      error(locale === "ar" ? "الرجاء تعبئة العنوان والوصف" : "Please fill in title and description");
      return;
    }
    const template: DiagnosisTemplate = {
      id: generateId(),
      title: newTitle.trim(),
      description: newDescription.trim(),
    };
    
    const updated = [...templates, template];
    setTemplates(updated);
    
    setNewTitle("");
    setNewDescription("");
    setShowModal(false);
    
    // Auto-save instantly
    void handleSave(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    
    // Auto-save instantly
    void handleSave(updated);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-slate-500">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-10 space-y-6">
      <div className="flex items-center justify-between pl-1 pr-1">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {locale === "ar" ? "قوالب التشخيص" : "Diagnosis Templates"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {locale === "ar" ? "قوالب سريعة للتشخيصات الشائعة" : "Quick templates for common diagnoses"}
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {locale === "ar" ? "إضافة قالب" : "Add Template"}
        </Button>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <Card key={template.id} className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 group relative transition-all duration-200 hover:border-blue-100 dark:hover:border-blue-900/50">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="mt-0.5 h-10 w-10 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{template.title}</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {template.description}
                </p>
              </div>
              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FileText className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {locale === "ar" ? "أضف قوالب مخصصة لتسريع الاستشارات" : "Create custom templates for faster consultations"}
            </p>
            <Button
              variant="secondary"
              onClick={() => setShowModal(true)}
              className="bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              {locale === "ar" ? "إنشاء قالب" : "Create Template"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 h-11 rounded-xl shadow-md shadow-blue-500/20"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving
            ? locale === "ar" ? "جارٍ الحفظ..." : "Saving..."
            : locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>

      {/* Add Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50 dark:border-slate-900">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {locale === "ar" ? "إضافة قالب تشخيص" : "Add Diagnosis Template"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "ar" ? "إنشاء قالب جاهز لتوفير الوقت في التشخيص" : "Create a reusable diagnosis template"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {locale === "ar" ? "عنوان القالب" : "Template Title"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder={locale === "ar" ? "مثال: الزكام الشائع" : "e.g. Common Cold"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {locale === "ar" ? "الوصف أو الملاحظات السريرية" : "Description / Clinical Notes"} <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  placeholder={locale === "ar" ? "مثال: عدوى الجهاز التنفسي العلوي الفيروسية مع أعراض خفيفة..." : "e.g. Viral upper respiratory infection with mild symptoms..."}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 min-h-[120px]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-800"
                >
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={handleAddTemplate}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {locale === "ar" ? "حفظ القالب" : "Save Template"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
