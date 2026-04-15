"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, User, Users, Stethoscope, ClipboardList,
  Package, BarChart3, Clock, FileText, Settings, X, MessageSquare, Sparkles,
  LogOut, Activity
} from "lucide-react";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type { Role } from "@/types";

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
    { label: "Patients", labelAr: "المرضى", href: "/doctor/patients", icon: Users },
    { label: "Treatment Timelines", labelAr: "الخطط العلاجية", href: "/doctor/treatment-timelines", icon: ClipboardList },
    { label: "Chat", labelAr: "المحادثة", href: "/doctor/chat", icon: MessageSquare },
    { label: "Analytics", labelAr: "التحليلات", href: "/doctor/analytics", icon: Activity },
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

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useStore();
  const { user, logout } = useAuthStore();
  const { t, locale, isRTL } = useTranslation();

  // Use the authenticated user's role; fall back to PATIENT
  const role = user?.role ?? "PATIENT";
  const items = navByRole[role];
  const isDoctorSidebar = role === "DOCTOR";
  const profileName = user?.name || (locale === "ar" ? "مستخدم النظام" : "MedFlow User");

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const renderLogo = () => {
    return (
      <Link href={isDoctorSidebar ? "/doctor/dashboard" : "/main"} className="flex items-center">
        <BrandLogo
          className="gap-2"
          iconClassName="h-9 w-9 rounded-xl"
          textClassName="text-base"
        />
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed top-0 z-50 h-full w-64 border-r border-sidebar-border bg-sidebar-bg text-sidebar-fg flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto",
          isRTL ? "right-0 border-l border-r-0" : "left-0",
          sidebarOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center justify-between h-16 px-5 border-b border-slate-100", isDoctorSidebar && "h-[72px]")}>
          {renderLogo()}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className={cn("flex-1 overflow-y-auto p-3 space-y-1", isDoctorSidebar && "px-3 py-4")}>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const isSettings = isDoctorSidebar && item.label === "Settings";
            return (
              <Link
                key={`${role}:${item.href}:${item.label}`}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isDoctorSidebar && "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isDoctorSidebar && isActive && "bg-blue-600 text-white shadow-none dark:bg-blue-500",
                  isDoctorSidebar && isSettings && !isActive && "text-slate-500 dark:text-slate-400"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isDoctorSidebar && "h-[17px] w-[17px]")} />
                <span>{locale === "ar" ? item.labelAr : item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-2">
            <button
              type="button"
              onClick={async () => {
                setSidebarOpen(false);
                await handleLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <LogOut className={cn("h-4 w-4", isDoctorSidebar && "h-[17px] w-[17px]")} />
              <span>{t("logout")}</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className={cn("p-3 border-t", isDoctorSidebar ? "border-slate-100 dark:border-slate-800" : "border-sidebar-border")}>
          {user && (
            <div className="flex items-center gap-3 rounded-xl px-2 py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {profileName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{profileName}</p>
                {isDoctorSidebar ? (
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Cardiologist</p>
                ) : (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t("settings")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
