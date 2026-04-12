"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Plus, Search, UserCheck, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { usersService } from "@/services/usersService";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiUser } from "@/types";

type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: ApiUser["role"];
  isActive: boolean;
  createdAt: string;
};

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  isActive: true,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mapToStaffUser = (input: ApiUser): StaffUser => ({
  id: input.id,
  fullName: input.name || "Unknown Staff",
  email: input.email || "",
  role: input.role,
  isActive: input.isActive !== false,
  createdAt: input.createdAt,
});

export default function ReceptionManagementPage() {
  const { locale } = useTranslation();
  const toast = useToastStore();

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const users = await usersService.getAll({ role: "STAFF", limit: 100 });
      setStaff(users.filter((user) => user.role === "STAFF").map(mapToStaffUser));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل تحميل موظفي الاستقبال"
            : "Failed to load reception staff";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [locale, toast]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return staff;

    return staff.filter((member) => {
      return (
        member.fullName?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
      );
    });
  }, [search, staff]);

  const activeCount = useMemo(
    () => staff.filter((member) => member.isActive).length,
    [staff],
  );

  const openCreateDialog = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (member: StaffUser) => {
    setEditTarget(member);
    setForm({
      fullName: member.fullName,
      email: member.email,
      password: "",
      confirmPassword: "",
      isActive: member.isActive,
    });
    setDialogOpen(true);
  };

  const validateForm = () => {
    if (form.fullName.trim().length < 2) {
      toast.error(
        locale === "ar"
          ? "الاسم يجب أن يكون حرفين على الأقل"
          : "Full name must be at least 2 characters",
      );
      return false;
    }

    if (!editTarget) {
      if (!emailRegex.test(form.email.trim())) {
        toast.error(locale === "ar" ? "البريد الإلكتروني غير صالح" : "Invalid email address");
        return false;
      }

      if (form.password.length < 8) {
        toast.error(
          locale === "ar"
            ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
            : "Password must be at least 8 characters",
        );
        return false;
      }

      if (form.password !== form.confirmPassword) {
        toast.error(
          locale === "ar"
            ? "تأكيد كلمة المرور غير متطابق"
            : "Password confirmation does not match",
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editTarget) {
        await usersService.update(editTarget.id, {
          name: form.fullName.trim(),
          isActive: form.isActive,
        });

        toast.success(
          locale === "ar" ? "تم تحديث بيانات الموظف" : "Staff member updated",
        );
      } else {
        await usersService.create({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: "STAFF",
        });

        toast.success(locale === "ar" ? "تم إضافة الموظف" : "Staff member created");
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditTarget(null);
      await loadStaff();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل حفظ بيانات الموظف"
            : "Failed to save staff member";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (member: StaffUser) => {
    const isDeactivating = member.isActive;
    const confirmMessage = isDeactivating
      ? locale === "ar"
        ? `هل تريد تعطيل حساب ${member.fullName}؟`
        : `Deactivate ${member.fullName}?`
      : locale === "ar"
        ? `هل تريد إعادة تفعيل حساب ${member.fullName}؟`
        : `Reactivate ${member.fullName}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      if (isDeactivating) {
        await usersService.remove(member.id);
      } else {
        await usersService.update(member.id, { isActive: true });
      }

      toast.success(
        isDeactivating
          ? locale === "ar"
            ? "تم تعطيل الحساب"
            : "Account deactivated"
          : locale === "ar"
            ? "تمت إعادة التفعيل"
            : "Account reactivated",
      );

      await loadStaff();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل تحديث الحالة"
            : "Failed to update account status";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "إدارة موظفي الاستقبال" : "Reception Staff Management"}
        description={
          locale === "ar"
            ? "إنشاء وتحديث وتعطيل حسابات موظفي الاستقبال"
            : "Create, update, and deactivate reception staff accounts"
        }
        action={
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditTarget(null);
                setForm(emptyForm);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                {locale === "ar" ? "إضافة موظف" : "Add Staff"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editTarget
                    ? locale === "ar"
                      ? "تعديل موظف استقبال"
                      : "Edit Reception Staff"
                    : locale === "ar"
                      ? "إضافة موظف استقبال"
                      : "Add Reception Staff"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {locale === "ar" ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    placeholder={locale === "ar" ? "محمد أحمد" : "Mona Hassan"}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="staff@clinic.com"
                    disabled={Boolean(editTarget)}
                  />
                </div>

                {!editTarget && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {locale === "ar" ? "كلمة المرور المؤقتة" : "Temporary Password"}
                      </label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        placeholder="Staff@2026"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                      </label>
                      <Input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                        }
                        placeholder="Staff@2026"
                      />
                    </div>
                  </>
                )}

                {editTarget && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {locale === "ar" ? "حالة الحساب" : "Account Status"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar"
                          ? "يمكنك تعطيل أو إعادة تفعيل الحساب"
                          : "You can deactivate or reactivate this account"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={form.isActive ? "outline" : "default"}
                      onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                    >
                      {form.isActive
                        ? locale === "ar"
                          ? "نشط"
                          : "Active"
                        : locale === "ar"
                          ? "غير نشط"
                          : "Inactive"}
                    </Button>
                  </div>
                )}

                <Button className="w-full" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving
                    ? locale === "ar"
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : locale === "ar"
                      ? "حفظ"
                      : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "إجمالي موظفي الاستقبال" : "Total Reception Staff"}
              </p>
              <p className="text-2xl font-semibold">{staff.length}</p>
            </div>
            <Users className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{locale === "ar" ? "نشط" : "Active"}</p>
              <p className="text-2xl font-semibold">{activeCount}</p>
            </div>
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "غير نشط" : "Inactive"}
              </p>
              <p className="text-2xl font-semibold">{staff.length - activeCount}</p>
            </div>
            <UserX className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "ar" ? "قائمة الموظفين" : "Staff Directory"}
          </CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={locale === "ar" ? "ابحث بالاسم أو البريد" : "Search by name or email"}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "جارٍ التحميل..." : "Loading staff..."}</p>
          ) : filteredStaff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "لا يوجد موظفون مطابقون" : "No matching staff members found"}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{member.fullName}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant={member.isActive ? "success" : "secondary"}>
                          {member.isActive
                            ? locale === "ar"
                              ? "نشط"
                              : "Active"
                            : locale === "ar"
                              ? "غير نشط"
                              : "Inactive"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => openEditDialog(member)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {locale === "ar" ? "تعديل" : "Edit"}
                        </Button>

                        <Button
                          size="sm"
                          variant={member.isActive ? "destructive" : "default"}
                          onClick={() => void handleToggleStatus(member)}
                        >
                          {member.isActive
                            ? locale === "ar"
                              ? "تعطيل"
                              : "Deactivate"
                            : locale === "ar"
                              ? "إعادة تفعيل"
                              : "Reactivate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
