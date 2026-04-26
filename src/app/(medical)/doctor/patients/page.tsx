"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  Check,
  Download,
  Droplet,
  FileText,
  FilterX,
  Funnel,
  History,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { patientService } from "@/services/patientService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPatient, CreatePatientPayload } from "@/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const chronicFilters = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "Arthritis",
];

const ageBuckets = ["0-18", "19-35", "36-50", "51-65", "65+"];

const canonicalizeCondition = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";

  if (normalized.includes("hypertension") || normalized.includes("ضغط")) {
    return "Hypertension";
  }
  if (normalized.includes("diabetes") || normalized.includes("سكري")) {
    return "Diabetes";
  }
  if (normalized.includes("asthma") || normalized.includes("ربو")) {
    return "Asthma";
  }
  if (
    normalized.includes("heart") ||
    normalized.includes("cardio") ||
    normalized.includes("قلب")
  ) {
    return "Heart Disease";
  }
  if (normalized.includes("arthritis") || normalized.includes("التهاب المفاصل")) {
    return "Arthritis";
  }

  return value.trim();
};

type AddPatientForm = {
  fullName: string;
  fullNameAr: string;
  age: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  allergies: string;
  idType: string;
  chronicDiseases: string[];
};

const getInitialAddPatientForm = (): AddPatientForm => ({
  fullName: "",
  fullNameAr: "",
  age: "",
  phone: "",
  email: "",
  address: "",
  bloodType: "",
  allergies: "",
  idType: "",
  chronicDiseases: [],
});

const parseCsvTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const ageToDateOfBirthIso = (ageText: string) => {
  const age = Number(ageText);
  if (!Number.isFinite(age) || age <= 0) return undefined;

  const now = new Date();
  const birthYear = now.getUTCFullYear() - age;
  return new Date(Date.UTC(birthYear, 0, 1)).toISOString();
};

const getAge = (dateOfBirth?: string) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const extractAllConditions = (patient: ApiPatient) => {
  const source = patient.medicalHistory as Record<string, unknown> | undefined;

  const fromStructured: string[] = [];

  // Directly pull structured data (populated by backend from onboarding)
  if (Array.isArray(source?.chronicDiseases)) {
    (source.chronicDiseases as unknown[]).forEach(item => {
      const norm = canonicalizeCondition(String(item));
      if (norm) fromStructured.push(norm);
    });
  } else if (typeof source?.chronicDiseases === 'string') {
    source.chronicDiseases.split(',').forEach(item => {
      const norm = canonicalizeCondition(item.trim());
      if (norm) fromStructured.push(norm);
    });
  }

  // Fallback heuristics for older data
  const text = `${patient.notes || ""} ${JSON.stringify(source || {})}`.toLowerCase();
  const fromText: string[] = [];

  if (text.includes("hypertension") || text.includes("ضغط")) fromText.push("Hypertension");
  if (text.includes("diabetes") || text.includes("سكري")) fromText.push("Diabetes");
  if (text.includes("asthma") || text.includes("ربو")) fromText.push("Asthma");
  if (text.includes("heart") || text.includes("قلب")) fromText.push("Heart Disease");
  if (text.includes("arthritis") || text.includes("المفاصل")) fromText.push("Arthritis");

  const normalized = [...fromStructured, ...fromText]
    .map((item) => canonicalizeCondition(item))
    .filter(Boolean);

  return Array.from(new Set(normalized));
};



const hasPendingResults = (patient: ApiPatient) => {
  const history = patient.medicalHistory as Record<string, unknown> | undefined;
  const pendingDirect = history?.pendingResults;

  if (typeof pendingDirect === "boolean") {
    return pendingDirect;
  }

  if (Array.isArray(pendingDirect)) {
    return pendingDirect.length > 0;
  }

  const historyText = JSON.stringify(history || {}).toLowerCase();
  if (
    historyText.includes("pending") ||
    historyText.includes("awaiting") ||
    historyText.includes("critical") ||
    historyText.includes("abnormal")
  ) {
    return true;
  }

  return !patient.user?.isOnboarded;
};

const hasRecentActivityWithinDays = (patient: ApiPatient, days: number) => {
  const fallbackDate = patient.updatedAt || patient.createdAt;
  if (!fallbackDate) return false;

  const updatedAtMs = new Date(fallbackDate).getTime();
  if (Number.isNaN(updatedAtMs)) return false;

  const daysSinceUpdate = Math.floor((Date.now() - updatedAtMs) / (1000 * 60 * 60 * 24));
  return daysSinceUpdate <= days;
};

const inAgeBucket = (age: number | null, bucket: string) => {
  if (age === null) return false;
  if (bucket === "0-18") return age <= 18;
  if (bucket === "19-35") return age >= 19 && age <= 35;
  if (bucket === "36-50") return age >= 36 && age <= 50;
  if (bucket === "51-65") return age >= 51 && age <= 65;
  return age >= 66;
};

const PatientCard = ({ patient }: { patient: ApiPatient }) => {
  const { t, locale } = useTranslation();
  const age = getAge(patient.dateOfBirth);
  const allConditions = extractAllConditions(patient);
  
  // Separate conditions into Chronic and Others
  const chronicConditions = allConditions.filter(c => chronicFilters.includes(c));
  const otherConditions = allConditions.filter(c => !chronicFilters.includes(c));
  
  const lastVisitDate = useMemo(() => {
    const dateStr = patient.updatedAt || patient.createdAt;
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
      { month: "short", day: "numeric", year: "numeric" },
    );
  }, [patient.updatedAt, patient.createdAt, locale]);

  return (
    <Link href={`/doctor/patients/${patient.id}`}>
      <article className="group relative flex flex-col rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-7 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer h-[420px] overflow-hidden">
        {/* Header section */}
        <div className="flex items-start gap-5 mb-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <UserRound className="h-8 w-8" />
          </div>
          <div className="min-w-0 pt-1">
            <h4 className="text-[18px] font-black text-slate-900 dark:text-slate-100 leading-tight mb-1 truncate">
              {locale === "ar" && patient.fullNameAr ? patient.fullNameAr : patient.fullName}
            </h4>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-bold text-slate-500 dark:text-slate-400">
                {age !== null ? t("yearsOld").replace("{age}", age.toString()) : t("ageNotAvailable")}
              </span>
              <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                ID: PAT-{patient.id.slice(-4).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Health Status Section - The Core Change */}
        <div className="flex-grow flex flex-col gap-4 overflow-hidden">
          <div>
            <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              {t("healthStatus")}
            </p>
            
            {/* Chronic Conditions (Scroll X) */}
            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar -mx-1 px-1">
              {chronicConditions.length > 0 ? (
                chronicConditions.map((condition) => (
                  <span 
                    key={`${patient.id}-${condition}`} 
                    className="whitespace-nowrap rounded-xl bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2 text-[12px] font-black text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50"
                  >
                    {t(condition.toLowerCase().replace(/\s+/g, "") as TranslationKey) || condition}
                  </span>
                ))
              ) : (
                <span className="whitespace-nowrap rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3.5 py-2 text-[12px] font-black text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                  {t("generalCheckup")}
                </span>
              )}
            </div>
          </div>
          
          {/* Well Controlled Section (Next Line) */}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2 text-[12px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1.5 shadow-sm shadow-emerald-500/5">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              {t("wellControlled")}
            </span>
            {otherConditions.map((condition) => (
              <span 
                key={`${patient.id}-other-${condition}`}
                className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3.5 py-2 text-[12px] font-black text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
              >
                {t(condition.toLowerCase().replace(/\s+/g, "") as TranslationKey) || condition}
              </span>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-5 pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
            <Calendar className="h-4.5 w-4.5 text-slate-400" />
            <span className="text-[13px] font-bold">
              {t("lastVisit")} {lastVisitDate}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                {t("vitalsTrend")}
              </p>
              <Activity className="h-3.5 w-3.5 text-blue-500 opacity-50" />
            </div>
            <div className="relative h-6 w-full opacity-90">
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <path
                  d="M0,12 C20,10 40,14 60,12 C80,10 100,14 120,12 C140,10 160,14 180,12 C200,10 220,14 240,12"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-500 group-hover:stroke-blue-700"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default function DoctorPatientsPage() {
  const { t } = useTranslation();
  const toastSuccess = useToastStore((state) => state.success);
  const toastError = useToastStore((state) => state.error);

  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAgeBucket, setSelectedAgeBucket] = useState<string | null>(null);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [showPendingResults, setShowPendingResults] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [addPatientForm, setAddPatientForm] = useState<AddPatientForm>(
    getInitialAddPatientForm(),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await patientService.getPage({
        take: 80,
        page: 1,
        search: debouncedSearch.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setPatients(response.data || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("failedToLoadSchedule");
      toastError(message);
    } finally {
      setIsLoading(false);
    }
  }, [toastError, debouncedSearch, t]);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return patients.filter((patient) => {
      const age = getAge(patient.dateOfBirth);
      const allConditions = extractAllConditions(patient);

      const haystack = [
        patient.fullName,
        patient.fullNameAr,
        patient.email,
        patient.phone,
        patient.id,
        `PAT-${patient.id.slice(-4).toUpperCase()}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalized || haystack.includes(normalized);
      const matchesCondition =
        selectedConditions.length === 0 ||
        selectedConditions.some((selected) =>
          allConditions.some((condition) => {
            const selectedNorm = selected.toLowerCase();
            const conditionNorm = condition.toLowerCase();
            return (
              conditionNorm === selectedNorm ||
              conditionNorm.includes(selectedNorm) ||
              selectedNorm.includes(conditionNorm)
            );
          }),
        );
      const matchesAge =
        !selectedAgeBucket || inAgeBucket(age, selectedAgeBucket);
      const matchesRecentActivity = !showRecentActivity || hasRecentActivityWithinDays(patient, 30);
      const matchesPendingResults = !showPendingResults || hasPendingResults(patient);

      return (
        matchesSearch &&
        matchesCondition &&
        matchesAge &&
        matchesRecentActivity &&
        matchesPendingResults
      );
    });
  }, [
    patients,
    searchTerm,
    selectedConditions,
    selectedAgeBucket,
    showRecentActivity,
    showPendingResults,
  ]);

  const stats = useMemo(() => {
    const total = filteredPatients.length;
    const active = filteredPatients.filter((patient) => (patient.totalVisits || 0) > 0).length;
    const pending = filteredPatients.filter((patient) => hasPendingResults(patient)).length;
    return { total, active, pending };
  }, [filteredPatients]);

  const exportPatients = () => {
    if (filteredPatients.length === 0) {
      toastError(t("exportFailed"));
      return;
    }

    const rows = filteredPatients.map((patient) => ({
      Name: patient.fullName,
      Email: patient.email || "",
      Phone: patient.phone || "",
      Visits: patient.totalVisits || 0,
      Status: patient.user?.isOnboarded ? "Active" : "Pending",
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header as keyof typeof row] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "patients-directory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedConditions([]);
    setSelectedAgeBucket(null);
    setShowRecentActivity(true);
    setShowPendingResults(false);
  };

  const handleCreatePatient = async () => {
    if (addPatientForm.fullName.trim().length < 2) {
      toastError(t("nameTooShort"));
      return;
    }

    const normalizedAge = addPatientForm.age.trim();
    if (normalizedAge) {
      const age = Number(normalizedAge);
      if (!Number.isInteger(age) || age <= 0 || age > 120) {
        toastError(t("invalidAge"));
        return;
      }
    }

    const normalizedEmail = addPatientForm.email.trim().toLowerCase();
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      toastError(t("invalidEmail"));
      return;
    }

    const allergyList = parseCsvTags(addPatientForm.allergies);
    const medicalHistory: Record<string, unknown> = {};

    if (addPatientForm.idType.trim()) {
      medicalHistory.idType = addPatientForm.idType.trim();
    }
    if (addPatientForm.chronicDiseases.length > 0) {
      medicalHistory.chronicDiseases = addPatientForm.chronicDiseases;
    }
    if (normalizedAge) {
      medicalHistory.estimatedAge = Number(normalizedAge);
    }

    const payload: CreatePatientPayload = {
      fullName: addPatientForm.fullName.trim(),
      fullNameAr: addPatientForm.fullNameAr.trim() || undefined,
      phone: addPatientForm.phone.trim() || undefined,
      email: normalizedEmail || undefined,
      dateOfBirth: ageToDateOfBirthIso(normalizedAge),
      bloodType: addPatientForm.bloodType.trim() || undefined,
      address: addPatientForm.address.trim() || undefined,
      allergies: allergyList,
      medicalHistory:
        Object.keys(medicalHistory).length > 0 ? medicalHistory : undefined,
      createUserAccount: false,
    };

    setIsSavingPatient(true);
    try {
      await patientService.create(payload);
      toastSuccess(t("patientAddedSuccessfully"));
      setIsAddDialogOpen(false);
      setAddPatientForm(getInitialAddPatientForm());
      await loadPatients();
    } catch (error) {
      toastError(
        error instanceof Error
          ? error.message
          : t("failedToAddPatient"),
      );
    } finally {
      setIsSavingPatient(false);
    }
  };

  const hasNoPatients = !isLoading && patients.length === 0;
  const hasNoMatches = !isLoading && patients.length > 0 && filteredPatients.length === 0;

  return (
    <div className="doctor-dashboard space-y-4 max-w-7xl pb-10">
      <section className="space-y-4">
        {/* Modernized Header */}
        <div className="rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-7 py-5 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {t("patientsDirectory")}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {t("managePatientRecords")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={exportPatients}
                className="h-11 px-5 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold text-[13px] border border-blue-100/50 dark:border-blue-800/50 hover:bg-blue-100 transition-all flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t("exportData")}
              </Button>
            </div>
          </div>

          <div className="mt-7 relative group">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("searchPatientsPlaceholder")}
              className="h-13 w-full rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-12 text-[14px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>
      </section>

      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setAddPatientForm(getInitialAddPatientForm());
        }}
      >
        <DialogContent className="max-w-2xl rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-8 py-5 border-b border-slate-100 dark:border-slate-800/50">
            <DialogTitle className="flex items-center gap-3 text-[18px] font-black text-slate-900 dark:text-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                <UserPlus className="h-5 w-5" />
              </div>
              {t("addNewPatient")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 px-8 py-8 overflow-y-auto max-h-[80vh]">
            {/* Name & Age Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  {t("fullName")} *
                </label>
                <Input
                  value={addPatientForm.fullName}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={t("enterPatientName")}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] focus:ring-4 focus:ring-blue-600/5 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  {t("fullName")} (Arabic)
                </label>
                <Input
                  value={addPatientForm.fullNameAr}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, fullNameAr: e.target.value }))}
                  placeholder="أحمد حسن"
                  dir="rtl"
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] focus:ring-4 focus:ring-blue-600/5 transition-all text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  {t("age")} *
                </label>
                <Input
                  value={addPatientForm.age}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, age: e.target.value }))}
                  placeholder={t("enterAge")}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
                />
              </div>
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-blue-500" />
                  {t("phoneNumber")} *
                </label>
                <Input
                  value={addPatientForm.phone}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-blue-500" />
                  {t("email")} *
                </label>
                <Input
                  value={addPatientForm.email}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="patient@email.com"
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
                />
              </div>
            </div>

            {/* Address Row */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                <MapPin className="h-4 w-4 text-blue-500" />
                {t("address")} *
              </label>
              <Input
                value={addPatientForm.address}
                onChange={(e) => setAddPatientForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder={t("addressPlaceholder") || t("address")}
                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
              />
            </div>

            {/* Blood Type & Allergies Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  {t("bloodType")} *
                </label>
                <Input
                  value={addPatientForm.bloodType}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, bloodType: e.target.value }))}
                  placeholder="O+"
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  {t("allergies")}
                </label>
                <Input
                  value={addPatientForm.allergies}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder={t("separateWithCommas")}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
                />
              </div>
            </div>

            {/* Chronic Diseases Section */}
            <div className="space-y-3">
              <p className="text-[13px] font-black text-slate-700 dark:text-slate-300">
                {t("chronicDiseases")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {chronicFilters.map((condition) => (
                  <button
                    key={`new-${condition}`}
                    type="button"
                    onClick={() =>
                      setAddPatientForm((prev) => ({
                        ...prev,
                        chronicDiseases: prev.chronicDiseases.includes(condition)
                          ? prev.chronicDiseases.filter((value) => value !== condition)
                          : [...prev.chronicDiseases, condition],
                      }))
                    }
                    className={cn(
                      "flex h-12 items-center justify-center rounded-xl border px-3 text-[13px] font-bold transition-all duration-200",
                      addPatientForm.chronicDiseases.includes(condition)
                        ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500 shadow-sm"
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    {t(condition.toLowerCase().replace(/\s+/g, "") as TranslationKey) || condition}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-8 pt-0">
            <Button
              variant="ghost"
              onClick={() => setIsAddDialogOpen(false)}
              className="flex-1 h-12 rounded-xl font-black text-[15px] text-slate-500 bg-[#E9EEF4] dark:bg-slate-800 hover:bg-[#DDE5EF] transition-all"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void handleCreatePatient()}
              disabled={isSavingPatient}
              className="flex-1 h-12 rounded-xl bg-[#2563EB] text-white font-black text-[15px] hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {isSavingPatient ? t("adding") : t("addNewPatient")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 mt-6 items-start">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-9 xl:grid-cols-3 items-start">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="h-56 rounded-2xl border bg-muted/30" />
            ))}

          {hasNoPatients && (
            <div className="rounded-2xl border bg-background sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={<UserPlus className="h-8 w-8 text-muted-foreground/60" />}
                title={t("noPatientsFound")}
                description={t("noPatientsDescription")}
                action={{
                  label: t("addNewPatient"),
                  onClick: () => setIsAddDialogOpen(true),
                }}
              />
            </div>
          )}

          {!isLoading &&
            !hasNoPatients &&
            filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}

          {hasNoMatches && (
            <div className="rounded-2xl border bg-background sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={<FilterX className="h-8 w-8 text-muted-foreground/60" />}
                title={t("noResultsFound")}
                description={t("noPatientsMatchFilters") || t("noResultsFound")}
                action={{
                  label: t("resetFilters"),
                  onClick: resetFilters,
                }}
              />
            </div>
          )}
        </section>

        <aside className="space-y-5 xl:col-span-3">
          {/* Modernized Advanced Filters */}
          <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                <Funnel className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[14px] font-black text-slate-900 dark:text-slate-100">
                {t("filters")}
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  {t("chronicDiseases")}
                </p>
                <div className="space-y-2">
                  {chronicFilters.map((condition) => {
                    const isSelected = selectedConditions.includes(condition);
                    return (
                      <button
                        key={condition}
                        onClick={() =>
                          setSelectedConditions((prev) =>
                            isSelected ? prev.filter((v) => v !== condition) : [...prev, condition]
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 transition-all duration-200",
                          isSelected
                            ? "border-blue-100 bg-blue-50/30 dark:bg-blue-900/10"
                            : "border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        )}
                      >
                        <span className={cn(
                          "text-[12px] font-bold transition-colors",
                          isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {t(condition.toLowerCase().replace(/\s+/g, "") as TranslationKey) || condition}
                        </span>
                        <div className={cn(
                          "h-4.5 w-4.5 rounded-md border-2 transition-all flex items-center justify-center",
                          isSelected
                            ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                            : "border-slate-200 dark:border-slate-700"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  {t("ageBuckets")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedAgeBucket(null)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-[12px] font-bold transition-all",
                      selectedAgeBucket === null
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {t("all")}
                  </button>
                  {ageBuckets.map((bucket) => (
                    <button
                      key={bucket}
                      onClick={() => setSelectedAgeBucket(bucket)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-[12px] font-bold transition-all",
                        selectedAgeBucket === bucket
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {bucket}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => setShowRecentActivity(!showRecentActivity)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3.5 transition-all duration-300",
                    showRecentActivity
                      ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm"
                      : "border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                      showRecentActivity ? "bg-blue-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-500"
                    )}>
                      <History className="h-4 w-4" />
                    </div>
                    <span className={cn(
                      "text-[13px] font-black",
                      showRecentActivity ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {t("recentActivity")}
                    </span>
                  </div>
                  <div className={cn(
                    "h-5 w-5 rounded-lg border-2 transition-all flex items-center justify-center",
                    showRecentActivity
                      ? "bg-blue-600 border-blue-600"
                      : "border-slate-200 dark:border-slate-700"
                  )}>
                    {showRecentActivity && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                  </div>
                </button>

                <button
                  onClick={() => setShowPendingResults(!showPendingResults)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3.5 transition-all duration-300",
                    showPendingResults
                      ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm"
                      : "border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                      showPendingResults ? "bg-blue-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-500"
                    )}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className={cn(
                      "text-[13px] font-black",
                      showPendingResults ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {t("pendingResults")}
                    </span>
                  </div>
                  <div className={cn(
                    "h-5 w-5 rounded-lg border-2 transition-all flex items-center justify-center",
                    showPendingResults
                      ? "bg-blue-600 border-blue-600"
                      : "border-slate-200 dark:border-slate-700"
                  )}>
                    {showPendingResults && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                  </div>
                </button>
              </div>

              <Button
                variant="ghost"
                onClick={resetFilters}
                className="w-full h-10 rounded-xl text-slate-500 font-bold text-[12px] hover:bg-slate-50 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
              >
                {t("resetFilters")}
              </Button>
            </div>
          </section>

          {/* Modernized Directory Statistics Card */}
          <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
            <div className="relative px-5 py-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5 border-b border-slate-100/50 dark:border-slate-800/50">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="relative z-10 text-[14px] font-black text-slate-900 dark:text-slate-100">
                {t("directoryStatistics") || t("analytics")}
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t("totalPatients")}
                  </span>
                </div>
                <span className="text-[18px] font-black text-slate-900 dark:text-slate-100">
                  {stats.total}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t("activePatients")}
                  </span>
                </div>
                <span className="text-[18px] font-black text-emerald-600 dark:text-emerald-400">
                  {stats.active}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t("pendingResults")}
                  </span>
                </div>
                <span className="text-[18px] font-black text-orange-600 dark:text-orange-400">
                  {stats.pending}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-28 right-6 rtl:right-auto rtl:left-6 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/40 transition-all hover:scale-110 active:scale-95 z-50 group/fab"
        aria-label={t("addNewPatient")}
      >
        <Plus className="h-6 w-6 group-hover/fab:rotate-90 transition-transform duration-300 stroke-[3]" />
      </button>
    </div>
  );
}

