"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, Calendar, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useBookingStore } from "@/stores/useBookingStore";

export default function DoctorNotificationsPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { appointments } = useBookingStore();

  const activeAppointments = appointments.filter(
    (a) => a.status === "scheduled" || a.status === "in-progress"
  );
  
  const pastAppointments = appointments.filter(
    (a) => a.status !== "scheduled" && a.status !== "in-progress"
  );

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
          
          {activeAppointments.length > 0 ? (
            <div className="grid gap-3">
              {activeAppointments.map((appt) => (
                <Card key={appt.id} className="overflow-hidden border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={`w-1.5 ${appt.status === "in-progress" ? "bg-rose-500" : "bg-blue-500"}`} />
                      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center ${appt.status === "in-progress" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"}`}>
                            {appt.status === "in-progress" ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              {locale === "ar" ? `موعد: ${appt.patientName}` : `Appointment: ${appt.patientName}`}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {appt.time}</span>
                              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {appt.patientName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${appt.status === "in-progress" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"}`}>
                                {appt.status === "in-progress" ? (locale === "ar" ? "قيد التنفيذ" : "In Progress") : (locale === "ar" ? "مجدول" : "Scheduled")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 text-xs font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => router.push(`/doctor/schedule`)}
                        >
                          {locale === "ar" ? "تفاصيل" : "Details"}
                        </Button>
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
            {pastAppointments.slice(0, 10).map((appt) => (
              <div 
                key={appt.id} 
                className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {locale === "ar" ? `اكتمل: ${appt.patientName}` : `Completed: ${appt.patientName}`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{appt.date} • {appt.time}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => router.push(`/doctor/schedule`)}>
                      {locale === "ar" ? "عرض" : "View"}
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
