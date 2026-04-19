"use client";

import React, { useState } from "react";
import { Search, Filter, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge } from "./StatusBadge";
import Image from "next/image";

interface ConversationItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  avatar?: string;
  status: "online" | "offline";
  ticketStatus?: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  role: string;
}

interface DoctorChatSidebarProps {
  conversations: ConversationItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onFilterChange: (filter: string) => void;
}

export function DoctorChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onFilterChange,
}: DoctorChatSidebarProps) {
  const { t, locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["All", "Patients", "Staff", "Admin"];
  const filterLabels: Record<string, string> = {
    All: t("all"),
    Patients: t("patients"),
    Staff: t("reception"),
    Admin: t("admin"),
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
    <div className="flex h-full min-w-[320px] w-[320px] flex-col border-e border-slate-200 bg-[#F8FAFF] dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#2F6DF6] tracking-tight">{t("messages")}</h1>
          <button className="rounded-xl p-2 text-slate-400 transition-all duration-300 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
            <MoreVertical size={18} />
          </button>
        </div>

        <div className="group relative mb-5">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" size={16} />
          <input
            type="text"
            placeholder={t("search")}
            className="w-full rounded-2xl border border-slate-100 bg-white py-2.5 pe-4 ps-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                onFilterChange(filter);
              }}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-300",
                activeFilter === filter
                  ? "bg-[#2F6DF6] text-white shadow-sm"
                  : "bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              )}
            >
              {filterLabels[filter] || filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredConversations.length > 0 ? (
          <div className="space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-300",
                  selectedId === conv.id
                    ? "bg-[#EAF1FF] dark:bg-blue-900/20"
                    : "hover:bg-white/90 dark:hover:bg-slate-800/50"
                )}
              >
                {selectedId === conv.id && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute start-1 h-8 w-1 rounded-full bg-[#2F6DF6]"
                  />
                )}

                <div className="relative flex-shrink-0">
                  <div className="h-11 w-11 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white transition-all duration-300 dark:bg-slate-800 dark:ring-slate-900">
                    {conv.avatar ? (
                      <Image src={conv.avatar} alt={conv.name} width={44} height={44} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-base font-bold text-blue-600 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-400">
                        {conv.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -inline-end-1">
                    <StatusBadge status={conv.status} className="h-3.5 w-3.5 border-2 border-white shadow-sm dark:border-slate-900" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left py-1 rtl:text-right">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={cn(
                      "truncate text-sm font-bold tracking-tight transition-colors",
                      selectedId === conv.id ? "text-blue-900 dark:text-blue-200" : "text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400"
                    )}>
                      {conv.name}
                    </h3>
                    <span className="mt-1 text-[11px] font-semibold text-slate-400">{conv.time}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "flex-1 truncate text-xs font-medium transition-colors",
                      conv.unreadCount ? "text-slate-700 dark:text-white" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {conv.lastMessage}
                    </p>

                    {conv.unreadCount ? (
                      <div className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-[#2F6DF6] px-1.5 text-[10px] font-bold text-white shadow-sm">
                        {conv.unreadCount}
                      </div>
                    ) : (
                      conv.role === "PATIENT" && (
                        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mx-4 flex h-64 flex-col items-center justify-center rounded-[2rem] bg-slate-50/50 p-8 text-center text-slate-400 dark:bg-slate-800/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
              <Filter size={24} className="opacity-20 text-slate-900 dark:text-white" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t("noResults")}</p>
            <p className="text-xs font-medium text-slate-400">{locale === "ar" ? "جرّب تعديل عوامل التصفية أو البحث" : "Try adjusting your filters or search"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
