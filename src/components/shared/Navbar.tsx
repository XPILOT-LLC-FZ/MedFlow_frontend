"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, Moon, Sun, Globe, Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type { Role } from "@/types";

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

export function Navbar({ showSidebarToggle = false }: { showSidebarToggle?: boolean }) {
  const router = useRouter();
  const { theme, toggleTheme, locale, setLocale, toggleSidebar } = useStore();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    if (typeof document !== "undefined") {
      document.cookie = "clinic-os-auth=; path=/; max-age=0;";
    }
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

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
          {notifOpen && (
            <div className="absolute top-full mt-1 right-0 rtl:right-auto rtl:left-0 w-72 rounded-xl border bg-popover p-4 shadow-lg z-50">
              <p className="text-sm font-medium mb-2">
                {locale === "ar" ? "الإشعارات" : "Notifications"}
              </p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted">
                  {locale === "ar" ? "تم حجز موعد جديد مع د. ميتشل" : "New appointment booked with Dr. Mitchell"}
                </div>
                <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted">
                  {locale === "ar" ? "تنبيه المخزون: كمامات N95 منخفضة" : "Inventory alert: Face Masks N95 low stock"}
                </div>
                <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted">
                  {locale === "ar" ? "تذكير: موعدك غداً الساعة 9:00 صباحاً" : "Appointment reminder: Tomorrow at 9:00 AM"}
                </div>
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
              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </motion.header>
  );
}
