"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, Moon, Sun, Globe, Bell, LogOut, UsersRound } from "lucide-react";
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

const availabilityPaths: Partial<Record<Role, string>> = {
  ADMIN: "/admin/doctors",
  DOCTOR: "/doctor/schedule",
  STAFF: "/reception/smart-scheduler",
  SUPER_ADMIN: "/admin/doctors",
} as const;

export function Navbar({ showSidebarToggle = false }: { showSidebarToggle?: boolean }) {
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
      className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl"
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
          <div className="relative group">
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
                  ? "text-primary hover:text-primary ring-2 ring-primary/20 ring-offset-2 bg-primary/5" 
                  : "text-muted-foreground grayscale opacity-70"
              }`}
              title={
                locale === "ar" 
                  ? (user.isAvailable ? "متاح" : "غير متاح")
                  : (user.isAvailable ? "Available" : "Unavailable")
              }
            >
              <UsersRound className={`h-4 w-4 ${user.isAvailable ? "animate-pulse-subtle" : ""}`} />
              {/* LED status indicator */}
              <span className={`absolute top-1 right-1 h-2 w-2 rounded-full border-2 border-background ${
                user.isAvailable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-400"
              }`} />
            </Button>
            
            {/* Dashboard Shortcut */}
            <Link 
              href={availabilityPaths[user.role] || "#"}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background border px-2 py-0.5 rounded text-[10px] shadow-sm z-50 pointer-events-none"
            >
              {locale === "ar" ? "لوحة التوفر" : "Availability Dashboard"}
            </Link>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell className="h-4 w-4" />
            {appointments.length > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />}
          </Button>
          {notifOpen && (
            <div className="absolute top-full mt-1 right-0 rtl:right-auto rtl:left-0 w-72 rounded-xl border bg-popover p-4 shadow-lg z-50">
              <p className="text-sm font-medium mb-2">
                {locale === "ar" ? "الإشعارات" : "Notifications"}
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {appointments.filter(a => a.status === "scheduled" || a.status === "in-progress").length > 0 ? (
                  appointments
                    .filter(a => a.status === "scheduled" || a.status === "in-progress")
                    .slice(0, 5)
                    .map((a, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground p-3 rounded-lg bg-muted cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="block font-semibold mb-1 text-foreground">
                          {locale === "ar" ? `موعد مجدول: ${a.patientName}` : `Scheduled: ${a.patientName}`}
                        </span>
                        {locale === "ar" ? `التاريخ: ${a.date} | الوقت: ${a.time}` : `Date: ${a.date} | Time: ${a.time}`}
                      </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground p-3 text-center">
                    {locale === "ar" ? "لا توجد إشعارات جديدة" : "No new notifications"}
                  </div>
                )}
              </div>
            </div>
          )}
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
