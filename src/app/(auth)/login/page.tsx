"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, ArrowRight, Eye, EyeOff, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStore } from "@/stores/useStore";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { login, isAuthenticated, getDashboardPath } = useAuthStore();
  const { setLocale } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(getDashboardPath());
    }
  }, [isAuthenticated, getDashboardPath, router]);

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError(t("emailRequired"));
      return;
    }
    if (!password) {
      setError(t("passwordRequired"));
      return;
    }

    setIsLoading(true);

    // Simulate network delay for realism
    await new Promise((r) => setTimeout(r, 800));

    const result = login(email, password);

    if (result.success) {
      setSuccess(true);
      // Brief pause to show success message, then redirect
      setTimeout(() => {
        router.replace(getDashboardPath());
      }, 600);
    } else {
      setError(t(result.error as "invalidCredentials"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-700 relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-white max-w-md space-y-6">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold">ClinicOS</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            {locale === "ar"
              ? "منصة إدارة رعاية صحية حديثة. احجز مواعيد، أدر سجلاتك الصحية، وتواصل مع أفضل المتخصصين."
              : "Modern healthcare management platform. Book appointments, manage your health records, and connect with top specialists."}
          </p>
          <div className="flex gap-6 pt-4">
            <div>
              <p className="text-2xl font-bold">10K+</p>
              <p className="text-blue-200 text-sm">{locale === "ar" ? "مريض" : "Patients"}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">50+</p>
              <p className="text-blue-200 text-sm">{locale === "ar" ? "طبيب" : "Doctors"}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">4.9</p>
              <p className="text-blue-200 text-sm">{locale === "ar" ? "تقييم" : "Rating"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="absolute top-6 right-6 rtl:right-auto rtl:left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-foreground/20"
        >
          <Globe className="h-4 w-4" />
          {t("switchLang")}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">ClinicOS</span>
            </Link>
            <h2 className="text-2xl font-bold">{t("welcomeBack")}</h2>
            <p className="text-muted-foreground mt-1">{t("loginSubtitle")}</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Success message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{t("loginSuccess")}</span>
                  </motion.div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t("email")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 rtl:pl-3 rtl:pr-10"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      {t("password")}
                    </label>
                    <Link href="#" className="text-xs text-primary hover:underline">
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 rtl:pl-10 rtl:pr-10"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {t("loggingIn")}
                    </>
                  ) : (
                    <>
                      {t("login")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {locale === "ar" ? "أو" : "or"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    const result = authService.loginWithGoogle();
                    if (result.success) {
                      setSuccess(true);
                      setTimeout(() => router.replace(getDashboardPath()), 600);
                    }
                  }}
                >
                  <svg className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {locale === "ar" ? "المتابعة مع Google" : "Continue with Google"}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {t("noAccount")}{" "}
                  <Link href="/signup" className="text-primary font-medium hover:underline">
                    {t("signup")}
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {locale === "ar" ? "حسابات تجريبية:" : "Demo accounts:"}
            </p>
            <div className="grid gap-1 text-xs text-muted-foreground">
              <span>patient@test.com / 123456</span>
              <span>admin@clinic.com / 123456</span>
              <span>doctor@clinic.com / 123456</span>
              <span>reception@clinic.com / 123456</span>
              <span>super@system.com / 123456</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
