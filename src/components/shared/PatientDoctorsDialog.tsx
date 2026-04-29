"use client";

import React from "react";
import Image from "next/image";
import { 
  Users,
  ChevronLeft,
  X,
  Star,
  Clock,
  Heart,
  Search,
  MapPin
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
import { usePatientStore } from "@/stores/usePatientStore";
import type { ApiPublicDoctor } from "@/types";

interface PatientDoctorsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doctors: ApiPublicDoctor[];
}

export function PatientDoctorsDialog({
  isOpen,
  onOpenChange,
  doctors,
}: PatientDoctorsDialogProps) {
  const { t, locale, isRTL } = useTranslation();
  const { favoriteDoctorIds, fetchFavorites, toggleFavorite } = usePatientStore();
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, fetchFavorites]);

  const filteredDoctors = React.useMemo(() => {
    return doctors.filter(doc => {
      const name = (locale === "ar" && doc.fullNameAr) ? doc.fullNameAr : doc.fullName;
      const spec = doc.specialization || "";
      return name.toLowerCase().includes(search.toLowerCase()) || 
             spec.toLowerCase().includes(search.toLowerCase());
    });
  }, [doctors, search, locale]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-[40px]",
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
            {t("allDoctors")}
          </DialogTitle>
          <LanguageToggle variant="ghost" className="h-10 w-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900" />
        </div>

        {/* Desktop Header */}
        <DialogHeader className="hidden md:block px-8 pt-8 pb-6 bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {t("allDoctors")}
                </DialogTitle>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {doctors.length} {t("availableDoctors").toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle variant="ghost" className="h-11 w-11 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800" />
              <DialogClose className="h-11 w-11 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </DialogClose>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 transition-colors group-focus-within:text-blue-600 start-5" />
            <input
              type="text"
              placeholder={t("searchAnything")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 rounded-[20px] border-none bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-600/10 transition-all ps-14 pe-6 text-start"
            />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 no-scrollbar p-3 md:px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredDoctors.map((doc) => (
              <div 
                key={doc.id}
                className="bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-50 dark:border-slate-800/50 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group relative cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                    <Image
                      src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                      alt={doc.fullName}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 truncate">
                        {locale === "ar" ? (doc.fullNameAr || doc.fullName) : doc.fullName}
                      </h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(doc.id);
                        }}
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                          favoriteDoctorIds.includes(doc.id) 
                            ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20" 
                            : "text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        )}
                      >
                        <Heart className={cn("h-4.5 w-4.5", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        <span className="text-blue-600 dark:text-blue-400">
                          {(() => {
                            const s = doc.specialization?.toLowerCase() || "";
                            if (s.includes("cardiologist")) return t("cardiologist");
                            if (s.includes("hematologist")) return t("hematologist");
                            if (s.includes("dermatologist")) return t("dermatologist");
                            if (s.includes("laser specialist")) return t("laserSpecialist");
                            if (s.includes("surgeon")) return t("surgeon");
                            if (s.includes("pediatric")) return t("pediatricSpecialist");
                            return doc.specialization;
                          })()}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Medica Hospital
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-[11px] font-black text-amber-700 dark:text-amber-500">{doc.rating}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span className="text-[11px] font-bold">4.30 PM - 7.30 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 flex gap-2">
                  <Button className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest transition-all">
                    {t("booking")}
                  </Button>
                  <Button variant="outline" className="flex-1 h-10 rounded-xl border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900">
                    {t("profile")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <Users className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold">{t("noResults")}</p>
            </div>
          )}
        </div>

        <div className="hidden md:flex p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 items-center justify-between shrink-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredDoctors.length} {t("doctors").toLowerCase()} {t("found")}
          </p>
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
