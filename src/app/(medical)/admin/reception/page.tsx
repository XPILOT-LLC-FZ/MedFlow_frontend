"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Mail, Phone, Shield, Edit3, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { userService, type SystemUser } from "@/services/userService";
import { usersService } from "@/services/usersService";
import { useToastStore } from "@/stores/useToastStore";

const emptyForm = {
  name: "", email: "", phone: "",
  role: "STAFF" as const,
};

export default function ReceptionManagementPage() {
  const { t, locale } = useTranslation();
  const { success, error } = useToastStore();
  
  const [staff, setStaff] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const allUsers = await userService.getAll();
      setStaff(allUsers.filter(u => u.role === "STAFF"));
    } catch (err) {
      error("Failed to load staff");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    try {
      if (editId) {
        await usersService.update(editId, form);
        success("Staff updated");
      } else {
        await usersService.create(form);
        success("Staff added");
      }
      loadStaff();
      setForm(emptyForm);
      setEditId(null);
      setDialogOpen(false);
    } catch (err) {
      error("Failed to save staff member");
    }
  };

  const openEdit = (s: SystemUser) => {
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone || "",
      role: "STAFF",
    });
    setEditId(s.id);
    setDialogOpen(true);
    setMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await usersService.remove(id);
      success("Staff member removed");
      loadStaff();
    } catch (err) {
      error("Failed to remove staff");
    }
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("fullName")}</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@clinic.com" type="email" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("phone")}</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0000" />
                </div>
                <Button className="w-full" onClick={handleSave}>{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/50" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("noResults")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${s.email}`}
                        alt={s.name}
                        className="h-12 w-12 rounded-xl"
                      />
                      <div>
                        <h3 className="font-semibold">{s.name}</h3>
                        <Badge variant={s.status === "active" ? "success" : "secondary"} className="text-xs mt-1">
                          {s.status === "active" ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
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
                          <button onClick={() => handleDelete(s.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted text-destructive">
                            <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {s.email}</div>
                    {s.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone}</div>}
                    <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Role: {s.role}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
