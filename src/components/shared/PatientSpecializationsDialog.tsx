"use client";

import React from "react";
import {
  Heart,
  Stethoscope,
  Activity,
  Baby,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import type { ApiService, ApiPublicDoctor } from "@/types";

interface PatientSpecializationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  services: ApiService[];
  doctors: ApiPublicDoctor[];
  onSelectSpecialization?: (specialization: string) => void;
}

export function PatientSpecializationsDialog({
  isOpen,
  onOpenChange,
  services,
  doctors,
  onSelectSpecialization,
}: PatientSpecializationsDialogProps) {
  const { t, locale, isRTL } = useTranslation();
  const [search, setSearch] = React.useState("");

  const specializations = React.useMemo(() => {
    // Collect all unique specializations from doctors and services
    const specs = new Map<string, { name: string; category?: string; count: number }>();

    // From Services (as a base)
    services.forEach(s => {
      const name = (() => {
        if (locale === "ar" && s.nameAr) return s.nameAr;
        const n = s.name.toLowerCase();
        if (n.includes("general consultation")) return t("generalConsultation");
        if (n.includes("dermatological exam")) return t("dermatologicalExam");
        if (n.includes("teeth whitening")) return t("professionalTeethWhitening");
        if (n.includes("laser hair removal")) return t("laserHairRemoval");
        return s.name;
      })();

      if (!specs.has(name)) {
        // Find real doctors matching this service
        const count = doctors.filter(d => {
          const docSpec = (d.specialization || "").toLowerCase();
          const svcName = s.name.toLowerCase();
          const cat = (s.category || "").toLowerCase();
          
          return docSpec.includes(svcName) ||
                 svcName.includes(docSpec) ||
                 docSpec.includes(cat) ||
                 cat.includes(docSpec) ||
                 (svcName.includes("general") && docSpec.includes("general")) ||
                 (svcName.includes("dermato") && docSpec.includes("dermato")) ||
                 (svcName.includes("teeth") && docSpec.includes("dental")) ||
                 (svcName.includes("teeth") && docSpec.includes("dentist")) ||
                 (svcName.includes("laser") && docSpec.includes("derma")) ||
                 (svcName.includes("laser") && docSpec.includes("aesthetic"));
        }).length;

        specs.set(name, { name, category: s.category, count });
      }
    });

    // From Doctors (to get counts and any other specs)
    doctors.forEach(d => {
      const spec = d.specialization || (locale === "ar" ? "تخصص عام" : "General");
      let matched = false;
      for (const [key] of specs.entries()) {
        if (key.toLowerCase().includes(spec.toLowerCase()) || spec.toLowerCase().includes(key.toLowerCase())) {
          matched = true;
          break;
        }
      }

      if (!matched) {
        const count = doctors.filter(doc => (doc.specialization || "").toLowerCase() === spec.toLowerCase()).length;
        specs.set(spec, { name: spec, category: "CONSULTATION", count });
      }
    });

    // If still empty or for diversity, add fallback ones
    if (specs.size < 3) {
      const fallbacks = [
        { name: t("dentist"), category: "DENTAL" },
        { name: t("monologist"), category: "CONSULTATION" },
        { name: t("heart"), category: "CONSULTATION" },
        { name: t("neuro"), category: "CONSULTATION" },
        { name: t("pediatric"), category: "CONSULTATION" },
      ];
      fallbacks.forEach(f => {
        if (!specs.has(f.name)) {
          const count = doctors.filter(d => (d.specialization || "").toLowerCase().includes(f.name.toLowerCase())).length;
          specs.set(f.name, { name: f.name, category: f.category, count });
        }
      });
    }

    return Array.from(specs.values()).filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [services, doctors, locale, t, search]);

  const getSpecIcon = (name: string, category?: string) => {
    const cat = category?.toUpperCase() || "";
    const n = name.toLowerCase();
    
    if (cat === "DENTAL" || n.includes("dentist")) return <Stethoscope className="h-6 w-6 text-blue-500" strokeWidth={1.5} />;
    if (cat === "DERMATOLOGY" || n.includes("dermatolog")) return <Activity className="h-6 w-6 text-indigo-500" strokeWidth={1.5} />;
    if (n.includes("heart") || n.includes("cardio")) return <Heart className="h-6 w-6 text-rose-500" strokeWidth={1.5} />;
    if (n.includes("neuro") || n.includes("brain")) return <Brain className="h-6 w-6 text-purple-500" strokeWidth={1.5} />;
    if (n.includes("pediatric") || n.includes("baby")) return <Baby className="h-6 w-6 text-amber-500" strokeWidth={1.5} />;
    if (n.includes("monologist")) return <Activity className="h-6 w-6 text-blue-500" strokeWidth={1.5} />;
    
    return <Activity className="h-6 w-6 text-blue-500" strokeWidth={1.5} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[85vh] md:max-w-md md:rounded-[40px]"
        )}
      >
        {/* Modern Header */}
        <div className="flex items-center px-6 pt-4 bg-transparent shrink-0">
          <button 
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition-all"
          >
            {isRTL ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </button>
          <DialogTitle className="flex-1 text-center text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t("specialization" as never) || "Specialization"}
          </DialogTitle>
        </div>

        {/* Search Bar Container */}
        <div className="px-6 pb-2">
          <div className="relative group">
            <Search className="absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500 start-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchAnything") || "Search anything here"}
              className={cn(
                "w-full h-14 rounded-md border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/40 dark:shadow-none text-sm font-medium transition-all",
                "ps-12 pe-5 text-start outline-none focus:ring-2 focus:ring-blue-500/10"
              )}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-slate-300 hover:text-slate-500 end-2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content - Vertical List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-4 space-y-3">
          {specializations.map((spec, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (onSelectSpecialization) onSelectSpecialization(spec.name);
                onOpenChange(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg transition-all",
                "bg-white dark:bg-slate-900 border border-slate-100/50 dark:border-slate-800/50",
                "hover:scale-[1.02] hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none active:scale-95 group"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6"
              )}>
                {getSpecIcon(spec.name, spec.category)}
              </div>
              
              <div className="flex-1 text-start">
                <h4 className="text-md font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {spec.name}
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-black text-slate-400">
                  {spec.count} {t("doctors").toLowerCase()}
                </span>
              </div>
            </button>
          ))}

          {specializations.length === 0 && (
            <div className="py-20 text-center">
              <div className="h-20 w-20 rounded-[32px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold">{t("noResults")}</p>
            </div>
          )}
        </div>

        {/* Bottom Bar for Desktop (Optional, but keeping for UX) */}
        <div className="hidden md:flex items-center justify-center p-6 bg-transparent border-t border-slate-100/50 dark:border-slate-800/50 shrink-0">
          <LanguageToggle variant="ghost" className="h-10 px-6 rounded-2xl hover:bg-white dark:hover:bg-slate-900 font-black text-xs uppercase tracking-widest text-slate-400" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
