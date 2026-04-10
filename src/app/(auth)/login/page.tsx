"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStore } from "@/stores/useStore";

export default function LoginPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { login, isAuthenticated, user, getPostAuthPath } = useAuthStore();
  const { setLocale } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    router.replace(getPostAuthPath(user));
  }, [isAuthenticated, user, getPostAuthPath, router]);

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
    setError("");

    const result = await login(email, password);

    if (result.success) {
      setSuccess(true);
      // Brief pause to show success message, then redirect using fresh store state
      setTimeout(() => {
        router.replace(useAuthStore.getState().getPostAuthPath());
      }, 600);
    } else {
      setError(result.error || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.28),transparent_30%),linear-gradient(135deg,#0f172a_0%,#075985_52%,#0ea5e9_100%)] p-12">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.3))]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2780%27 height=%2780%27 viewBox=%270 0 80 80%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%270.06%27%3E%3Ccircle cx=%2740%27 cy=%2740%27 r=%272%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative text-white max-w-md space-y-6">
          <BrandLogo
            iconClassName="h-14 w-14 rounded-[1.25rem]"
            textClassName="text-4xl"
            captionClassName="text-[11px] tracking-[0.34em]"
            showCaption
            theme="dark"
          />
          <p className="text-blue-100 text-lg leading-relaxed">
            {locale === "ar"
              ? "منصة إدارة رعاية صحية حديثة. احجز مواعيد، أدر سجلاتك الصحية، وتواصل مع أفضل المتخصصين."
              : "A smarter clinic experience for modern care teams and patients. Book visits, manage records, and move through care with less friction."}
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
            <Link href="/main" className="inline-flex items-center mb-6">
              <BrandLogo iconClassName="h-10 w-10 rounded-xl" textClassName="text-xl" />
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

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t("or")}
                    </span>
                  </div>
                </div>

                <GoogleSignInButton
                  onSuccess={(isNewUser) => {
                    setSuccess(true);
                    setTimeout(() => {
                      const targetPath = isNewUser ? "/onboarding" : useAuthStore.getState().getPostAuthPath();
                      router.replace(targetPath);
                    }, 600);
                  }}
                  onError={(err) => setError(err)}
                />

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
              <span>superadmin@medflow.com / Admin@12345</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
