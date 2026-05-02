"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, User, Users, Stethoscope, ClipboardList,
  Package, BarChart3, FileText, Settings, X, MessageSquare, Sparkles,
  LogOut, Activity, CreditCard
} from "lucide-react";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    { label: "Patients", labelAr: "المرضى", href: "/reception/patients", icon: Users },
    { label: "Schedule", labelAr: "الجدول", href: "/reception/booking", icon: Calendar },
    { label: "Queue Management", labelAr: "إدارة الطوابير", href: "/reception/waiting-room", icon: Activity },
    { label: "Tasks", labelAr: "المهام", href: "/reception/tasks", icon: ClipboardList },
    { label: "Prescriptions", labelAr: "الوصفات الطبية", href: "/reception/prescriptions", icon: Package },
    { label: "Checkout & payment", labelAr: "الدفع والسداد", href: "/reception/payments", icon: CreditCard },
    { label: "Invoice List", labelAr: "قائمة الفواتير", href: "/reception/invoices", icon: FileText },
    { label: "Chats", labelAr: "المحادثات", href: "/doctor/chat", icon: MessageSquare },
    { label: "Settings", labelAr: "الإعدادات", href: "/reception/profile", icon: Settings },
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

  const role = user?.role ?? "PATIENT";
  const items = navByRole[role];
  const isDoctorSidebar = role === "DOCTOR";
  const isReceptionSidebar = role === "STAFF";
  const isPremiumSidebar = isDoctorSidebar || isReceptionSidebar;
  const profileName = (locale === "ar" && user?.nameAr) ? user.nameAr : (user?.name || (locale === "ar" ? "مستخدم النظام" : "MedFlow User"));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const renderLogo = () => {
    if (isPremiumSidebar) {
      const dashboardHref = isDoctorSidebar ? "/doctor/dashboard" : "/reception/dashboard";
      return (
        <Link href={dashboardHref} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{t("clinicFlow")}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider leading-tight">{t("medicalSuite")}</span>
          </div>
        </Link>
      );
    }
    return (
      <Link href="/main" className="flex items-center">
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

      <motion.aside
        className={cn(
          "fixed top-0 z-50 h-full w-64 border-r border-sidebar-border bg-sidebar-bg text-sidebar-fg flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto",
          isPremiumSidebar && "bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-800",
          isRTL ? "right-0 border-l border-r-0" : "left-0",
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("flex items-center justify-between h-16 px-6", isPremiumSidebar ? "border-none" : "border-b border-slate-100 dark:border-slate-800")}>
          {renderLogo()}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isPremiumSidebar && <div className="mx-6 border-b border-slate-100 dark:border-slate-800/50 mb-2" />}

        <nav className={cn("flex-1 overflow-y-auto p-4 space-y-1.5", isPremiumSidebar && "px-5 py-4")}>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={`${role}:${item.href}:${item.label}`}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isPremiumSidebar && (
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200/50 dark:shadow-none"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                  )
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isPremiumSidebar && "h-[18px] w-[18px]")} />
                <span>{locale === "ar" ? item.labelAr : item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2">
            <button
              type="button"
              onClick={async () => {
                setSidebarOpen(false);
                await handleLogout();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30",
                isPremiumSidebar && "hover:bg-rose-50 dark:hover:bg-rose-950/20"
              )}
            >
              <LogOut className={cn("h-4 w-4", isPremiumSidebar && "h-[18px] w-[18px]")} />
              <span>{t("logout")}</span>
            </button>
          </div>
        </nav>

        <div className={cn("p-4 border-t", isPremiumSidebar ? "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" : "border-sidebar-border")}>
          {user && (
            <div className={cn("flex items-center gap-3 rounded-xl px-2", isPremiumSidebar ? "py-1.5" : "py-1")}>
              <Avatar className={cn("border border-border", isPremiumSidebar ? "h-10 w-10" : "h-9 w-9")}>
                <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`} />
                <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className={cn("truncate font-semibold text-slate-800 dark:text-slate-100", isPremiumSidebar ? "text-sm" : "text-sm")}>{profileName}</p>
                {isDoctorSidebar ? (
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{t("cardiologist")}</p>
                ) : isReceptionSidebar ? (
                  <p className="truncate text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">{locale === "ar" ? "موظف استقبال" : "Receptionist"}</p>
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
