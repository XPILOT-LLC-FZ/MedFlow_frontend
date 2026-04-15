"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun, Globe, Bell, Search } from "lucide-react";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type { Role } from "@/types";
import {
  LayoutDashboard, Calendar, User, Users, Stethoscope, ClipboardList,
  Package, BarChart3, Clock, FileText, Settings, MessageSquare, Sparkles, Activity
} from "lucide-react";
import { useBookingStore } from "@/stores/useBookingStore";
import { formatDateKey } from "@/lib/dateUtils";

const roleLabels: Record<Role, { en: string; ar: string }> = {
  PATIENT: { en: "Patient", ar: "مريض" },
  ADMIN: { en: "Admin", ar: "إدارة" },
  DOCTOR: { en: "Doctor", ar: "طبيب" },
  STAFF: { en: "Reception", ar: "استقبال" },
  SUPER_ADMIN: { en: "Super Admin", ar: "مدير النظام" },
};

// Route index for search
interface NavItem {
  label: string;
  labelAr: string;
  href: string;
  icon: React.ElementType;
}

const navByRole: Record<Role, NavItem[]> = {
  PATIENT: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    { label: "AI Chat", labelAr: "المساعد الذكي", href: "/chat", icon: MessageSquare },
    { label: "Smart Scheduler", labelAr: "الجدولة الذكية", href: "/smart-scheduler", icon: Sparkles },
    { label: "Feedback", labelAr: "التقييمات", href: "/feedback", icon: FileText },
    { label: "Profile", labelAr: "الملف الشخصي", href: "/profile", icon: User },
  ],
  ADMIN: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Clinic", labelAr: "العيادة", href: "/admin/clinic", icon: Settings },
    { label: "Doctors", labelAr: "الأطباء", href: "/admin/doctors", icon: Stethoscope },
    { label: "Patients", labelAr: "المرضى", href: "/admin/patients", icon: User },
    { label: "Reception", labelAr: "الاستقبال", href: "/admin/reception", icon: Users },
    { label: "Services", labelAr: "الخدمات", href: "/admin/services", icon: ClipboardList },
    { label: "Inventory", labelAr: "المخزون", href: "/admin/inventory", icon: Package },
    { label: "Analytics", labelAr: "التحليلات", href: "/admin/analytics", icon: BarChart3 },
  ],
  DOCTOR: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "My Schedule", labelAr: "جدولي", href: "/doctor/schedule", icon: Calendar },
    { label: "Chat", labelAr: "المحادثة", href: "/doctor/chat", icon: MessageSquare },
    { label: "Patients", labelAr: "المرضى", href: "/doctor/patients", icon: Users },
    { label: "Analytics", labelAr: "التحليلات", href: "/doctor/analytics", icon: Activity },
    { label: "Treatment Timelines", labelAr: "الخطط العلاجية", href: "/doctor/treatment-timelines", icon: ClipboardList },
    { label: "Settings", labelAr: "الإعدادات", href: "/doctor/profile", icon: Settings },
  ],
  STAFF: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/reception/dashboard", icon: LayoutDashboard },
    { label: "Patients", labelAr: "المرضى", href: "/reception/patients", icon: User },
    { label: "Booking", labelAr: "الحجز", href: "/reception/booking", icon: Calendar },
    { label: "Smart Scheduler", labelAr: "الجدولة الذكية", href: "/reception/smart-scheduler", icon: Sparkles },
    { label: "Waiting Room", labelAr: "غرفة الانتظار", href: "/reception/waiting-room", icon: Clock },
    { label: "Profile", labelAr: "الملف الشخصي", href: "/reception/profile", icon: User },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/super-dashboard", icon: LayoutDashboard },
    { label: "Users", labelAr: "المستخدمون", href: "/super-users", icon: Users },
    { label: "Logs", labelAr: "السجلات", href: "/super-logs", icon: FileText },
  ],
};

export function DashboardTopbar() {
  const router = useRouter();
  const { theme, toggleTheme, locale, setLocale } = useStore();
  const { user } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchResults, setSearchResults] = useState<NavItem[]>([]);

  const { appointments, fetchAppointments } = useBookingStore();

  useEffect(() => {
    const today = formatDateKey(new Date());
    fetchAppointments({ startDate: today, endDate: today });
  }, [fetchAppointments]);

  const role = user?.role ?? "PATIENT";
  const firstName = user?.name ? user.name.split(" ")[0] : "";
  const roleLabel = roleLabels[role][locale];

  // Close search on click outside or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsSearchFocused(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter routes on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const availableRoutes = navByRole[role] || [];
    
    const matches = availableRoutes.filter(
      (route) => 
        route.label.toLowerCase().includes(query) || 
        route.labelAr.toLowerCase().includes(query) ||
        route.href.toLowerCase().includes(query)
    );
    
    setSearchResults(matches);
  }, [searchQuery, role]);

  const handleRouteNavigate = (href: string) => {
    setIsSearchFocused(false);
    setSearchQuery("");
    router.push(href);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return locale === "ar" ? "صباح الخير" : "Good Morning";
    if (hour < 17) return locale === "ar" ? "مساء الخير" : "Good Afternoon";
    return locale === "ar" ? "مساء الخير" : "Good Evening";
  };

  const getSubtitle = () => {
    const dateStr = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

    const todayStr = formatDateKey(new Date());
    const todaysAppointmentsCount = appointments.filter(a => a.date === todayStr).length;

    let message = "";
    
    if (user?.role === "DOCTOR") {
      if (todaysAppointmentsCount === 0) {
        message = locale === "ar" ? "ليس لديك مواعيد اليوم" : "You have no appointments today";
      } else if (todaysAppointmentsCount === 1) {
        message = locale === "ar" ? "لديك موعد واحد اليوم" : "You have 1 appointment today";
      } else {
        message = locale === "ar" 
          ? `لديك ${todaysAppointmentsCount} مواعيد اليوم` 
          : `You have ${todaysAppointmentsCount} appointments today`;
      }
    } else if (user?.role === "PATIENT") {
      message = locale === "ar" ? "صحتك في لمحة" : "Your health at a glance";
    } else if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "STAFF") {
      if (todaysAppointmentsCount === 0) {
        message = locale === "ar" ? "لا توجد مواعيد في العيادة اليوم" : "No appointments in the clinic today";
      } else {
        message = locale === "ar" 
          ? `هناك ${todaysAppointmentsCount} مواعيد في العيادة اليوم` 
          : `There are ${todaysAppointmentsCount} clinic appointments today`;
      }
    } else {
      message = locale === "ar" ? "أهلاً بك في لوحة التحكم" : "Welcome back to your dashboard";
    }

    return `${dateStr} • ${message}`;
  };

  return (
    <div className="hidden lg:flex w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl p-6 flex-col gap-3 transition-all duration-300">
      
      <div className="flex items-start justify-between w-full">
        {/* Greeting Section */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {`${getGreeting()}, ${firstName || (locale === "ar" ? "مستخدم" : "User")}`}
          </h1>
          <p className="mt-1 text-[13px] mt-2 font-medium text-slate-500 dark:text-slate-400">
            {getSubtitle()}
          </p>
        </div>

        {/* Right Side Panel (Account, Theme, etc.) */}
        <div className="flex items-center gap-3">
          {/* Actions Group */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800" 
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
                <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
              </Button>
              {notifOpen && (
                <div className="absolute top-full mt-3 right-0 rtl:right-auto rtl:left-0 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 z-50">
                  <p className="text-sm font-bold mb-3 px-1 text-slate-900 dark:text-slate-50">
                    {locale === "ar" ? "الإشعارات" : "Notifications"}
                  </p>
                  <div className="space-y-2">
                    {[
                      { en: "New appointment booked with Dr. Mitchell", ar: "تم حجز موعد جديد مع د. ميتشل" },
                      { en: "Inventory alert: Face Masks N95 low stock", ar: "تنبيه المخزون: كمامات N95 منخفضة" },
                      { en: "Appointment reminder: Tomorrow at 9:00 AM", ar: "تذكير: موعدك غداً الساعة 9:00 صباحاً" }
                    ].map((n, idx) => (
                      <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors">
                        {locale === "ar" ? n.ar : n.en}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Language Toggle */}
            <Button
              variant="ghost" 
              size="icon"
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
            >
              {locale === "en" ? "AR" : "EN"}
            </Button>
  
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {theme === "light" 
                ? <Moon className="h-5 w-5 text-slate-600" /> 
                : <Sun className="h-5 w-5 text-amber-400" />}
            </Button>
          </div>
  
          {/* User Info & Avatar */}
          {user && (
            <div className="flex items-center gap-4 pl-3 rtl:pl-0 rtl:pr-3 border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-800">
              <div className="flex flex-col text-right rtl:text-left">
                <span className="text-[15px] font-bold text-slate-900 dark:text-slate-50 leading-tight">{firstName}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight mt-1">{roleLabel}</span>
              </div>
              <Link href={role === "DOCTOR" ? "/doctor/profile" : (role === "PATIENT" ? "/profile" : (role === "STAFF" ? "/reception/profile" : "#"))}>
                <Avatar className="h-10 w-10 cursor-pointer border border-slate-200 dark:border-slate-800">
                  <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`} />
                  <AvatarFallback className="bg-primary text-white font-bold">{firstName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Strip */}
      <div className="max-w-3xl relative group" ref={searchRef}>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={
              locale === "ar"
                ? "ابحث في صفحات لوحة التحكم، المرضى، أو المواعيد..."
                : "Search patients, appointments, or dashboard pages..."
            }
            className="h-11 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 pl-12 pr-5 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all group-hover:bg-white dark:group-hover:bg-slate-900"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute top-full w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {searchResults.length > 0 ? (
              <div className="flex flex-col">
                <span className="px-5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                  {locale === "ar" ? "الصفحات" : "Results Found"}
                </span>
                {searchResults.map((route, i) => (
                  <button
                    key={`${route.href}-${i}`}
                    onClick={() => handleRouteNavigate(route.href)}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <route.icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        {locale === "ar" ? route.labelAr : route.label}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 truncate uppercase tracking-wider mt-0.5">
                        {route.href}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <Search className="h-6 w-6 text-slate-300" />
                </div>
                <div className="text-sm font-bold text-slate-400">
                  {locale === "ar" ? "لم يتم العثور على نتائج." : "No results found."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
