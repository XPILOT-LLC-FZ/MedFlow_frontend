"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
// import { useBookingStore } from "@/stores/useBookingStore";
import { notificationsService, type InAppNotification } from "@/services/notificationsService";

export default function DoctorNotificationsPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const [notifications, setNotifications] = React.useState<InAppNotification[]>([]);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsService.getInAppNotifications({ limit: 50 });
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();
  }, []);

  const activeNotifications = notifications.filter(n => !n.readAt);
  const pastNotifications = notifications.filter(n => !!n.readAt);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markInAppRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {locale === "ar" ? "الإشعارات" : "Notifications"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {locale === "ar" ? "إدارة وتتبع تنبيهات المواعيد الخاصة بك" : "Manage and track your appointment alerts"}
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500">
          <Bell className="h-6 w-6" />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Active Notifications */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            {locale === "ar" ? "التنبيهات النشطة" : "Active Alerts"}
          </h2>
          
          {activeNotifications.length > 0 ? (
            <div className="grid gap-3">
              {activeNotifications.map((notification) => (
                <Card key={notification.id} className="overflow-hidden border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-1.5 bg-blue-500" />
                      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 h-8 w-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {notification.body}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(notification.createdAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(notification.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[11px] font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => handleMarkRead(notification.id)}
                          >
                            {locale === "ar" ? "تحديد كمقروء" : "Mark Read"}
                          </Button>
                          {!!notification.payload?.appointmentId && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="h-8 text-[11px] font-medium rounded-lg"
                              onClick={() => router.push(`/doctor/schedule`)}
                            >
                              {locale === "ar" ? "تفاصيل" : "Details"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {locale === "ar" ? "لا توجد تنبيهات نشطة حالياً" : "No active alerts right now"}
              </p>
            </div>
          )}
        </section>

        {/* History */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            {locale === "ar" ? "السجل سابقاً" : "Previous History"}
          </h2>
          
          <div className="grid gap-2">
            {pastNotifications.slice(0, 10).map((notification) => (
              <div 
                key={notification.id} 
                className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {notification.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(notification.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")} • {new Date(notification.createdAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {!!notification.payload?.appointmentId && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => router.push(`/doctor/schedule`)}>
                        {locale === "ar" ? "عرض" : "View"}
                     </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
