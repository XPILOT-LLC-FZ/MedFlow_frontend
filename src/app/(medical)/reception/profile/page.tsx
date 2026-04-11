"use client";

import React, { useEffect, useState } from "react";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";

export default function ReceptionProfilePage() {
  const { locale } = useTranslation();
  const { user, updateProfile, changePassword } = useAuthStore();
  const { success, error } = useToastStore();

  const [fullName, setFullName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setFullName(user?.name ?? "");
  }, [user?.name]);

  const saveProfile = async () => {
    if (fullName.trim().length < 2) {
      error(
        locale === "ar"
          ? "الاسم يجب أن يكون حرفين على الأقل"
          : "Name must be at least 2 characters",
      );
      return;
    }

    setIsSavingProfile(true);
    try {
      const result = await updateProfile({ name: fullName.trim() });
      if (!result.success) {
        error(result.error || (locale === "ar" ? "فشل تحديث الاسم" : "Failed to update name"));
        return;
      }

      success(locale === "ar" ? "تم تحديث البيانات" : "Profile updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword.trim()) {
      error(locale === "ar" ? "أدخل كلمة المرور الحالية" : "Enter current password");
      return;
    }

    if (newPassword.length < 8) {
      error(
        locale === "ar"
          ? "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"
          : "New password must be at least 8 characters",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      error(
        locale === "ar"
          ? "تأكيد كلمة المرور غير متطابق"
          : "Password confirmation does not match",
      );
      return;
    }

    setIsSavingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.success) {
        error(result.error || (locale === "ar" ? "فشل تغيير كلمة المرور" : "Failed to change password"));
        return;
      }

      success(locale === "ar" ? "تم تغيير كلمة المرور" : "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      error(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={locale === "ar" ? "الملف الشخصي" : "Profile"}
        description={
          locale === "ar"
            ? "تحديث الاسم وكلمة المرور"
            : "Update your name and password"
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {locale === "ar" ? "البيانات الأساسية" : "Basic Information"}
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {user?.role ?? "STAFF"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "الاسم الكامل" : "Full Name"}
              </label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="pl-10"
                  placeholder={locale === "ar" ? "منى أحمد" : "Mona Hassan"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{locale === "ar" ? "البريد" : "Email"}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={user?.email ?? ""} className="pl-10" disabled />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void saveProfile()} disabled={isSavingProfile}>
              {isSavingProfile
                ? locale === "ar"
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : locale === "ar"
                  ? "حفظ البيانات"
                  : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {locale === "ar" ? "كلمة المرور الحالية" : "Current Password"}
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="********"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="********"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void savePassword()} disabled={isSavingPassword}>
              {isSavingPassword
                ? locale === "ar"
                  ? "جارٍ التحديث..."
                  : "Updating..."
                : locale === "ar"
                  ? "تحديث كلمة المرور"
                  : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
