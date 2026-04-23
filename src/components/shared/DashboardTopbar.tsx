"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Role, InAppNotification } from "@/types";
import { useBookingStore } from "@/stores/useBookingStore";
import { formatDateKey } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { notificationsService } from "@/services/notificationsService";
import { formatDistanceToNow } from "date-fns";
import { NotificationsDialog } from "@/components/shared/NotificationsDialog";
import {
  ShieldCheck,
  LayoutDashboard, Calendar, User, Users, Stethoscope, ClipboardList,
  Package, BarChart3, Clock, FileText, Settings, MessageSquare, Sparkles, Activity,
  Moon, Sun, Bell, Search, UsersRound, ChevronRight
} from "lucide-react";

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
  const { appointments, fetchAppointments } = useBookingStore();
  const { locale, setLocale, theme, toggleTheme } = useStore();
  const { user } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [isFullNotificationsOpen, setIsFullNotificationsOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState<InAppNotification[]>([]);
  
  const refreshNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getInAppNotifications();
      setRealNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications in Topbar", err);
    }
  }, []);

  useEffect(() => {
    // Defer the initial fetch to avoid sync setState in effect
    const timeoutId = setTimeout(() => {
      void refreshNotifications();
    }, 0);

    const intervalId = setInterval(() => {
      void refreshNotifications();
    }, 60000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [refreshNotifications]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = formatDateKey(new Date());
    fetchAppointments({ startDate: today, endDate: today });
  }, [fetchAppointments]);

  const role = user?.role ?? "PATIENT";
  const firstName = user?.name ? user.name.split(" ")[0] : "";
  const roleLabel = roleLabels[role][locale];

  // Derive search results from query and role
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const availableRoutes = navByRole[role] || [];
    
    return availableRoutes.filter(
      (route) => 
        route.label.toLowerCase().includes(query) || 
        route.labelAr.toLowerCase().includes(query) ||
        route.href.toLowerCase().includes(query)
    );
  }, [searchQuery, role]);

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
    const todaysAppointmentsCount = appointments.filter((a: { date: string; }) => a.date === todayStr).length;

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
    <div className="hidden lg:flex w-full border-b border-slate-100/80 dark:border-slate-800/60 bg-white dark:bg-slate-950 px-7 py-4 flex-col gap-2 transition-all duration-300">
      <div className="flex items-start justify-between w-full">
        {/* Left Side: Greeting & Search */}
        <div className="flex flex-col gap-4 flex-1 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex flex-col min-w-0">
              <h1 className="text-[17px] font-bold text-slate-900 dark:text-slate-50 leading-tight truncate mb-1">
                {user?.role === "DOCTOR" 
                  ? `${getGreeting()}, Dr. ${firstName || "User"}`
                  : `${getGreeting()}, ${firstName || "User"}`}
              </h1>
              <p className="mt-0.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {getSubtitle()}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group w-full max-w-xl" ref={searchRef}>
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={
                locale === "ar"
                  ? "ابحث في صفحات لوحة التحكم، المرضى، أو المواعيد..."
                  : "Search patients, appointments, or medical records..."
              }
              className="h-10 w-full rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-5 text-[13px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all group-hover:bg-white dark:group-hover:bg-slate-900"
            />
            
            {/* Search Results Dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-[100] animate-in fade-in zoom-in-95 duration-200" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {searchResults.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="px-5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {locale === "ar" ? "النتائج" : "Results Found"}
                    </span>
                    {searchResults.map((route, i) => (
                      <button
                        key={`${route.href}-${i}`}
                        onClick={() => handleRouteNavigate(route.href)}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
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

        {/* Right Side: Action Icons & Availability */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-2xl transition-all duration-300 border-2 border-slate-50 dark:border-slate-800",
                    notifOpen 
                      ? "bg-blue-600 text-white ring-4 ring-blue-50 dark:ring-blue-900/20" 
                      : "bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  )} 
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-[17px] w-[17px]" />
                {realNotifications.filter(n => !n.readAt).length > 0 && (
                  <span className={cn(
                    "absolute top-1.5 right-1.5 h-2 w-2 rounded-full border border-white dark:border-slate-900",
                    notifOpen ? "bg-white" : "bg-rose-500"
                  )} />
                )}
              </Button>
              {notifOpen && (
                <div className="absolute top-full mt-3 right-0 rtl:right-auto rtl:left-0 w-85 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      {locale === "ar" ? "الإشعارات" : "Notifications"}
                    </p>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {realNotifications.filter(n => !n.readAt).length}
                    </span>
                  </div>
                  
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                    {realNotifications.length > 0 ? (
                      realNotifications.slice(0, 8).map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              if (!n.readAt) {
                                notificationsService.markInAppRead(n.id).then(() => refreshNotifications());
                              }
                            }}
                            className={cn(
                              "group relative flex items-start gap-3 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer border-l-4",
                              !n.readAt 
                                ? "bg-blue-50/40 dark:bg-blue-900/10 border-l-blue-600" 
                                : "bg-transparent border-l-transparent"
                            )}
                          >
                            <div className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                              n.payload?.role === "ADMIN" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" :
                              n.payload?.role === "DOCTOR" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" :
                              n.payload?.role === "PATIENT" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                              n.type === "CRITICAL" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500" :
                              "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                              {n.payload?.role === "ADMIN" ? <ShieldCheck className="h-4.5 w-4.5" /> : 
                               n.payload?.role === "DOCTOR" ? <Stethoscope className="h-4.5 w-4.5" /> : 
                               n.payload?.role === "PATIENT" ? <User className="h-4.5 w-4.5" /> : 
                               <Bell className="h-4.5 w-4.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.1em] mb-1 px-1.5 py-0.5 rounded-md w-fit",
                                    n.payload?.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                                    n.payload?.role === "DOCTOR" ? "bg-blue-100 text-blue-700" :
                                    n.payload?.role === "PATIENT" ? "bg-emerald-100 text-emerald-700" :
                                    "bg-slate-100 text-slate-500"
                                  )}>
                                    {n.payload?.role as string || n.type || "System"}
                                  </span>
                                  <p className={cn(
                                    "text-[13px] text-slate-800 dark:text-slate-100 truncate",
                                    !n.readAt ? "font-bold" : "font-medium"
                                  )}>
                                    {n.title}
                                  </p>
                                </div>
                                 {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                              </div>
                              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {n.body}
                              </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span 
                                    title={new Date(n.createdAt).toLocaleString()}
                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-tight"
                                  >
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                  </span>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                    {!n.readAt && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          notificationsService.markInAppRead(n.id).then(() => refreshNotifications());
                                        }}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                                      >
                                        {locale === "ar" ? "مقروء" : "Read"}
                                      </button>
                                    )}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        notificationsService.deleteInAppNotification(n.id).then(() => refreshNotifications());
                                      }}
                                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600"
                                    >
                                      {locale === "ar" ? "حذف" : "Delete"}
                                    </button>
                                  </div>
                                </div>
                            </div>
                          </div>
                      ))
                    ) : (
                      <div className="py-12 text-center px-6">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 mb-3">
                          <Bell className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">
                          {locale === "ar" ? "لا توجد إشعارات جديدة" : "No new notifications"}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50">
                     <button 
                       onClick={() => {
                         setNotifOpen(false);
                         setIsFullNotificationsOpen(true);
                       }}
                       className="flex h-9 w-full items-center justify-center rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                     >
                        {locale === "ar" ? "عرض كل الإشعارات" : "View All Notifications"}
                        <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                     </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
            >
              {theme === "light" 
                ? <Moon className="h-[18px] w-[18px]" /> 
                : <Sun className="h-[18px] w-[18px] text-amber-400" />}
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost" 
              size="icon"
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-[10px]"
            >
              {locale === "en" ? "AR" : "EN"}
            </Button>

            {/* Profile Section */}
            {user && (
              <Link 
                href={role === "DOCTOR" ? "/doctor/profile" : (role === "PATIENT" ? "/profile" : (role === "STAFF" ? "/reception/profile" : "#"))}
                className="flex items-center gap-3 pl-3 border-l border-slate-100 dark:border-slate-800 ml-2 group"
              >
                <Avatar className="h-9 w-9 cursor-pointer border-2 border-white dark:border-slate-900 transition-all group-hover:scale-105">
                  <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`} />
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">{firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden xl:flex flex-col items-start min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-slate-50 truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {roleLabel}
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* Row 2: Availability Toggle */}
          {user && (user.role === "ADMIN" || user.role === "DOCTOR" || user.role === "STAFF" || user.role === "SUPER_ADMIN") && (
            <Button
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                useAuthStore.getState().toggleAvailability();
              }}
              className={cn(
                "h-10 px-4 rounded-sm transition-all duration-200 flex items-center gap-2.5",
                user.isAvailable 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900" 
                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
              )}
            >
              <div className="relative">
                <UsersRound className={cn("h-4 w-4", user.isAvailable && "animate-pulse-subtle")} />
                <span className={cn(
                  "absolute -top-1 -right-1 h-2 w-2 rounded-full border border-white dark:border-slate-950",
                  user.isAvailable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-400"
                )} />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {locale === "ar" ? "الحالة" : "Status"}
                </span>
                <span className="text-[12px] font-bold">
                  {locale === "ar" 
                    ? (user.isAvailable ? "متاح" : "غير متاح")
                    : (user.isAvailable ? "Available" : "Unavailable")}
                </span>
              </div>
            </Button>
          )}
        </div>
      </div>

      <NotificationsDialog 
        isOpen={isFullNotificationsOpen}
        onOpenChange={setIsFullNotificationsOpen}
        notifications={realNotifications}
        onRefresh={refreshNotifications}
        locale={locale}
      />
    </div>
  );
}
