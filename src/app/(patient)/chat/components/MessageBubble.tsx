"use client";

import React, { useState, useRef } from "react";
import { Check, CheckCheck, Stethoscope, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/services/doctorChatService";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  senderFallback: string;
  formattedTime: string;
}

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  if (status === "seen") {
    return <CheckCheck size={14} className="text-white/80" />;
  }
  if (status === "delivered") {
    return <CheckCheck size={14} className="text-white/40" />;
  }
  return <Check size={14} className="text-white/40" />;
}

export function MessageBubble({
  message,
  mine,
  senderFallback,
  formattedTime,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = () => {
    timerRef.current = setTimeout(() => {
      setShowMenu(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setShowMenu(false);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "mb-6 flex gap-3 items-end relative",
          mine ? "flex-row-reverse" : "flex-row"
        )}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      >
        {/* Avatar for others */}
        {!mine && (
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm flex-shrink-0 mb-1">
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
              <Stethoscope className="h-5 w-5 text-slate-400" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn(
          "flex flex-col relative",
          mine ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "relative max-w-[85vw] md:max-w-md px-5 py-4 shadow-sm transition-all duration-300",
            mine 
              ? "rounded-[28px] rounded-br-[8px] bg-[#4F46E5] text-white" 
              : "rounded-[28px] rounded-bl-[8px] bg-[#EEF2F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          )}>
            {/* Sender Name for incoming messages */}
            {!mine && (
              <span className="block mb-1 text-[14px] font-bold text-slate-900 dark:text-slate-100 opacity-90">
                {message.senderName ?? senderFallback}
              </span>
            )}

            <p className={cn(
              "text-[15px] leading-relaxed font-medium",
              !mine ? "text-slate-600 dark:text-slate-300" : "text-white"
            )}>
              {message.text}
            </p>

            <div className="mt-1 flex items-center justify-end gap-1.5">
              {mine && <StatusIcon status={message.status} />}
              <span className={cn(
                "text-[10px] font-bold tracking-tight opacity-70 uppercase",
                mine ? "text-white" : "text-slate-400"
              )}>
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Context Menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px]" 
                  onClick={() => setShowMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className={cn(
                    "absolute z-50 min-w-[200px] overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 p-1.5",
                    mine ? "bottom-full right-0 mb-2" : "bottom-full left-0 mb-2"
                  )}
                >
                  <div className="px-3 py-2.5 flex items-center gap-2.5 border-b border-slate-50 dark:border-slate-700/50">
                    <CheckCheck size={14} className={cn(message.status === "seen" ? "text-blue-500" : "text-slate-400")} />
                    <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-tight">
                      {message.status === "seen" ? "Read" : "Delivered"} {formattedTime}
                    </span>
                  </div>
                  
                  <button
                    onClick={copyToClipboard}
                    className="w-full px-3 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group"
                  >
                    <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Copy message</span>
                    <Copy size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Copy Feedback Modal */}
      <AnimatePresence>
        {showCopiedToast && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                <Check className="h-10 w-10 text-emerald-500" strokeWidth={3} />
              </div>
              <h2 className="text-[22px] font-extrabold text-slate-900 dark:text-slate-50 mb-2">
                Message copied
              </h2>
              <p className="text-[15px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
                You can now paste it wherever you need.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
