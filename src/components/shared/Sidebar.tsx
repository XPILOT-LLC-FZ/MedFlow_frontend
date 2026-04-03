"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, User, Users, Stethoscope, ClipboardList,
  Package, BarChart3, Clock, CreditCard, Shield, FileText, Settings,
  ChevronLeft, ChevronRight, X, Heart,
} from "lucide-react";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
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
    { label: "Appointments", labelAr: "المواعيد", href: "/appointments", icon: Calendar },
    { label: "Profile", labelAr: "الملف الشخصي", href: "/profile", icon: User },
  ],
  MEDICAL_ADMIN: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Doctors", labelAr: "الأطباء", href: "/admin/doctors", icon: Stethoscope },
    { label: "Reception", labelAr: "الاستقبال", href: "/admin/reception", icon: Users },
    { label: "Services", labelAr: "الخدمات", href: "/admin/services", icon: ClipboardList },
    { label: "Inventory", labelAr: "المخزون", href: "/admin/inventory", icon: Package },
    { label: "Analytics", labelAr: "التحليلات", href: "/admin/analytics", icon: BarChart3 },
  ],
  DOCTOR: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Schedule", labelAr: "الجدول", href: "/doctor/schedule", icon: Calendar },
    { label: "Appointments", labelAr: "المواعيد", href: "/doctor/appointments", icon: ClipboardList },
  ],
  RECEPTION: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/reception/dashboard", icon: LayoutDashboard },
    { label: "Booking", labelAr: "الحجز", href: "/reception/booking", icon: Calendar },
    { label: "Waiting Room", labelAr: "غرفة الانتظار", href: "/reception/waiting-room", icon: Clock },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", labelAr: "لوحة التحكم", href: "/super-dashboard", icon: LayoutDashboard },
    { label: "Users", labelAr: "المستخدمون", href: "/super-users", icon: Users },
    { label: "Logs", labelAr: "السجلات", href: "/super-logs", icon: FileText },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useStore();
  const { user } = useAuthStore();
  const { t, locale, isRTL } = useTranslation();

  // Use the authenticated user's role; fall back to PATIENT
  const role = user?.role ?? "PATIENT";
  const items = navByRole[role];

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
          "fixed top-0 z-50 h-full w-64 border-r bg-sidebar-bg text-sidebar-fg flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto",
          isRTL ? "right-0 border-l border-r-0" : "left-0",
          sidebarOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-base">ClinicOS</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Healthcare Platform</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{locale === "ar" ? item.labelAr : item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>{t("settings")}</span>
          </Link>
        </div>
      </motion.aside>
    </>
  );
}
