"use client";

import { useState } from "react";
import {
  CalendarDays,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ReceptionPrescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const prescriptions = [
    {
      id: "1",
      patient: { name: "Linda Harrison", id: "#MH-9021", avatar: "Linda" },
      doctor: { name: "Dr. Smith", avatar: "Doc1" },
      dateTime: { date: "Oct 24, 2026", time: "10:45 AM" },
      type: "CONSULTATION",
      status: "Ready",
      comms: { email: false, chat: true },
    },
    {
      id: "2",
      patient: { name: "David Chen", id: "#MH-4421", avatar: "David" },
      doctor: { name: "Dr. Smith", avatar: "Doc1" },
      dateTime: { date: "Oct 24, 2026", time: "10:45 AM" },
      type: "CONSULTATION",
      status: "Sent",
      comms: { email: false, chat: false },
    },
    {
      id: "3",
      patient: { name: "David Chen", id: "#MH-4421", avatar: "David2" },
      doctor: { name: "Dr. Smith", avatar: "Doc1" },
      dateTime: { date: "Oct 24, 2026", time: "10:45 AM" },
      type: "CONSULTATION",
      status: "Ready",
      comms: { email: true, chat: true },
    },
    {
      id: "4",
      patient: { name: "David Chen", id: "#MH-4421", avatar: "David3" },
      doctor: { name: "Dr. Smith", avatar: "Doc1" },
      dateTime: { date: "Oct 24, 2026", time: "10:45 AM" },
      type: "FOLLOW-UP",
      status: "Sent",
      comms: { email: false, chat: true },
    },
    {
      id: "5",
      patient: { name: "Sarah Montgomery", id: "#MH-8571", avatar: "" },
      doctor: { name: "Dr. Smith", avatar: "Doc1" },
      dateTime: { date: "Oct 24, 2026", time: "10:45 AM" },
      type: "FOLLOW-UP",
      status: "Ready",
      comms: { email: false, chat: true },
    },
    {
      id: "6",
      patient: { name: "James Wilson", id: "#MH-2234", avatar: "James" },
      doctor: { name: "Dr. Smith", avatar: "Doc1" },
      dateTime: { date: "Oct 24, 2026", time: "10:45 AM" },
      type: "FOLLOW-UP",
      status: "Pending",
      comms: { email: false, chat: true },
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 w-full mx-auto bg-[#F9FAFB] min-h-screen pb-24 overflow-x-hidden">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-[22px] font-bold text-slate-900 tracking-tight">
            Prescriptions
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium">
            Manage and track medical operations across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1.5 md:py-2.5 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
            <span className="text-[12px] md:text-sm font-semibold text-slate-700">
              Monday, Oct 24th, 2026
            </span>
            <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 2. Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full lg:w-3/4 xl:w-2/3">
        {/* Efficiency Rate Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px] md:rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-900 font-bold text-xs md:text-sm">Efficiency rate</span>
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] md:text-xs font-bold">
                <TrendingUp className="h-3 w-3" />
                +5.2%
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">94.8%</h3>
                <span className="text-slate-400 text-[10px] md:text-sm font-bold truncate">prescriptions sent &lt; 2h</span>
              </div>
              <Progress value={94.8} className="h-2 md:h-2.5 bg-slate-50 rounded-full [&>div]:bg-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Ready for Pickup Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px] md:rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6">
            <span className="text-slate-900 font-bold text-xs md:text-sm">Ready for pickup</span>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">28</h3>
                <span className="text-slate-400 text-[10px] md:text-sm font-bold truncate">awaiting patient collection</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center -space-x-2 md:-space-x-3">
                  {[1, 2, 3].map((i) => (
                    <Avatar key={i} className="h-7 w-7 md:h-9 md:w-9 border-2 md:border-4 border-white shadow-sm shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=Patient${i}`} />
                      <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-slate-400 text-[10px] md:text-xs font-bold ml-3">+25 more</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Content Section */}
      <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.03)] rounded-[24px] md:rounded-[40px] overflow-hidden bg-white p-1">
        <CardContent className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Filters Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
            <div className="relative w-full max-w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                placeholder="Search tasks or patients..."
                className="pl-11 h-11 md:h-12 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/20 focus:ring-blue-600/5 focus:border-blue-200 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1">
              <TableFilter label="All states" />
              <TableFilter label="All Doctors" />
              <TableFilter label="All Priority" />
            </div>
          </div>

          {/* Table Container - Critical for responsiveness without scroll */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl md:rounded-3xl border border-slate-50">
            <table className="w-full text-left border-collapse table-fixed min-w-[950px] xl:min-w-full">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="w-[22%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest first:rounded-tl-3xl">Patient Name</th>
                  <th className="w-[18%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">ASSIGNED DOCTOR</th>
                  <th className="w-[15%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">DATE & TIME</th>
                  <th className="w-[14%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="w-[10%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="w-[10%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Comms</th>
                  <th className="w-[11%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right last:rounded-tr-3xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {prescriptions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-4 md:px-6 py-4 md:py-6 overflow-hidden">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <Avatar className="h-8 w-8 md:h-11 md:w-11 border-2 border-white shadow-sm shrink-0">
                          <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.patient.avatar || item.patient.name}`} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-500 font-bold text-[10px]">{item.patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] md:text-[15px] font-bold text-slate-800 leading-tight truncate">
                            {item.patient.name}
                          </span>
                          <span className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-1 truncate">
                            PID: {item.patient.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6 overflow-hidden">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <Avatar className="h-7 w-7 md:h-9 md:w-9 border-2 border-white shadow-sm shrink-0">
                          <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.doctor.avatar}`} />
                          <AvatarFallback>D</AvatarFallback>
                        </Avatar>
                        <span className="text-[12px] md:text-[14px] font-bold text-slate-700 truncate">
                          {item.doctor.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6">
                      <div className="text-[12px] md:text-[14px] font-bold text-slate-700 truncate">
                        {item.dateTime.date}
                      </div>
                      <div className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight truncate">
                        {item.dateTime.time}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6">
                      <span className="text-[9px] md:text-[11px] font-black text-indigo-500 bg-indigo-50/50 px-2 md:px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                      <StatusBadge status={item.status as "Ready" | "Sent" | "Pending"} />
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6">
                      <div className="flex items-center justify-center gap-3 md:gap-5">
                        <Mail className={cn("h-4 w-4 md:h-5 md:w-5 transition-colors", item.comms.email ? "text-blue-600 fill-blue-50" : "text-slate-200")} />
                        <MessageCircle className={cn("h-4 w-4 md:h-5 md:w-5 transition-colors", item.comms.chat ? "text-blue-600 fill-blue-50" : "text-slate-200")} />
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6 text-right">
                      <Button
                        size="sm"
                        className={cn(
                          "rounded-[10px] md:rounded-[14px] px-4 md:px-7 font-black text-[9px] md:text-[11px] h-8 md:h-11 uppercase tracking-widest shadow-sm transition-all whitespace-nowrap",
                          item.status === "Sent" 
                            ? "bg-slate-50 text-slate-400 hover:bg-slate-100" 
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                        )}
                      >
                        {item.status === "Sent" ? "Resend" : "Send"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-[11px] md:text-[13px] font-bold text-slate-400">
              Showing <span className="text-slate-900">1</span> to <span className="text-slate-900">10</span> of <span className="text-slate-900">97</span> results
            </p>
            <div className="flex items-center gap-2">
              <PaginationButton icon={ChevronLeft} disabled />
              <PaginationNumber number={1} active />
              <PaginationNumber number={2} />
              <PaginationNumber number={3} />
              <span className="text-slate-300 px-1 font-bold">...</span>
              <PaginationNumber number={10} />
              <PaginationButton icon={ChevronRight} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function TableFilter({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-2 md:py-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap">
      <span className="text-[11px] md:text-[13px] font-bold text-slate-500">{label}</span>
      <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
    </div>
  );
}

function StatusBadge({ status }: { status: "Ready" | "Sent" | "Pending" }) {
  const configs = {
    Ready: "bg-orange-50 text-orange-400",
    Sent: "bg-emerald-50 text-emerald-600",
    Pending: "bg-slate-100 text-slate-400",
  };
  return (
    <Badge className={cn("rounded-lg md:rounded-[14px] px-3 md:px-5 py-1 md:py-2 border-none font-black text-[9px] md:text-[11px] uppercase tracking-widest whitespace-nowrap", configs[status])}>
      {status}
    </Badge>
  );
}

interface PaginationButtonProps {
  icon: React.ElementType;
  disabled?: boolean;
}

function PaginationButton({ icon: Icon, disabled }: PaginationButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl md:rounded-[14px] border border-slate-100 transition-all",
        disabled ? "bg-slate-50 text-slate-100 cursor-not-allowed" : "bg-white text-slate-400 hover:border-blue-600 hover:text-blue-600"
      )}
    >
      <Icon className="h-4 w-4 md:h-5 md:w-5" />
    </button>
  );
}

function PaginationNumber({ number, active }: { number: number; active?: boolean }) {
  return (
    <button
      className={cn(
        "h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl md:rounded-[14px] font-bold text-[12px] md:text-[14px] transition-all",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {number}
    </button>
  );
}
