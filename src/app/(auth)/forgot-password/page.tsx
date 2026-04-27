"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function ForgotPasswordPage() {
  const { locale } = useTranslation();
  const router = useRouter();
  const { sendResetOtp } = useAuthStore();

  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError(locale === "ar" ? "يرجى إدخال البريد الإلكتروني أو رقم الهاتف" : "Please enter your email or phone number");
      return;
    }

    setIsLoading(true);
    setError("");
    
    // In a real app, we'd call the API to send the OTP
    const result = await sendResetOtp(identifier);
    setIsLoading(false);

    if (result.success) {
      router.push(`/reset-password?step=otp&email=${encodeURIComponent(identifier)}`);
    } else {
      setError(result.error || (locale === "ar" ? "فشل إرسال الرمز" : "Failed to send code"));
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
        className="w-full h-full min-h-screen md:min-h-[550px] md:max-w-[480px] md:h-auto bg-white dark:bg-slate-900 md:rounded-[3rem] md:shadow-xl md:shadow-slate-200/40 md:dark:shadow-none overflow-hidden flex flex-col relative transition-colors duration-300"
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
          <div className="mb-6">
            <h1 className="text-[28px] md:text-[32px] font-black text-[#0F172A] dark:text-slate-50 mb-1 leading-tight tracking-tight">
              {locale === "ar" ? "استعادة كلمة المرور" : "Forgot Password"}
            </h1>
            <p className="text-[#94A3B8] dark:text-slate-400 text-base font-medium leading-relaxed">
              {locale === "ar" 
                ? "أدخل بريدك الإلكتروني أو رقم هاتفك وسنرسل لك رمز التحقق" 
                : "Enter your email or phone number and we will send you a verification code"}
            </p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-5 flex-1">
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 p-4 rounded-2xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Identifier Input */}
            <div className="space-y-3">
              <label className="text-base font-bold text-[#0F172A] dark:text-slate-200 px-2">
                {locale === "ar" ? "البريد الإلكتروني / رقم الهاتف" : "Email / Phone number"}
              </label>
              <Input
                placeholder={locale === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                className="h-[56px] mt-2 rounded-full bg-slate-50 dark:bg-slate-800/50 border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-slate-50 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-base px-7 placeholder:text-slate-400"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-[56px] rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "..." : (locale === "ar" ? "إرسال الرمز" : "Send code")}
              </Button>
            </div>
          </form>

          <div className="mt-auto pt-4 text-center">
            <p className="text-[#64748B] dark:text-slate-400 text-sm font-medium pb-8">
              {locale === "ar" ? "تذكرت كلمة المرور؟" : "Remember password?"}{" "}
              <Link href="/login" className="text-[#2563EB] font-black hover:underline ml-1">
                {locale === "ar" ? "تسجيل الدخول" : "Log in"}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
