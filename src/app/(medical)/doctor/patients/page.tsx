"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Download,
  FilterX,
  Plus,
  Search,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { patientService } from "@/services/patientService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPatient, CreatePatientPayload } from "@/types";

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
  const fromStructured = Array.isArray(source?.chronicDiseases)
    ? (source.chronicDiseases as unknown[])
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

  const text = `${patient.notes || ""} ${JSON.stringify(source || {})}`.toLowerCase();
  const fromText: string[] = [];

  if (text.includes("hypertension")) fromText.push("Hypertension");
  if (text.includes("diabetes")) fromText.push("Diabetes");
  if (text.includes("asthma")) fromText.push("Asthma");
  if (text.includes("heart")) fromText.push("Heart Disease");
  if (text.includes("arthritis")) fromText.push("Arthritis");

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
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAgeBucket, setSelectedAgeBucket] = useState<string | null>(null);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [showPendingResults, setShowPendingResults] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [addPatientForm, setAddPatientForm] = useState<AddPatientForm>(
    getInitialAddPatientForm(),
  );

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await patientService.getPage({
        take: 80,
        page: 1,
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
  }, [locale, toastError]);

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

    if (addPatientForm.address.trim()) {
      medicalHistory.address = addPatientForm.address.trim();
    }
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
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "دليل المرضى" : "Patients Directory"}
        description={
          locale === "ar"
            ? "إدارة سجلات المرضى والتاريخ الطبي"
            : "Manage patient records and medical history"
        }
        action={
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {locale === "ar" ? "إضافة مريض جديد" : "Add New Patient"}
          </Button>
        }
      />

      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setAddPatientForm(getInitialAddPatientForm());
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{locale === "ar" ? "إضافة مريض جديد" : "Add New Patient"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{locale === "ar" ? "الاسم الكامل" : "Full Name"} *</label>
                <Input
                  value={addPatientForm.fullName}
                  onChange={(event) =>
                    setAddPatientForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  placeholder={locale === "ar" ? "أدخل اسم المريض" : "Enter patient name"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{locale === "ar" ? "العمر" : "Age"}</label>
                <Input
                  value={addPatientForm.age}
                  onChange={(event) =>
                    setAddPatientForm((prev) => ({ ...prev, age: event.target.value }))
                  }
                  placeholder={locale === "ar" ? "أدخل العمر" : "Enter age"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{locale === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
                <Input
                  value={addPatientForm.phone}
                  onChange={(event) =>
                    setAddPatientForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder={locale === "ar" ? "0555 123 4567" : "0555 123 4567"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                <Input
                  value={addPatientForm.email}
                  onChange={(event) =>
                    setAddPatientForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="patient@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{locale === "ar" ? "العنوان" : "Address"}</label>
              <Input
                value={addPatientForm.address}
                onChange={(event) =>
                  setAddPatientForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder={locale === "ar" ? "23 Main St, City" : "23 Main St, City, State ZIP"}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{locale === "ar" ? "نوع الهوية" : "ID Type"}</label>
                <Input
                  value={addPatientForm.idType}
                  onChange={(event) =>
                    setAddPatientForm((prev) => ({ ...prev, idType: event.target.value }))
                  }
                  placeholder={locale === "ar" ? "الرقم القومي / جواز" : "National ID / Passport"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{locale === "ar" ? "فصيلة الدم" : "Blood Type"}</label>
                <Input
                  value={addPatientForm.bloodType}
                  onChange={(event) =>
                    setAddPatientForm((prev) => ({ ...prev, bloodType: event.target.value }))
                  }
                  placeholder="O+"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{locale === "ar" ? "الحساسية" : "Allergies"}</label>
              <Input
                value={addPatientForm.allergies}
                onChange={(event) =>
                  setAddPatientForm((prev) => ({ ...prev, allergies: event.target.value }))
                }
                placeholder={
                  locale === "ar"
                    ? "افصل بين القيم بفاصلة"
                    : "Separate with commas"
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    className={`rounded-md border px-2 py-1.5 text-xs ${
                      addPatientForm.chronicDiseases.includes(condition)
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border"
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button className="flex-1" disabled={isSavingPatient} onClick={() => void handleCreatePatient()}>
                {isSavingPatient
                  ? locale === "ar"
                    ? "جارٍ الإضافة..."
                    : "Adding..."
                  : locale === "ar"
                    ? "إضافة المريض"
                    : "Add Patient"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">
              {locale === "ar" ? "بحث وفلاتر" : "Search & Filters"}
            </h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportPatients}>
              <Download className="h-3.5 w-3.5" />
              {locale === "ar" ? "تصدير البيانات" : "Export Data"}
            </Button>
          </div>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                locale === "ar"
                  ? "ابحث باسم المريض أو الهاتف أو السجل الطبي"
                  : "Search patients, appointments, or medical records..."
              }
              className="pl-9 rtl:pl-3 rtl:pr-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-9 xl:grid-cols-3">
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

              return (
                <article key={patient.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold leading-6">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {age !== null ? `${age} years` : locale === "ar" ? "العمر غير متاح" : "Age N/A"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {`ID: PAT-${patient.id.slice(0, 8)}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "ar" ? "الحالة الصحية" : "Health Status"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {conditions.map((condition) => (
                        <span key={`${patient.id}-${condition}`} className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] text-red-600 border border-red-100">
                          {condition}
                        </span>
                      ))}
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600 border border-emerald-100">
                        Well Controlled
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 border-t pt-2.5">
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {locale === "ar" ? "آخر زيارة:" : "Last visit:"}{" "}
                      {new Date(patient.updatedAt || patient.createdAt || Date.now()).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {locale === "ar" ? "اتجاه المؤشرات الحيوية" : "Recent Vitals Trend"}
                    </p>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                        style={{ width: `${Math.min(100, 35 + (patient.totalVisits || 0) * 8)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {(patient.totalVisits ?? 0).toString()} {locale === "ar" ? "زيارات" : "visits"}
                    </Badge>
                    <Link href={`/doctor/patients/${patient.id}`}>
                      <Button size="sm" className="gap-1.5 h-8">
                        {locale === "ar" ? "تفاصيل" : "Details"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </article>
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

        <aside className="space-y-3 xl:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {locale === "ar" ? "فلاتر متقدمة" : "Advanced Filters"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}
                </p>
                <div className="space-y-1.5">
                  {chronicFilters.map((condition) => (
                    <label key={condition} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                      <span>{condition}</span>
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(condition)}
                        onChange={(event) =>
                          setSelectedConditions((prev) =>
                            event.target.checked
                              ? [...prev, condition]
                              : prev.filter((value) => value !== condition),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {locale === "ar" ? "الفئة العمرية" : "Age Group"}
                </p>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                    <span>{locale === "ar" ? "الكل" : "All"}</span>
                    <input
                      type="radio"
                      name="age-group"
                      checked={selectedAgeBucket === null}
                      onChange={() => setSelectedAgeBucket(null)}
                    />
                  </label>
                  {ageBuckets.map((bucket) => (
                    <label
                      key={bucket}
                      className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs"
                    >
                      <span>{bucket}</span>
                      <input
                        type="radio"
                        name="age-group"
                        checked={selectedAgeBucket === bucket}
                        onChange={() => setSelectedAgeBucket(bucket)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                  <span>{locale === "ar" ? "نشاط حديث" : "Recent Activity"}</span>
                  <input
                    type="checkbox"
                    checked={showRecentActivity}
                    onChange={(event) => setShowRecentActivity(event.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                  <span>{locale === "ar" ? "نتائج معلقة" : "Pending Results"}</span>
                  <input
                    type="checkbox"
                    checked={showPendingResults}
                    onChange={(event) => setShowPendingResults(event.target.checked)}
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={resetFilters}
                >
                  {locale === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {locale === "ar" ? "إحصائيات الدليل" : "Directory Statistics"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{locale === "ar" ? "إجمالي المرضى" : "Total Patients"}</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{locale === "ar" ? "نشط" : "Active"}</span>
                <span className="font-semibold text-emerald-600">{stats.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{locale === "ar" ? "نتائج معلقة" : "Pending Results"}</span>
                <span className="font-semibold text-amber-600">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105"
        aria-label={locale === "ar" ? "إضافة مريض جديد" : "Add new patient"}
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
