'use client';

import { useState } from 'react';
import {
  Lock,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { authService } from '@/services/authService';
import { useToastStore } from '@/stores/useToastStore';
import { useProfileUiStore } from '@/stores/useProfileUiStore';
import { useStore } from '@/stores/useStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

type ViewState = 'menu' | 'password';

export default function SecurityPanel() {
  const { locale } = useTranslation();
  const { setLocale, theme, toggleTheme } = useStore();
  const toast = useToastStore();
  const setDeepFlow = useProfileUiStore((state) => state.setDeepFlow);

  const [view, setView] = useState<ViewState>('menu');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    }
  };

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const navigateTo = (v: ViewState) => {
    setView(v);
    setDeepFlow(v !== 'menu');
  };

  const handleBack = () => {
    setView('menu');
    setDeepFlow(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    setIsProcessing(true);
    try {
      const resp = await authService.changePassword(currentPassword, newPassword);
      if (resp.success) {
        toast.success(locale === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed successfully');
        handleBack();
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        toast.error(resp.error || 'Failed to change password');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsProcessing(false);
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
      <AnimatePresence mode="wait">
        {view === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >

            {/* Menu Items */}
            <div className="space-y-3">
              {/* Change Password */}
              <button
                onClick={() => navigateTo('password')}
                className="w-full h-18 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Lock className="h-6 w-6 text-indigo-600" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </button>

              {/* Language */}
              <button
                onClick={toggleLanguage}
                className="w-full h-18 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Globe className="h-6 w-6 text-indigo-600" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {locale === 'ar' ? 'اللغة' : 'Language'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold text-sm uppercase">{locale}</span>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </button>

              {/* Dark Mode */}
              <button
                onClick={toggleTheme}
                className="w-full h-18 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {theme === 'light' ? (
                    <Moon className="h-6 w-6 text-indigo-600" />
                  ) : (
                    <Sun className="h-6 w-6 text-indigo-600" />
                  )}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {locale === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold text-sm uppercase">
                    {locale === 'ar' 
                      ? (theme === 'light' ? 'إيقاف' : 'تشغيل') 
                      : (theme === 'light' ? 'Off' : 'On')}
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </button>

              {/* Delete Account */}
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="w-full h-16 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-5 flex items-center justify-between hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Trash2 className="h-5 w-5 text-rose-500" />
                  <span className="font-bold text-rose-500">
                    {locale === 'ar' ? 'حذف الحساب' : 'Delete account'}
                  </span>
                </div>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Header with Back */}
            <div className="flex items-center justify-center relative pb-6">
              <button onClick={handleBack} className="absolute left-0 p-2 text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}
              </h1>
            </div>

            {/* Form */}
            <div className="space-y-5">
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
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"
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
                    onClick={() => setShowPass(prev => ({ ...prev, new: !prev.current }))}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPass.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={isProcessing || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (locale === 'ar' ? 'تحديث كلمة المرور' : 'Update password')}
                </button>
              </div>
            </div>
          </motion.div>
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
                className="w-full h-14 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-[16px] rounded-[24px] shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (locale === 'ar' ? 'حذف الحساب' : 'Delete account')}
              </button>

              <button
                onClick={() => setIsDeleteOpen(false)}
                className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-[16px] rounded-[24px] transition-all hover:bg-slate-50 active:scale-95"
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
