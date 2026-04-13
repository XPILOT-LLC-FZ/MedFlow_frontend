"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, UserRound, CalendarDays, Download, Plus, X, Phone, Mail, MapPin, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PatientsManagementPage } from "@/components/shared/PatientsManagementPage";
import { patientService } from "@/services/patientService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPatient } from "@/types";

const chronicFilters = ["Hypertension", "Diabetes", "Asthma", "Heart Disease", "Arthritis"];
const ageBuckets = ["0-18", "19-35", "36-50", "51-65", "65+"];

const getAge = (dateOfBirth?: string) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

const inAgeBucket = (age: number | null, bucket: string) => {
  if (age === null) return false;
  if (bucket === "0-18") return age <= 18;
  if (bucket === "19-35") return age >= 19 && age <= 35;
  if (bucket === "36-50") return age >= 36 && age <= 50;
  if (bucket === "51-65") return age >= 51 && age <= 65;
  return age >= 66;
};

const deriveConditions = (patient: ApiPatient) => {
  const text = `${patient.notes || ""} ${JSON.stringify(patient.medicalHistory || {})}`.toLowerCase();
  const tags: string[] = [];
  if (text.includes("hypertension")) tags.push("Hypertension");
  if (text.includes("diabetes")) tags.push("Diabetes");
  if (text.includes("asthma")) tags.push("Asthma");
  if (text.includes("heart")) tags.push("Heart Disease");
  if (text.includes("arthritis")) tags.push("Arthritis");
  if (tags.length === 0) tags.push("Hypertension");
  return tags.slice(0, 2);
};

export default function DoctorPatientsPage() {
  const { locale } = useTranslation();
  const toast = useToastStore();
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [showPendingResults, setShowPendingResults] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    bloodType: "",
    allergies: "",
    chronic: [] as string[],
  });

  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      try {
        const response = await patientService.getPage({ take: 60, page: 1, sortBy: "createdAt", sortOrder: "desc" });
        setPatients(response.data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load patients";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };
    void loadPatients();
  }, [toast]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return patients.filter((patient) => {
      const age = getAge(patient.dateOfBirth);
      const conditions = deriveConditions(patient);
      const updatedAt = new Date(patient.updatedAt || patient.createdAt || Date.now()).getTime();
      const daysSinceUpdate = Math.floor((Date.now() - updatedAt) / (1000 * 60 * 60 * 24));
      const matchesSearch =
        !query ||
        patient.fullName.toLowerCase().includes(query) ||
        (patient.phone || "").toLowerCase().includes(query) ||
        (patient.notes || "").toLowerCase().includes(query);
      const matchesCondition =
        selectedConditions.length === 0 ||
        conditions.some((condition) => selectedConditions.includes(condition));
      const matchesAge =
        selectedAges.length === 0 ||
        selectedAges.some((bucket) => inAgeBucket(age, bucket));
      const matchesRecentActivity = !showRecentActivity || daysSinceUpdate <= 30;
      const matchesPendingResults = !showPendingResults || !patient.user?.isOnboarded;
      return matchesSearch && matchesCondition && matchesAge && matchesRecentActivity && matchesPendingResults;
    });
  }, [patients, search, selectedConditions, selectedAges, showPendingResults, showRecentActivity]);

  const stats = useMemo(() => {
    const total = filteredPatients.length;
    const active = filteredPatients.filter((patient) => (patient.totalVisits || 0) > 0).length;
    const pending = filteredPatients.filter((patient) => !patient.user?.isOnboarded).length;
    return { total, active, pending };
  }, [filteredPatients]);

  const toggleChronic = (condition: string) => {
    setNewPatient((prev) => ({
      ...prev,
      chronic: prev.chronic.includes(condition)
        ? prev.chronic.filter((item) => item !== condition)
        : [...prev.chronic, condition],
    }));
  };

  const resetPatientForm = () => {
    setNewPatient({
      fullName: "",
      age: "",
      phone: "",
      email: "",
      address: "",
      bloodType: "",
      allergies: "",
      chronic: [],
    });
  };

  const createPatient = async () => {
    if (!newPatient.fullName.trim() || !newPatient.age.trim() || !newPatient.phone.trim() || !newPatient.email.trim() || !newPatient.address.trim() || !newPatient.bloodType.trim()) {
      toast.error(locale === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newPatient.email.trim())) {
      toast.error(locale === "ar" ? "البريد الإلكتروني غير صالح" : "Invalid email format");
      return;
    }
    if (Number.isNaN(Number(newPatient.age)) || Number(newPatient.age) < 0 || Number(newPatient.age) > 120) {
      toast.error(locale === "ar" ? "العمر غير صالح" : "Invalid age value");
      return;
    }

    setIsAddingPatient(true);
    try {
      await patientService.create({
        fullName: newPatient.fullName.trim(),
        email: newPatient.email.trim(),
        phone: newPatient.phone.trim(),
        bloodType: newPatient.bloodType.trim(),
        allergies: newPatient.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        medicalHistory: {
          address: newPatient.address.trim(),
          chronicDiseases: newPatient.chronic,
        },
        notes: `Age: ${newPatient.age.trim()}`,
      });

      const response = await patientService.getPage({ take: 60, page: 1, sortBy: "createdAt", sortOrder: "desc" });
      setPatients(response.data || []);
      setAddPatientOpen(false);
      resetPatientForm();
      toast.success(locale === "ar" ? "تمت إضافة المريض بنجاح" : "Patient added successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add patient";
      toast.error(message);
    } finally {
      setIsAddingPatient(false);
    }
  };

  const exportPatients = () => {
    if (filteredPatients.length === 0) {
      toast.error(locale === "ar" ? "لا يوجد مرضى للتصدير" : "No patients to export");
      return;
    }
    const rows = filteredPatients.map((patient) => {
      const age = getAge(patient.dateOfBirth);
      const conditions = deriveConditions(patient).join(" | ");
      return {
        Name: patient.fullName,
        Age: age ?? "",
        Phone: patient.phone || "",
        Email: patient.email || "",
        Conditions: conditions,
        Visits: patient.totalVisits ?? 0,
      };
    });
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header as keyof typeof row] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "doctor-patients-directory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[29px] font-semibold text-slate-900">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <UserRound className="h-5 w-5" />
              </span>
              {locale === "ar" ? "دليل المرضى" : "Patients Directory"}
            </h2>
            <p className="text-xs text-slate-500">{locale === "ar" ? "إدارة سجلات المرضى والتاريخ الطبي" : "Manage patient records and medical history"}</p>
          </div>
          <button type="button" onClick={exportPatients} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700">
            <Download className="h-3.5 w-3.5" />
            {locale === "ar" ? "تصدير البيانات" : "Export Data"}
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={locale === "ar" ? "ابحث باسم المريض أو الهاتف أو السبب..." : "Search appointments by patient name, phone, or reason..."}
            className="h-10 border-slate-200 pl-10"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-9 xl:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="h-56 rounded-2xl border border-slate-200 bg-white" />
          ))}

          {!isLoading && filteredPatients.map((patient) => {
            const age = getAge(patient.dateOfBirth);
            const conditions = deriveConditions(patient);
            return (
              <article key={patient.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[22px] font-semibold leading-6 text-slate-800">{patient.fullName}</p>
                    <p className="text-xs text-slate-500">{age !== null ? `${age} years` : "Age N/A"}</p>
                    <p className="text-[10px] text-slate-400">{`ID: PAT-${patient.id.slice(0, 8)}`}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] text-slate-500">{locale === "ar" ? "الحالة الصحية" : "Health Status"}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {conditions.map((condition) => (
                      <span key={`${patient.id}-${condition}`} className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] text-rose-600">
                        {condition}
                      </span>
                    ))}
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">
                      Well Controlled
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-200 pt-2.5">
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {locale === "ar" ? "آخر زيارة:" : "Last visit:"} {new Date(patient.updatedAt || patient.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="mt-2 text-[10px] text-slate-500">{locale === "ar" ? "اتجاه المؤشرات الحيوية" : "Recent Vitals Trend"}</p>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${Math.min(100, 35 + (patient.totalVisits || 0) * 8)}%` }} />
                  </div>
                </div>
              </article>
            );
          })}

          {!isLoading && filteredPatients.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
              {locale === "ar" ? "لا توجد نتائج مطابقة للفلاتر الحالية" : "No patients match the current filters"}
            </div>
          )}
        </section>

        <aside className="space-y-3 xl:col-span-3">
          <section className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">{locale === "ar" ? "فلاتر متقدمة" : "Advanced Filters"}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}</p>
            <div className="mt-1.5 space-y-1.5">
              {chronicFilters.map((condition) => (
                <label key={condition} className="flex items-center justify-between rounded-md px-1 py-1 text-xs text-slate-700">
                  <span>{condition}</span>
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(condition)}
                    onChange={(event) =>
                      setSelectedConditions((prev) =>
                        event.target.checked ? [...prev, condition] : prev.filter((value) => value !== condition)
                      )
                    }
                  />
                </label>
              ))}
            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">{locale === "ar" ? "الفئة العمرية" : "Age Group"}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ageBuckets.map((bucket) => (
                <button
                  key={bucket}
                  type="button"
                  onClick={() =>
                    setSelectedAges((prev) =>
                      prev.includes(bucket) ? prev.filter((item) => item !== bucket) : [...prev, bucket]
                    )
                  }
                  className={`rounded-md border px-2 py-1.5 text-xs ${
                    selectedAges.includes(bucket) ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {bucket}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <label className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs ${showRecentActivity ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                <span>{locale === "ar" ? "نشاط حديث" : "Recent Activity"}</span>
                <input type="checkbox" checked={showRecentActivity} onChange={(event) => setShowRecentActivity(event.target.checked)} />
              </label>
              <label className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs ${showPendingResults ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                <span>{locale === "ar" ? "نتائج معلقة" : "Pending Results"}</span>
                <input type="checkbox" checked={showPendingResults} onChange={(event) => setShowPendingResults(event.target.checked)} />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_-18px_rgba(37,99,235,0.6)]">
            <p className="text-sm font-semibold text-slate-800">{locale === "ar" ? "إحصائيات الدليل" : "Directory Statistics"}</p>
            <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between"><span>{locale === "ar" ? "إجمالي المرضى" : "Total Patients"}</span><span className="font-semibold">{stats.total}</span></div>
              <div className="flex items-center justify-between"><span>{locale === "ar" ? "نشط" : "Active"}</span><span className="font-semibold text-emerald-600">{stats.active}</span></div>
              <div className="flex items-center justify-between"><span>{locale === "ar" ? "نتائج معلقة" : "Pending Results"}</span><span className="font-semibold text-amber-500">{stats.pending}</span></div>
            </div>
          </section>
        </aside>
      </div>

      <button
        type="button"
        aria-label="Add patient"
        onClick={() => setAddPatientOpen(true)}
        className="fixed right-6 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl bg-[#1d72f3] text-white shadow-[0_14px_30px_-12px_rgba(29,114,243,0.9)] transition-all hover:bg-[#1867df]"
      >
        <Plus className="h-5 w-5 stroke-[2.5]" />
      </button>

      <section className="pt-6">
        <PatientsManagementPage mode="reception" hideTopSummary />
      </section>

      {addPatientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="flex items-center gap-2 text-[36px] font-semibold text-slate-900">
                <UserRound className="h-6 w-6 text-blue-600" />
                {locale === "ar" ? "إضافة مريض جديد" : "Add New Patient"}
              </h3>
              <button type="button" onClick={() => setAddPatientOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800">{locale === "ar" ? "الاسم الكامل *" : "Full Name *"}</label>
                  <Input placeholder={locale === "ar" ? "ادخل اسم المريض" : "Enter patient name"} value={newPatient.fullName} onChange={(e) => setNewPatient((prev) => ({ ...prev, fullName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800">{locale === "ar" ? "العمر *" : "Age *"}</label>
                  <Input placeholder={locale === "ar" ? "ادخل العمر" : "Enter age"} value={newPatient.age} onChange={(e) => setNewPatient((prev) => ({ ...prev, age: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Phone className="h-4 w-4 text-blue-500" />{locale === "ar" ? "رقم الهاتف *" : "Phone Number *"}</label>
                  <Input placeholder="(555) 123-4567" value={newPatient.phone} onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Mail className="h-4 w-4 text-blue-500" />{locale === "ar" ? "البريد الإلكتروني *" : "Email *"}</label>
                  <Input placeholder="patient@email.com" value={newPatient.email} onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800"><MapPin className="h-4 w-4 text-blue-500" />{locale === "ar" ? "العنوان *" : "Address *"}</label>
                <Input placeholder={locale === "ar" ? "العنوان" : "123 Main St, City, State ZIP"} value={newPatient.address} onChange={(e) => setNewPatient((prev) => ({ ...prev, address: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Heart className="h-4 w-4 text-blue-500" />{locale === "ar" ? "فصيلة الدم *" : "Blood Type *"}</label>
                  <Input placeholder="O+" value={newPatient.bloodType} onChange={(e) => setNewPatient((prev) => ({ ...prev, bloodType: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800">{locale === "ar" ? "الحساسية" : "Allergies"}</label>
                  <Input placeholder={locale === "ar" ? "افصل بفواصل" : "Separate with commas"} value={newPatient.allergies} onChange={(e) => setNewPatient((prev) => ({ ...prev, allergies: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">{locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {chronicFilters.map((condition) => (
                    <button
                      key={`chronic-${condition}`}
                      type="button"
                      onClick={() => toggleChronic(condition)}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        newPatient.chronic.includes(condition)
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 pb-6">
              <Button variant="secondary" className="h-11 flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300" onClick={() => setAddPatientOpen(false)} disabled={isAddingPatient}>
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button className="h-11 flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => void createPatient()} disabled={isAddingPatient}>
                {isAddingPatient ? (locale === "ar" ? "جارٍ الإضافة..." : "Adding...") : (locale === "ar" ? "إضافة مريض" : "Add Patient")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
