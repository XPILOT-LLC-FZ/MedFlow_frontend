"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  UserCircle, 
  Clock, 
  Bell, 
  FileText, 
  MessageSquare, 
  Pill
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n";
import { LanguageToggle } from "@/components/shared/LanguageToggle";

const NAV_ITEMS = [
  {
    name: "profile",
    href: "/doctor/settings/profile",
    icon: UserCircle,
  },
  {
    name: "workingHours",
    href: "/doctor/settings/working-hours",
    icon: Clock,
  },
  {
    name: "notificationsSettings",
    href: "/doctor/settings/notifications",
    icon: Bell,
  },
  {
    name: "diagnosisPreferences",
    href: "/doctor/settings/diagnosis",
    icon: FileText,
  },
  {
    name: "prescriptionSettings",
    href: "/doctor/settings/prescription-settings",
    icon: Pill,
  },
  {
    name: "communicationSettings",
    href: "/doctor/settings/communication",
    icon: MessageSquare,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="w-full sm:w-64 space-y-1.5 h-fit">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px]",
                isActive ? "text-white" : "text-slate-400 dark:text-slate-500",
              )}
            />
            {t(item.name as TranslationKey)}
          </Link>
        );
      })}

      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
        <LanguageToggle className="w-full justify-start px-4 py-3 rounded-xl border-none shadow-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 h-auto" />
      </div>
    </nav>
  );
}
