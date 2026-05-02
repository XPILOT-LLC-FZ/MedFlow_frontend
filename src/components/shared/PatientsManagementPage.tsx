"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  UserRound,
  UserRoundCheck,
  ClipboardCheck,
  Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { patientService } from "@/services/patientService";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { useTranslation } from "@/hooks/useTranslation";
import type {
  ApiDoctor,
  ApiPatient,
  CreatePatientPayload,
  PatientListFilters,
  PatientsPaginationMeta,
} from "@/types";

type Mode = "admin" | "reception";

type Props = {
  mode: Mode;
  hideTopSummary?: boolean;
};

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  notes: "",
  createUserAccount: false,
  password: "",
  confirmPassword: "",
};

const getInitialForm = (mode: Mode) => ({
  ...emptyForm,
  // Admin flow defaults to creating portal access so patient onboarding is required.
  createUserAccount: mode === "admin",
});

const vipOptions: Array<{ value: "ALL" | "STANDARD" | "SILVER" | "GOLD" | "PLATINUM"; label: string; labelAr: string }> = [
  { value: "ALL", label: "All VIP Tiers", labelAr: "كل مستويات VIP" },
  { value: "STANDARD", label: "Standard", labelAr: "عادي" },
  { value: "SILVER", label: "Silver", labelAr: "فضي" },
  { value: "GOLD", label: "Gold", labelAr: "ذهبي" },
  { value: "PLATINUM", label: "Platinum", labelAr: "بلاتيني" },
];

const portalOptions: Array<{
  value: PatientListFilters["portalStatus"];
  label: string;
  labelAr: string;
}> = [
  { value: "all", label: "All", labelAr: "الكل" },
  { value: "with_account", label: "With Account", labelAr: "مع حساب" },
  { value: "without_account", label: "No Account", labelAr: "بدون حساب" },
  { value: "onboarding_pending", label: "Onboarding Pending", labelAr: "بانتظار الإعداد" },
  { value: "onboarding_completed", label: "Onboarding Done", labelAr: "اكتمل الإعداد" },
];

const sortByOptions: Array<{ value: NonNullable<PatientListFilters["sortBy"]>; label: string; labelAr: string }> = [
  { value: "createdAt", label: "Newest", labelAr: "الأحدث" },
  { value: "fullName", label: "Name", labelAr: "الاسم" },
  { value: "totalVisits", label: "Visits", labelAr: "الزيارات" },
  { value: "totalSpent", label: "Spend", labelAr: "الإنفاق" },
];

const renderVipLabel = (tier?: ApiPatient["vipTier"], locale?: string) => {
  if (!tier) return locale === "ar" ? "غير محدد" : "N/A";
  if (tier === "PLATINUM") return locale === "ar" ? "بلاتيني" : "Platinum";
  if (tier === "GOLD") return locale === "ar" ? "ذهبي" : "Gold";
  if (tier === "SILVER") return locale === "ar" ? "فضي" : "Silver";
  return locale === "ar" ? "عادي" : "Standard";
};

const renderPortalStatus = (patient: ApiPatient, locale: string) => {
  if (!patient.user) {
    return {
      text: locale === "ar" ? "بدون حساب" : "No Account",
      variant: "secondary" as const,
    };
  }

  if (patient.user.isOnboarded) {
    return {
      text: locale === "ar" ? "مفعل" : "Active",
      variant: "success" as const,
    };
  }

  return {
    text: locale === "ar" ? "بانتظار الإعداد" : "Onboarding Pending",
    variant: "warning" as const,
  };
};

export function PatientsManagementPage({ mode, hideTopSummary = false }: Props) {
  const { locale } = useTranslation();
  const { doctors, fetchDoctors } = useStaffStore();
  const toast = useToastStore();

  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [discountInput, setDiscountInput] = useState<Record<string, number>>({});
  const [isUpdatingDiscount, setIsUpdatingDiscount] = useState<string | null>(null);

  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [vipTier, setVipTier] = useState<(typeof vipOptions)[number]["value"]>("ALL");
  const [gender, setGender] = useState("ALL");
  const [portalStatus, setPortalStatus] = useState<NonNullable<PatientListFilters["portalStatus"]>>("all");
  const [sortBy, setSortBy] = useState<NonNullable<PatientListFilters["sortBy"]>>("createdAt");
  const [sortOrder, setSortOrder] = useState<NonNullable<PatientListFilters["sortOrder"]>>("desc");

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PatientsPaginationMeta>({
    page: 1,
    take: 20,
    total: 0,
    totalPages: 0,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(getInitialForm(mode));
  const [preferredDoctorId, setPreferredDoctorId] = useState("");

  useEffect(() => {
    if (mode !== "reception") {
      return;
    }

    void fetchDoctors({ status: "ACTIVE" });
  }, [fetchDoctors, mode]);

  const activeDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.status === "ACTIVE"),
    [doctors],
  );

  const title =
    mode === "admin"
      ? locale === "ar"
        ? "إدارة المرضى"
        : "Patients Management"
      : locale === "ar"
        ? "مرضى الاستقبال"
        : "Reception Patients";

  const description =
    mode === "admin"
      ? locale === "ar"
        ? "إدارة سجلات المرضى وربطهم بحسابات البوابة"
        : "Manage patient records and linked portal accounts"
      : locale === "ar"
        ? "بحث سريع وتسجيل مرضى جدد مع دعم الإعداد"
        : "Fast search and registration with onboarding-ready accounts";

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: PatientListFilters = {
        search: searchTerm || undefined,
        vipTier: vipTier === "ALL" ? undefined : vipTier,
        gender: gender === "ALL" ? undefined : gender,
        portalStatus,
        sortBy,
        sortOrder,
        take: 20,
        page,
      };

      const response = await patientService.getPage(filters);
      const rows = Array.isArray(response?.data) ? response.data : [];
      setPatients(rows);
      setPagination({
        page: response?.meta?.page ?? filters.page ?? 1,
        take: response?.meta?.take ?? filters.take ?? 20,
        total: response?.meta?.total ?? rows.length,
        totalPages:
          response?.meta?.totalPages ??
          (rows.length === 0
            ? 0
            : Math.ceil((response?.meta?.total ?? rows.length) / Math.max(1, response?.meta?.take ?? filters.take ?? 20))),
      });
      setSelectedPatientId((current) => {
        if (!current) {
          return rows[0]?.id ?? null;
        }

        return rows.some((patient) => patient.id === current)
          ? current
          : (rows[0]?.id ?? null);
      });
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
  }, [gender, locale, page, portalStatus, searchTerm, sortBy, sortOrder, toast, vipTier]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, vipTier, gender, portalStatus, sortBy, sortOrder]);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  const uniqueGenderOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        patients
          .map((patient) => (patient.gender || "").trim())
          .filter((value) => value.length > 0),
      ),
    );

    return ["ALL", ...values];
  }, [patients]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  );

  const visiblePageNumbers = useMemo(() => {
    if (pagination.totalPages <= 1) {
      return [] as number[];
    }

    const start = Math.max(1, pagination.page - 2);
    const end = Math.min(pagination.totalPages, pagination.page + 2);
    const pages: number[] = [];
    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
      pages.push(pageNumber);
    }

    return pages;
  }, [pagination.page, pagination.totalPages]);

  const bookingHref = useMemo(() => {
    if (!selectedPatient) {
      return "/reception/booking";
    }

    const params = new URLSearchParams({ patientId: selectedPatient.id });
    if (preferredDoctorId) {
      params.set("doctorId", preferredDoctorId);
    }

    return `/reception/booking?${params.toString()}`;
  }, [preferredDoctorId, selectedPatient]);

  const stats = useMemo(() => {
    const total = pagination.total;
    const withPortal = patients.filter((patient) => Boolean(patient.user)).length;
    const onboardingPending = patients.filter(
      (patient) => patient.user && !patient.user.isOnboarded,
    ).length;
    const goldAndUp = patients.filter(
      (patient) => patient.vipTier === "GOLD" || patient.vipTier === "PLATINUM",
    ).length;

    return { total, withPortal, onboardingPending, goldAndUp };
  }, [patients, pagination.total]);

  const handleCreatePatient = async () => {
    if (form.fullName.trim().length < 2) {
      toast.error(
        locale === "ar"
          ? "اسم المريض يجب أن يكون حرفين على الأقل"
          : "Patient name must be at least 2 characters",
      );
      return;
    }

    if (form.createUserAccount) {
      if (!form.email.trim()) {
        toast.error(
          locale === "ar"
            ? "البريد الإلكتروني مطلوب لإنشاء حساب"
            : "Email is required when creating a portal account",
        );
        return;
      }

      if (form.password.length < 8) {
        toast.error(
          locale === "ar"
            ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
            : "Password must be at least 8 characters",
        );
        return;
      }

      if (form.password !== form.confirmPassword) {
        toast.error(
          locale === "ar"
            ? "تأكيد كلمة المرور غير متطابق"
            : "Password confirmation does not match",
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: CreatePatientPayload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase() || undefined,
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth
          ? new Date(`${form.dateOfBirth}T00:00:00.000Z`).toISOString()
          : undefined,
        gender: form.gender.trim() || undefined,
        notes: form.notes.trim() || undefined,
        createUserAccount: form.createUserAccount,
        password: form.createUserAccount ? form.password : undefined,
      };

      const created = await patientService.create(payload);
      setDialogOpen(false);
      setForm(getInitialForm(mode));
      toast.success(
        locale === "ar"
          ? "تم إنشاء المريض بنجاح"
          : "Patient created successfully",
      );
      await loadPatients();
      setSelectedPatientId(created.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل إنشاء المريض"
            : "Failed to create patient";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDiscount = async (id: string, discount: number) => {
    setIsUpdatingDiscount(id);
    try {
      await patientService.update(id, { specialDiscount: discount });
      toast.success(
        locale === "ar"
          ? "تم تحديث الخصم بنجاح"
          : "Special discount updated successfully"
      );
      await loadPatients();
    } catch {
      toast.error(
        locale === "ar"
          ? "فشل تحديث الخصم"
          : "Failed to update discount"
      );
    } finally {
      setIsUpdatingDiscount(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {!hideTopSummary && (
        <PageHeader
          title={title}
          description={description}
          action={
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setForm(getInitialForm(mode));
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {locale === "ar" ? "إضافة مريض" : "Add Patient"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{locale === "ar" ? "تسجيل مريض جديد" : "Register New Patient"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{locale === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                  <Input
                    value={form.fullName}
                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder={locale === "ar" ? "اسم المريض" : "Patient full name"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "الهاتف" : "Phone"}</label>
                    <Input
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="+20..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "تاريخ الميلاد" : "Date of Birth"}</label>
                    <Input
                      value={form.dateOfBirth}
                      onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                      type="date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="patient@clinic.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "النوع" : "Gender"}</label>
                    <div className="flex items-center gap-4 rounded-lg border px-3 py-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="patient-gender"
                          value="Male"
                          checked={form.gender === "Male"}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, gender: event.target.value }))
                          }
                        />
                        <span>{locale === "ar" ? "ذكر" : "Male"}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="patient-gender"
                          value="Female"
                          checked={form.gender === "Female"}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, gender: event.target.value }))
                          }
                        />
                        <span>{locale === "ar" ? "أنثى" : "Female"}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{locale === "ar" ? "ملاحظات" : "Notes"}</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background min-h-20"
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder={locale === "ar" ? "ملاحظات إضافية" : "Optional notes"}
                  />
                </div>

                <div className="rounded-lg border p-3 space-y-3">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.createUserAccount}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, createUserAccount: event.target.checked }))
                      }
                    />
                    <span>
                      {locale === "ar"
                        ? "إنشاء حساب بوابة للمريض (يتطلب إكمال الإعداد بعد أول تسجيل دخول)"
                        : "Create a patient portal account (onboarding required after first login)"}
                    </span>
                  </label>

                  {form.createUserAccount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{locale === "ar" ? "كلمة المرور المؤقتة" : "Temporary Password"}</label>
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                          placeholder="Patient@2026"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
                        <Input
                          type="password"
                          value={form.confirmPassword}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                          }
                          placeholder="Patient@2026"
                        />
                      </div>
                    </div>
                  )}
                </div>

                  <Button className="w-full" disabled={isSaving} onClick={() => void handleCreatePatient()}>
                    {isSaving
                      ? locale === "ar"
                        ? "جار الحفظ..."
                        : "Saving..."
                      : locale === "ar"
                        ? "حفظ المريض"
                        : "Save Patient"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
      )}

      {!hideTopSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "إجمالي المرضى" : "Total Patients"}</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <UserRound className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "مع حساب" : "Portal Accounts"}</p>
                <p className="text-2xl font-semibold">{stats.withPortal}</p>
              </div>
              <UserRoundCheck className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "بانتظار الإعداد" : "Onboarding Pending"}</p>
                <p className="text-2xl font-semibold">{stats.onboardingPending}</p>
              </div>
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "VIP ذهبي+" : "VIP Gold+"}</p>
                <p className="text-2xl font-semibold">{stats.goldAndUp}</p>
              </div>
              <Stethoscope className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{locale === "ar" ? "بحث وفلاتر" : "Search & Filters"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 rtl:pl-3 rtl:pr-9"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setSearchTerm(searchDraft.trim());
                  }
                }}
                placeholder={
                  locale === "ar"
                    ? "ابحث بالاسم أو الهاتف أو البريد"
                    : "Search by name, phone, or email"
                }
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm(searchDraft.trim())}>
              {locale === "ar" ? "بحث" : "Search"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <select
              value={vipTier}
              onChange={(event) => setVipTier(event.target.value as (typeof vipOptions)[number]["value"])}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              {vipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "ar" ? option.labelAr : option.label}
                </option>
              ))}
            </select>

            <select
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              {uniqueGenderOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL"
                    ? locale === "ar"
                      ? "كل الأنواع"
                      : "All Genders"
                    : item}
                </option>
              ))}
            </select>

            <select
              value={portalStatus}
              onChange={(event) =>
                setPortalStatus(event.target.value as NonNullable<PatientListFilters["portalStatus"]>)
              }
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              {portalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "ar" ? option.labelAr : option.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as NonNullable<PatientListFilters["sortBy"]>)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              {sortByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "ar" ? option.labelAr : option.label}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as NonNullable<PatientListFilters["sortOrder"]>)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="desc">{locale === "ar" ? "تنازلي" : "Descending"}</option>
              <option value="asc">{locale === "ar" ? "تصاعدي" : "Ascending"}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{locale === "ar" ? "قائمة المرضى" : "Patients List"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "المريض" : "Patient"}</TableHead>
                    <TableHead>{locale === "ar" ? "التواصل" : "Contact"}</TableHead>
                    <TableHead>{locale === "ar" ? "VIP" : "VIP"}</TableHead>
                    <TableHead>{locale === "ar" ? "البوابة" : "Portal"}</TableHead>
                    <TableHead>{locale === "ar" ? "الزيارات" : "Visits"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {locale === "ar" ? "لا يوجد مرضى مطابقون" : "No matching patients found"}
                      </TableCell>
                    </TableRow>
                  )}

                  {patients.map((patient, index) => {
                    const portal = renderPortalStatus(patient, locale);
                    const active = selectedPatientId === patient.id;

                    return (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.015 }}
                        className={`border-b cursor-pointer transition-colors ${
                          active ? "bg-muted/70" : "hover:bg-muted/40"
                        }`}
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{patient.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {patient.createdAt
                                ? new Date(patient.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")
                                : "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{patient.phone || "-"}</p>
                          <p className="text-xs text-muted-foreground">{patient.email || "-"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {renderVipLabel(patient.vipTier, locale)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={portal.variant} className="text-xs">
                            {portal.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{patient.totalVisits ?? 0}</TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? `الصفحة ${pagination.page} من ${Math.max(1, pagination.totalPages || 1)} - إجمالي ${pagination.total}`
                  : `Page ${pagination.page} of ${Math.max(1, pagination.totalPages || 1)} - Total ${pagination.total}`}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {locale === "ar" ? "السابق" : "Previous"}
                </Button>
                {visiblePageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="sm"
                    variant={pageNumber === pagination.page ? "default" : "outline"}
                    disabled={isLoading}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    isLoading ||
                    pagination.totalPages === 0 ||
                    pagination.page >= pagination.totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      pagination.totalPages === 0
                        ? current
                        : Math.min(pagination.totalPages, current + 1),
                    )
                  }
                >
                  {locale === "ar" ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{locale === "ar" ? "تفاصيل المريض" : "Patient Details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedPatient && (
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "اختر مريضاً لعرض التفاصيل" : "Select a patient to view details"}
              </p>
            )}

            {selectedPatient && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "الاسم" : "Name"}</p>
                  <p className="font-medium">{selectedPatient.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "الهاتف" : "Phone"}</p>
                  <p className="text-sm">{selectedPatient.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "البريد" : "Email"}</p>
                  <p className="text-sm">{selectedPatient.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "VIP" : "VIP"}</p>
                  <Badge variant="outline">{renderVipLabel(selectedPatient.vipTier, locale)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "حالة البوابة" : "Portal Status"}</p>
                  <Badge variant={renderPortalStatus(selectedPatient, locale).variant}>
                    {renderPortalStatus(selectedPatient, locale).text}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "ملاحظات" : "Notes"}</p>
                  <p className="text-sm">{selectedPatient.notes || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "خصم خاص (%)" : "Special Discount (%)"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-24 h-8"
                      value={discountInput[selectedPatient.id] ?? selectedPatient.specialDiscount ?? 0}
                      onChange={(e) => setDiscountInput(prev => ({ ...prev, [selectedPatient.id]: Number(e.target.value) }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={isUpdatingDiscount === selectedPatient.id || (discountInput[selectedPatient.id] === undefined && selectedPatient.specialDiscount === undefined)}
                      onClick={() => handleUpdateDiscount(selectedPatient.id, discountInput[selectedPatient.id] ?? selectedPatient.specialDiscount ?? 0)}
                    >
                      {isUpdatingDiscount === selectedPatient.id ? "..." : (locale === "ar" ? "تحديث" : "Update")}
                    </Button>
                  </div>
                </div>

                {mode === "reception" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        {locale === "ar" ? "طبيب مفضل (اختياري)" : "Preferred Doctor (Optional)"}
                      </label>
                      <select
                        value={preferredDoctorId}
                        onChange={(event) => setPreferredDoctorId(event.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                      >
                        <option value="">
                          {locale === "ar" ? "بدون طبيب محدد" : "No preselected doctor"}
                        </option>
                        {activeDoctors.map((doctor: ApiDoctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Link href={bookingHref} className="block pt-2">
                      <Button variant="outline" className="w-full">
                        {locale === "ar" ? "فتح الحجز" : "Open Booking"}
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
