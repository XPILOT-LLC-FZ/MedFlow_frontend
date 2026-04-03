"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowRight, ArrowLeft, User, Phone, Mail, Lock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

const steps = [
  { key: "personal", icon: User },
  { key: "contact", icon: Phone },
  { key: "medical", icon: AlertCircle },
  { key: "review", icon: CheckCircle2 },
];

interface FormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  emergencyContact: string;
  medicalHistory: string;
  allergies: string;
}

const emptyForm: FormData = {
  fullName: "", dateOfBirth: "", gender: "",
  email: "", phone: "", address: "", password: "",
  emergencyContact: "", medicalHistory: "", allergies: "",
};

export default function SignupPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { signup, isAuthenticated, getDashboardPath } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const stepLabels = [t("stepPersonal"), t("stepContact"), t("stepMedical"), t("stepReview")];

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(getDashboardPath());
    }
  }, [isAuthenticated, getDashboardPath, router]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = (): boolean => {
    if (currentStep === 0) {
      if (!form.fullName.trim()) {
        setError(t("nameRequired"));
        return false;
      }
    }
    if (currentStep === 1) {
      if (!form.email.trim()) {
        setError(t("emailRequired"));
        return false;
      }
      if (!form.password || form.password.length < 6) {
        setError(t("passwordTooShort"));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    // Simulate network
    await new Promise((r) => setTimeout(r, 800));

    const result = signup({
      name: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.replace(getDashboardPath());
      }, 600);
    } else {
      setError(t(result.error as "emailAlreadyExists"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-700 relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-white max-w-md space-y-6">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold">{t("createAccount")}</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            {locale === "ar"
              ? "انضم لآلاف المرضى الذين يثقون بـ ClinicOS. أكمل الخطوات لإنشاء حسابك."
              : "Join thousands of patients who trust ClinicOS. Complete the steps to set up your account."}
          </p>
          {/* Step indicators */}
          <div className="space-y-3 pt-4">
            {stepLabels.map((label, i) => {
              const Icon = steps[i].icon;
              return (
                <div key={i} className={cn("flex items-center gap-3 transition-opacity", i <= currentStep ? "opacity-100" : "opacity-40")}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                    i < currentStep ? "bg-white text-primary" : i === currentStep ? "bg-white/30 text-white ring-2 ring-white" : "bg-white/10 text-white/60"
                  )}>
                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 lg:hidden">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">ClinicOS</span>
            </Link>
            <h2 className="text-2xl font-bold">{stepLabels[currentStep]}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {locale === "ar" ? `الخطوة ${currentStep + 1} من ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
            </p>
          </div>

          <Progress value={progress} className="mb-6" />

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

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {currentStep === 0 && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("fullName")}</label>
                        <Input
                          value={form.fullName}
                          onChange={(e) => update("fullName", e.target.value)}
                          placeholder="John Smith"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("dateOfBirth")}</label>
                        <Input
                          type="date"
                          value={form.dateOfBirth}
                          onChange={(e) => update("dateOfBirth", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("gender")}</label>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant={form.gender === "male" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => update("gender", "male")}
                          >
                            {t("male")}
                          </Button>
                          <Button
                            type="button"
                            variant={form.gender === "female" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => update("gender", "female")}
                          >
                            {t("female")}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {currentStep === 1 && (
                    <>
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
                        <label className="text-sm font-medium">{t("phone")}</label>
                        <div className="relative">
                          <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="pl-10 rtl:pl-3 rtl:pr-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("address")}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={form.address}
                            onChange={(e) => update("address", e.target.value)}
                            placeholder="123 Main St, City"
                            className="pl-10 rtl:pl-3 rtl:pr-10"
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
                          {locale === "ar" ? "6 أحرف على الأقل" : "At least 6 characters"}
                        </p>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("emergencyContact")}</label>
                        <Input
                          value={form.emergencyContact}
                          onChange={(e) => update("emergencyContact", e.target.value)}
                          placeholder="Name - Phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("medicalHistory")}</label>
                        <textarea
                          value={form.medicalHistory}
                          onChange={(e) => update("medicalHistory", e.target.value)}
                          className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder={locale === "ar" ? "أي حالات سابقة، عمليات جراحية..." : "Any pre-existing conditions, surgeries, etc."}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("allergies")}</label>
                        <Input
                          value={form.allergies}
                          onChange={(e) => update("allergies", e.target.value)}
                          placeholder={locale === "ar" ? "أي حساسية معروفة" : "List any known allergies"}
                        />
                      </div>
                    </>
                  )}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <span className="font-medium">{t("stepPersonal")}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{form.fullName || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <span className="font-medium">{t("stepContact")}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{form.email || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <span className="font-medium">{t("stepMedical")}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {form.allergies || (locale === "ar" ? "لا يوجد" : "None")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        {locale === "ar"
                          ? "بإنشاء حساب، فأنت توافق على شروط الخدمة وسياسة الخصوصية."
                          : "By creating an account, you agree to our Terms of Service and Privacy Policy."}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-3 mt-6">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={() => { setCurrentStep(currentStep - 1); setError(""); }} className="gap-2" disabled={isLoading}>
                    <ArrowLeft className="h-4 w-4" />
                    {t("back")}
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button className="flex-1 gap-2" onClick={handleNext}>
                    {t("next")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1 gap-2"
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
                )}
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
