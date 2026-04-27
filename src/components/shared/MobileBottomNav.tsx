"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Calendar, Plus, MessagesSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { locale } = useTranslation();

  // Show on patient routes (excluding main landing and other modules)
  const isPatientRoute = pathname !== "/main" && 
    pathname !== "/" &&
    !pathname.startsWith("/doctor") && 
    !pathname.startsWith("/admin") && 
    !pathname.startsWith("/reception") && 
    !pathname.startsWith("/super-dashboard") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/signup");
  
  if (!isPatientRoute) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="relative h-20 w-full pointer-events-auto">
        {/* SVG Background with Notch and Top Border/Shadow */}
        <div className="absolute inset-0">
          <svg
            viewBox="0 0 100 30"
            className="w-full h-full drop-shadow-[0_-1px_4px_rgba(0,0,0,0.02)]"
            preserveAspectRatio="none"
          >
            <path
              d="M0 30 V8 Q0 0 8 0 H35 C40 0 42 18 50 18 C58 18 60 0 65 0 H92 Q100 0 100 8 V30 Z"
              className="fill-white dark:fill-slate-900"
            />
            {/* Subtle top border line */}
            <path
              d="M0 8 Q0 0 8 0 H35 C40 0 42 18 50 18 C58 18 60 0 65 0 H92 Q100 0 100 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.15"
              className="text-slate-100 dark:text-slate-800"
            />
          </svg>
        </div>

        {/* Navigation Content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-around px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <div key={item.label} className="relative -top-7 flex flex-col items-center">
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-14 w-14 rounded-full bg-[#4659ff] flex items-center justify-center text-white shadow-lg shadow-blue-500/30 border-[5px] border-white dark:border-slate-900"
                    >
                      <Plus className="h-7 w-7" strokeWidth={3} />
                    </motion.div>
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-0.5 mb-2">
                  <Icon
                    className={cn(
                      "h-5.5 w-5.5 transition-colors duration-300",
                      isActive ? "text-[#4659ff]" : "text-slate-400 dark:text-slate-500"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-bold transition-colors",
                      isActive ? "text-[#4659ff]" : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {locale === "ar" ? item.labelAr : item.label}
                  </span>
                </div>
                
                {isActive && (
                  <div className="absolute bottom-0 w-12 h-1 bg-[#4659ff] rounded-t-full">
                    {/* Small bump in the middle of the indicator */}
                    <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-1.5 bg-[#4659ff] rounded-full" />
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
