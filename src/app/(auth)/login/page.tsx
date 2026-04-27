"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { FacebookIcon, GoogleIcon, AppleIcon } from "@/components/shared/SocialIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";


export default function LoginPage() {
  const { locale } = useTranslation();
  const router = useRouter();
  const { login, isAuthenticated, user, getPostAuthPath } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const path = getPostAuthPath(user);
      router.push(path);
    }
  }, [isAuthenticated, user, router, getPostAuthPath]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      // success handled by auth state redirect
    } else {
      setError(result.error || (locale === "ar" ? "فشل تسجيل الدخول" : "Login failed"));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 md:bg-[#F8F9FB] md:dark:bg-slate-950 flex flex-col items-center justify-center md:p-8 relative transition-colors duration-300" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Settings bar */}
      <div className="fixed top-8 right-8 rtl:right-auto rtl:left-8 z-50 flex items-center gap-2">
        <LanguageToggle variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-900/50 backdrop-blur-sm dark:text-slate-100" />
        <ThemeToggle variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-900/50 backdrop-blur-sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full min-h-screen md:min-h-[650px] md:max-w-[480px] md:h-auto bg-white dark:bg-slate-900 md:rounded-[3rem] md:shadow-xl md:shadow-slate-200/40 md:dark:shadow-none overflow-hidden flex flex-col relative transition-colors duration-300"
      >
        <div className="p-6 pt-24 md:p-12 md:pt-16 flex flex-col h-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[28px] md:text-[32px] font-black text-[#0F172A] dark:text-slate-50 mb-1 leading-tight tracking-tight">
              {locale === "ar" ? "تسجيل الدخول" : "Welcome Back"}
            </h1>
            <p className="text-[#94A3B8] dark:text-slate-400 text-base font-medium">
              {locale === "ar" ? "يسعدنا رؤيتك مرة أخرى!" : "Glad to see you again!"}
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex-1 flex flex-col space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 p-4 rounded-2xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email / Phone */}
            <div className="space-y-3">
              <label className="text-base font-bold text-[#0F172A] dark:text-slate-200 px-2">
                {locale === "ar" ? "البريد الإلكتروني / رقم الهاتف" : "Email / Phone number"}
              </label>
              <Input 
                placeholder={locale === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                className="h-[56px] mt-3 rounded-full bg-slate-50 dark:bg-slate-800/50 border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-slate-50 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-base px-7 placeholder:text-slate-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-2">
                <label className="text-base font-bold text-[#0F172A] dark:text-slate-200">
                  {locale === "ar" ? "كلمة المرور" : "Password"}
                </label>
                <Link href="/forgot-password" className="text-[#2563EB] text-sm font-bold hover:underline">
                  {locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                </Link>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder={locale === "ar" ? "أدخل كلمة المرور" : "Enter password"}
                  className="h-[56px] rounded-full bg-slate-50 dark:bg-slate-800/50 border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-slate-50 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-base px-7 pr-14 rtl:pr-7 rtl:pl-14 placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 rtl:right-auto rtl:left-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 space-y-6">
              <Button
                type="submit"
                className="w-full h-[56px] rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "..." : (locale === "ar" ? "تسجيل الدخول" : "Sign in")}
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E2E8F0] dark:border-slate-800"></div>
                </div>
                <span className="relative px-4 bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-400 text-xs font-medium transition-colors">
                  {locale === "ar" ? "أو المتابعة باستخدام" : "or continue with"}
                </span>
              </div>

              <div className="flex justify-center gap-6">
                <SocialButton icon={<FacebookIcon className="h-7 w-7 text-[#1877F2]" />} />
                <SocialButton icon={<GoogleIcon className="h-7 w-7" />} />
                <SocialButton icon={<AppleIcon className="h-7 w-7 text-black dark:text-white" />} />
              </div>

              <p className="text-center text-[#64748B] dark:text-slate-400 text-sm font-medium pb-8">
                {locale === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <Link href="/signup" className="text-[#2563EB] font-black hover:underline ml-1">
                  {locale === "ar" ? "إنشاء حساب" : "Create account"}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function SocialButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-16 h-12 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95">
      {icon}
    </button>
  );
}
