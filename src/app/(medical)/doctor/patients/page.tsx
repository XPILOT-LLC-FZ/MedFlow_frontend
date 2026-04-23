"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const deriveConditionsForCard = (patient: ApiPatient) => {
  const conditions = extractAllConditions(patient);
  if (conditions.length === 0) {
    return ["General Checkup"];
  }
  return conditions.slice(0, 2);
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

export default function DoctorPatientsPage() {
  const { locale } = useTranslation();
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
          : locale === "ar"
            ? "تعذر تحميل المرضى"
            : "Failed to load patients";
      toastError(message);
    } finally {
      setIsLoading(false);
    }
  }, [locale, toastError, debouncedSearch]);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return patients.filter((patient) => {
      const age = getAge(patient.dateOfBirth);
      const allConditions = extractAllConditions(patient);

      const haystack = [patient.fullName, patient.email, patient.phone]
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
      toastError(locale === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
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
      toastError(
        locale === "ar"
          ? "الاسم الكامل يجب أن يكون حرفين على الأقل"
          : "Full name must be at least 2 characters",
      );
      return;
    }

    const normalizedAge = addPatientForm.age.trim();
    if (normalizedAge) {
      const age = Number(normalizedAge);
      if (!Number.isInteger(age) || age <= 0 || age > 120) {
        toastError(locale === "ar" ? "العمر غير صالح" : "Age is invalid");
        return;
      }
    }

    const normalizedEmail = addPatientForm.email.trim().toLowerCase();
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      toastError(
        locale === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format",
      );
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
      toastSuccess(
        locale === "ar" ? "تم إضافة المريض بنجاح" : "Patient added successfully",
      );
      setIsAddDialogOpen(false);
      setAddPatientForm(getInitialAddPatientForm());
      await loadPatients();
    } catch (error) {
      toastError(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر إضافة المريض"
            : "Failed to add patient",
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
                  {locale === "ar" ? "دليل المرضى" : "Patients Directory"}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {locale === "ar"
                    ? "إدارة سجلات المرضى والتاريخ الطبي"
                    : "Manage patient records and medical history"}
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
                {locale === "ar" ? "تصدير البيانات" : "Export Data"}
              </Button>
            </div>
          </div>

          <div className="mt-7 relative group">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                locale === "ar"
                  ? "ابحث عن المرضى بالاسم أو الهاتف أو السجل الطبي..."
                  : "Search patients by name, phone, or medical history..."
              }
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
              {locale === "ar" ? "إضافة مريض جديد" : "Add New Patient"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 px-8 py-8 overflow-y-auto max-h-[80vh]">
            {/* Name & Age Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  {locale === "ar" ? "الاسم الكامل" : "Full Name"} *
                </label>
                <Input
                  value={addPatientForm.fullName}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={locale === "ar" ? "أدخل اسم المريض" : "Enter patient name"}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] focus:ring-4 focus:ring-blue-600/5 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  {locale === "ar" ? "العمر" : "Age"} *
                </label>
                <Input
                  value={addPatientForm.age}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, age: e.target.value }))}
                  placeholder={locale === "ar" ? "أدخل العمر" : "Enter age"}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
                />
              </div>
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-blue-500" />
                  {locale === "ar" ? "رقم الهاتف" : "Phone Number"} *
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
                  {locale === "ar" ? "البريد الإلكتروني" : "Email"} *
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
                {locale === "ar" ? "العنوان" : "Address"} *
              </label>
              <Input
                value={addPatientForm.address}
                onChange={(e) => setAddPatientForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder={locale === "ar" ? "123 شارع رئيسي، المدينة، الدولة ZIP" : "123 Main St, City, State ZIP"}
                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
              />
            </div>

            {/* Blood Type & Allergies Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 dark:text-slate-300">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  {locale === "ar" ? "فصيلة الدم" : "Blood Type"} *
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
                  {locale === "ar" ? "الحساسية" : "Allergies"}
                </label>
                <Input
                  value={addPatientForm.allergies}
                  onChange={(e) => setAddPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder={locale === "ar" ? "افصل بين القيم بفاصلة" : "Separate with commas"}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-[14px] transition-all"
                />
              </div>
            </div>

            {/* Chronic Diseases Section */}
            <div className="space-y-3">
              <p className="text-[13px] font-black text-slate-700 dark:text-slate-300">
                {locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}
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
                    {condition}
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
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => void handleCreatePatient()}
              disabled={isSavingPatient}
              className="flex-1 h-12 rounded-xl bg-[#2563EB] text-white font-black text-[15px] hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {isSavingPatient ? (locale === "ar" ? "جارٍ الإضافة..." : "Adding...") : (locale === "ar" ? "إضافة المريض" : "Add Patient")}
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
                title={locale === "ar" ? "لا يوجد مرضى حالياً" : "No patients found"}
                description={
                  locale === "ar"
                    ? "ابدأ بإضافة مريض جديد لعرض السجل الطبي في هذا القسم"
                    : "Start by adding a new patient to populate this directory"
                }
                action={{
                  label: locale === "ar" ? "إضافة مريض جديد" : "Add New Patient",
                  onClick: () => setIsAddDialogOpen(true),
                }}
              />
            </div>
          )}

          {!isLoading &&
            !hasNoPatients &&
            filteredPatients.map((patient) => {
              const age = getAge(patient.dateOfBirth);
              const conditions = deriveConditionsForCard(patient);
              const lastVisitDate = new Date(patient.updatedAt || patient.createdAt || Date.now()).toLocaleDateString(
                locale === "ar" ? "ar-EG" : "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              );

              return (
                <Link key={patient.id} href={`/doctor/patients/${patient.id}`}>
                  <article className="group relative rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-7 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer h-full">
                    <div className="flex items-start gap-5 mb-7">
                      <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <UserRound className="h-9 w-9" />
                      </div>
                      <div className="min-w-0 pt-1">
                        <h4 className="text-[20px] font-bold text-[#1E293B] dark:text-slate-100 leading-tight mb-1">
                          {patient.fullName}
                        </h4>
                        <div className="flex flex-col gap-1">
                          <span className="text-[15px] font-medium text-[#64748B] dark:text-slate-400">
                            {age !== null ? `${age} ${locale === "ar" ? "سنة" : "years"}` : locale === "ar" ? "العمر غير متاح" : "AGE N/A"}
                          </span>
                          <span className="text-[13px] font-medium text-[#94A3B8] dark:text-slate-500 uppercase tracking-wide">
                            ID: PAT-2024-{patient.id.slice(-3).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-7">
                      <p className="text-[14px] font-bold text-[#64748B] dark:text-slate-400 mb-3.5">
                        {locale === "ar" ? "الحالة الصحية" : "Health Status"}
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {conditions.length > 0 ? (
                          conditions.map((condition) => (
                            <span 
                              key={`${patient.id}-${condition}`} 
                              className="rounded-[10px] bg-[#FFF1F2] dark:bg-rose-950/30 px-3.5 py-1.5 text-[13px] font-bold text-[#F43F5E] border border-[#FFE4E6] dark:border-rose-900/50"
                            >
                              {condition}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-[10px] bg-[#EFF6FF] dark:bg-blue-950/30 px-3.5 py-1.5 text-[13px] font-bold text-[#3B82F6] border border-[#DBEAFE] dark:border-blue-900/50">
                            {locale === "ar" ? "فحص عام" : "General Checkup"}
                          </span>
                        )}
                        <span className="rounded-[10px] bg-[#F0FDF4] dark:bg-emerald-950/30 px-3.5 py-1.5 text-[13px] font-bold text-[#22C55E] border border-[#DCFCE7] dark:border-emerald-900/50">
                          {locale === "ar" ? "متحكم به جيداً" : "Well Controlled"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-5 pt-7 border-t border-[#F1F5F9] dark:border-slate-800/60">
                      <div className="flex items-center gap-2.5 text-[#64748B] dark:text-slate-400">
                        <Calendar className="h-5 w-5 text-[#94A3B8]" />
                        <span className="text-[14px] font-bold">
                          {locale === "ar" ? "آخر زيارة:" : "Last visit:"} {lastVisitDate}
                        </span>
                      </div>
                      
                      <div className="space-y-3.5">
                        <p className="text-[13px] font-bold text-[#64748B] dark:text-slate-400">
                          {locale === "ar" ? "اتجاه العلامات الحيوية الحديثة" : "Recent Vitals Trend"}
                        </p>
                        <div className="relative h-8 w-full opacity-90">
                          <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
                            <path
                              d="M0,15 C20,13 40,17 60,15 C80,13 100,17 120,15 C140,13 160,17 180,15 C200,13 220,17 240,15"
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
            })}

          {hasNoMatches && (
            <div className="rounded-2xl border bg-background sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={<FilterX className="h-8 w-8 text-muted-foreground/60" />}
                title={locale === "ar" ? "لا توجد نتائج مطابقة" : "No patients match current filters"}
                description={
                  locale === "ar"
                    ? "جرّب تعديل الفلاتر أو مسح البحث للوصول إلى النتائج"
                    : "Try adjusting filters or clearing search to see results"
                }
                action={{
                  label: locale === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters",
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
                {locale === "ar" ? "فلاتر متقدمة" : "Advanced Filters"}
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  {locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}
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
                          {condition}
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
                  {locale === "ar" ? "الفئة العمرية" : "Age Group"}
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
                    {locale === "ar" ? "الكل" : "All"}
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
                      {locale === "ar" ? "نشط حديث" : "Recent Activity"}
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
                      {locale === "ar" ? "نتائج معلقة" : "Pending Results"}
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
                {locale === "ar" ? "إعادة تعيين الفلاتر" : "Reset All Filters"}
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
                {locale === "ar" ? "إحصائيات الدليل" : "Directory Statistics"}
              </h3>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {locale === "ar" ? "إجمالي المرضى" : "Total Patients"}
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
                    {locale === "ar" ? "نشط" : "Active"}
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
                    {locale === "ar" ? "نتائج معلقة" : "Pending Results"}
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
        aria-label={locale === "ar" ? "إضافة مريض جديد" : "Add new patient"}
      >
        <Plus className="h-6 w-6 group-hover/fab:rotate-90 transition-transform duration-300 stroke-[3]" />
      </button>
    </div>
  );
}
