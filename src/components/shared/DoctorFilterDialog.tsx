"use client";

import React from "react";
import { 
  ChevronDown, 
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { DoctorFilterData } from "@/types";

interface DoctorFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialFilters: Partial<DoctorFilterData>;
  onApply: (filters: DoctorFilterData) => void;
}

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-base font-black text-slate-900 dark:text-slate-50 tracking-tight">
      {title}
    </h3>
    {children}
  </div>
);

const ToggleButton = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 h-11 rounded-full text-sm font-bold transition-all px-4",
      isActive 
        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
        : "bg-white text-slate-500 border border-slate-100"
    )}
  >
    {label}
  </button>
);

export function DoctorFilterDialog({
  isOpen,
  onOpenChange,
  initialFilters,
  onApply,
}: DoctorFilterDialogProps) {
  const { t } = useTranslation();
  
  const [selectedSpecialties, setSelectedSpecialties] = React.useState<string[]>([]);
  const [experience, setExperience] = React.useState("All");
  const [gender, setGender] = React.useState("All");
  const [appointmentType, setAppointmentType] = React.useState("All");
  const [location, setLocation] = React.useState("All");
  const [urgentOnly, setUrgentOnly] = React.useState(false);
  const [showAllSpecialties, setShowAllSpecialties] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && initialFilters) {
      setSelectedSpecialties(initialFilters.specialties || []);
      setExperience(initialFilters.experience || "All");
      setGender(initialFilters.gender || "All");
      setAppointmentType(initialFilters.appointmentType || "All");
      setLocation(initialFilters.location || "All");
      setUrgentOnly(initialFilters.urgentOnly || false);
    }
  }, [isOpen, initialFilters]);

  const specialties = React.useMemo(() => [
    t("generalPractitioner" as never) || "General Practitioner",
    t("dentist") || "Dentist",
    t("gastroenterologist" as never) || "Gastroenterologist",
    t("neurologist" as never) || "Neurologist",
    t("pulmonologist" as never) || "Pulmonologist",
    t("cardiologist") || "Cardiologist",
    t("dermatologist") || "Dermatologist"
  ], [t]);

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

  const handleApply = () => {
    onApply({
      specialties: selectedSpecialties,
      experience,
      gender,
      appointmentType,
      location,
      urgentOnly
    });
    onOpenChange(false);
  };



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[90vh] md:max-w-md md:rounded-[40px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0 border-b border-slate-100/50 dark:border-slate-800/50 bg-white dark:bg-slate-900">
          <button 
            onClick={() => onOpenChange(false)}
            className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
          >
            {t("cancel") || "Cancel"}
          </button>
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t("filter") || "Filter"}
          </DialogTitle>
          <button 
            onClick={handleApply}
            className="text-blue-600 font-bold hover:text-blue-700 transition-colors text-sm"
          >
            {t("apply") || "Apply"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-5 space-y-6">
          {/* Specializations */}
          <FilterSection title={t("specializations") || "Specializations"}>
            <div className="space-y-4">
              {(showAllSpecialties ? specialties : specialties.slice(0, 5)).map((s) => (
                <label key={s} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox 
                    checked={selectedSpecialties.includes(s)}
                    onCheckedChange={() => handleToggleSpecialty(s)}
                    className="h-6 w-6 rounded-lg"
                  />
                  <span className={cn(
                    "text-[15px] font-medium transition-colors",
                    selectedSpecialties.includes(s) ? "text-slate-900 dark:text-slate-50" : "text-slate-500 group-hover:text-slate-700"
                  )}>
                    {s}
                  </span>
                </label>
              ))}
              <button 
                onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                className="flex items-center gap-2 text-slate-400 font-bold text-sm pt-2 w-full justify-center"
              >
                {showAllSpecialties ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAllSpecialties ? (t("showLess") || "Show less") : (t("showAll") || "Show all")}
              </button>
            </div>
          </FilterSection>

          {/* Experience */}
          <FilterSection title={t("experience") || "Experience"}>
            <div className="flex gap-3">
              {[
                { label: t("lessThan3Years" as never) || "<3 years", value: "<3 years" },
                { label: t("threeToTenYears" as never) || "3-10 years", value: "3-10 years" },
                { label: t("moreThanTenYears" as never) || ">10 years", value: ">10 years" }
              ].map((opt) => (
                <ToggleButton 
                  key={opt.value}
                  label={opt.label}
                  isActive={experience === opt.value}
                  onClick={() => setExperience(opt.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Gender */}
          <FilterSection title={t("gender") || "Gender"}>
            <div className="flex gap-3">
              {["Male", "Female", "All"].map((opt) => (
                <ToggleButton 
                  key={opt}
                  label={t(opt.toLowerCase() as never) || opt}
                  isActive={gender === opt}
                  onClick={() => setGender(opt)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Type of appointment */}
          <FilterSection title={t("typeOfAppointment") || "Type of appointment"}>
            <div className="flex gap-3">
              {["Virtual", "In-person", "All"].map((opt) => (
                <ToggleButton 
                  key={opt}
                  label={t(opt.toLowerCase() as never) || opt}
                  isActive={appointmentType === opt}
                  onClick={() => setAppointmentType(opt)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection title={t("location") || "Location"}>
            <div className="flex gap-3">
              {["Near me", "My city", "All"].map((opt) => (
                <ToggleButton 
                  key={opt}
                  label={t(opt.toLowerCase() as never) || opt}
                  isActive={location === opt}
                  onClick={() => setLocation(opt)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Urgent Consultation */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-rose-500" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("availableForUrgentConsultation") || "Available for urgent consultation"}
              </span>
            </div>
            <Switch 
              checked={urgentOnly}
              onCheckedChange={setUrgentOnly}
            />
          </div>

          {/* Reset Filter */}
          <button 
            onClick={handleReset}
            className="w-full text-rose-500 font-black text-xs py-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all uppercase tracking-widest"
          >
            {t("resetFilter") || "Reset filter"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
