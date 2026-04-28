"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface FloatingChatButtonProps {
  unreadCount?: number;
  onClick: () => void;
}

export function FloatingChatButton({
  unreadCount = 0,
  onClick,
}: FloatingChatButtonProps) {
  return (
    <motion.button
      type="button"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="fixed right-6 bottom-[90px] lg:bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_50px_-18px_rgba(15,23,42,0.55)] transition-shadow hover:shadow-[0_20px_60px_-18px_rgba(15,23,42,0.65)] rtl:right-auto rtl:left-6"
      aria-label="Open chatbot"
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground rtl:-right-auto rtl:-left-1">
          {Math.min(unreadCount, 9)}
          {unreadCount > 9 ? "+" : ""}
        </span>
      )}
    </motion.button>
  );
}
