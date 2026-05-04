'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  X
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { authService } from '@/services/authService';
import { useToastStore } from '@/stores/useToastStore';
import { useProfileUiStore } from '@/stores/useProfileUiStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecurityPanel() {
  const { locale, isRTL } = useTranslation();
  const toast = useToastStore();
  const setDeepFlow = useProfileUiStore((state) => state.setDeepFlow);
  const user = useAuthStore((s) => s.user);

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  // Email change fields
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(59);

  const currentEmail = user?.email || "alex.john7@examplemail.com";
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Synchronize setDeepFlow with bottom sheet states
  useEffect(() => {
    setDeepFlow(isPasswordOpen || isEmailOpen);
  }, [isPasswordOpen, isEmailOpen, setDeepFlow]);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isEmailOpen && emailStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEmailOpen, emailStep, timer]);

  const handleClosePassword = () => {
    setIsPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCloseEmail = () => {
    setIsEmailOpen(false);
    setEmailStep(1);
    setNewEmail('');
    setOtp(['', '', '', '']);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    setIsProcessing(true);
    try {
      const resp = await authService.changePassword(currentPassword, newPassword);
      if (resp.success) {
        toast.success(locale === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed successfully');
        handleClosePassword();
      } else {
        toast.error(resp.error || 'Failed to change password');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendCode = async () => {
    if (!newEmail || newEmail === currentEmail) return;
    setIsProcessing(true);
    try {
      const result = await authService.sendChangeEmailOtp(newEmail);
      if (result && result.success) {
        setEmailStep(2);
        setTimer(59);
        toast.success(locale === 'ar' ? 'تم إرسال الرمز' : 'Verification code sent');
      } else {
        toast.error(result?.error || 'Failed to send code');
      }
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Error sending code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async (codeOverride?: string) => {
    const otpString = codeOverride || otp.join('');
    if (otpString.length < 4) return;
    
    setIsProcessing(true);
    try {
      const result = await authService.verifyChangeEmailOtp(newEmail, otpString);
      if (result.success) {
        toast.success(locale === 'ar' ? 'تم تغيير البريد الإلكتروني بنجاح' : 'Email changed successfully');
        handleCloseEmail();
      } else {
        toast.error(result.error || (locale === 'ar' ? 'الرمز غير صحيح' : 'Invalid verification code'));
      }
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || (locale === 'ar' ? 'الرمز غير صحيح' : 'Invalid verification code'));
    } finally {
      setIsProcessing(false);
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

  const handleDeleteAccount = async () => {
    setIsProcessing(true);
    try {
      const resp = await authService.deleteAccount();

      if (resp.success) {
        toast.success(locale === 'ar' ? 'تم حذف الحساب' : 'Account deleted');
        window.location.href = '/login';
      } else {
        toast.error(resp.error || 'Deletion failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[400px] flex flex-col">
      <div className="space-y-3">
        {/* Change Password */}
        <button
          onClick={() => setIsPasswordOpen(true)}
          className="w-full h-18 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-all group outline-none"
        >
          <div className="flex items-center gap-4">
            <Lock className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}
            </span>
          </div>
          {isRTL ? (
            <ChevronLeft className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
          )}
        </button>

        {/* Change Email */}
        <button
          onClick={() => setIsEmailOpen(true)}
          className="w-full h-18 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-all group outline-none"
        >
          <div className="flex items-center gap-4">
            <Mail className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {locale === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change email'}
            </span>
          </div>
          {isRTL ? (
            <ChevronLeft className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
          )}
        </button>

        {/* Delete Account */}
        <button
          onClick={() => setIsDeleteOpen(true)}
          className="w-full h-16 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-5 flex items-center justify-between hover:bg-slate-50 transition-all group outline-none"
        >
          <div className="flex items-center gap-4">
            <Trash2 className="h-5 w-5 text-rose-500" />
            <span className="font-bold text-rose-500">
              {locale === 'ar' ? 'حذف الحساب' : 'Delete account'}
            </span>
          </div>
        </button>
      </div>

      {/* Change Password Bottom Sheet */}
      <AnimatePresence>
        {isPasswordOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePassword}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex flex-col justify-end"
            />

            {/* Bottom Sheet / Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-slate-950 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-2xl z-[101] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-800" />
              </div>

              {/* Title Header with close button */}
              <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-900/50">
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}
                  </h2>
                </div>
                <button
                  onClick={handleClosePassword}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full bg-slate-50 dark:bg-slate-900 transition-all outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content with scrolling */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200 ml-1">
                    {locale === 'ar' ? 'كلمة المرور الحالية' : 'Current password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={locale === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                      className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] px-6 text-slate-600 focus:border-blue-400 outline-none transition-all shadow-sm"
                    />
                    <button
                      onClick={() => setShowPass(prev => ({ ...prev, current: !prev.current }))}
                      className={`absolute top-1/2 -translate-y-1/2 text-slate-400 outline-none ${isRTL ? "left-6" : "right-6"}`}
                    >
                      {showPass.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200 ml-1">
                    {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass.new ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={locale === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                      className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] px-6 text-slate-600 focus:border-blue-400 outline-none transition-all shadow-sm"
                    />
                    <button
                      onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                      className={`absolute top-1/2 -translate-y-1/2 text-slate-400 outline-none ${isRTL ? "left-6" : "right-6"}`}
                    >
                      {showPass.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200 ml-1">
                    {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm new password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={locale === 'ar' ? 'أدخل كلمة المرور مرة أخرى' : 'Enter new password again'}
                      className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] px-6 text-slate-600 focus:border-blue-400 outline-none transition-all shadow-sm"
                    />
                    <button
                      onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className={`absolute top-1/2 -translate-y-1/2 text-slate-400 outline-none ${isRTL ? "left-6" : "right-6"}`}
                    >
                      {showPass.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 pb-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={isProcessing || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center outline-none"
                  >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (locale === 'ar' ? 'تحديث كلمة المرور' : 'Update password')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Change Email Bottom Sheet */}
      <AnimatePresence>
        {isEmailOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseEmail}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex flex-col justify-end"
            />

            {/* Bottom Sheet / Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-slate-950 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-2xl z-[101] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-800" />
              </div>

              {/* Title Header with close button */}
              <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-900/50">
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {locale === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change email'}
                  </h2>
                </div>
                <button
                  onClick={handleCloseEmail}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full bg-slate-50 dark:bg-slate-900 transition-all outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content with scrolling */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {emailStep === 1 ? (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                        {locale === 'ar' 
                          ? 'لتغيير عنوان بريدك الإلكتروني، سنرسل لك رمزاً مكوناً من 4 أرقام.'
                          : "To verify your new address, we'll send you a 4-digit code. Please enter the code to complete verification."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Current Email (Disabled) */}
                      <div className="space-y-2">
                        <label className="text-[15px] font-bold text-slate-400">
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
                      <div className="space-y-2">
                        <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                          {locale === 'ar' ? 'البريد الإلكتروني الجديد' : 'New Email'}
                        </label>
                        <input 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder={locale === 'ar' ? 'مثال: mail@example.com' : 'e.g. mail@example.com'}
                          autoComplete="off"
                          className="w-full h-14 rounded-[30px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-4 pb-4">
                      <button
                        onClick={handleSendCode}
                        disabled={isProcessing || !newEmail || newEmail === currentEmail}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center outline-none"
                      >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (locale === 'ar' ? 'إرسال الرمز' : 'Send code')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                        {locale === 'ar'
                          ? 'لقد أرسلنا الرمز إلى بريدك الإلكتروني، يرجى مراجعة بريدك.'
                          : `We've sent the code to ${newEmail}, check your inbox.`}
                      </p>
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

                    <div className="flex flex-col items-center gap-6 pt-2">
                      <p className="text-sm font-medium text-slate-400">
                        {locale === 'ar' 
                          ? `سيكون رمز التحقق متاحاً خلال 00:${timer.toString().padStart(2, '0')} ثانية`
                          : `This OTP will be available during 00:${timer.toString().padStart(2, '0')}sec`}
                      </p>
                      
                      <button 
                        type="button"
                        onClick={() => { if (timer === 0) handleSendCode(); }}
                        disabled={timer > 0}
                        className={`text-[15px] font-bold outline-none ${timer > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700 underline underline-offset-4'}`}
                      >
                        {locale === 'ar' ? 'إعادة إرسال الرمز' : 'Resend code'}
                      </button>
                    </div>

                    <div className="pt-4 pb-4">
                      <button
                        onClick={() => handleVerify()}
                        disabled={isProcessing || otp.join('').length < 4}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center outline-none"
                      >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (locale === 'ar' ? 'تحقق' : 'Verify')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[90vw] max-w-[340px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[9999]">
          <div className="p-8 flex flex-col items-center text-center bg-white dark:bg-slate-950">
            {/* Pink Circle Trash Icon */}
            <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-6 ring-8 ring-rose-50/50">
              <Trash2 className="h-7 w-7 text-rose-500" />
            </div>

            <DialogTitle className="text-[19px] font-black text-slate-900 dark:text-white leading-tight mb-3">
              {locale === 'ar' ? 'هل أنت متأكد أنك تريد حذف الحساب؟' : 'Are you sure you want to delete account?'}
            </DialogTitle>

            <DialogDescription className="text-[14px] text-slate-500 font-medium leading-relaxed mb-8">
              {locale === 'ar'
                ? 'بالمضي قدماً، ستفقد إمكانية الوصول إلى حسابك وجميع البيانات المرتبطة به بشكل دائم، بما في ذلك التقارير والمواعيد والرسائل.'
                : 'By proceeding, you will permanently lose access to your account and all associated data, including reports, appointments, and messages.'}
            </DialogDescription>

            <div className="w-full space-y-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isProcessing}
                className="w-full h-14 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-[16px] rounded-[24px] shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center outline-none"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (locale === 'ar' ? 'حذف الحساب' : 'Delete account')}
              </button>

              <button
                onClick={() => setIsDeleteOpen(false)}
                className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-[16px] rounded-[24px] transition-all hover:bg-slate-50 active:scale-95 outline-none"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
