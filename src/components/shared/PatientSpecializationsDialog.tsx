"use client";

import React from "react";
import {
  Heart,
  Stethoscope,
  Activity,
  Baby,
  ChevronLeft,
  X,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import type { ApiService } from "@/types";

interface PatientSpecializationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  services: ApiService[];
}

export function PatientSpecializationsDialog({
  isOpen,
  onOpenChange,
  services,
}: PatientSpecializationsDialogProps) {
  const { t, locale } = useTranslation();
  const [search] = React.useState("");

  const getSpecIcon = (category?: string) => {
    const cat = category?.toUpperCase() || "";
    if (cat === "DENTAL") return <Stethoscope className="h-6 w-6 text-blue-500" />;
    if (cat === "DERMATOLOGY") return <Activity className="h-6 w-6 text-emerald-500" />;
    if (cat === "LASER") return <LayoutGrid className="h-6 w-6 text-purple-500" />;
    if (cat === "CONSULTATION") return <Activity className="h-6 w-6 text-indigo-500" />;
    if (cat === "AESTHETIC") return <Heart className="h-6 w-6 text-rose-500" />;
    if (cat === "SURGICAL") return <Activity className="h-6 w-6 text-slate-500" />;
    if (cat === "WELLNESS") return <Baby className="h-6 w-6 text-amber-500" />;
    return <Activity className="h-6 w-6 text-indigo-500" />;
  };

  const getSpecBg = (category?: string) => {
    const cat = category?.toUpperCase() || "";
    if (cat === "DENTAL") return "bg-blue-50 dark:bg-blue-900/10";
    if (cat === "DERMATOLOGY") return "bg-emerald-50 dark:bg-emerald-900/10";
    if (cat === "LASER") return "bg-purple-50 dark:bg-purple-900/10";
    if (cat === "CONSULTATION") return "bg-indigo-50 dark:bg-indigo-900/10";
    if (cat === "AESTHETIC") return "bg-rose-50 dark:bg-rose-900/10";
    if (cat === "WELLNESS") return "bg-amber-50 dark:bg-amber-900/10";
    return "bg-slate-50 dark:bg-slate-900/10";
  };

  const filteredServices = React.useMemo(() => {
    return services.filter(s => {
      const name = (locale === "ar" && s.nameAr) ? s.nameAr : s.name;
      return name.toLowerCase().includes(search.toLowerCase());
    });
  }, [services, search, locale]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-3xl",
          "bg-white dark:bg-slate-950"
        )}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center px-6 py-5 bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <button 
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <DialogTitle className="flex-1 text-center text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t("popularSpecializations")}
          </DialogTitle>
          <LanguageToggle variant="ghost" className="h-10 w-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900" />
        </div>

        {/* Desktop Header */}
        <DialogHeader className="hidden md:block px-8 pt-8 pb-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {t("popularSpecializations")}
                </DialogTitle>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {services.length} {t("services").toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle variant="ghost" className="h-10 w-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800" />
              <DialogClose className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 no-scrollbar p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredServices.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpenChange(false)}
                className="flex flex-col items-center justify-center p-6 rounded-[32px] transition-all hover:scale-105 active:scale-95 border border-slate-50 dark:border-slate-900/50 bg-slate-50/50 dark:bg-slate-900/30 group"
              >
                <div className={cn(
                  "h-16 w-16 rounded-[24px] flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-all",
                  getSpecBg(s.category)
                )}>
                  {getSpecIcon(s.category)}
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 text-center leading-tight">
                  {(() => {
                    if (locale === "ar" && s.nameAr) return s.nameAr;
                    const n = s.name.toLowerCase();
                    if (n.includes("general consultation")) return t("generalConsultation");
                    if (n.includes("dermatological exam")) return t("dermatologicalExam");
                    if (n.includes("teeth whitening")) return t("professionalTeethWhitening");
                    if (n.includes("laser hair removal")) return t("laserHairRemoval");
                    return s.name;
                  })()}
                </span>
              </button>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-400 font-bold">{t("noResults")}</p>
            </div>
          )}
        </div>

        <div className="hidden md:flex p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 items-center justify-end z-20">
          <DialogClose asChild>
            <Button className="h-12 rounded-2xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 px-8 font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-transform active:scale-95">
              {t("close")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
