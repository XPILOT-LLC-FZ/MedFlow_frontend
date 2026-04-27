"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { FacebookIcon, GoogleIcon, AppleIcon } from "@/components/shared/SocialIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function SignupPage() {
  const { locale } = useTranslation();
  const router = useRouter();
  const { sendSignupOtp } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "PATIENT" as "PATIENT" | "ADMIN"
  });

  const update = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const requirements = {
    length: form.password.length >= 8,
    numbers: (form.password.match(/\d/g) || []).length >= 2,
    uppercase: /[A-Z]/.test(form.password)
  };

  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const hasPasswordError = touched && !Object.values(requirements).every(Boolean);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }

    if (!passwordsMatch) {
      setError(locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    if (!Object.values(requirements).every(Boolean)) {
      return;
    }

    setIsLoading(true);
    const result = await sendSignupOtp(form.email, form.fullName, form.role);
    setIsLoading(false);

    if (result.success) {
      router.push(`/reset-password?step=otp&email=${encodeURIComponent(form.email)}&type=signup&name=${encodeURIComponent(form.fullName)}&pass=${encodeURIComponent(form.password)}&role=${form.role}`);
    } else {
      setError(result.error || (locale === "ar" ? "حدث خطأ ما" : "Something went wrong"));
    }
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
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-8 left-8 rtl:left-auto rtl:right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="p-6 pt-24 md:p-12 md:pt-16 flex flex-col h-full">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-[28px] md:text-[32px] font-black text-[#0F172A] dark:text-slate-50 mb-1 leading-tight tracking-tight">
              {locale === "ar" ? "إنشاء حساب" : "Create Account"}
            </h1>
            <p className="text-[#94A3B8] dark:text-slate-400 text-base font-medium">
              {locale === "ar" ? "متحمسون لانضمامك إلينا!" : "Excited to have you on board!"}
            </p>
          </div>

          <form onSubmit={handleSignup} className="flex-1 flex flex-col space-y-3">
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 p-4 rounded-2xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-3">
              <label className="text-base font-bold text-[#0F172A] dark:text-slate-200 px-2">
                {locale === "ar" ? "الاسم الكامل" : "Full Name"}
              </label>
              <Input 
                placeholder={locale === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                className="h-[54px] mt-2 rounded-full bg-slate-50 dark:bg-slate-800/50 border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-slate-50 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-base px-7 placeholder:text-slate-400"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </div>

            {/* Email / Phone */}
            <div className="space-y-3">
              <label className="text-base font-bold text-[#0F172A] dark:text-slate-200 px-2">
                {locale === "ar" ? "البريد الإلكتروني / رقم الهاتف" : "Email / Phone number"}
              </label>
              <Input 
                placeholder={locale === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                className="h-[54px] mt-2 rounded-full bg-slate-50 dark:bg-slate-800/50 border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-slate-50 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-base px-7 placeholder:text-slate-400"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-3">
              <label className={`text-base font-bold transition-colors px-2 ${hasPasswordError ? "text-[#FF4D4D]" : "text-[#0F172A] dark:text-slate-200"}`}>
                {locale === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder={locale === "ar" ? "أنشئ كلمة مرور" : "Create password"}
                  className={`h-[54px] mt-2 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all text-base px-7 pr-14 rtl:pr-7 rtl:pl-14 text-[#0F172A] dark:text-slate-50 placeholder:text-slate-400 ${
                    hasPasswordError ? "border-[#FF4D4D] focus:border-[#FF4D4D]" : "border-[#E2E8F0] dark:border-slate-800 focus:border-[#2563EB]"
                  }`}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  onBlur={() => setTouched(true)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 rtl:right-auto rtl:left-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              <AnimatePresence>
                {form.password.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 px-4 space-y-2 overflow-hidden"
                  >
                    <RequirementItem met={requirements.length} text={locale === "ar" ? "8 أحرف على الأقل" : "Min 8 characters length"} />
                    <RequirementItem met={requirements.numbers} text={locale === "ar" ? "رقمين على الأقل" : "Min 2 number"} />
                    <RequirementItem met={requirements.uppercase} text={locale === "ar" ? "حرف كبير واحد على الأقل" : "Min 1 uppercase letter"} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <label className="text-base font-bold text-[#0F172A] dark:text-slate-200 px-2">
                {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}
              </label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={locale === "ar" ? "أعد إدخال كلمة المرور" : "Confirm password"}
                  className="h-[54px] mt-2 rounded-full bg-slate-50 dark:bg-slate-800/50 border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-slate-50 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-base px-7 pr-14 rtl:pr-7 rtl:pl-14 placeholder:text-slate-400"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-6 rtl:right-auto rtl:left-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <AnimatePresence>
                {form.confirmPassword.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 px-4 overflow-hidden"
                  >
                    <RequirementItem met={passwordsMatch} text={locale === "ar" ? "تطابق كلمات المرور" : "Passwords match"} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <div className="pt-2 space-y-4">
              <Button
                type="submit"
                className="w-full h-[54px] rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "..." : (locale === "ar" ? "إنشاء حساب" : "Sign up")}
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

              <p className="text-center text-[#64748B] dark:text-slate-400 text-sm font-medium pb-12">
                {locale === "ar" ? "هل لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link href="/login" className="text-[#2563EB] font-black hover:underline ml-1">
                  {locale === "ar" ? "تسجيل الدخول" : "Log in"}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-4 w-4 flex items-center justify-center`}>
        {met ? (
          <Check className="h-4 w-4 text-[#4ADE80] stroke-[3px]" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-slate-100 dark:bg-slate-800" />
        )}
      </div>
      <span className={`text-sm font-medium transition-colors duration-300 ${met ? "text-[#4ADE80]" : "text-[#94A3B8] dark:text-slate-500"}`}>
        {text}
      </span>
    </div>
  );
}

function SocialButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-20 h-14 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95">
      {icon}
    </button>
  );
}
