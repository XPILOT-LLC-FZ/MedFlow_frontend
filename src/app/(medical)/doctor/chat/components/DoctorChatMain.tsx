"use client";

import React from "react";
import { Phone, Video, MoreVertical, Paperclip, Mic, Send, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge } from "./StatusBadge";
import Image from "next/image";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isMine: boolean;
  status?: "sent" | "delivered" | "seen";
}

interface Recipient {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: "online" | "offline";
}

interface DoctorChatMainProps {
  recipient: Recipient | null;
  messages: Message[];
  inputValue: string;
  isTyping?: boolean;
  onSend: () => void;
  onInputChange: (val: string) => void;
}

export function DoctorChatMain({
  recipient,
  messages,
  inputValue,
  isTyping,
  onSend,
  onInputChange,
}: DoctorChatMainProps) {
  const { t } = useTranslation();

  if (!recipient) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-8 text-center text-slate-400 transition-colors duration-300 dark:bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-sm">
             <MoreVertical size={32} className="opacity-20" />
          </div>
          <p className="font-bold text-slate-900 dark:text-white">{t("noResults")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white transition-colors duration-300 dark:bg-slate-950">
      {/* Chat Header */}
      <header className="flex h-[74px] flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-50 dark:ring-slate-900 transition-all duration-300">
              {recipient.avatar ? (
                <Image src={recipient.avatar} alt={recipient.name} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-600 dark:text-blue-400 font-bold text-base">
                  {recipient.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -inline-end-0.5">
              <StatusBadge status={recipient.status} className="h-3.5 w-3.5 border-2 border-white dark:border-slate-900 shadow-sm" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 dark:text-white text-base tracking-tight">{recipient.name}</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                {recipient.role}
              </span>
            </div>
            <div className="flex items-center gap-1.5 leading-none">
               <span className={cn(
                 "w-1.5 h-1.5 rounded-full",
                 recipient.status === "online" ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
               )} />
               <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 capitalize">{recipient.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
               <Video size={18} />
          </button>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
               <Phone size={18} />
          </button>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#F6F9FF] p-6 [scrollbar-width:none] transition-colors duration-300 dark:bg-[#020617] [&::-webkit-scrollbar]:hidden">
        {messages.map((msg, idx) => {
          const showTime = idx === 0 || messages[idx-1].time !== msg.time;
          return (
            <div key={msg.id} className={cn(
              "flex flex-col",
              msg.isMine ? "items-end" : "items-start"
            )}>
              {showTime && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mb-2 uppercase tracking-[0.2em]">{msg.time}</span>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed transition-all duration-300",
                  msg.isMine 
                    ? "rounded-br-md bg-[#2F6DF6] text-white shadow-sm" 
                    : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                )}
              >
                <p>{msg.text}</p>
                
                {msg.isMine && (
                  <div className="flex justify-end mt-1 opacity-70">
                    {msg.status === "sent" && <Check size={12} className="text-white" />}
                    {msg.status === "delivered" && <CheckCheck size={12} className="text-white" />}
                    {msg.status === "seen" && <CheckCheck size={12} className="text-white" />}
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 self-start"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("typing")}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-4 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950">
        <div className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F7FAFF] p-1.5 ps-3 transition-all duration-300 focus-within:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
          <button className="rounded-lg p-1 text-slate-400 transition-all duration-300 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400">
            <Paperclip size={18} />
          </button>

          <textarea
            rows={1}
            placeholder={t("typeMessage")}
            className="max-h-32 flex-1 resize-none border-none bg-transparent py-2 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />

          <div className="flex items-center gap-1 pe-1">
            <button className="rounded-lg p-2 text-slate-400 transition-all duration-300 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400">
              <Mic size={18} />
            </button>
            <button 
              onClick={onSend}
              disabled={!inputValue.trim()}
              className={cn(
                "rounded-lg p-2.5 transition-all duration-300",
                inputValue.trim() 
                  ? "bg-[#7EA5FF] text-white hover:bg-[#2F6DF6]" 
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              )}
            >
              <Send size={16} className={cn(inputValue.trim() && "transform -rotate-12")} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
