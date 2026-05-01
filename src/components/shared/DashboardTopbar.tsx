"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Role, InAppNotification } from "@/types";
import { cn } from "@/lib/utils";
import { notificationsService } from "@/services/notificationsService";
import { formatDistanceToNow } from "date-fns";
import { NotificationsDialog } from "@/components/shared/NotificationsDialog";
import { PatientNotificationsDialog } from "@/components/shared/PatientNotificationsDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { ar } from "date-fns/locale";
import {
  ShieldCheck,
  User,
  Stethoscope,
  Bell,
  Search,
  Moon,
  Sun,
  Building2,
  ChevronDown,
  Activity
} from "lucide-react";

const roleLabels: Record<Role, { en: string; ar: string }> = {
  PATIENT: { en: "Patient", ar: "مريض" },
  ADMIN: { en: "Lead Administrator", ar: "إدارة" },
  DOCTOR: { en: "Lead Doctor", ar: "طبيب" },
  STAFF: { en: "Lead Receptionist", ar: "مسؤول استقبال" },
  SUPER_ADMIN: { en: "System Architect", ar: "مدير النظام" },
};

export function DashboardTopbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useStore();
  const { t, locale } = useTranslation();
  const { user, toggleAvailability } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [isFullNotificationsOpen, setIsFullNotificationsOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState<InAppNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getInAppNotifications();
      setRealNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
    const intervalId = setInterval(() => void refreshNotifications(), 60000);
    return () => clearInterval(intervalId);
  }, [refreshNotifications]);

  const role = user?.role ?? "PATIENT";
  const displayName = (locale === "ar" && user?.nameAr) ? user.nameAr : (user?.name || "User");
  const roleLabel = roleLabels[role][locale];

  return (
    <div className="hidden lg:flex w-full border-b border-slate-100 bg-white px-8 h-20 items-center justify-between sticky top-0 z-30 transition-all duration-300">
      {/* Left: Location Selector */}
      <div className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 px-3 py-2 rounded-2xl transition-colors">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 leading-none">Tanta, Gharbia</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 ml-1 group-hover:text-slate-600 transition-colors" />
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-2xl px-8" ref={searchRef}>
        <div className="relative group">
          <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === "ar" ? "ابحث عن المرضى، الأطباء أو المواعيد..." : "Search patients, doctors or appointments..."}
            className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-14 pr-6 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-200 focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Status Button (requested) */}
        {(role === "DOCTOR" || role === "STAFF" || role === "ADMIN") && (
          <Button
            variant="ghost"
            onClick={toggleAvailability}
            className={cn(
              "h-11 px-4 rounded-2xl flex items-center gap-2 transition-all duration-200 border",
              user?.isAvailable 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-slate-50 text-slate-500 border-slate-100"
            )}
          >
            <div className="relative">
              <Activity className={cn("h-4 w-4", user?.isAvailable && "animate-pulse")} />
              <span className={cn(
                "absolute -top-1 -right-1 h-2 w-2 rounded-full border-2 border-white",
                user?.isAvailable ? "bg-emerald-500" : "bg-slate-400"
              )} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">
              {locale === "ar" ? (user?.isAvailable ? "متاح" : "غير متاح") : (user?.isAvailable ? "Online" : "Offline")}
            </span>
          </Button>
        )}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotifOpen(!notifOpen)}
          className={cn(
            "h-12 w-12 rounded-2xl bg-blue-50/50 text-slate-600 hover:bg-blue-100 hover:text-blue-600 relative transition-all shadow-sm",
            notifOpen && "bg-blue-100 text-blue-600"
          )}
        >
          <Bell className="h-6 w-6" />
          {realNotifications.some(n => !n.readAt) && (
            <span className="absolute top-3.5 right-3.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-12 w-12 rounded-2xl bg-blue-50/50 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all shadow-sm"
        >
          {theme === "light" ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6 text-amber-500" />}
        </Button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <Avatar className="h-12 w-12 border-2 border-blue-600 p-0.5">
            <AvatarImage 
              src={user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email}`} 
              className="rounded-full"
            />
            <AvatarFallback className="bg-blue-600 text-white font-bold">{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-bold text-slate-900">{displayName}</span>
            <span className="text-xs font-medium text-slate-500">{roleLabel}</span>
          </div>
        </div>
      </div>

      {user?.role === "PATIENT" ? (
        <PatientNotificationsDialog
          isOpen={isFullNotificationsOpen}
          onOpenChange={setIsFullNotificationsOpen}
          notifications={realNotifications}
          onRefresh={refreshNotifications}
        />
      ) : (
        <NotificationsDialog
          isOpen={isFullNotificationsOpen}
          onOpenChange={setIsFullNotificationsOpen}
          notifications={realNotifications}
          onRefresh={refreshNotifications}
        />
      )}
    </div>
  );
}
