"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { MessageSquare, Save, RefreshCw, Plus, Send, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const DEFAULT_EN = `Hi {patient_name},
Date: {date}

Your prescription from {doctor_name} is ready:

{prescription_details}

Next appointment: {next_appointment}

Please take medications as prescribed. Contact us if you have any questions.

MediCore Clinic
+91 98765 43210`;

const DEFAULT_AR = `مرحباً {patient_name}،
التاريخ: {date}

الوصفة الطبية الخاصة بك من {doctor_name} جاهزة:

{prescription_details}

الموعد القادم: {next_appointment}

يرجى تناول الأدوية كما هو موصوف. تواصل معنا إذا كان لديك أي استفسارات.

عيادة ميديكور
+91 98765 43210`;

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
      // Fallback to default if load fails
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

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
    
    // Focus and reset cursor position after variable insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
      }
    }, 0);
  };

  const getPreviewText = () => {
    const today = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return template
      .replace(/{patient_name}/g, locale === "ar" ? "أحمد محمد" : "John Doe")
      .replace(/{date}/g, today)
      .replace(/{doctor_name}/g, doctorName)
      .replace(/{prescription_details}/g, locale === "ar" ? "• ميتفورمين 500ملغ - مرتين يومياً\n• أسبرين 75ملغ - مرة يومياً" : "• Metformin 500mg - Twice daily\n• Aspirin 75mg - Once daily")
      .replace(/{next_appointment}/g, locale === "ar" ? "20 أبريل 2026 الساعة 10:00 صباحاً" : "Apr 20, 2026 at 10:00 AM");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 animate-pulse" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">
          {locale === "ar" ? "جارٍ تحضير إعدادات التواصل..." : "Preparing communication settings..."}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto pb-10 px-4 sm:px-6"
    >
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Editor Section */}
        <div className="flex-1 w-full space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              {locale === "ar" ? "نموذج رسالة واتس آب التلقائية" : "WhatsApp Auto-Message Template"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {locale === "ar" 
                ? "قم بتخصيص رسالة الوصفة الطبية التي يتم إرسالها للمرضى" 
                : "Customize the prescription message sent to patients"}
            </p>
          </div>

          <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 ring-1 ring-slate-200/50 dark:ring-slate-800">
            {/* Legend Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  {locale === "ar" ? "محرر القوالب" : "Message Template"}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["{patient_name}", "{date}", "{prescription_details}", "{next_appointment}"].map((v) => (
                  <code key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono border border-blue-100 dark:border-blue-800/50">
                    {v}
                  </code>
                ))}
              </div>
            </div>
            
            {/* Editor Area */}
            <div className="p-5">
              <div className="relative group/textarea">
                <Textarea
                  ref={textareaRef}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full min-h-[220px] resize-none bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed p-4 rounded-xl transition-all duration-200 font-medium"
                  placeholder={locale === "ar" ? "اكتب نموذج الرسالة هنا..." : "Write your message template here..."}
                />
                <div className="absolute bottom-4 right-4 opacity-0 group-hover/textarea:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Live Editor</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplate(defaultTemplate)}
                className="text-[11px] h-9 px-3 rounded-lg text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
              >
                <RefreshCw className="h-3 w-3 mr-1.5 opacity-70" />
                {locale === "ar" ? "استعادة الافتراضي" : "Reset Default"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-[11px] h-9 px-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 border-none font-bold shadow-md transition-transform active:scale-95">
                    <Plus className="h-3 w-3 mr-1.5" />
                    {locale === "ar" ? "إضافة متغير" : "Add Variable"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-200/60 dark:border-slate-800">
                  <DropdownMenuItem onClick={() => insertVariable("{patient_name}")} className="rounded-xl py-2.5 cursor-pointer">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[13px] font-bold">{locale === "ar" ? "اسم المريض" : "Patient Name"}</span>
                       <span className="text-[10px] font-mono text-blue-500">{`{patient_name}`}</span>
                     </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable("{date}")} className="rounded-xl py-2.5 cursor-pointer">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[13px] font-bold">{locale === "ar" ? "التاريخ" : "Current Date"}</span>
                       <span className="text-[10px] font-mono text-blue-500">{`{date}`}</span>
                     </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable("{prescription_details}")} className="rounded-xl py-2.5 cursor-pointer">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[13px] font-bold">{locale === "ar" ? "تفاصيل الوصفة" : "Prescription Details"}</span>
                       <span className="text-[10px] font-mono text-blue-500">{`{prescription_details}`}</span>
                     </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable("{next_appointment}")} className="rounded-xl py-2.5 cursor-pointer">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[13px] font-bold">{locale === "ar" ? "الموعد القادم" : "Next Appointment"}</span>
                       <span className="text-[10px] font-mono text-blue-500">{`{next_appointment}`}</span>
                     </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Right Side: Phone Preview Section */}
        <div className="w-full lg:w-[340px] flex flex-col items-center">
          <div className="mb-4 self-start lg:self-center">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
                <Smartphone className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{locale === "ar" ? "معاينة الرسالة" : "Live Preview"}</span>
             </div>
          </div>

          <div className="relative group">
            {/* Device Outer Frame */}
            <div className="relative w-[280px] h-[540px] bg-[#0E121A] rounded-[44px] p-[8px] shadow-2xl ring-1 ring-slate-800 transition-transform duration-500 group-hover:rotate-1">
              
              {/* Screen Content */}
              <div className="relative w-full h-full bg-[#0b141a] rounded-[36px] overflow-hidden flex flex-col">
                
                {/* Dynamic Island / Notch */}
                <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-30">
                  <div className="w-24 h-5 bg-black rounded-b-xl flex items-center justify-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
                    <div className="w-6 h-1 rounded-full bg-slate-900"></div>
                  </div>
                </div>

                {/* WhatsApp Status Bar */}
                <div className="bg-[#0b141a] pt-8 pb-1 px-5 flex justify-between items-center text-[10px] text-white/90 z-20">
                   <span>9:41</span>
                </div>

                {/* WhatsApp Header */}
                <div className="bg-[#202c33] py-2.5 px-4 flex items-center gap-2.5 z-10 border-b border-white/5">
                  <div className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center shrink-0 shadow-lg text-[10px] font-bold text-white">
                    M
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-[12px] font-bold truncate leading-tight tracking-wide">
                      MediCore Clinic
                    </h3>
                  </div>
                </div>
                
                {/* Chat Background */}
                <div 
                  className="flex-1 overflow-y-auto p-4 flex flex-col relative"
                  style={{ 
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
                    backgroundSize: '400px',
                    opacity: 0.9
                  }}
                >
                  <div className="absolute inset-0 bg-[#0b141a]/95"></div>
                  
                  <div className="relative mt-2 self-center bg-[#182229] text-[#8696a0] text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest font-bold mb-6">
                    {locale === "ar" ? "اليوم" : "Today"}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={template}
                      initial={{ opacity: 0, scale: 0.95, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative bg-[#005c4b] text-[#e9edef] p-4 rounded-2xl rounded-tr-[4px] shadow-lg self-end max-w-[88%] text-[12.5px] leading-relaxed whitespace-pre-wrap break-words border border-white/5"
                    >
                      {getPreviewText()}
                      <div className="flex items-center justify-end gap-1 mt-1.5">
                         <span className="text-[10px] text-white/50 font-medium">9:41 AM</span>
                         <div className="flex -space-x-1">
                            <svg className="w-3 h-3 text-[#53bdeb]" fill="currentColor" viewBox="0 0 24 24"><path d="M0.41 13.41L6 19L7.41 17.58L1.83 12L0.41 13.41M7 13.41L12.59 19L23.59 8L22.17 6.58L12.59 16.17L8.41 12L7 13.41Z" /></svg>
                            <svg className="w-3 h-3 text-[#53bdeb]" fill="currentColor" viewBox="0 0 24 24"><path d="M0.41 13.41L6 19L7.41 17.58L1.83 12L0.41 13.41M7 13.41L12.59 19L23.59 8L22.17 6.58L12.59 16.17L8.41 12L7 13.41Z" /></svg>
                         </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* WhatsApp Input */}
                <div className="bg-[#202c33] p-2.5 flex items-center gap-2.5">
                   <div className="flex-1 bg-[#2a3942] rounded-full h-9 px-4 flex items-center shadow-inner">
                     <p className="text-[#8696a0] text-[11px]">Message</p>
                   </div>
                   <div className="h-9 w-9 rounded-full bg-[#00a884] flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-transform cursor-pointer">
                     <Send className="h-4 w-4 text-white ml-0.5" />
                   </div>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full"></div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        </div>
      </div>

      {/* Global Save Action */}
      <div className="mt-8 flex justify-center lg:justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div 
                key="saving"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">{locale === "ar" ? "جارٍ الحفظ..." : "Saving..."}</span>
              </motion.div>
            ) : (
              <motion.div 
                key="save"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                <span className="text-sm">{locale === "ar" ? "حفظ التغييرات" : "Save Changes"}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
        </Button>
      </div>
    </motion.div>
  );
}
