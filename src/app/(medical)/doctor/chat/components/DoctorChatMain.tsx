"use client";

import React from "react";
import { Phone, Video, Info, MoreHorizontal, Paperclip, Mic, Send, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Star, Archive, BellOff, Trash2 } from "lucide-react";

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
  isFavorite?: boolean;
  isMuted?: boolean;
}

interface DoctorChatMainProps {
  recipient: Recipient | null;
  messages: Message[];
  inputValue: string;
  isTyping?: boolean;
  onSend: () => void;
  onInputChange: (val: string) => void;
  onFavorite?: () => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
  onToggleContactInfo?: () => void;
  isContactInfoOpen?: boolean;
}

export function DoctorChatMain({
  recipient,
  messages,
  inputValue,
  isTyping,
  onSend,
  onInputChange,
  onFavorite,
  onArchive,
  onMute,
  onDelete,
  onToggleContactInfo,
  isContactInfoOpen,
}: DoctorChatMainProps) {
  const { t, locale } = useTranslation();

  if (!recipient) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-8 text-center text-slate-400 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-sm">
             <MoreHorizontal size={32} className="opacity-20" />
          </div>
          <p className="font-bold text-slate-900 dark:text-white">{t("noResults")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
      {/* Chat Header */}
      <header className="flex h-[80px] flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 dark:border-slate-800 dark:bg-slate-950 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-2 ring-white dark:ring-slate-950 shadow-sm">
              {recipient.avatar ? (
                <Image src={recipient.avatar} alt={recipient.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-lg">
                  {recipient.name.charAt(0)}
                </div>
              )}
            </div>
            {recipient.status === "online" && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-[16px] tracking-tight">{recipient.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {recipient.status === "online" ? (locale === "ar" ? "متصل" : "Online") : (locale === "ar" ? "غير متصل" : "Offline")}
                </span>
              </div>
              <span className="h-4 w-px bg-slate-200 mx-1" />
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                {recipient.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-800">
               <Video size={18} />
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-800">
               <Phone size={18} />
          </button>
          <button 
            onClick={onToggleContactInfo}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl border transition-all",
              isContactInfoOpen 
                ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
                : "border-slate-100 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            )}
          >
               <Info size={18} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-800">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100 dark:border-slate-800">
              <DropdownMenuItem 
                onClick={onFavorite}
                className="rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200"
              >
                <Star className={cn("h-4 w-4", recipient.isFavorite && "fill-amber-400 text-amber-400")} />
                <span>{recipient.isFavorite ? (locale === "ar" ? "إزالة من المفضلة" : "Remove from favorites") : (locale === "ar" ? "إضافة إلى المفضلة" : "Add to favorites")}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onArchive}
                className="rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200"
              >
                <Archive className="h-4 w-4" />
                <span>{locale === "ar" ? "أرشفة المحادثة" : "Archive chat"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={onMute}
                className="rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200"
              >
                <BellOff className={cn("h-4 w-4", recipient.isMuted && "text-blue-500")} />
                <span>{recipient.isMuted ? (locale === "ar" ? "إلغاء كتم التنبيهات" : "Unmute notifications") : (locale === "ar" ? "كتم التنبيهات" : "Mute notifications")}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-900" />
              
              <DropdownMenuItem 
                onClick={onDelete}
                className="rounded-xl px-3 py-2 text-[13px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 focus:bg-red-50 focus:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>{locale === "ar" ? "حذف المحادثة" : "Delete chat"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 space-y-6 overflow-y-auto bg-[#F8FAFC] p-6 thin-scrollbar dark:bg-slate-950/50">
        {messages.map((msg) => {
          return (
            <div key={msg.id} className={cn(
              "flex flex-col",
              msg.isMine ? "items-end" : "items-start"
            )}>
              <div
                className={cn(
                  "max-w-[75%] rounded-[20px] px-5 py-3 text-[14px] font-medium leading-relaxed shadow-sm",
                  msg.isMine 
                    ? "bg-[#2563EB] text-white" 
                    : "bg-white border border-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                )}
              >
                <p>{msg.text}</p>
              </div>
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</span>
                {msg.isMine && (
                  <div className="flex">
                    {msg.status === "seen" ? (
                      <CheckCheck size={12} className="text-blue-500" />
                    ) : (
                      <Check size={12} className="text-slate-400" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}


          {isTyping && (
            <div
              className="flex items-center gap-3 self-start"
            >
              <div className="flex gap-1 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}

      </div>

      {/* Message Input Footer */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-blue-400">
            <Paperclip size={20} />
          </button>

          <div className="relative flex flex-1 items-center bg-[#F1F5F9]/60 rounded-xl px-4 dark:bg-slate-900/50 focus-within:bg-[#F1F5F9] dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
            <textarea
              rows={1}
              placeholder={locale === "ar" ? "اكتب رسالة..." : "Type a message..."}
              className="w-full max-h-32 resize-none border-none bg-transparent py-3 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-200"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-blue-400">
              <Mic size={20} />
            </button>
            <button 
              onClick={onSend}
              disabled={!inputValue.trim()}
              className={cn(
                "h-11 w-11 flex items-center justify-center rounded-xl shadow-lg transition-all",
                inputValue.trim() 
                  ? "bg-[#2563EB] text-white shadow-blue-600/20" 
                  : "bg-blue-200 text-white cursor-not-allowed"
              )}
            >
              <Send size={18} className={cn(inputValue.trim() && "transform -rotate-12")} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
