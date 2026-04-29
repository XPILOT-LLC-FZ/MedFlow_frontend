"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { DashboardTopbar } from "@/components/shared/DashboardTopbar";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { usePathname, useSearchParams } from "next/navigation";
import { useProfileUiStore } from "@/stores/useProfileUiStore";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { Bell } from "lucide-react";
import { PatientNotificationsDialog } from "@/components/shared/PatientNotificationsDialog";
import { notificationsService } from "@/services/notificationsService";
import { useState, useCallback, useEffect, Suspense } from "react";
import type { InAppNotification } from "@/types";

function MobileBottomNavWrapper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDeepFlow = useProfileUiStore((state) => state.isDeepFlow);
  const profileSection = searchParams.get("section");
  const shouldHideMobileBottomNav = pathname === "/profile" && (isDeepFlow || (profileSection && profileSection !== "profile"));

  if (shouldHideMobileBottomNav) return null;
  return <MobileBottomNav />;
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useTranslation();
  const pathname = usePathname();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getInAppNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications in Layout", err);
    }
  }, []);

  useEffect(() => {
    const initNotifications = async () => {
      await refreshNotifications();
    };
    initNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <RoleGuard allowedRoles={["PATIENT"]}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <DashboardTopbar />

          {/* Mobile Settings Toggles */}
          {!pathname.includes("/dashboard") && (
            <div className="lg:hidden fixed top-4 right-4 rtl:right-auto rtl:left-4 z-[100] flex items-center gap-3 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-400/20 dark:shadow-none">
                <button
                  onClick={() => setNotifOpen(true)}
                  className="relative h-8 w-8 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 border-1.5 border-white dark:border-slate-900 animate-pulse" />
                  )}
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                <LanguageToggle variant="ghost" className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold" />
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                <ThemeToggle variant="ghost" className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" />
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6" dir={locale === "ar" ? "rtl" : "ltr"}>{children}</main>
          <Suspense fallback={null}>
            <MobileBottomNavWrapper />
          </Suspense>

          <PatientNotificationsDialog
            isOpen={notifOpen}
            onOpenChange={setNotifOpen}
            notifications={notifications}
            onRefresh={refreshNotifications}
          />
        </div>
      </div>
    </RoleGuard>
  );
}
