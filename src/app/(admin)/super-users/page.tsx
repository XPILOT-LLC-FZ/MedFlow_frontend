"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { usersService } from "@/services/usersService";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiUser, Role } from "@/types";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  phone?: string;
  lastLogin?: string;
};

const roleBadgeVariant: Record<Role, "default" | "info" | "success" | "warning" | "secondary"> = {
  PATIENT: "info",
  DOCTOR: "success",
  STAFF: "warning",
  ADMIN: "secondary",
  SUPER_ADMIN: "default",
};

export default function UsersPage() {
  const { t, locale } = useTranslation();
  const toast = useToastStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "PATIENT" as Role,
  });

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const loadUsers = async () => {
    // ... logic remains same, we will preserve it
    setIsLoading(true);
    try {
      const data = await usersService.getAll();
      const mapped = (data || []).map((user: ApiUser): SystemUser => ({
        id: user.id ?? "",
        name: user.name || "Unknown User",
        email: user.email || "",
        role: user.role || "PATIENT",
        status: user.isActive === false ? "inactive" : "active",
        phone: user.phone,
        lastLogin: user.createdAt,
      }));
      setUsers(mapped);
    } catch (err) {
      console.error("Failed to load users", err);
      toast.error(extractErrorMessage(err, "Failed to load users"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEdit = (user: SystemUser) => {
    setEditId(user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "", // do not populate password on edit
      role: user.role,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ name: "", email: "", phone: "", password: "", role: "PATIENT" });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (!editId && !form.password) {
      toast.error(locale === "ar" ? "كلمة المرور مطلوبة" : "Password is required");
      return;
    }

    setIsSaving(true);
    try {
      if (editId) {
        await usersService.update(editId, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role,
        });
        toast.success(locale === "ar" ? "تم تحديث المستخدم" : "User updated");
      } else {
        await usersService.create({
          fullName: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          role: form.role,
        });
        toast.success(locale === "ar" ? "تم إضافة المستخدم" : "User added successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      await loadUsers();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, locale === "ar" ? "فشل حفظ المستخدم" : "Failed to save user")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: SystemUser) => {
    const confirmed = window.confirm(
      locale === "ar"
        ? `هل أنت متأكد من حذف ${user.name || "هذا المستخدم"}؟`
        : `Are you sure you want to delete ${user.name || "this user"}?`
    );

    if (!confirmed) return;

    setIsDeleting(user.id);
    try {
      await usersService.remove(user.id);

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success(locale === "ar" ? "تم حذف المستخدم" : "User deleted");
    } catch (error) {
      toast.error(
        extractErrorMessage(error, locale === "ar" ? "فشل حذف المستخدم" : "Failed to delete user")
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const safeName = (u.name || "").toLowerCase();
    const safeEmail = (u.email || "").toLowerCase();
    const matchSearch = safeName.includes(q) || safeEmail.includes(q);
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("manageUsers")}
        description={locale === "ar" ? "إدارة جميع مستخدمي النظام" : "Manage all system users"}
        action={
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" /> {locale === "ar" ? "إضافة مستخدم" : "Add User"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? (locale === "ar" ? "تعديل المستخدم" : "Edit User") : (locale === "ar" ? "إضافة مستخدم جديد" : "Add New User")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={t("fullName")}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder={t("email")}
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                {!editId && (
                  <Input
                    type="password"
                    placeholder={locale === "ar" ? "كلمة المرور (٨ أحرف كحد أدنى)" : "Password (min 8 chars)"}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                )}
                <Input
                  placeholder={t("phone")}
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="PATIENT">PATIENT</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
                <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (locale === "ar" ? "جارٍ الحفظ..." : "Saving...") : t("save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={locale === "ar" ? "ابحث عن مستخدم..." : "Search users..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "PATIENT", "DOCTOR", "STAFF", "ADMIN", "SUPER_ADMIN"].map((r) => (
            <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r)} className="rounded-full text-xs">
              {r === "All" ? t("all") : r.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fullName")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell>
                </TableRow>
              ) : filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell><Badge variant={roleBadgeVariant[user.role]} className="text-xs">{user.role.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "secondary"} className="text-xs">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(user)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(user)}
                        disabled={isDeleting === user.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("noResults")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
}
