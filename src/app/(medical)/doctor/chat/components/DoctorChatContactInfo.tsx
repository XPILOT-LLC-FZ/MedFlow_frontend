"use client";

import React, { useState } from "react";
import { X, Phone, Video, Mail, FileText, Download, Activity, MapPin, UserRound, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n";

interface ContactInfoProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    email?: string;
    phone?: string;
    address?: string;
    age?: number;
    bloodType?: string;
    lastVisit?: string;
    ticketStatus?: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  } | null;
  activity: Array<{ id: string; date: string; title: string }>;
  files: Array<{ id: string; name: string; size: string; date: string }>;
  onClose?: () => void;
}

export function DoctorChatContactInfo({ user, activity, files, onClose }: ContactInfoProps) {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState("Details");
  const tabs = ["Details", "History", "Files"];
  const tabLabels: Record<string, string> = {
    Details: t("details"),
    History: t("history"),
    Files: t("files"),
  };

  if (!user) {
    return (
      <div className="w-[340px] h-full bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 p-8 text-center">
        <p>{t("noResults")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-[320px] w-[320px] flex-col overflow-hidden border-s border-slate-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {locale === "ar" ? "معلومات التواصل" : "Contact Info"}
        </h3>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-all duration-300 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center border-b border-slate-100 px-6 pb-5 dark:border-slate-800/50">
        <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-50 transition-all duration-300 dark:bg-slate-800 dark:ring-slate-950">
          {user.avatar ? (
            <Image 
              src={user.avatar} 
              alt={user.name} 
              width={80} 
              height={80} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-600 dark:text-blue-400 font-bold text-3xl">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{user.name}</h2>
        <span className="mb-4 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
          {user.role}
        </span>

        <div className="flex w-full justify-center gap-4">
          {[
            { icon: Phone, label: "Call", labelKey: "call", color: "bg-blue-600" },
            { icon: Video, label: "Video", labelKey: "video", color: "bg-blue-600" },
            { icon: Mail, label: "Email", labelKey: "email", color: "bg-blue-600" },
          ].map((btn) => (
            <div key={btn.label} className="flex flex-col items-center gap-2 group">
              <button className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-300",
                btn.color
              )}>
                <btn.icon size={18} />
              </button>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{t(btn.labelKey as TranslationKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative pb-2 text-xs font-semibold transition-all duration-300",
                activeTab === tab
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              )}
            >
              {tabLabels[tab]}
              {activeTab === tab && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#2F6DF6]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {activeTab === "Details" && (
              <>
                <section>
                  <div className="flex items-center gap-2 mb-4">
                     <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                       <UserRound size={14} />
                     </div>
                     <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t("personalInfo")}</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: Mail, label: "Email", labelKey: "email", value: user.email || "—" },
                      { icon: Phone, label: "Phone", labelKey: "phone", value: user.phone || "—" },
                      { icon: MapPin, label: "Address", labelKey: "address", value: user.address || "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 transition-all duration-300 dark:bg-slate-950/40">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                          <item.icon size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{t(item.labelKey as TranslationKey)}</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                     <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                       <Activity size={14} />
                     </div>
                     <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t("medicalInfo")}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Age", labelKey: "age", value: user.age ? `${user.age} yrs` : "—" },
                      { label: "Blood Type", labelKey: "bloodType", value: user.bloodType || "—" },
                      { label: "Last Visit", labelKey: "lastVisit", value: user.lastVisit || "—" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-all duration-500 dark:border-slate-800 dark:bg-slate-950/30">
                        <p className="mb-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">{t(item.labelKey as TranslationKey)}</p>
                        <p className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeTab === "History" && (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-blue-900/50">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 group-hover:text-blue-600 dark:bg-slate-900 dark:text-slate-500">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold leading-tight text-slate-800 dark:text-slate-200">{item.title}</p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Files" && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="max-w-[140px] truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{file.size} • {file.date}</p>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-all">
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 p-4 text-center dark:border-slate-800 dark:bg-slate-950/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600">MedFlow Secure Chat</p>
      </div>
    </div>
  );
}
