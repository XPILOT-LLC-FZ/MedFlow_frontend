"use client";

import React from "react";
import Image from "next/image";
import { 
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Heart,
  Search,
  SlidersHorizontal,
  Briefcase,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { usePatientStore } from "@/stores/usePatientStore";
import type { ApiPublicDoctor, DoctorFilterData } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "../ui/switch";
import { DoctorProfileDialog } from "./DoctorProfileDialog";


interface PatientDoctorsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
  doctors: ApiPublicDoctor[];
  specializationFilter?: string | null;
  onBookAppointment?: (doctor: ApiPublicDoctor) => void;
}

export function PatientDoctorsDialog({
  isOpen,
  onOpenChange,
  onBack,
  doctors,
  specializationFilter,
  onBookAppointment,
}: PatientDoctorsDialogProps) {
  const { t, locale, isRTL } = useTranslation();
  const router = useRouter();
  const { favoriteDoctorIds, fetchFavorites, toggleFavorite } = usePatientStore();
  const [search, setSearch] = React.useState("");
  const [currentView, setCurrentView] = React.useState<"list" | "filters">("list");
  const [selectedDoctor, setSelectedDoctor] = React.useState<ApiPublicDoctor | null>(null);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleDoctorClick = (doc: ApiPublicDoctor) => {
    setSelectedDoctor(doc);
    setIsProfileOpen(true);
  };


  React.useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, fetchFavorites]);

  const [filters, setFilters] = React.useState<DoctorFilterData>({
    specialties: [],
    experience: "All",
    gender: "All",
    appointmentType: "All",
    location: "All",
    urgentOnly: false
  });

  const filteredDoctors = React.useMemo(() => {
    return doctors.filter((doc) => {
      const name =
        locale === "ar" && doc.fullNameAr ? doc.fullNameAr : doc.fullName;
      const spec = doc.specialization || "";

      // specializationFilter from props
      if (specializationFilter && specializationFilter !== "All") {
        if (!spec.toLowerCase().includes(specializationFilter.toLowerCase())) return false;
      }

      // Search filter
      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        spec.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Specialization filter
      if (filters.specialties.length > 0) {
        const docSpec = doc.specialization || "";
        const hasSpec = filters.specialties.some((s: string) =>
          docSpec.toLowerCase().includes(s.toLowerCase()),
        );
        if (!hasSpec) return false;
      }

      // Experience filter
      if (filters.experience !== "All") {
        const years = doc.experienceYears || 0;
        if (filters.experience === "<3 years" && years >= 3) return false;
        if (filters.experience === "3-10 years" && (years < 3 || years > 10))
          return false;
        if (filters.experience === ">10 years" && years <= 10) return false;
      }

      // Gender filter
      if (filters.gender !== "All") {
        if (doc.user?.gender?.toLowerCase() !== filters.gender.toLowerCase()) {
          return false;
        }
      }

      // Appointment Type filter
      if (filters.appointmentType !== "All") {
        const modes = doc.availableModes || [];
        if (filters.appointmentType === "Virtual") {
          if (!modes.includes("ONLINE") && !modes.includes("PHONE_CALL"))
            return false;
        } else if (filters.appointmentType === "In-person") {
          if (!modes.includes("ONSITE")) return false;
        }
      }

      // Urgent Consultation filter
      if (filters.urgentOnly) {
        if (!doc.isAvailableNow) return false;
      }

      return true;
    });
  }, [doctors, search, locale, filters, specializationFilter]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[85vh] md:max-w-md md:rounded-[40px]"
        )}
      >
        {currentView === "list" ? (
          <>
            <div className="flex items-center px-6 pt-4 bg-transparent shrink-0">
              <button 
                onClick={() => onBack ? onBack() : onOpenChange(false)}
                className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition-all"
              >
                {isRTL ? (
                  <ChevronRight className="h-6 w-6" />
                ) : (
                  <ChevronLeft className="h-6 w-6" />
                )}
              </button>
              <DialogTitle className="flex-1 text-center text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                {t("allDoctors") || "All Doctor"}
              </DialogTitle>
              <LanguageToggle variant="ghost" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all" />
            </div>

            <div className="px-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500 start-4" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchAnything") || "Search anything here"}
                    className={cn(
                      "w-full h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/40 dark:shadow-none text-sm font-medium transition-all",
                      "ps-12 pe-4 text-start outline-none focus:ring-2 focus:ring-blue-500/10"
                    )}
                  />
                  {search && (
                    <button 
                      onClick={() => setSearch("")}
                      className="absolute top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-slate-500 end-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setCurrentView("filters")}
                  className="h-12 w-12 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 shadow-sm shadow-slate-200/40 dark:shadow-none hover:text-blue-500 transition-all"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-3 pb-6">
              {filteredDoctors.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => handleDoctorClick(doc)}
                  className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col group cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                >

                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                        alt={doc.fullName}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                      />
                      <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>
                    
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">
                          {locale === "ar" ? (doc.fullNameAr || doc.fullName) : `Dr. ${doc.fullName}`}
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(doc.id);
                          }}
                          className={cn(
                            "h-8 w-8 flex items-center justify-center transition-all",
                            favoriteDoctorIds.includes(doc.id) ? "text-rose-500" : "text-blue-400"
                          )}
                        >
                          <Heart className={cn("h-5 w-5", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                        </button>
                      </div>

                      {doc.isAvailableNow && (
                        <div className="flex items-center gap-1 mb-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            {t("availableNow") || "Available Now"}
                          </span>
                        </div>
                      )}

                      <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {(() => {
                          const s = doc.specialization?.toLowerCase() || "";
                          if (s.includes("cardiologist")) return t("cardiologist");
                          if (s.includes("hematologist")) return t("hematologist");
                          if (s.includes("dermatologist")) return t("dermatologist");
                          if (s.includes("laser specialist")) return t("laserSpecialist");
                          if (s.includes("surgeon")) return t("surgeon");
                          if (s.includes("pediatric")) return t("pediatricSpecialist");
                          return doc.specialization || "Generalist";
                        })()}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span className="text-[12px] font-bold">{doc.experienceYears || 0} {t("yearsExp")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-[12px] font-black text-slate-600 dark:text-slate-300">{doc.rating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex justify-end">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBookAppointment) {
                          onBookAppointment(doc);
                        } else {
                          router.push(`/appointments?doctorId=${doc.id}`);
                        }
                      }}
                      className="h-10 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-sm shadow-blue-500/20"
                    >
                      {t("bookNow") || "Book"}
                    </Button>
                  </div>
                </div>
              ))}

              {filteredDoctors.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                    <Users className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold">{t("noResults")}</p>
                </div>
              )}
            </div>

            <div className="hidden md:flex p-6 bg-transparent border-t border-slate-100/50 dark:border-slate-800/50 items-center justify-center shrink-0">
              <LanguageToggle variant="ghost" className="h-10 px-6 rounded-2xl hover:bg-white dark:hover:bg-slate-900 font-black text-xs uppercase tracking-widest text-slate-400" />
            </div>
          </>
        ) : (
          <DoctorFilterView 
            onBack={() => setCurrentView("list")}
            initialFilters={filters}
            onApply={(newFilters) => {
              setFilters(newFilters);
              setCurrentView("list");
            }}
            doctors={doctors}
          />
        )}
      </DialogContent>
    </Dialog>

    <DoctorProfileDialog 
      isOpen={isProfileOpen}
      onOpenChange={setIsProfileOpen}
      doctor={selectedDoctor}
      onBookAppointment={(doc) => {
        setIsProfileOpen(false);
        onOpenChange(false);
        if (onBookAppointment) onBookAppointment(doc);
      }}
    />
    </>

  );
}

function DoctorFilterView({ 
  onBack, 
  onApply, 
  initialFilters,
  doctors,
}: {
  onBack: () => void;
  onApply: (filters: DoctorFilterData) => void;
  initialFilters: DoctorFilterData;
  doctors: ApiPublicDoctor[];
}) {
  const { t } = useTranslation();
  const [selectedSpecialties, setSelectedSpecialties] = React.useState<string[]>(initialFilters.specialties || []);
  const [experience, setExperience] = React.useState(initialFilters.experience || "All");
  const [gender, setGender] = React.useState(initialFilters.gender || "All");
  const [appointmentType, setAppointmentType] = React.useState(initialFilters.appointmentType || "All");
  const [location, setLocation] = React.useState(initialFilters.location || "All");
  const [urgentOnly, setUrgentOnly] = React.useState(initialFilters.urgentOnly || false);
  const [showAllSpecialties, setShowAllSpecialties] = React.useState(false);

  const specialties = React.useMemo(() => {
    const specs = new Set<string>();
    doctors.forEach((doc) => {
      if (doc.specialization) specs.add(doc.specialization);
    });
    // Add default common ones if list is empty or small
    if (specs.size < 3) {
      [
        t("dentist") || "Dentist",
        t("cardiologist") || "Cardiologist",
        t("dermatologist") || "Dermatologist",
        t("pediatricSpecialist") || "Pediatric Specialist",
      ].forEach((s) => specs.add(s));
    }
    return Array.from(specs);
  }, [doctors, t]);

  const handleToggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };

  const handleReset = () => {
    setSelectedSpecialties([]);
    setExperience("All");
    setGender("All");
    setAppointmentType("All");
    setLocation("All");
    setUrgentOnly(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-6 py-5 shrink-0 border-b border-slate-100/50 dark:border-slate-800/50 bg-white dark:bg-slate-900">
        <button 
          onClick={onBack}
          className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
        >
          {t("cancel") || "Cancel"}
        </button>
        <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight text-center">
          {t("filter") || "Filter"}
        </DialogTitle>
        <button 
          onClick={() => onApply({ specialties: selectedSpecialties, experience, gender, appointmentType, location, urgentOnly })}
          className="text-blue-600 font-bold hover:text-blue-700 transition-colors text-sm"
        >
          {t("apply") || "Apply"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-5 space-y-6 pt-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50 tracking-tight">{t("specializations") || "Specializations"}</h3>
            <div className="space-y-4">
              {(showAllSpecialties ? specialties : specialties.slice(0, 5)).map((s) => (
                <label key={s} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox 
                    checked={selectedSpecialties.includes(s)}
                    onCheckedChange={() => handleToggleSpecialty(s)}
                    className="h-6 w-6 rounded-lg"
                  />
                  <span className={cn("text-[15px] font-medium transition-colors", selectedSpecialties.includes(s) ? "text-slate-900 dark:text-slate-50" : "text-slate-500 group-hover:text-slate-700")}>{s}</span>
                </label>
              ))}
              <button onClick={() => setShowAllSpecialties(!showAllSpecialties)} className="flex items-center gap-2 text-slate-400 font-bold text-sm pt-2 w-full justify-center">
                {showAllSpecialties ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAllSpecialties ? (t("showLess") || "Show less") : (t("showAll") || "Show all")}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50 tracking-tight">{t("experience") || "Experience"}</h3>
            <div className="flex gap-3">
              {[
                { label: t("lessThan3Years" as never) || "<3 years", value: "<3 years" },
                { label: t("threeToTenYears" as never) || "3-10 years", value: "3-10 years" },
                { label: t("moreThanTenYears" as never) || ">10 years", value: ">10 years" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  className={cn("flex-1 h-11 rounded-full text-sm font-bold transition-all px-4", experience === opt.value ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-slate-500 border border-slate-100")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50 tracking-tight">{t("gender") || "Gender"}</h3>
            <div className="flex gap-3">
              {["Male", "Female", "All"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setGender(opt)}
                  className={cn("flex-1 h-11 rounded-full text-sm font-bold transition-all px-4", gender === opt ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-slate-500 border border-slate-100")}
                >
                  {t(opt.toLowerCase() as never) || opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-rose-500" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t("availableForUrgentConsultation") || "Available for urgent consultation"}</span>
            </div>
            <Switch checked={urgentOnly} onCheckedChange={setUrgentOnly} />
          </div>

          <button onClick={handleReset} className="w-full text-rose-500 font-black text-xs py-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all uppercase tracking-widest">{t("resetFilter") || "Reset filter"}</button>
        </div>
      </div>
    </>
  );
}
