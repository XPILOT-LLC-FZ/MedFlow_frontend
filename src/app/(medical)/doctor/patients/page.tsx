"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Download,
  Search,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { patientService } from "@/services/patientService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPatient } from "@/types";

const chronicFilters = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "Arthritis",
];

const ageBuckets = ["0-18", "19-35", "36-50", "51-65", "65+"];

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

const deriveConditions = (patient: ApiPatient) => {
  const text = `${patient.notes || ""} ${JSON.stringify(patient.medicalHistory || {})}`.toLowerCase();
  const tags: string[] = [];

  if (text.includes("hypertension")) tags.push("Hypertension");
  if (text.includes("diabetes")) tags.push("Diabetes");
  if (text.includes("asthma")) tags.push("Asthma");
  if (text.includes("heart")) tags.push("Heart Disease");
  if (text.includes("arthritis")) tags.push("Arthritis");

  if (tags.length === 0) {
    tags.push("General Checkup");
  }

  return tags.slice(0, 2);
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
  const toast = useToastStore();

  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [showPendingResults, setShowPendingResults] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
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
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatients();
  }, [locale, toast]);

  const filteredPatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return patients.filter((patient) => {
      const age = getAge(patient.dateOfBirth);
      const conditions = deriveConditions(patient);
      const updatedAt = new Date(
        patient.updatedAt || patient.createdAt || Date.now(),
      ).getTime();
      const daysSinceUpdate = Math.floor(
        (Date.now() - updatedAt) / (1000 * 60 * 60 * 24),
      );

      const haystack = [patient.fullName, patient.email, patient.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalized || haystack.includes(normalized);
      const matchesCondition =
        selectedConditions.length === 0 ||
        conditions.some((condition) => selectedConditions.includes(condition));
      const matchesAge =
        selectedAges.length === 0 ||
        selectedAges.some((bucket) => inAgeBucket(age, bucket));
      const matchesRecentActivity = !showRecentActivity || daysSinceUpdate <= 30;
      const matchesPendingResults = !showPendingResults || !patient.user?.isOnboarded;

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
    selectedAges,
    showRecentActivity,
    showPendingResults,
  ]);

  const stats = useMemo(() => {
    const total = filteredPatients.length;
    const active = filteredPatients.filter((patient) => (patient.totalVisits || 0) > 0).length;
    const pending = filteredPatients.filter((patient) => !patient.user?.isOnboarded).length;
    return { total, active, pending };
  }, [filteredPatients]);

  const exportPatients = () => {
    if (filteredPatients.length === 0) {
      toast.error(locale === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
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

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "دليل المرضى" : "Patients Directory"}
        description={
          locale === "ar"
            ? "إدارة سجلات المرضى والتاريخ الطبي"
            : "Manage patient records and medical history"
        }
      />

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

          {!isLoading &&
            filteredPatients.map((patient) => {
              const age = getAge(patient.dateOfBirth);
              const conditions = deriveConditions(patient);

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

          {!isLoading && filteredPatients.length === 0 && (
            <div className="rounded-2xl border bg-background p-6 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
              {locale === "ar" ? "لا توجد نتائج مطابقة" : "No patients match current filters"}
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
                <div className="grid grid-cols-2 gap-1.5">
                  {ageBuckets.map((bucket) => (
                    <button
                      key={bucket}
                      type="button"
                      onClick={() =>
                        setSelectedAges((prev) =>
                          prev.includes(bucket)
                            ? prev.filter((item) => item !== bucket)
                            : [...prev, bucket],
                        )
                      }
                      className={`rounded-md border px-2 py-1.5 text-xs ${
                        selectedAges.includes(bucket)
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border"
                      }`}
                    >
                      {bucket}
                    </button>
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
    </div>
  );
}
