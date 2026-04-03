"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Star, Clock, MoreVertical, Edit3, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useStaffStore, type StaffMember } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";

const emptyForm = {
  name: "", nameAr: "", email: "", phone: "",
  specialty: "", specialtyAr: "", experience: "",
  status: "active" as StaffMember["status"],
};

export default function DoctorsPage() {
  const { t, locale } = useTranslation();
  const { staff, addStaff, updateStaff, deleteStaff, changeRole } = useStaffStore();
  const toast = useToastStore();
  const doctors = staff.filter((s) => s.role === "DOCTOR");

  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.specialty || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast.error(locale === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields");
      return;
    }
    if (editId) {
      updateStaff(editId, {
        name: form.name,
        nameAr: form.nameAr || form.name,
        email: form.email,
        phone: form.phone,
        specialty: form.specialty,
        specialtyAr: form.specialtyAr,
        experience: form.experience ? parseInt(form.experience) : undefined,
        status: form.status,
      });
      toast.success(locale === "ar" ? "تم تحديث الطبيب" : "Doctor updated");
    } else {
      addStaff({
        name: form.name,
        nameAr: form.nameAr || form.name,
        email: form.email,
        phone: form.phone,
        role: "DOCTOR",
        specialty: form.specialty,
        specialtyAr: form.specialtyAr,
        experience: form.experience ? parseInt(form.experience) : undefined,
        status: form.status,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${form.email}`,
      });
      toast.success(locale === "ar" ? "تم إضافة الطبيب" : "Doctor added");
    }
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(false);
  };

  const openEdit = (doc: StaffMember) => {
    setForm({
      name: doc.name,
      nameAr: doc.nameAr,
      email: doc.email,
      phone: doc.phone,
      specialty: doc.specialty || "",
      specialtyAr: doc.specialtyAr || "",
      experience: doc.experience?.toString() || "",
      status: doc.status,
    });
    setEditId(doc.id);
    setDialogOpen(true);
    setMenuOpen(null);
  };

  const handleDelete = (id: string) => {
    deleteStaff(id);
    setMenuOpen(null);
    toast.success(locale === "ar" ? "تم حذف الطبيب" : "Doctor removed");
  };

  const handleSwitchToReception = (id: string) => {
    changeRole(id, "RECEPTION");
    setMenuOpen(null);
    toast.info(locale === "ar" ? "تم تغيير الدور إلى استقبال" : "Role changed to Reception");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("manageDoctors")}
        description={locale === "ar" ? "إدارة فريق الأطباء" : "Manage your medical team"}
        action={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> {locale === "ar" ? "إضافة طبيب" : "Add Doctor"}</Button>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("fullName")} (EN)</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. ..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("fullName")} (AR)</label>
                    <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="د. ..." dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("specialty")} (EN)</label>
                    <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="e.g. Cardiology" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("specialty")} (AR)</label>
                    <Input value={form.specialtyAr} onChange={(e) => setForm({ ...form, specialtyAr: e.target.value })} placeholder="مثال: أمراض القلب" dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@clinic.com" type="email" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("phone")}</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("experience")}</label>
                    <Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="10" type="number" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("status")}</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as StaffMember["status"] })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="active">{locale === "ar" ? "نشط" : "Active"}</option>
                    <option value="on-leave">{locale === "ar" ? "إجازة" : "On Leave"}</option>
                    <option value="inactive">{locale === "ar" ? "غير نشط" : "Inactive"}</option>
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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t("noResults")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <img
                      src={doc.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.email}`}
                      alt={doc.name}
                      className="h-14 w-14 rounded-xl"
                    />
                    <div>
                      <h3 className="font-semibold">{locale === "ar" ? doc.nameAr : doc.name}</h3>
                      <p className="text-sm text-primary">{locale === "ar" ? doc.specialtyAr : doc.specialty}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpen === doc.id && (
                      <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 w-44 rounded-lg border bg-popover p-1 shadow-lg z-10">
                        <button onClick={() => openEdit(doc)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted">
                          <Edit3 className="h-3.5 w-3.5" /> {t("edit")}
                        </button>
                        <button onClick={() => handleSwitchToReception(doc.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted text-primary">
                          <UserCog className="h-3.5 w-3.5" /> {locale === "ar" ? "تحويل لاستقبال" : "Switch to Reception"}
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{doc.rating ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{doc.experience ?? 0} {t("yearsExp")}</span>
                  </div>
                  <Badge variant={doc.status === "active" ? "success" : doc.status === "on-leave" ? "warning" : "secondary"} className="text-xs">
                    {doc.status === "active" ? t("available") : doc.status === "on-leave" ? (locale === "ar" ? "إجازة" : "On Leave") : t("unavailable")}
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
