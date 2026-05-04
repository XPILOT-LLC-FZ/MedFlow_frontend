'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/stores/useStore';
import { Moon, Sun, Globe } from 'lucide-react';

export default function AppearancePanel() {
  const { locale } = useTranslation();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const setLocale = useStore((s) => s.setLocale);

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[400px] flex flex-col space-y-3">
      {/* Language Toggle Button */}
      <button
        onClick={toggleLanguage}
        className="w-full h-18 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-all group outline-none"
      >
        <div className="flex items-center gap-4">
          <Globe className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {locale === 'ar' ? 'اللغة' : 'Language'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-500 font-bold text-sm uppercase">{locale}</span>
        </div>
      </button>

      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleTheme}
        className="w-full h-18 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-all group outline-none"
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
        </div>
      </button>
    </div>
  );
}
