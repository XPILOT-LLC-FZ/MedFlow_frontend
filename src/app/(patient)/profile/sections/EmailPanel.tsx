'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { authService } from '@/services/authService';
import { useToastStore } from '@/stores/useToastStore';
import type { ApiPatient } from '@/types';

interface EmailPanelProps {
  patient?: ApiPatient;
  userEmail?: string;
  onBack?: () => void;
  onRefresh?: () => void;
}

export default function EmailPanel({ patient, userEmail, onBack, onRefresh }: EmailPanelProps) {
  const { locale } = useTranslation();
  const toast = useToastStore();
  const [step, setStep] = useState<1 | 2>(1);
  
  console.log('EmailPanel Render - Step:', step);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isSaving, setIsSaving] = useState(false);
  const [timer, setTimer] = useState(59);
  
  const currentEmail = patient?.email || userEmail || "alex.john7@examplemail.com";
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendCode = async () => {
    if (!newEmail || newEmail === currentEmail) return;
    setIsSaving(true);
    try {
      const result = await authService.sendChangeEmailOtp(newEmail);
      if (result && result.success) {
        setStep(2);
        setTimer(59);
        toast.success(locale === 'ar' ? 'تم إرسال الرمز' : 'Verification code sent');
      } else {
        toast.error(result?.error || 'Failed to send code');
      }
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Error sending code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async (codeOverride?: string) => {
    const otpString = codeOverride || otp.join('');
    if (otpString.length < 4) return;
    
    setIsSaving(true);
    try {
      const result = await authService.verifyChangeEmailOtp(newEmail, otpString);
      if (result.success) {
        toast.success(locale === 'ar' ? 'تم تغيير البريد الإلكتروني بنجاح' : 'Email changed successfully');
        if (onRefresh) onRefresh();
        if (onBack) onBack();
      } else {
        toast.error(result.error || (locale === 'ar' ? 'الرمز غير صحيح' : 'Invalid verification code'));
      }
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || (locale === 'ar' ? 'الرمز غير صحيح' : 'Invalid verification code'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1); 
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-verify if full
    const fullCode = newOtp.join('');
    if (fullCode.length === 4) {
      handleVerify(fullCode);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4).replace(/[^0-9]/g, '');
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 4) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Auto-verify if we got 4 digits
    const fullCode = newOtp.join('');
    if (fullCode.length === 4) {
      handleVerify(fullCode);
    } else {
      // Focus the next empty one
      const nextIndex = Math.min(pastedData.length, 3);
      otpRefs[nextIndex].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-14">
      {/* Progress Bar Container */}
      <div className="px-2 pt-4 flex justify-center gap-2">
         {[1, 2].map((s) => (
           <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-blue-600 shadow-sm shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800'}`} />
         ))}
      </div>

      <form 
        className="flex-1 overflow-y-auto px-6 py-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {step === 1 ? (
          <>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                {locale === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change email'}
              </h2>
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                {locale === 'ar' 
                  ? `بريدك الإلكتروني الحالي هو ${currentEmail}. للتحقق من عنوانك الجديد، سنرسل لك رمزًا مكونًا من 4 أرقام. يرجى إدخال الرمز لإكمال التحقق.`
                  : `To verify your new address, we'll send you a 4-digit code. Please enter the code to complete verification`}
              </p>
            </div>

            <div className="space-y-6">
              {/* Current Email (Disabled) */}
              <div className="space-y-2">
                <label className="text-[15px] font-bold text-slate-400 dark:text-slate-500">
                  {locale === 'ar' ? 'البريد الإلكتروني الحالي' : 'Current Email'}
                </label>
                <input 
                  value={currentEmail}
                  disabled
                  readOnly
                  className="w-full h-14 rounded-[30px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm opacity-70 outline-none"
                />
              </div>

              {/* New Email */}
              <div className="space-y-2" onKeyDown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}>
                <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'البريد الإلكتروني الجديد' : 'New Email'}
                </label>
                <input 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex.johnson78@examplemail.com"
                  autoComplete="off"
                  name="medflow-new-email"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSendCode();
                    }
                  }}
                  className="w-full h-14 rounded-[30px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                {locale === 'ar' ? 'أدخل الرمز المكون من 4 أرقام' : 'Enter the 4-digit code'}
              </h2>
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                {locale === 'ar'
                  ? 'لقد أرسلنا الرمز إلى بريدك الإلكتروني، يرجى مراجعة بريدك.'
                  : `We've sent the code to ${newEmail}, check your inbox.`}
              </p>
            </div>

            {/* Verifying Email (Disabled) */}
            <div className="space-y-2">
              <input 
                value={newEmail}
                disabled
                readOnly
                className="w-full h-14 rounded-[30px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm opacity-70 text-center font-bold outline-none"
              />
            </div>

            <div className="flex justify-between gap-4 py-4">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className="w-full h-16 rounded-[12px] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-center text-2xl font-black text-slate-800 dark:text-white focus:border-blue-400 focus:bg-white outline-none transition-all"
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-6 pt-4">
              <p className="text-sm font-medium text-slate-400">
                {locale === 'ar' 
                  ? `سيكون رمز التحقق متاحاً خلال 00:${timer.toString().padStart(2, '0')} ثانية`
                  : `This OTP will be available during 00:${timer.toString().padStart(2, '0')}sec`}
              </p>
              
              <button 
                type="button"
                onClick={() => { if (timer === 0) handleSendCode(); }}
                disabled={timer > 0}
                className={`text-[15px] font-bold ${timer > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700 underline underline-offset-4'}`}
              >
                {locale === 'ar' ? 'إعادة إرسال الرمز' : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </form>

      {/* Footer Button */}
      <div className="p-6 fixed bottom-0 left-0 right-0 max-w-[800px] mx-auto w-full">
        <button 
          type="button"
          disabled={isSaving || (step === 1 ? !newEmail : otp.join('').length < 4)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (step === 1) handleSendCode();
            else handleVerify();
          }}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            step === 1 
              ? (locale === 'ar' ? 'إرسال الرمز' : 'Send code')
              : (locale === 'ar' ? 'تحقق' : 'Verify')
          )}
        </button>
      </div>
    </div>
  );
}
