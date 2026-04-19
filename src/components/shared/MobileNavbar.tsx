"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Moon, Sun, Globe, Bell, LogOut, X, UsersRound } from "lucide-react";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type { Role } from "@/types";
import { useBookingStore } from "@/stores/useBookingStore";

const roleLabels: Record<Role, { en: string; ar: string }> = {
  PATIENT: { en: "Patient", ar: "مريض" },
  ADMIN: { en: "Admin", ar: "إدارة" },
  DOCTOR: { en: "Doctor", ar: "طبيب" },
  STAFF: { en: "Reception", ar: "استقبال" },
  SUPER_ADMIN: { en: "Super Admin", ar: "مدير النظام" },
};

const rolePaths: Record<Role, string> = {
  PATIENT: "/dashboard",
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/dashboard",
  STAFF: "/reception/dashboard",
  SUPER_ADMIN: "/super-dashboard",
};

export function MobileNavbar({ showSidebarToggle = false }: { showSidebarToggle?: boolean }) {
  const { theme, toggleTheme, locale, setLocale, toggleSidebar } = useStore();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const { appointments } = useBookingStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const displayName = user
    ? locale === "ar" ? user.nameAr : user.name
    : "";

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="lg:hidden sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl"
    >
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {showSidebarToggle && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {!showSidebarToggle && (
          <Link href="/main" className="flex items-center">
            <BrandLogo
              className="gap-2"
              iconClassName="h-9 w-9 rounded-xl"
              textClassName="hidden text-lg sm:inline"
            />
          </Link>
        )}

        <div className="flex-1" />

        {/* User info + role badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-medium">{displayName}</span>
            <Badge variant="secondary" className="text-xs">
              {roleLabels[user.role][locale]}
            </Badge>
          </div>
        )}

        {/* Staff Availability Icon (For Medical/Admin Roles) */}
        {user && (user.role === "ADMIN" || user.role === "DOCTOR" || user.role === "STAFF" || user.role === "SUPER_ADMIN") && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.preventDefault();
              const { toggleAvailability } = useAuthStore.getState();
              toggleAvailability();
            }}
            className={`relative transition-all duration-300 ${
              user.isAvailable 
                ? "text-primary bg-primary/5 ring-1 ring-primary/20" 
                : "text-muted-foreground opacity-70"
            }`}
            title={
              locale === "ar" 
                ? (user.isAvailable ? "متاح" : "غير متاح")
                : (user.isAvailable ? "Available" : "Unavailable")
            }
          >
            <UsersRound className={`h-4 w-4 ${user.isAvailable ? "animate-pulse" : ""}`} />
            <span className={`absolute top-1 right-1 h-2 w-2 rounded-full border-2 border-background ${
              user.isAvailable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-400"
            }`} />
          </Button>
        )}

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setNotifOpen(true)}>
            <Bell className="h-4 w-4" />
            {appointments.length > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />}
          </Button>

          <AnimatePresence>
            {notifOpen && (
              <>
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setNotifOpen(false)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
                />

                {/* Drawer */}
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 508 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-slate-950 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-2xl z-[60] flex flex-col lg:hidden"
                >
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-800" />
                  </div>

                  <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-900/50">
                    <div className="flex flex-col">
                       <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                         {locale === "ar" ? "الإشعارات" : "Notifications"}
                       </h2>
                       <p className="text-xs text-slate-500 dark:text-slate-400">
                         {appointments.filter(a => a.status === "scheduled" || a.status === "in-progress").length} {locale === "ar" ? "تنبيهات نشطة" : "active alerts"}
                       </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setNotifOpen(false)}
                      className="rounded-full bg-slate-50 dark:bg-slate-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {appointments.filter(a => a.status === "scheduled" || a.status === "in-progress").length > 0 ? (
                      appointments
                        .filter(a => a.status === "scheduled" || a.status === "in-progress")
                        .slice(0, 5)
                        .map((a, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setNotifOpen(false);
                              window.location.href = `/doctor/notifications`; // or redirect to specific id
                            }}
                            className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent active:scale-[0.98] active:bg-slate-100 transition-all duration-200"
                          >
                            <div className={`mt-0.5 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${a.status === "in-progress" ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600" : "bg-blue-100 dark:bg-blue-900/20 text-blue-600"}`}>
                               <Bell className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                                 {locale === "ar" ? `موعد مجدول: ${a.patientName}` : `Scheduled: ${a.patientName}`}
                               </p>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{a.time}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-500">{a.patientName}</span>
                               </div>
                            </div>
                          </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                          <Bell className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="text-slate-500 font-medium">{locale === "ar" ? "لا توجد إشعارات جديدة" : "No new notifications"}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-slate-50 dark:border-slate-900/50">
                    <Button 
                      className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      onClick={() => {
                        setNotifOpen(false);
                        window.location.href = "/doctor/notifications";
                      }}
                    >
                      {locale === "ar" ? "عرض كل الإشعارات" : "View All Notifications"}
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Language Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="gap-1.5 min-w-[70px]"
        >
          <Globe className="h-3.5 w-3.5" />
          {locale === "en" ? "AR" : "EN"}
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={handleLogout} title={t("logout")}>
          <LogOut className="h-4 w-4" />
        </Button>

        {/* Avatar */}
        {user && (
          <Link href={rolePaths[user.role]}>
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20">
              <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </motion.header>
  );
}
