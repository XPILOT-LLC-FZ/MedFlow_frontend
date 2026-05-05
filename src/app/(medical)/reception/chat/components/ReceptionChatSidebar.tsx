"use client";

import { useState } from "react";
import { Search, Users, ShieldCheck, ShieldAlert, User, MoreVertical, Star, Archive, BellOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";

interface ConversationItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  avatar?: string;
  status: "online" | "offline";
  role: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
}

interface ReceptionChatSidebarProps {
  conversations: ConversationItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onFilterChange: (filter: string) => void;
  onFavorite?: (id: string) => void;
  onArchive?: (id: string) => void;
  onMute?: (id: string) => void;
  onNewChat?: () => void;
}

export function ReceptionChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onFilterChange,
  onFavorite,
  onArchive,
  onMute,
  onNewChat,
}: ReceptionChatSidebarProps) {
  const { t, isRTL, locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["All", "Patients", "Staff", "Admin"];
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "PATIENT": return <Users size={12} className="text-blue-500" />;
      case "DOCTOR": return <ShieldCheck size={12} className="text-emerald-500" />;
      case "ADMIN": return <ShieldAlert size={12} className="text-amber-500" />;
      default: return <User size={12} className="text-slate-400" />;
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const filterToRole: Record<string, string> = {
      "Patients": "PATIENT",
      "Staff": "STAFF",
      "Admin": "ADMIN"
    };
    const targetRole = filterToRole[activeFilter];
    const matchesFilter = activeFilter === "All" || c.role === targetRole;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className={cn(
      "flex h-full min-w-[280px] w-full md:w-[320px] lg:w-[380px] flex-col border-e border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950",
      isRTL ? "border-e-0 border-s" : "border-e",
      selectedId ? "hidden md:flex" : "flex"
    )}>
      <div className="p-5 space-y-5">
        <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
          <h1 className="text-[24px] font-black text-[#2563EB] tracking-tight">
            {t("messages") || (isRTL ? "الرسائل" : "Messages")}
          </h1>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          )}
        </div>

        <div className="relative group">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors", isRTL ? "right-4" : "left-4")} size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث..." : "Search..."}
            className={cn("w-full h-10 bg-[#F1F5F9]/60 dark:bg-slate-900/50 border-none rounded-full text-[13px] font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:bg-[#F1F5F9] dark:focus:bg-slate-900 transition-all", isRTL ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={cn("flex items-center gap-1.5 overflow-x-auto thin-scrollbar", isRTL ? "flex-row-reverse" : "flex-row")}>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                onFilterChange(filter);
              }}
              className={cn(
                "h-7 px-3 rounded-xl text-[11px] font-bold transition-all shrink-0",
                activeFilter === filter
                  ? "bg-[#2563EB] text-white shadow-lg shadow-blue-600/20"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-900/50"
              )}
            >
              {filter === "All" ? (isRTL ? "الكل" : "All") : 
               filter === "Patients" ? (isRTL ? "مرضى" : "Patients") :
               filter === "Staff" ? (isRTL ? "طاقم" : "Staff") :
               (isRTL ? "مدير" : "Admin")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-0 pb-6 thin-scrollbar divide-y divide-slate-50 dark:divide-slate-900/50">
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              "group relative flex w-full items-center gap-3 p-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/30",
              isRTL ? "text-right flex-row-reverse" : "text-left flex-row",
              selectedId === conv.id && "bg-[#F0F7FF] dark:bg-blue-900/10 before:absolute before:top-0 before:bottom-0 before:w-[3px] before:bg-[#2563EB]",
              selectedId === conv.id && (isRTL ? "before:right-0" : "before:left-0")
            )}
          >
            <button
              onClick={() => onSelect(conv.id)}
              className={cn("flex-1 flex items-center gap-3 min-w-0", isRTL ? "flex-row-reverse" : "flex-row")}
            >
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white dark:ring-slate-950 shadow-sm">
                  {conv.avatar ? (
                    <Image src={conv.avatar} alt={conv.name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600 font-bold text-base">
                      {conv.name.charAt(0)}
                    </div>
                  )}
                </div>
                {conv.status === "online" && (
                  <div className={cn("absolute -bottom-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950", isRTL ? "-left-0.5" : "-right-0.5")} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className={cn("flex items-center justify-between mb-0.5", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("flex items-center gap-1", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <h3 className="truncate text-[14px] font-bold text-slate-900 dark:text-slate-100">
                      {conv.name}
                    </h3>
                    {getRoleIcon(conv.role)}
                    {conv.isFavorite && <Star size={10} className="text-amber-400 fill-amber-400" />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    {conv.time}
                  </span>
                </div>

                <div className={cn("flex items-center justify-between gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <p className={cn(
                    "truncate text-[12px] transition-colors",
                    isRTL ? "text-right" : "text-left",
                    conv.unreadCount ? "font-bold text-slate-700 dark:text-slate-200" : "font-medium text-slate-400 dark:text-slate-500"
                  )}>
                    {conv.lastMessage}
                  </p>
                  <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}>
                    {conv.isMuted && <BellOff size={10} className="text-slate-400" />}
                    {conv.unreadCount && (
                      <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-black text-white shadow-sm">
                        {conv.unreadCount.toLocaleString(isRTL ? "ar-EG" : "en-US")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 p-2 rounded-2xl shadow-xl border-slate-100 dark:border-slate-800">
                  <DropdownMenuItem 
                    onClick={() => onFavorite?.(conv.id)}
                    className={cn("rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 gap-2", isRTL ? "flex-row-reverse text-right" : "flex-row")}
                  >
                    <Star className={cn("h-4 w-4", conv.isFavorite && "fill-amber-400 text-amber-400")} />
                    <span>{conv.isFavorite ? (isRTL ? "إزالة من المفضلة" : "Remove from favorites") : (isRTL ? "إضافة إلى المفضلة" : "Add to favorites")}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => onArchive?.(conv.id)}
                    className={cn("rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 gap-2", isRTL ? "flex-row-reverse text-right" : "flex-row")}
                  >
                    <Archive className="h-4 w-4" />
                    <span>{isRTL ? "أرشفة المحادثة" : "Archive chat"}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => onMute?.(conv.id)}
                    className={cn("rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 gap-2", isRTL ? "flex-row-reverse text-right" : "flex-row")}
                  >
                    <BellOff className={cn("h-4 w-4", conv.isMuted && "text-blue-500")} />
                    <span>{conv.isMuted ? (isRTL ? "إلغاء كتم التنبيهات" : "Unmute notifications") : (isRTL ? "كتم التنبيهات" : "Mute notifications")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}