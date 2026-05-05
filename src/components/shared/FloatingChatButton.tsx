"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

interface FloatingChatButtonProps {
  unreadCount?: number;
  onClick: () => void;
}

export function FloatingChatButton({
  unreadCount = 0,
  onClick,
}: FloatingChatButtonProps) {
  const [showBubble, setShowBubble] = useState(false);
  const pathname = usePathname();
  const { isRTL } = useTranslation();

  useEffect(() => {
    const isDashboard = pathname === "/dashboard" || pathname?.endsWith("/dashboard");
    let showTimer: NodeJS.Timeout | undefined;
    let hideTimer: NodeJS.Timeout | undefined;

    if (isDashboard) {
      showTimer = setTimeout(() => setShowBubble(true), 0);
      hideTimer = setTimeout(() => setShowBubble(false), 3000);
    } else {
      showTimer = setTimeout(() => setShowBubble(false), 0);
    }

    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [pathname]);

  return (
    <div className="fixed right-6 rtl:right-auto rtl:left-6 bottom-[92px] md:bottom-[40px] lg:right-10 lg:rtl:right-auto lg:rtl:left-10 lg:bottom-[40px] z-[100] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-blue-600 text-white px-6 py-4 rounded-3xl shadow-xl shadow-blue-200 w-[240px] pointer-events-auto"
          >
            <p className={`text-sm font-bold leading-relaxed ${isRTL ? "text-right" : "text-left"}`}>
              {isRTL ? "تحتاج مساعدة؟ اسألني عن أي شيء" : "Need help? Ask me anything"}
            </p>
            {/* Arrow */}
            <div className="absolute -bottom-2 right-8 rtl:right-auto rtl:left-8 w-4 h-4 bg-blue-600 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className="pointer-events-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-300 transition-all border-4 border-white relative"
        aria-label="Open chatbot"
      >
        <Bot className="h-8 w-8" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-rose-500 border-2 border-white px-1 text-[11px] font-bold text-white shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
