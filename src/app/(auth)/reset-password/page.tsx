"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Check, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.3 }
  }
};

function ResetPasswordContent() {
  const { locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyResetOtp, verifySignupOtp, sendResetOtp, sendSignupOtp } = useAuthStore();

  const forcedStep = searchParams.get("step") as "otp" | "password" | "success" | null;
  const [step, setStep] = useState<"otp" | "password" | "success">(forcedStep || "otp");
  const [prevForcedStep, setPrevForcedStep] = useState(forcedStep);

  if (forcedStep !== prevForcedStep) {
    setPrevForcedStep(forcedStep);
    if (forcedStep) {
      setStep(forcedStep);
    }
  }

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(59);

  const email = searchParams.get("email") || "********@mail.com";
  const type = searchParams.get("type") || "reset";
  
  // Signup data (if coming from signup)
  const fullName = searchParams.get("name") || "";
  const signupPass = searchParams.get("pass") || "";
  const role = (searchParams.get("role") as "PATIENT" | "ADMIN") || "PATIENT";

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, idx) => {
      if (idx < 4) newOtp[idx] = char;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    if (type === "signup") {
      await sendSignupOtp(email, fullName, role);
    } else {
      await sendResetOtp(email);
    }
    setIsLoading(false);
    setTimer(59);
    setOtp(["", "", "", ""]);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}sec`;
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 4) return;

    setIsLoading(true);
    if (type === "signup") {
      const result = await verifySignupOtp(email, fullName, signupPass, code, role);
      if (result.success) setStep("success");
      else setError(result.error || (locale === "ar" ? "رمز غير صحيح" : "Invalid code"));
    } else {
      setStep("password");
    }
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setError(locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError(locale === "ar" ? "كلمة المرور قصيرة جداً" : "Password is too short");
      return;
    }
    setIsLoading(true);
    const result = await verifyResetOtp(email, otp.join(""), password);
    setIsLoading(false);
    if (result.success) setStep("success");
    else setError(result.error || (locale === "ar" ? "حدث خطأ ما" : "Something went wrong"));
  };

  const isOtpComplete = otp.every(digit => digit !== "");

  return (
    <div className={`min-h-screen transition-all duration-500 flex flex-col items-center justify-center md:p-8 relative ${step === "success" ? "bg-[#2563EB]" : "bg-white dark:bg-slate-950 md:bg-[#F8F9FB] md:dark:bg-slate-950"}`} dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Settings bar */}
      <div className="fixed top-8 right-8 rtl:right-auto rtl:left-8 z-50 flex items-center gap-2">
        <LanguageToggle 
          variant="ghost" 
          className={cn(
            "hover:bg-slate-100 dark:hover:bg-slate-900/50 backdrop-blur-sm dark:text-slate-100",
            step === "success" && "text-white hover:bg-white/20"
          )} 
        />
        <ThemeToggle 
          variant="ghost" 
          className={cn(
            "hover:bg-slate-100 dark:hover:bg-slate-900/50 backdrop-blur-sm",
            step === "success" && "text-white hover:bg-white/20"
          )} 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full h-full min-h-screen md:min-h-[600px] md:max-w-[480px] md:h-auto rounded-none md:rounded-[3rem] shadow-none md:shadow-xl overflow-hidden flex flex-col relative transition-all duration-500 ${
          step === "success" ? "bg-[#2563EB]" : "bg-white dark:bg-slate-900 shadow-slate-200/40 dark:shadow-none"
        }`}
      >
        {/* Back Button (Only if not success) */}
        {step !== "success" && (
          <button 
            onClick={() => router.back()}
            className="absolute top-8 left-8 rtl:left-auto rtl:right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === "otp" && (
            <motion.div key="otp" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="p-6 pt-24 md:p-12 md:pt-16 flex flex-col h-full">
              <div className="mb-6">
                <h1 className="text-[28px] md:text-[32px] font-black text-[#0F172A] dark:text-slate-50 mb-1 leading-tight tracking-tight">
                  {type === "signup" 
                    ? (locale === "ar" ? "تم إرسال الرمز للبريد" : "Code sent to email")
                    : (locale === "ar" ? "أدخل الرمز المكون من 4 أرقام" : "Enter the 4-digit code")
                  }
                </h1>
                <p className="text-[#94A3B8] dark:text-slate-400 text-base font-medium leading-relaxed">
                  {type === "signup"
                    ? (locale === "ar" ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى إدخاله للتحقق من ملفك الشخصي." : "A verification code has been sent to your email. Please enter it to verify your profile.")
                    : (locale === "ar" ? "لقد أرسلنا الرمز إلى بريدك الإلكتروني، يرجى التحقق من صندوق الوارد." : "We've sent the code to your email, check your inbox.")
                  }
                </p>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between gap-3 mb-6" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-14 h-14 md:w-[72px] md:h-[72px] text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none bg-slate-50 dark:bg-slate-800/50 ${
                        digit 
                          ? `border-[#4ADE80] text-[#0F172A] dark:text-slate-50` 
                          : "border-[#E2E8F0] dark:border-slate-800 text-slate-400 focus:border-[#4ADE80]"
                      }`}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <div className="text-center mb-12">
                  <p className="text-base font-medium text-[#94A3B8] dark:text-slate-400">
                    {locale === "ar" ? "سيكون هذا الرمز متاحاً خلال " : "This OTP will be available during "}
                    <span className="text-slate-500 dark:text-slate-300 font-bold">{formatTimer(timer)}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 p-4 rounded-2xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-auto space-y-4">
                  <Button
                    className={`w-full h-[56px] rounded-full text-base font-bold transition-all active:scale-[0.98] ${
                      isOtpComplete 
                        ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-blue-200 dark:shadow-none" 
                        : "bg-[#E2E8F0] dark:bg-slate-800 text-[#94A3B8] dark:text-slate-500 cursor-not-allowed"
                    }`}
                    onClick={handleVerifyOtp}
                    disabled={!isOtpComplete || isLoading}
                  >
                    {isLoading ? "..." : (type === "signup" ? (locale === "ar" ? "تأكيد" : "Confirm") : (locale === "ar" ? "تحقق من الرمز" : "Verify Code"))}
                  </Button>

                  <div className="text-center">
                    <button 
                      onClick={handleResendCode}
                      disabled={timer > 0 || isLoading}
                      className={`text-base font-bold transition-colors ${
                        timer > 0 ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" : "text-[#2563EB] hover:underline"
                      }`}
                    >
                      {locale === "ar" ? "إعادة إرسال الرمز" : "Resend code"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div key="password" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="p-6 pt-24 md:p-12 md:pt-16 flex flex-col h-full">
              <div className="mb-6">
                <h1 className="text-[28px] md:text-[32px] font-black text-[#0F172A] dark:text-slate-50 mb-1 leading-tight tracking-tight">
                  {locale === "ar" ? "كلمة مرور جديدة" : "New Password"}
                </h1>
                <p className="text-[#94A3B8] dark:text-slate-400 text-base font-medium leading-relaxed">
                  {locale === "ar" ? "أنشئ كلمة مرور قوية لحماية حسابك." : "Create a strong password to protect your account."}
                </p>
              </div>

              <div className="flex-1 space-y-5">
                <div className="space-y-3">
                  <label className="text-base font-bold text-[#0F172A] dark:text-slate-200 px-2">
                    {locale === "ar" ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder={locale === "ar" ? "أدخل كلمة مرور جديدة" : "Enter new password"}
                      className="w-full h-[56px] mt-2 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 border-[#E2E8F0] dark:border-slate-700 focus:border-[#2563EB] outline-none transition-all text-base px-7 pr-14 rtl:pr-7 rtl:pl-14 text-[#0F172A] dark:text-slate-50 placeholder:text-slate-400"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 rtl:right-auto rtl:left-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-base font-bold text-[#0F172A] dark:text-slate-200 px-2">
                    {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={locale === "ar" ? "أعد إدخال كلمة المرور" : "Confirm password"}
                      className="w-full h-[56px] mt-2 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 border-[#E2E8F0] dark:border-slate-700 focus:border-[#2563EB] outline-none transition-all text-base px-7 pr-14 rtl:pr-7 rtl:pl-14 text-[#0F172A] dark:text-slate-50 placeholder:text-slate-400"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <button 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-6 rtl:right-auto rtl:left-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 p-4 rounded-2xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <Button
                  className="w-full h-[56px] rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? "..." : (locale === "ar" ? "حفظ كلمة المرور" : "Save password")}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div 
              key="success" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 md:p-12 flex flex-col items-center justify-center text-center h-full min-h-screen md:min-h-[600px] bg-[#2563EB]"
            >
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                <Check className="h-12 w-12 text-white stroke-[4px]" />
              </div>
              
              <h1 className="text-[32px] md:text-[36px] font-black text-white mb-3 leading-tight tracking-tight">
                {type === "signup" 
                  ? (locale === "ar" ? "تم التحقق!" : "Account Verified!")
                  : (locale === "ar" ? "تم التغيير!" : "Password Changed!")
                }
              </h1>
              <p className="text-white/80 text-base font-medium mb-10 leading-relaxed max-w-[280px]">
                {type === "signup"
                  ? (locale === "ar" ? "تم التحقق من حسابك بنجاح. لنبدأ رحلتك الآن!" : "Your account has been verified successfully, now let's enjoy our features!")
                  : (locale === "ar" ? "تم تغيير كلمة المرور بنجاح، يمكنك الآن استخدام كلمة المرور الجديدة." : "Password changed successfully, you can login again with a new password")
                }
              </p>

              <div className="w-full mt-auto pb-4 md:absolute md:bottom-10 md:left-0 md:px-12">
                <Button
                  className="w-full h-[56px] rounded-2xl bg-white hover:bg-white/90 text-[#2563EB] text-base font-black transition-all shadow-2xl active:scale-[0.98]"
                  onClick={() => router.push("/login")}
                >
                  {type === "signup" 
                    ? (locale === "ar" ? "ابدأ الآن" : "Get Started")
                    : (locale === "ar" ? "تسجيل الدخول الآن" : "Sign In Now")
                  }
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
