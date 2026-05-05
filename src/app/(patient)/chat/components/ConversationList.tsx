"use client";

import { useState } from "react";
import { Search, X, UserRound, Stethoscope, Paperclip, Check, CheckCheck, MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export interface ConversationListItem {
  id: string;
  title: string;
  subtitle: string;
  unreadCount?: number;
  avatarUrl?: string;
  lastMessageTime?: string;
  online?: boolean;
  lastMessageStatus?: "sent" | "delivered" | "seen";
  hasAttachment?: boolean;
}

interface ConversationListProps {
  title: string;
  items: ConversationListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isDoctor: boolean;
  isLoading?: boolean;
}

export function ConversationList({
  title,
  items,
  selectedId,
  onSelect,
  isDoctor,
  isLoading = false,
}: ConversationListProps) {
  const { locale, t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
      </div>

      {/* Search Bar */}
      <div className="px-6 pb-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
          <Input
            placeholder={t("searchByName") || "Search by name"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-12 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 transition-all focus-visible:border-primary focus-visible:ring-primary focus-visible:bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-24 md:pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 px-10 text-center animate-in fade-in duration-300">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-sm text-slate-500">
              {locale === "ar" ? "جاري تحميل المحادثات..." : "Loading messages..."}
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-10 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-8">
              <MessagesSquare className="h-20 w-20 text-blue-500" strokeWidth={1} />
            </div>
            <h3 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 mb-3">
              {searchQuery ? (locale === "ar" ? "لا توجد نتائج" : "No result") : (locale === "ar" ? "لا توجد رسائل" : "No messages yet")}
            </h3>
            <p className="text-[15px] leading-relaxed text-slate-400 dark:text-slate-500 max-w-[260px]">
              {searchQuery 
                ? (locale === "ar" 
                    ? `لم يتم العثور على نتائج لـ "${searchQuery}". حاول البحث عن شيء آخر.` 
                    : `There were no results for "${searchQuery}". Try another search.`)
                : (locale === "ar"
                    ? "سيتم إعلامك هنا بمجرد وجود شيء جديد."
                    : "You'll be notified here once there's something new.")}
            </p>
          </div>
        ) : null}

        <div className="space-y-1">
          {filteredItems.map((item) => {
            const selected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "w-full px-4 py-4 flex items-center gap-4 transition-all rounded-3xl",
                  selected 
                    ? "bg-slate-50 dark:bg-slate-900" 
                    : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                )}
              >
                {/* Avatar with Status Dot */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                    <AvatarImage src={item.avatarUrl} alt={item.title} />
                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                      {isDoctor ? <UserRound className="h-6 w-6 text-slate-400" /> : <Stethoscope className="h-6 w-6 text-slate-400" />}
                    </AvatarFallback>
                  </Avatar>
                  {item.online && (
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-50 truncate">
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">
                      {item.lastMessageTime || "8:35 AM"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {item.lastMessageStatus === "seen" && (
                        <CheckCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      )}
                      {item.lastMessageStatus === "delivered" && (
                        <CheckCheck className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      {item.lastMessageStatus === "sent" && (
                        <Check className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      {item.hasAttachment && (
                        <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 rotate-45" />
                      )}
                      <p className={cn(
                        "text-[13px] truncate",
                        item.unreadCount ? "text-slate-900 dark:text-slate-50 font-semibold" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {item.subtitle}
                      </p>
                    </div>
                    
                    {item.unreadCount && item.unreadCount > 0 ? (
                      <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white leading-none">
                          {item.unreadCount}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
