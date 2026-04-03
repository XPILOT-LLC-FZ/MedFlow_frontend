"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Mail, Phone, Shield, Edit3, Trash2, MoreVertical, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useStaffStore, type StaffMember } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";

const emptyForm = {
  name: "", nameAr: "", email: "", phone: "", shift: "Morning",
  status: "active" as StaffMember["status"],
};

export default function ReceptionManagementPage() {
  const { t, locale } = useTranslation();
  const { staff, addStaff, updateStaff, deleteStaff, changeRole } = useStaffStore();
  const toast = useToastStore();
  const receptionStaff = staff.filter((s) => s.role === "RECEPTION");

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editId) {
      updateStaff(editId, {
        name: form.name,
        nameAr: form.nameAr || form.name,
        email: form.email,
        phone: form.phone,
        shift: form.shift,
        status: form.status,
      });
    } else {
      addStaff({
        name: form.name,
        nameAr: form.nameAr || form.name,
        email: form.email,
        phone: form.phone,
        role: "RECEPTION",
        status: form.status,
        shift: form.shift,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${form.email}`,
      });
    }
    toast.success(editId
      ? locale === "ar" ? "تم تحديث الموظف" : "Staff updated"
      : locale === "ar" ? "تم إضافة الموظف" : "Staff added"
    );
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(false);
  };

  const openEdit = (s: StaffMember) => {
    setForm({
      name: s.name,
      nameAr: s.nameAr,
      email: s.email,
      phone: s.phone,
      shift: s.shift || "Morning",
      status: s.status,
    });
    setEditId(s.id);
    setDialogOpen(true);
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("manageReception")}
        description={locale === "ar" ? "إدارة موظفي الاستقبال" : "Manage reception staff"}
        action={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> {locale === "ar" ? "إضافة موظف" : "Add Staff"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editId
                    ? locale === "ar" ? "تعديل الموظف" : "Edit Staff"
                    : locale === "ar" ? "إضافة موظف استقبال" : "Add Reception Staff"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("fullName")} (EN)</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("fullName")} (AR)</label>
                    <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="الاسم الكامل" dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@clinic.com" type="email" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("phone")}</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{locale === "ar" ? "الوردية" : "Shift"}</label>
                    <select
                      value={form.shift}
                      onChange={(e) => setForm({ ...form, shift: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      <option value="Morning">{locale === "ar" ? "صباحية" : "Morning"}</option>
                      <option value="Evening">{locale === "ar" ? "مسائية" : "Evening"}</option>
                      <option value="Night">{locale === "ar" ? "ليلية" : "Night"}</option>
                    </select>
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

      {receptionStaff.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">{t("noResults")}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {receptionStaff.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${s.email}`}
                      alt={s.name}
                      className="h-12 w-12 rounded-xl"
                    />
                    <div>
                      <h3 className="font-semibold">{locale === "ar" ? s.nameAr : s.name}</h3>
                      <Badge
                        variant={s.status === "active" ? "success" : s.status === "on-leave" ? "warning" : "secondary"}
                        className="text-xs mt-1"
                      >
                        {s.status === "active"
                          ? locale === "ar" ? "نشط" : "Active"
                          : s.status === "on-leave"
                          ? locale === "ar" ? "إجازة" : "On Leave"
                          : locale === "ar" ? "غير نشط" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpen === s.id && (
                      <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 w-44 rounded-lg border bg-popover p-1 shadow-lg z-10">
                        <button onClick={() => openEdit(s)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted">
                          <Edit3 className="h-3.5 w-3.5" /> {t("edit")}
                        </button>
                        <button onClick={() => { changeRole(s.id, "DOCTOR"); setMenuOpen(null); toast.info(locale === "ar" ? "تم تغيير الدور إلى طبيب" : "Role changed to Doctor"); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted text-primary">
                          <UserCog className="h-3.5 w-3.5" /> {locale === "ar" ? "تحويل لطبيب" : "Switch to Doctor"}
                        </button>
                        <button onClick={() => { deleteStaff(s.id); setMenuOpen(null); toast.success(locale === "ar" ? "تم حذف الموظف" : "Staff removed"); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {s.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone}</div>
                  <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> {locale === "ar" ? "وردية" : "Shift"}: {s.shift || "—"}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
