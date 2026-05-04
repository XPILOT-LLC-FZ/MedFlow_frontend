"use client";

import React from "react";
import { 
  Bell,
  Trash2,
  AlertTriangle, 
  Activity, 
  ClipboardCheck, 
  MessageSquare, 
  Calendar,
  AlertCircle,
  Coins,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { notificationsService } from "@/services/notificationsService";
import type { InAppNotification } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { ar } from "date-fns/locale";
import { motion } from "framer-motion";

interface PatientNotificationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: InAppNotification[];
  onRefresh: () => void;
}

export function PatientNotificationsDialog({
  isOpen,
  onOpenChange,
  notifications,
  onRefresh,
}: PatientNotificationsDialogProps) {
  const { t, locale, isRTL } = useTranslation();
  const [filter, setFilter] = React.useState<"all" | "unread" | "appointments" | "medical" | "important">("all");

  const translateNotificationTitle = (title: string) => {
    if (title === "Appointment status updated") return t("appointmentStatusUpdated");
    return title;
  };

  const translateNotificationBody = (body: string) => {
    // Basic translation logic for common patterns
    if (body.includes("Appointment confirmed")) return locale === 'ar' ? "تم تأكيد الموعد" : "Appointment confirmed";
    return body;
  };

  const filteredNotifications = React.useMemo(() => {
    let list = notifications;
    
    switch (filter) {
      case "unread":
        list = notifications.filter(n => !n.readAt);
        break;
      case "appointments":
        list = notifications.filter(n => 
          n.type === "APPOINTMENT_EVENT" || 
          n.title?.toLowerCase().includes("booked") || 
          n.title?.toLowerCase().includes("appointment")
        );
        break;
      case "medical":
        list = notifications.filter(n => 
          n.type === "LAB_RESULT" || 
          n.type === "TREATMENT_PLAN" ||
          n.type === "PRESCRIPTION"
        );
        break;
      case "important":
        list = notifications.filter(n => 
          n.type === "CRITICAL" || 
          n.type === "ALERT" ||
          n.type === "LOYALTY_EVENT" ||
          !n.readAt
        );
        break;
    }

    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, filter]);

  const groupedNotifications = React.useMemo(() => {
    const groups: Record<string, InAppNotification[]> = {};
    
    filteredNotifications.forEach(n => {
      const date = new Date(n.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let key = "Earlier";
      if (date.toDateString() === today.toDateString()) key = "Today";
      else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";
      else key = date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric' });

      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return Object.entries(groups);
  }, [filteredNotifications, locale]);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-3xl",
          "bg-white dark:bg-slate-950"
        )}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center px-6 py-5 bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <button 
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            {isRTL ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </button>
          <DialogTitle className="flex-1 text-center text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight pr-8">
            {t("notifications")}
          </DialogTitle>
        </div>

        {/* Desktop Header */}
        <DialogHeader className="hidden md:block px-8 pt-8 pb-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {t("notificationCenter")}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {unreadCount} {t("unread").toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
            <DialogClose className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="hidden md:flex px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-950 items-center gap-3 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: "all", label: t("all") },
            { id: "unread", label: t("unread") },
            { id: "appointments", label: locale === 'ar' ? 'المواعيد' : 'Appointments' },
            { id: "medical", label: locale === 'ar' ? 'طبي' : 'Medical' },
            { id: "important", label: locale === 'ar' ? 'هام' : 'Important' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-black whitespace-nowrap transition-all border-2",
                filter === f.id
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 no-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-10 py-20 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="relative h-24 w-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <Bell className="h-10 w-10 animate-bounce" />
                </div>
              </div>
              <h3 className="mt-8 text-xl font-black text-slate-900 dark:text-slate-50">
                {locale === 'ar' ? 'لا توجد إشعارات حتى الآن' : 'No Notifications Yet'}
              </h3>
              <p className="mt-2 text-[15px] font-medium text-slate-400 dark:text-slate-500 max-w-[240px]">
                {locale === 'ar' ? 'سيتم إخطارك هنا بمجرد وجود شيء جديد.' : 'You\'ll be notified here once there\'s something new.'}
              </p>
            </div>
          ) : (
            <div className="p-0 pb-10 divide-y divide-slate-50 dark:divide-slate-900">
              {groupedNotifications.map(([groupDate, groupItems]) => (
                <div key={groupDate} className="flex flex-col">
                  <div className="sticky top-0 z-10 px-6 py-3 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {groupDate}
                    </span>
                  </div>
                  
                  {groupItems.map((n) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={n.id}
                      className={cn(
                        "relative group/item px-6 py-6 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/50",
                        !n.readAt && "bg-blue-50/20 dark:bg-blue-900/5"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all group-hover/item:scale-105",
                          n.type === "CRITICAL" ? "bg-rose-100 text-rose-500" :
                          n.type === "ALERT" ? "bg-amber-100 text-amber-500" :
                          n.type === "LAB_RESULT" ? "bg-blue-600 text-white" :
                          n.type === "APPOINTMENT_EVENT" ? "bg-blue-600 text-white" :
                          n.type === "LOYALTY_EVENT" ? "bg-amber-400 text-white" :
                          "bg-slate-100 text-slate-400"
                        )}>
                          {n.type === "CRITICAL" ? <AlertTriangle className="h-6 w-6" /> :
                            n.type === "ALERT" ? <AlertCircle className="h-6 w-6" /> :
                            n.type === "LAB_RESULT" ? <Activity className="h-6 w-6" /> :
                            n.type === "TASK_EVENT" ? <ClipboardCheck className="h-6 w-6" /> :
                            n.type === "CHAT_MESSAGE" ? <MessageSquare className="h-6 w-6" /> :
                            n.type === "APPOINTMENT_EVENT" ? <Calendar className="h-6 w-6" /> :
                            n.type === "LOYALTY_EVENT" ? <Coins className="h-6 w-6" /> :
                            <Bell className="h-6 w-6" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="text-[15px] font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                              {translateNotificationTitle(n.title)}
                            </h4>
                            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest mt-1">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: locale === "ar" ? ar : undefined })}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                            {translateNotificationBody(n.body)}
                          </p>
    
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {!n.readAt && (
                                <button
                                  onClick={() => notificationsService.markInAppRead(n.id).then(() => onRefresh())}
                                  className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                >
                                  {t("markRead")}
                                </button>
                              )}
                              <button
                                onClick={() => notificationsService.deleteInAppNotification(n.id).then(() => onRefresh())}
                                className="text-[11px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                              >
                                {t("delete")}
                              </button>
                            </div>
                            <button
                              onClick={() => notificationsService.deleteInAppNotification(n.id).then(onRefresh)}
                              className="flex items-center gap-2 text-[11px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-[0.1em] opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("delete")}
                            </button>
                          </div>
                        </div>
                      </div>
                      {!n.readAt && (
                        <div className="absolute top-5 right-5 h-2.5 w-2.5 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
                      )}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 items-center justify-between z-20">
          <button
            onClick={() => {
              Promise.all(notifications.filter(n => !n.readAt).map(n => notificationsService.markInAppRead(n.id)))
                .then(onRefresh);
            }}
            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
          >
            {t("markAll")}
          </button>
          <DialogClose asChild>
            <Button className="h-12 rounded-2xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 px-8 font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-transform active:scale-95">
              {t("close")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
