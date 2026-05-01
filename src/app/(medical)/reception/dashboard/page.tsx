"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Clock,
  CheckCircle,
  CircleDollarSign,
  UserPlus,
  Calendar,
  UserCheck,
  CreditCard,
  CalendarDays,
  Dot,
  ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import { cn } from "@/lib/utils";
import type { DashboardStaffSummaryData, DashboardAppointmentStatus } from "@/types";

export default function ReceptionDashboard() {
  const { locale } = useTranslation();
  const [dashboardData, setDashboardData] = React.useState<DashboardStaffSummaryData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshDashboard = React.useCallback(async () => {
    try {
      const summary = await dashboardService.getStaffSummary({ period: "day" });
      setDashboardData(summary);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
    const interval = setInterval(() => void refreshDashboard(), 30000);
    return () => clearInterval(interval);
  }, [refreshDashboard]);

  const summary = dashboardData?.summaryCards;
  const upcoming = dashboardData?.queue.upcoming || [];

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-[1600px] mx-auto bg-[#F9FAFB] min-h-screen relative pb-24">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {locale === "ar" ? "نظرة عامة يومية" : "Daily Overview"}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {locale === "ar"
              ? "الإثنين، 24 أكتوبر، 2023 - إدارة 12 موظفاً نشطاً اليوم بكفاءة."
              : "Monday, Oct 24th, 2023 — Efficiently managing 12 active staff members today."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              {locale === "ar" ? "الإثنين، 24 أكتوبر، 2026" : "Monday, Oct 24th, 2026"}
            </span>
          </div>
          <div className="flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <Dot className="h-8 w-8 text-emerald-500 -ml-2" />
            <span className="text-sm font-semibold text-slate-700">
              {locale === "ar" ? "حركة المرور المباشرة: طبيعي" : "Live Traffic: Normal"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Patients Today" value={isLoading ? "..." : (summary?.totalToday || 12)} trend="+12%" color="blue" />
        <StatCard icon={Clock} label="Waiting" value={isLoading ? "..." : (summary?.scheduledConfirmed || 3)} badge="Avg 14 min" color="orange" />
        <StatCard icon={CheckCircle} label="Checked-in" value={isLoading ? "..." : (summary?.inProgress || 7)} trend="+4%" color="purple" />
        <StatCard icon={CircleDollarSign} label="Daily revenue" value={isLoading ? "..." : "4,850L.E"} trend="+24%" color="green" />
      </div>

      {/* 3. Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard icon={UserPlus} title="Add Patient" subtitle="Register new visitor" href="/reception/patients/new" />
          <ActionCard icon={Calendar} title="New Appointment" subtitle="Book a session" href="/reception/booking" />
          <ActionCard icon={UserCheck} title="Check in patients" subtitle="confirm arrival patients" href="/reception/waiting-room" />
          <ActionCard icon={CreditCard} title="Payment" subtitle="Process payment" href="/reception/payments" />
        </div>
      </div>

      {/* 4. Today's Appointments */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Today's Appointments</h2>
            <p className="text-slate-400 text-sm font-medium">Managing {upcoming.length || 12} upcoming sessions for today</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-100 bg-white text-slate-500 gap-2 h-10">
              All Doctor <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-100 bg-white text-slate-500 gap-2 h-10">
              All status <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="w-[25%] px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">Patient</th>
                    <th className="w-[25%] px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">Service</th>
                    <th className="w-[15%] px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">Time</th>
                    <th className="w-[15%] px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">Status</th>
                    <th className="w-[20%] px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(upcoming.length > 0 ? upcoming.slice(0, 4) : [1, 2, 3, 4]).map((apt: any, idx: number) => {
                    const patientName = typeof apt === "object" ? apt.patientName : (idx === 0 ? "Sarah Jenkins" : idx === 1 ? "Michael Ross" : idx === 2 ? "Emily Blunt" : "Robert Vance");
                    const status = typeof apt === "object" ? apt.status : (idx === 0 ? "CONFIRMED" : idx === 1 ? "IN_PROGRESS" : idx === 2 ? "SCHEDULED" : "COMPLETED");
                    const time = typeof apt === "object" ? apt.time : "09:00 AM";
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${patientName}`} />
                              <AvatarFallback>P</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-bold text-slate-800 leading-tight truncate">{patientName}</span>
                              <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">#PT-{6234 + idx}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[13px] font-medium text-slate-500 truncate">General Consultation</td>
                        <td className="px-6 py-5 text-[13px] font-bold text-slate-900">{time}</td>
                        <td className="px-6 py-5">
                          <StatusBadge status={status as DashboardAppointmentStatus} />
                        </td>
                        <td className="px-6 py-5 text-right">
                          <ActionButton status={status as DashboardAppointmentStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-6 text-center border-t border-slate-50">
              <button className="text-slate-400 text-sm font-semibold hover:text-blue-600 transition-colors">
                View all appointment (12 appointments)
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Live Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Live Patient Queue</h2>
            <div className="flex items-center gap-1.5"><Dot className="h-5 w-5 text-emerald-500" /><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</span></div>
          </div>
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left table-fixed min-w-[700px] lg:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="w-[22%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">Patient</th>
                      <th className="w-[20%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">VISIT REASON</th>
                      <th className="w-[16%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">SCHEDULED</th>
                      <th className="w-[18%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">STATUS</th>
                      <th className="w-[10%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">ROOM</th>
                      <th className="w-[14%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah${i}`} />
                              <AvatarFallback>P</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-bold text-slate-800 leading-tight truncate">Sarah Jenkins</span>
                              <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">#PT-8234</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-[13px] font-medium text-slate-400/80 truncate">Chronic Hypertension</td>
                        <td className="px-4 py-5 text-[13px] font-bold text-slate-500/90 truncate">09:30 AM</td>
                        <td className="px-4 py-5"><QueueStatusBadge status={i === 1 ? "IN_PROGRESS" : i === 2 ? "WAITING" : "UPCOMING"} /></td>
                        <td className="px-4 py-5 text-[13px] font-bold text-slate-700">B-04</td>
                        <td className="px-4 py-5 text-right"><button className="text-[12px] font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap">{i === 1 ? "View File" : i === 2 ? "Admit Patient" : i === 3 ? "Reschedule" : "Prepare Room"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 text-center border-t border-slate-50 bg-white/50">
                <button className="text-slate-400 text-[13px] font-bold hover:text-blue-600 transition-colors">View Full Queue (12 patients)</button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline & Performance */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Journey Timeline</h2>
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                  <TimelineItem time="09:45 AM" title="Consultation: Michael Ross" subtitle="Arthur Benson (Hypertension Check)" active />
                  <TimelineItem time="10:15 AM" title="Admission: Sarah Miller" subtitle="Prepare Vitals Station A" />
                  <TimelineItem time="11:00 AM" title="Team Briefing: Ward 2" subtitle="Inventory Sync & Supply Check" />
                </div>
                <Button variant="outline" className="w-full mt-8 rounded-xl border-slate-100 text-slate-500 font-bold h-11">Expand Full Timeline</Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-8 space-y-8">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinic Performance</h2>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Patient Satisfaction</span><span className="text-slate-900">94%</span>
                    </div>
                    <Progress value={94} className="h-2 bg-slate-50 [&>div]:bg-emerald-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Capacity Used</span><span className="text-slate-900">72%</span>
                    </div>
                    <Progress value={72} className="h-2 bg-slate-50 [&>div]:bg-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, badge, color }: any) {
  const colorMap: any = { blue: "bg-blue-50 text-blue-600", orange: "bg-orange-50 text-orange-600", purple: "bg-purple-50 text-purple-600", green: "bg-emerald-50 text-emerald-600" };
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-4 rounded-[20px]", colorMap[color])}><Icon className="h-6 w-6" /></div>
            <span className="text-slate-500 text-sm font-semibold">{label}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
            {trend && <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-bold rounded-lg px-2 py-1 flex items-center gap-0.5"><svg viewBox="0 0 24 24" className="h-3 w-3 fill-current"><path d="M7 11l5-5 5 5M7 17l5-5 5 5" /></svg>{trend}</Badge>}
            {badge && <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-none font-bold rounded-lg px-2 py-1">{badge}</Badge>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActionCard({ icon: Icon, title, subtitle, href }: any) {
  return (
    <Link href={href}>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white text-center cursor-pointer group hover:shadow-[0_20px_50px_rgb(59,130,246,0.1)] transition-all duration-300">
          <CardContent className="p-8 space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300"><Icon className="h-6 w-6" /></div>
            <div className="space-y-1"><h3 className="text-lg font-bold text-slate-900">{title}</h3><p className="text-slate-400 text-sm font-medium">{subtitle}</p></div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = { CONFIRMED: { label: "Confirmed", color: "bg-blue-50 text-blue-600" }, IN_PROGRESS: { label: "In Progress", color: "bg-orange-50 text-orange-600" }, SCHEDULED: { label: "Waiting", color: "bg-slate-100 text-slate-500" }, COMPLETED: { label: "Completed", color: "bg-emerald-50 text-emerald-600" } };
  const config = configs[status] || configs.SCHEDULED;
  return <Badge className={cn("rounded-full px-4 py-1 border-none font-bold text-[11px]", config.color)}>{config.label}</Badge>;
}

function ActionButton({ status }: any) {
  let label = "View";
  if (status === "CONFIRMED") label = "Check in";
  if (status === "SCHEDULED") label = "Go to queue";
  if (status === "COMPLETED") label = "Check out";
  return <Button variant="link" className="text-blue-600 font-bold hover:no-underline px-0">{label}</Button>;
}

function QueueStatusBadge({ status }: any) {
  const configs: any = { IN_PROGRESS: { label: "IN-PROGRESS", color: "bg-emerald-50/60 text-emerald-600" }, WAITING: { label: "WAITING", color: "bg-orange-50 text-orange-400" }, UPCOMING: { label: "UPCOMING", color: "bg-blue-50/50 text-slate-400" } };
  const config = configs[status] || configs.UPCOMING;
  return <Badge className={cn("rounded-full px-3 py-1 border-none font-bold text-[10px] tracking-tight", config.color)}>{config.label}</Badge>;
}

function TimelineItem({ time, title, subtitle, active }: any) {
  return (
    <div className="flex gap-6 relative">
      <div className={cn("z-10 h-[22px] w-[22px] rounded-full border-4 border-white shadow-sm transition-colors", active ? "bg-blue-600" : "bg-slate-200")} />
      <div className="flex flex-col gap-1">
        <span className={cn("text-[13px] font-bold", active ? "text-blue-600" : "text-slate-400")}>{time}</span>
        <div className="space-y-0.5"><p className="text-sm font-bold text-slate-900">{title}</p><p className="text-xs font-medium text-slate-400">{subtitle}</p></div>
      </div>
    </div>
  );
}
