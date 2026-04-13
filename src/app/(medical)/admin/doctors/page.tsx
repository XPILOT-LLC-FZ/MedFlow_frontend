"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Plus, Star, Clock, MoreVertical, Edit3, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { clinicService } from "@/services/clinicService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { staffService } from "@/services/staffService";
import type {
  ApiBranch,
  ApiDoctor,
  ApiService,
  CreateDoctorPayload,
  DoctorListFilters,
  UpdateDoctorPayload,
} from "@/types";

const emptyForm = {
  fullName: "", email: "", phone: "",
  specialization: "", bio: "", ministryOfHealthId: "", experienceStartDate: "",
  consultationFee: "",
  clinicId: "",
  branchId: "",
  services: [] as string[],
  status: "ACTIVE" as ApiDoctor["status"],
  password: "",
  confirmPassword: "",
};

export default function DoctorsPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const { doctors, fetchDoctors, addDoctor, updateDoctor } = useStaffStore();
  const { success, error } = useToastStore();
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [clinics, setClinics] = useState<Array<{ id: string; name: string }>>([]);
  const [availableServices, setAvailableServices] = useState<ApiService[]>([]);

  async function loadReferences() {
    try {
      const [branchData, serviceData] = await Promise.all([
        clinicService.getBranches().catch(() => [] as ApiBranch[]),
        servicesCatalogService.getAll({ isActive: "true" }).catch(() => [] as ApiService[]),
      ]);

      const clinicData = await clinicService
        .getPublicClinics()
        .catch(() => [] as Array<{ id: string; name: string }>);

      setBranches(branchData);
      setAvailableServices(serviceData);
      setClinics(clinicData.map((clinic) => ({ id: clinic.id, name: clinic.name })));
    } catch {
      // Non-blocking metadata for form selectors.
    }
  }

  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApiDoctor["status"]>("ALL");
  const [specializationFilter, setSpecializationFilter] = useState("ALL");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetDoctorId, setResetDoctorId] = useState<string | null>(null);
  const [resetDoctorName, setResetDoctorName] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const buildDoctorFilters = useCallback(
    (): DoctorListFilters => ({
      search: searchTerm.trim() || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      specialization: specializationFilter === "ALL" ? undefined : specializationFilter,
    }),
    [searchTerm, statusFilter, specializationFilter],
  );

  useEffect(() => {
    void fetchDoctors(buildDoctorFilters());
  }, [fetchDoctors, buildDoctorFilters]);

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const openCreate = () => {
    setEditId(null);
    setForm({
      ...emptyForm,
      clinicId: isSuperAdmin ? "" : (user?.clinicId ?? ""),
    });
    setDialogOpen(true);
    void loadReferences();
  };

  const openResetPassword = (doc: ApiDoctor) => {
    setResetDoctorId(doc.id);
    setResetDoctorName(doc.fullName);
    setResetPassword("");
    setResetConfirmPassword("");
    setResetDialogOpen(true);
    setMenuOpen(null);
  };

  const specializationOptions = Array.from(
    new Set(
      doctors
        .map((doctor) => (doctor.specialization || "").trim())
        .filter((value) => value.length > 0),
    ),
  );

  const filtered = doctors;

  const handleSave = async () => {
    if (!form.fullName || !form.email) {
      error(locale === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields");
      return;
    }

    if (!editId) {
      if (!form.password || form.password.length < 8) {
        error(
          locale === "ar"
            ? "كلمة المرور المؤقتة يجب أن تكون 8 أحرف على الأقل"
            : "Temporary password must be at least 8 characters",
        );
        return;
      }

      if (form.password !== form.confirmPassword) {
        error(
          locale === "ar"
            ? "تأكيد كلمة المرور غير متطابق"
            : "Password confirmation does not match",
        );
        return;
      }
    }

    const effectiveClinicId =
      user?.role === "SUPER_ADMIN" ? form.clinicId : (user?.clinicId ?? "");

    if (!effectiveClinicId) {
      error(
        locale === "ar"
          ? "يرجى تحديد العيادة للطبيب"
          : "Doctor clinic assignment is required",
      );
      return;
    }

    const normalized = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || undefined,
      specialization: form.specialization.trim() || undefined,
      bio: form.bio.trim() || undefined,
      clinicId: effectiveClinicId,
      ministryOfHealthId: form.ministryOfHealthId.trim() || null,
      experienceStartDate: form.experienceStartDate || null,
      consultationFee: parseFloat(form.consultationFee) || 0,
      branchId: form.branchId || undefined,
      services: form.services,
      status: form.status,
    };

    try {
      if (editId) {
        const updatePayload: UpdateDoctorPayload = normalized;
        await updateDoctor(editId, updatePayload);
        success(locale === "ar" ? "تم تحديث الطبيب" : "Doctor updated");
      } else {
        const createPayload: CreateDoctorPayload = {
          ...normalized,
          email: form.email.trim(),
          password: form.password,
        };
        await addDoctor(createPayload);
        success(locale === "ar" ? "تم إضافة الطبيب" : "Doctor added");
      }
      setForm(emptyForm);
      setEditId(null);
      setDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save doctor";
      error(message);
    }
  };

  const handleResetPassword = async () => {
    if (!resetDoctorId) {
      error(locale === "ar" ? "تعذر تحديد الطبيب" : "Doctor context missing");
      return;
    }

    if (!resetPassword || resetPassword.length < 8) {
      error(
        locale === "ar"
          ? "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"
          : "New password must be at least 8 characters",
      );
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      error(
        locale === "ar"
          ? "تأكيد كلمة المرور غير متطابق"
          : "Password confirmation does not match",
      );
      return;
    }

    setIsResettingPassword(true);
    try {
      await staffService.resetDoctorPassword(resetDoctorId, { password: resetPassword });
      success(
        locale === "ar"
          ? "تم إعادة تعيين كلمة المرور بنجاح"
          : "Doctor password reset successfully",
      );
      setResetDialogOpen(false);
      setResetDoctorId(null);
      setResetDoctorName("");
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset doctor password";
      error(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const openEdit = (doc: ApiDoctor) => {
    setForm({
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone || "",
      specialization: doc.specialization || "",
      bio: doc.bio || "",
      clinicId:
        doc.clinicId ??
        doc.user?.clinicId ??
        (isSuperAdmin ? "" : (user?.clinicId ?? "")),
      ministryOfHealthId: doc.ministryOfHealthId || "",
      experienceStartDate: doc.experienceStartDate ? doc.experienceStartDate.split("T")[0] : "",
      consultationFee: doc.consultationFee.toString(),
      branchId: doc.branchId || "",
      services: Array.isArray(doc.services) ? doc.services : [],
      status: doc.status,
      password: "",
      confirmPassword: "",
    });
    setEditId(doc.id);
    setDialogOpen(true);
    setMenuOpen(null);
    void loadReferences();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("manageDoctors")}
        description={locale === "ar" ? "إدارة فريق الأطباء" : "Manage your medical team"}
        action={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> {locale === "ar" ? "إضافة طبيب" : "Add Doctor"}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editId
                    ? locale === "ar" ? "تعديل الطبيب" : "Edit Doctor"
                    : locale === "ar" ? "إضافة طبيب جديد" : "Add New Doctor"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("fullName")}</label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Dr. ..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="doctor@clinic.com"
                    type="email"
                    disabled={Boolean(editId)}
                  />
                </div>
                {!editId && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {locale === "ar" ? "كلمة المرور المؤقتة" : "Temporary Password"}
                      </label>
                      <Input
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Doctor@2026"
                        type="password"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                      </label>
                      <Input
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        placeholder="Doctor@2026"
                        type="password"
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("specialty")}</label>
                    <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Cardiology" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {locale === "ar" ? "تاريخ بداية الخبرة" : "Experience Start Date"}
                    </label>
                    <Input
                      value={form.experienceStartDate}
                      onChange={(e) => setForm({ ...form, experienceStartDate: e.target.value })}
                      type="date"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {locale === "ar" ? "رقم وزارة الصحة" : "Ministry of Health ID"}
                  </label>
                  <Input
                    value={form.ministryOfHealthId}
                    onChange={(e) => setForm({ ...form, ministryOfHealthId: e.target.value })}
                    placeholder="MOH-2026-009871"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background min-h-20"
                    placeholder="Short doctor biography"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("phone")}</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Consultation Fee</label>
                    <Input value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} placeholder="50" type="number" />
                  </div>
                </div>
                <div className="rounded-lg border p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {locale === "ar" ? "تعيين العيادة والفرع" : "Clinic & Branch Assignment"}
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {locale === "ar" ? "العيادة" : "Clinic"}
                      </label>
                      {isSuperAdmin ? (
                        <select
                          value={form.clinicId}
                          onChange={(e) =>
                            setForm({ ...form, clinicId: e.target.value, branchId: "" })
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                        >
                          <option value="">{locale === "ar" ? "اختر العيادة" : "Select clinic"}</option>
                          {clinics.map((clinic) => (
                            <option key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          value={
                            clinics.find((clinic) => clinic.id === user?.clinicId)?.name ||
                            (locale === "ar" ? "عيادة المشرف الحالية" : "Current admin clinic")
                          }
                          disabled
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Branch</label>
                      <select
                        value={form.branchId}
                        onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                        disabled={isSuperAdmin}
                      >
                        <option value="">{locale === "ar" ? "بدون فرع" : "No branch"}</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <p className="text-xs text-muted-foreground">
                      {locale === "ar"
                        ? "يمكنك تحديد العيادة للطبيب هنا. الفرع يبقى اختيارياً ويمكن تعيينه من مدير العيادة لاحقاً."
                        : "You can assign the doctor clinic here. Branch remains optional and can be set later by the clinic admin."}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Services</label>
                  <div className="max-h-36 overflow-y-auto rounded-lg border p-2 space-y-2">
                    {availableServices.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-1 py-2">No services available yet</p>
                    ) : (
                      availableServices.map((service) => (
                        <label key={service.id} className="flex items-center gap-2 text-sm px-1 py-1">
                          <input
                            type="checkbox"
                            checked={form.services.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                          />
                          <span>{service.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("status")}</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ApiDoctor["status"] })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="ACTIVE">{locale === "ar" ? "نشط" : "Active"}</option>
                    <option value="ON_LEAVE">{locale === "ar" ? "إجازة" : "On Leave"}</option>
                    <option value="INACTIVE">{locale === "ar" ? "غير نشط" : "Inactive"}</option>
                  </select>
                </div>
                <Button className="w-full" onClick={handleSave}>{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl">
        <div className="md:col-span-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={locale === "ar" ? "ابحث عن طبيب..." : "Search doctors..."}
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchTerm(searchDraft.trim());
                }
              }}
              className="pl-10 rtl:pl-3 rtl:pr-10"
            />
          </div>
          <Button variant="outline" onClick={() => setSearchTerm(searchDraft.trim())}>
            {locale === "ar" ? "بحث" : "Search"}
          </Button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ALL" | ApiDoctor["status"])}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value="ALL">{locale === "ar" ? "كل الحالات" : "All Statuses"}</option>
          <option value="ACTIVE">{locale === "ar" ? "نشط" : "Active"}</option>
          <option value="ON_LEAVE">{locale === "ar" ? "إجازة" : "On Leave"}</option>
          <option value="INACTIVE">{locale === "ar" ? "غير نشط" : "Inactive"}</option>
        </select>
        <select
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value="ALL">{locale === "ar" ? "كل التخصصات" : "All Specializations"}</option>
          {specializationOptions.map((specialization) => (
            <option key={specialization} value={specialization}>
              {specialization}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Image
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.email}`}
                      alt={doc.fullName}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-xl"
                      unoptimized
                    />
                    <div>
                      <h3 className="font-semibold">{doc.fullName}</h3>
                      <p className="text-sm text-primary">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpen === doc.id && (
                      <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 w-44 rounded-lg border bg-popover p-1 shadow-lg z-10">
                        <button onClick={() => void openEdit(doc)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted">
                          <Edit3 className="h-3.5 w-3.5" /> {t("edit")}
                        </button>
                        <button
                          onClick={() => openResetPassword(doc)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{doc.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{doc.experienceYears} {t("yearsExp")}</span>
                  </div>
                  <Badge variant={doc.status === "ACTIVE" ? "success" : doc.status === "ON_LEAVE" ? "warning" : "secondary"} className="text-xs">
                    {doc.status === "ACTIVE" ? t("available") : doc.status === "ON_LEAVE" ? (locale === "ar" ? "إجازة" : "On Leave") : t("unavailable")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          setResetDialogOpen(open);
          if (!open) {
            setResetDoctorId(null);
            setResetDoctorName("");
            setResetPassword("");
            setResetConfirmPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "إعادة تعيين كلمة مرور الطبيب" : "Reset Doctor Password"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? `سيتم تعيين كلمة مرور جديدة للطبيب: ${resetDoctorName || "-"}`
                : `Set a new temporary password for: ${resetDoctorName || "-"}`}
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <Input
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Doctor@2026"
                type="password"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <Input
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="Doctor@2026"
                type="password"
              />
            </div>

            <Button
              className="w-full"
              onClick={() => void handleResetPassword()}
              disabled={isResettingPassword}
            >
              {isResettingPassword
                ? locale === "ar"
                  ? "جارٍ إعادة التعيين..."
                  : "Resetting..."
                : locale === "ar"
                  ? "تأكيد إعادة التعيين"
                  : "Confirm Reset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
