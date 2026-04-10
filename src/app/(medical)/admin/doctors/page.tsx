"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Star, Clock, MoreVertical, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { clinicService } from "@/services/clinicService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import type { ApiBranch, ApiDoctor, ApiService, CreateDoctorPayload, UpdateDoctorPayload } from "@/types";

const emptyForm = {
  fullName: "", email: "", phone: "",
  specialization: "", bio: "", experienceYears: "",
  consultationFee: "",
  branchId: "",
  services: [] as string[],
  status: "ACTIVE" as ApiDoctor["status"],
};

export default function DoctorsPage() {
  const { t, locale } = useTranslation();
  const { doctors, fetchDoctors, addDoctor, updateDoctor } = useStaffStore();
  const { success, error } = useToastStore();
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [availableServices, setAvailableServices] = useState<ApiService[]>([]);

  async function loadReferences() {
    try {
      const [branchData, serviceData] = await Promise.all([
        clinicService.getBranches().catch(() => [] as ApiBranch[]),
        servicesCatalogService.getAll({ isActive: "true" }).catch(() => [] as ApiService[]),
      ]);
      setBranches(branchData);
      setAvailableServices(serviceData);
    } catch {
      // Non-blocking metadata for form selectors.
    }
  }

  useEffect(() => {
    void fetchDoctors();
  }, []);

  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setForm(emptyForm);
    setDialogOpen(true);
    void loadReferences();
  };

  const filtered = doctors.filter(
    (d) =>
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (d.specialization || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.fullName || !form.email) {
      error(locale === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields");
      return;
    }

    const normalized = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || undefined,
      specialization: form.specialization.trim() || undefined,
      bio: form.bio.trim() || undefined,
      experienceYears: parseInt(form.experienceYears) || 0,
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
        };
        await addDoctor(createPayload);
        success(locale === "ar" ? "تم إضافة الطبيب" : "Doctor added");
      }
      setForm(emptyForm);
      setEditId(null);
      setDialogOpen(false);
    } catch (err) {
      error("Failed to save doctor");
    }
  };

  const openEdit = (doc: ApiDoctor) => {
    setForm({
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone || "",
      specialization: doc.specialization || "",
      bio: doc.bio || "",
      experienceYears: doc.experienceYears.toString(),
      consultationFee: doc.consultationFee.toString(),
      branchId: doc.branchId || "",
      services: Array.isArray(doc.services) ? doc.services : [],
      status: doc.status,
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
            <DialogContent>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("specialty")}</label>
                    <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Cardiology" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("experience")}</label>
                    <Input value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} placeholder="10" type="number" />
                  </div>
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Branch</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="">{locale === "ar" ? "بدون فرع" : "No branch"}</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={locale === "ar" ? "ابحث عن طبيب..." : "Search doctors..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rtl:pl-3 rtl:pr-10"
        />
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
                    <img
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.email}`}
                      alt={doc.fullName}
                      className="h-14 w-14 rounded-xl"
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
    </div>
  );
}
