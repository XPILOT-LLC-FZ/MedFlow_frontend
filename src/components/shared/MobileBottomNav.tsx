"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Calendar, Plus, MessagesSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useSearchParams } from "next/navigation";
import { useProfileUiStore } from "@/stores/useProfileUiStore";

import { useBookingFlowStore } from "@/stores/useBookingFlowStore";

const NAV_ITEMS = [
  {
    label: "Home",
    labelAr: "الرئيسية",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Schedule",
    labelAr: "المواعيد",
    href: "/appointments",
    icon: Calendar,
  },
  {
    label: "Plus",
    labelAr: "إضافة",
    href: "/appointments",
    icon: Plus,
    isCenter: true,
  },
  {
    label: "Cart",
    labelAr: "السلة",
    href: "/chat", // Mapping to chat for now as there's no cart
    icon: MessagesSquare,
  },
  {
    label: "Profile",
    labelAr: "الملف الشخصي",
    href: "/profile",
    icon: User,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useTranslation();
  const isDeepFlow = useProfileUiStore((state) => state.isDeepFlow);

  // Show on patient routes (excluding main landing and other modules)
  const isPatientRoute = pathname !== "/main" &&
    pathname !== "/" &&
    !pathname.startsWith("/doctor") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/reception") &&
    !pathname.startsWith("/super-dashboard") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/signup");
  const profileSection = searchParams.get("section");
  const isProfileRoute = pathname === "/profile";
  const shouldHideForProfile = isProfileRoute && (isDeepFlow || (profileSection && profileSection !== "profile"));

  if (!isPatientRoute || shouldHideForProfile) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="relative h-20 w-full pointer-events-auto">
        {/* SVG Background with Notch and Top Border/Shadow */}
        <div className="absolute inset-0">
          <svg
            viewBox="0 0 100 30"
            className="w-full h-full drop-shadow-[0_-1px_8px_rgba(0,0,0,0.08)]"
            preserveAspectRatio="none"
          >
            <path
              d="M0 30 V8 Q0 0 8 0 H35 C40 0 42 18 50 18 C58 18 60 0 65 0 H92 Q100 0 100 8 V30 Z"
              className="fill-white dark:fill-slate-900"
            />
            {/* Subtle top border line */}
            <path
              d="M0 10 Q0 2 8 2 H25 C32 2 35 26 50 26 C65 26 68 2 75 2 H92 Q100 2 100 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.1"
              className="text-slate-100 dark:text-slate-800"
            />
          </svg>
        </div>

        {/* Navigation Content */}
        <div className="absolute bottom-0 left-0 right-0 h-22 flex items-start justify-around px-4 pt-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <div key={item.label} className="relative -top-12 flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      useBookingFlowStore.getState().openSpec();
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-16 w-16 rounded-full bg-[#4659ff] flex items-center justify-center text-white cursor-pointer"
                    >
                      <Plus className="h-10 w-10" strokeWidth={1} />
                    </motion.div>
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-16 transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors duration-300",
                      isActive ? "text-[#0066FF]" : "text-slate-400 dark:text-slate-500"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-bold transition-colors",
                      isActive ? "text-[#0066FF]" : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {locale === "ar" ? item.labelAr : item.label}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute bottom-[-9px] w-12 h-1.5 bg-[#0066FF] rounded-t-full">
                    {/* Small bump in the middle of the indicator */}
                    <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-3 h-2 bg-[#0066FF] rounded-full" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
