"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { MessageSquare, Save, RefreshCw, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const DEFAULT_EN = `Hi {patient_name},

Your prescription from {doctor_name} is ready:

{prescription_details}

Next appointment: {next_appointment}

Please take medications as prescribed. Contact us if you have any questions.

MediCore Clinic`;

const DEFAULT_AR = `مرحباً {patient_name}،

الوصفة الطبية الخاصة بك من {doctor_name} جاهزة:

{prescription_details}

الموعد القادم: {next_appointment}

يرجى تناول الأدوية كما هو موصوف. تواصل معنا إذا كان لديك أي استفسارات.

عيادة ميديكور`;

export default function CommunicationSettingsPage() {
  const { locale } = useTranslation();
  const { success, error } = useToastStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultTemplate = locale === "ar" ? DEFAULT_AR : DEFAULT_EN;
  const [template, setTemplate] = useState<string>(defaultTemplate);
  const [doctorName, setDoctorName] = useState<string>("Dr. Sarah Mitchell");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const doctor = await staffService.getMyDoctorProfile();
      if (doctor.fullName) {
        setDoctorName(locale === "ar" ? `د. ${doctor.fullName}` : `Dr. ${doctor.fullName}`);
      }

      const rawPrefs = doctor.preferences;
      const prefs = (typeof rawPrefs === 'string' ? JSON.parse(rawPrefs) : rawPrefs) as Record<string, unknown> | undefined;
      const communicationSettings = prefs?.communicationSettings as Record<string, unknown> | undefined;
      
      if (communicationSettings && typeof communicationSettings.whatsappTemplate === "string") {
        setTemplate(communicationSettings.whatsappTemplate);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await staffService.updateMyPreferences({
        communicationSettings: {
          whatsappTemplate: template,
        },
      });
      success(locale === "ar" ? "تم حفظ إعدادات التواصل بنجاح" : "Communication settings saved successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    
    const newText = text.substring(0, start) + variable + text.substring(end);
    setTemplate(newText);
    
    // Focus and reset cursor position after variable insertion (timeout needed for React re-render)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
      }
    }, 0);
  };

  const getPreviewText = () => {
    return template
      .replace(/{patient_name}/g, locale === "ar" ? "أحمد محمد" : "John Doe")
      .replace(/{doctor_name}/g, doctorName)
      .replace(/{prescription_details}/g, locale === "ar" ? "• ميتفورمين 500ملغ - مرتين يومياً\n• أسبرين 75ملغ - مرة يومياً" : "• Metformin 500mg - Twice daily\n• Aspirin 75mg - Once daily")
      .replace(/{next_appointment}/g, locale === "ar" ? "20 أبريل 2026 الساعة 10:00 صباحاً" : "Apr 20, 2026 at 10:00 AM");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-slate-500">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pl-1 pr-1 lg:pr-6">
        
        {/* Left Side: Editor */}
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "نموذج رسالة واتس آب التلقائية" : "WhatsApp Auto-Message Template"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {locale === "ar" 
                ? "قم بتخصيص رسالة الوصفة الطبية التي يتم إرسالها للمرضى عبر الواتس آب" 
                : "Customize the prescription message sent to patients via WhatsApp"}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {locale === "ar" ? "نص الرسالة" : "Message Template"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {locale === "ar" ? "المتغيرات المتاحة:" : "Use variables:"} <span className="font-mono text-blue-600 dark:text-blue-400">{`{patient_name}`}</span>, <span className="font-mono text-blue-600 dark:text-blue-400">{`{doctor_name}`}</span>, <span className="font-mono text-blue-600 dark:text-blue-400">{`{prescription_details}`}</span>, <span className="font-mono text-blue-600 dark:text-blue-400">{`{next_appointment}`}</span>
              </p>
            </div>
            
            <div className="p-4 bg-slate-50/30 dark:bg-slate-950/20">
              <Textarea
                ref={textareaRef}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full min-h-[250px] resize-y bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-sm leading-relaxed p-4"
                placeholder={locale === "ar" ? "اكتب نموذج الرسالة هنا..." : "Write your message template here..."}
              />
            </div>

            <div className="p-4 border-t border-slate-50 dark:border-slate-800/60 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplate(defaultTemplate)}
                className="text-xs h-9 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                {locale === "ar" ? "استعادة الافتراضي" : "Reset to Default"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-9 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border-slate-200">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {locale === "ar" ? "إضافة متغير" : "Add Variable"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => insertVariable("{patient_name}")}>
                     <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 mr-2">{`{patient_name}`}</span>
                     {locale === "ar" ? "اسم المريض" : "Patient Name"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable("{doctor_name}")}>
                     <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 mr-2">{`{doctor_name}`}</span>
                     {locale === "ar" ? "اسم الطبيب" : "Doctor Name"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable("{prescription_details}")}>
                     <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 mr-2">{`{prescription_details}`}</span>
                     {locale === "ar" ? "تفاصيل الوصفة" : "Prescription Details"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable("{next_appointment}")}>
                     <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 mr-2">{`{next_appointment}`}</span>
                     {locale === "ar" ? "الموعد القادم" : "Next Appointment"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Right Side: Preview Phone Mockup */}
        <div className="flex justify-center items-start lg:justify-end mt-4 lg:mt-0 relative">
          <div className="relative w-[300px] h-[600px] bg-[#0E1525] rounded-[40px] border-[8px] border-[#1C2534] shadow-2xl shadow-slate-300/30 dark:shadow-none overflow-hidden flex flex-col shrink-0 ring-1 ring-slate-900/5">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
               <div className="w-32 h-5 bg-[#1C2534] rounded-b-2xl"></div>
            </div>

            {/* App Header */}
            <div className="bg-[#0b141a] pt-12 pb-3 px-4 flex items-center gap-3 z-10 border-b border-slate-800/50">
              <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-white stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-semibold truncate leading-tight">
                  MediCore Clinic
                </h3>
                <p className="text-white/70 text-[11px] mt-0.5">online</p>
              </div>
            </div>
            
            {/* Chat Body */}
            <div 
              className="flex-1 overflow-y-auto p-4 flex flex-col justify-end"
              style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/508/606/HD-wallpaper-whatsapp-background-dark-theme-whatsapp-thumbnail.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#0b141a', backgroundBlendMode: 'overlay' }}
            >
              <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-sm shadow-md self-end max-w-[90%] text-xs leading-relaxed whitespace-pre-wrap break-words relative">
                {getPreviewText()}
                <p className="text-[9px] text-[#8696a0] text-right mt-1.5">10:00 AM</p>
              </div>
            </div>

            {/* Input Bar */}
            <div className="bg-[#202c33] p-2.5 flex items-center gap-2">
               <div className="flex-1 bg-[#2a3942] rounded-full h-10 px-4 flex items-center">
                 <p className="text-[#8696a0] text-xs">Message</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0 shadow-sm">
                 <Send className="h-4 w-4 text-white ml-0.5" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-12 pr-1 lg:pr-6">
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
    </div>
  );
}
