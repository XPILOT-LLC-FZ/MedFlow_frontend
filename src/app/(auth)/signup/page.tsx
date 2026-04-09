"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, User, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

interface FormData {
  fullName: string;
  role: "PATIENT" | "ADMIN";
  email: string;
  password: string;
}

const emptyForm: FormData = {
  fullName: "",
  role: "PATIENT",
  email: "",
  password: "",
};

export default function SignupPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { signup, isAuthenticated } = useAuthStore();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(useAuthStore.getState().getDashboardPath());
    }
  }, [isAuthenticated, router]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateForm = (): boolean => {
    if (!form.fullName.trim()) {
      setError(t("nameRequired"));
      return false;
    }

    if (!form.email.trim()) {
      setError(t("emailRequired"));
      return false;
    }

    if (!form.password || form.password.length < 8) {
      setError(locale === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    const result = await signup({
      name: form.fullName,
      email: form.email,
      password: form.password,
      role: form.role,
    });

    if (result.success) {
      setSuccess(true);
      router.push("/onboarding");
    } else {
      setError(result.error || "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.28),transparent_30%),linear-gradient(135deg,#0f172a_0%,#075985_52%,#0ea5e9_100%)] p-12">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.3))]" />
        <div className="relative text-white max-w-md space-y-6">
          <BrandLogo
            iconClassName="h-14 w-14 rounded-[1.25rem]"
            textClassName="text-3xl"
            captionClassName="text-[11px] tracking-[0.34em]"
            showCaption
            theme="dark"
          />
          <h1 className="text-4xl font-bold">{t("createAccount")}</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            {locale === "ar"
              ? "أنشئ حسابك بسرعة باستخدام الاسم الكامل والبريد الإلكتروني وكلمة المرور ونوع الحساب."
              : "Create your account quickly with full name, email, password, and account role."}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link href="/main" className="inline-flex items-center mb-4 lg:hidden">
              <BrandLogo iconClassName="h-10 w-10 rounded-xl" textClassName="text-xl" />
            </Link>
            <h2 className="text-2xl font-bold">{t("createAccount")}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {locale === "ar" ? "نموذج تسجيل سريع" : "Simple signup form"}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Success */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-success/10 text-success text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{t("signupSuccess")}</span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("fullName")}</label>
                  <div className="relative">
                    <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="John Smith"
                      className="pl-10 rtl:pl-3 rtl:pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 rtl:pl-3 rtl:pr-10"
                      type="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 rtl:pl-3 rtl:pr-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{locale === "ar" ? "نوع الحساب" : "Account Type"}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={form.role === "PATIENT" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => update("role", "PATIENT")}
                    >
                      {locale === "ar" ? "مريض" : "Patient"}
                    </Button>
                    <Button
                      type="button"
                      variant={form.role === "ADMIN" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => update("role", "ADMIN")}
                    >
                      {locale === "ar" ? "إدارة عيادة" : "Clinic Admin"}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center pt-1">
                  {locale === "ar"
                    ? "بإنشاء حساب، فأنت توافق على شروط الخدمة وسياسة الخصوصية."
                    : "By creating an account, you agree to our Terms of Service and Privacy Policy."}
                </p>
              </motion.div>

              <div className="mt-6">
                <Button
                  className="w-full gap-2"
                  onClick={handleSubmit}
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {t("signingUp")}
                    </>
                  ) : (
                    <>
                      {t("createAccount")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {t("hasAccount")}{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  {t("login")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
