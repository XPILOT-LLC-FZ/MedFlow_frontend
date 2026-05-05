"use client";

import { Info, MoreHorizontal, Paperclip, Mic, Send, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, Archive, BellOff } from "lucide-react";

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

interface ReceptionChatMainProps {
  recipient: Recipient | null;
  messages: Message[];
  inputValue: string;
  isTyping?: boolean;
  onSend: () => void;
  onInputChange: (val: string) => void;
  onFavorite?: () => void;
  onArchive?: () => void;
  onMute?: () => void;
  onToggleContactInfo?: () => void;
  onBack?: () => void;
  isContactInfoOpen?: boolean;
}

export function ReceptionChatMain({
  recipient,
  messages,
  inputValue,
  isTyping,
  onSend,
  onInputChange,
  onFavorite,
  onArchive,
  onMute,
  onToggleContactInfo,
  onBack,
  isContactInfoOpen,
}: ReceptionChatMainProps) {
  const { t, isRTL, locale } = useTranslation();

  if (!recipient) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="hidden md:flex flex-1 items-center justify-center bg-white p-8 text-center text-slate-400 dark:bg-slate-950">
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
    <div dir={isRTL ? "rtl" : "ltr"} className="flex h-full flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950 relative">
      {/* Chat Header */}
      <header className={cn("flex h-[70px] md:h-[80px] flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-slate-950 shadow-sm z-10", isRTL ? "flex-row-reverse" : "flex-row")}>
        <div className={cn("flex items-center gap-3 md:gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
          {/* Back Button for Mobile */}
          <button 
            onClick={onBack}
            className={cn("md:hidden p-2 rounded-full hover:bg-slate-100 text-slate-500", isRTL ? "-mr-2 ml-0" : "-ml-2 mr-0")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn(isRTL ? "rotate-0" : "rotate-180")}>
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <div className="relative">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-2 ring-white dark:ring-slate-950 shadow-sm">
              {recipient.avatar ? (
                <Image src={recipient.avatar} alt={recipient.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-lg">
                  {recipient.name.charAt(0)}
                </div>
              )}
            </div>
            {recipient.status === "online" && (
              <div className={cn("absolute -bottom-0.5 h-3 w-3 md:h-3.5 md:w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950", isRTL ? "-left-0.5" : "-right-0.5")} />
            )}
          </div>
          <div className={cn("min-w-0", isRTL ? "text-right" : "text-left")}>
            <h2 className="font-bold text-slate-900 dark:text-white text-[14px] md:text-[16px] tracking-tight truncate max-w-[120px] md:max-w-none">{recipient.name}</h2>
            <div className={cn("flex items-center gap-1.5 md:gap-2 mt-0.5", isRTL ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("flex items-center gap-1", isRTL ? "flex-row-reverse" : "flex-row")}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {recipient.status === "online" ? (isRTL ? "متصل" : "Online") : (isRTL ? "غير متصل" : "Offline")}
                </span>
              </div>
              <span className="hidden md:inline h-4 w-px bg-slate-200 mx-1" />
              <span className="hidden md:inline px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                {recipient.role}
              </span>
            </div>
          </div>
        </div>

        <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
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
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 p-2 rounded-2xl shadow-xl border-slate-100 dark:border-slate-800">
              <DropdownMenuItem 
                onClick={onFavorite}
                className={cn("rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 gap-2", isRTL ? "flex-row-reverse text-right" : "flex-row")}
              >
                <Star className={cn("h-4 w-4", recipient.isFavorite && "fill-amber-400 text-amber-400")} />
                <span>{recipient.isFavorite ? (isRTL ? "إزالة من المفضلة" : "Remove from favorites") : (isRTL ? "إضافة إلى المفضلة" : "Add to favorites")}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onArchive}
                className={cn("rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 gap-2", isRTL ? "flex-row-reverse text-right" : "flex-row")}
              >
                <Archive className="h-4 w-4" />
                <span>{isRTL ? "أرشفة المحادثة" : "Archive chat"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={onMute}
                className={cn("rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 gap-2", isRTL ? "flex-row-reverse text-right" : "flex-row")}
              >
                <BellOff className={cn("h-4 w-4", recipient.isMuted && "text-blue-500")} />
                <span>{recipient.isMuted ? (isRTL ? "إلغاء كتم التنبيهات" : "Unmute notifications") : (isRTL ? "كتم التنبيهات" : "Mute notifications")}</span>
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
                  isRTL ? (msg.isMine ? "rounded-tr-none" : "rounded-tl-none") : (msg.isMine ? "rounded-tr-none" : "rounded-tl-none"), // Note: The logic in Tailwind handles it nicely
                  msg.isMine 
                    ? "bg-[#2563EB] text-white" 
                    : "bg-white border border-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                )}
              >
                <p className={isRTL ? "text-right" : "text-left"}>{msg.text}</p>
              </div>
              <div className={cn("flex items-center gap-2 mt-1.5 px-1", isRTL ? "flex-row-reverse" : "flex-row")}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(msg.time).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' })}</span>
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
              className={cn("flex items-center gap-3", isRTL ? "self-end" : "self-start")}
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
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-blue-400">
            <Paperclip size={20} />
          </button>

          <div className={cn("relative flex flex-1 items-center bg-[#F1F5F9]/60 rounded-xl px-4 dark:bg-slate-900/50 focus-within:bg-[#F1F5F9] dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all", isRTL ? "flex-row-reverse" : "flex-row")}>
            <textarea
              rows={1}
              placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."}
              className={cn("w-full max-h-32 resize-none border-none bg-transparent py-3 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-200", isRTL ? "text-right" : "text-left")}
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

          <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
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
              <Send size={18} className={cn(inputValue.trim() && (isRTL ? "transform rotate-12" : "transform -rotate-12"))} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
