"use client";

import { useState } from "react";
import {
  CalendarDays,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Stethoscope,
  Calendar as CalendarIcon,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function ReceptionSchedulePage() {
  const [selectedDate] = useState("Monday, Oct 24th, 2026");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  const departments = [
    { id: "all", label: "All Departments", checked: true },
    { id: "cardiology", label: "Cardiology", checked: false },
    { id: "pediatrics", label: "Pediatrics", checked: false },
    { id: "orthopedics", label: "Orthopedics", checked: false },
    { id: "dermatology", label: "Dermatology", checked: false },
  ];

  const appointmentTypes = [
    { label: "Consultation", color: "bg-[#3B82F6]" },
    { label: "Follow-up", color: "bg-[#10B981]" },
    { label: "Procedure", color: "bg-[#F59E0B]" },
    { label: "Emergency", color: "bg-[#EF4444]" },
  ];

  const doctors = [
    { id: "1", name: "Dr. Sarah Smith", dept: "CARDIOLOGY", avatar: "Sarah" },
    { id: "2", name: "Dr. Michael Chen", dept: "PEDIATRICS", avatar: "Michael" },
    { id: "3", name: "Dr. Elena Rodriguez", dept: "DERMATOLOGY", avatar: "Elena" },
  ];

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM"
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* 1. Left Sidebar */}
      <div className="w-[280px] border-r border-slate-100 flex flex-col p-6 space-y-10 shrink-0 overflow-y-auto no-scrollbar">
        {/* October 2026 Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[17px] font-bold text-slate-900">October 2026</h2>
            <div className="flex items-center gap-3">
              <ChevronLeft className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
              <ChevronRight className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d}</span>
            ))}
            {[24, 25, 26, 27, 28, 29, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((day, i) => (
              <span
                key={i}
                className={cn(
                  "text-[12px] font-bold h-8 w-8 flex items-center justify-center rounded-full cursor-pointer transition-all",
                  day === 12 && i > 5 ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-200" : (day < 1 || (day > 20 && i < 6) ? "text-slate-200" : "text-slate-500 hover:bg-slate-50")
                )}
              >
                {day}
              </span>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-2">DEPARTMENTS</h3>
          <div className="space-y-1">
            {departments.map((dept) => (
              <div key={dept.id} className={cn("flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group", dept.id === "all" ? "bg-[#F0F7FF]" : "hover:bg-slate-50")}>
                <Checkbox id={dept.id} checked={dept.checked} className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]" />
                <label htmlFor={dept.id} className={cn("text-[13px] font-bold cursor-pointer transition-colors", dept.id === "all" ? "text-slate-700" : "text-slate-500 group-hover:text-slate-700")}>{dept.label}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-6 pt-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-2">APPOINTMENT TYPES</h3>
          <div className="space-y-4 px-2">
            {appointmentTypes.map((type) => (
              <div key={type.label} className="flex items-center gap-3">
                <div className={cn("h-2 w-2 rounded-full", type.color)} />
                <span className="text-[12px] font-bold text-slate-500">{type.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB]">
        {/* Header */}
        <header className="h-[90px] border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
            <CalendarDays className="h-5 w-5 text-[#6366F1]" />
            <span className="text-[14px] font-bold text-slate-700">{selectedDate}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          <Button 
            onClick={() => setIsNewAppointmentOpen(true)}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-blue-100 flex items-center gap-2 text-sm transition-all"
          >
            <Plus className="h-5 w-5" />
            New Appointment
          </Button>
        </header>

        {/* Scheduler Grid */}
        <div className="flex-1 overflow-auto bg-white flex flex-col no-scrollbar">
          <div className="min-w-[1000px] flex-1 flex flex-col">
            {/* Column Headers */}
            <div className="flex h-[80px] border-b border-slate-100 shrink-0 sticky top-0 bg-white z-10">
              <div className="w-[100px] flex items-center justify-center border-r border-slate-100">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">GMT-5</span>
              </div>
              {doctors.map((doc, idx) => (
                <div key={doc.id} className={cn("flex-1 flex items-center px-8 border-r border-slate-100 last:border-r-0", idx === 2 && "relative")}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.avatar}`} />
                      <AvatarFallback>D</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-900 leading-tight">{doc.name}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{doc.dept}</span>
                    </div>
                  </div>
                  {idx === 2 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Main Body */}
            <div className="flex-1 relative flex">
              {/* Left Time Column Labels */}
              <div className="w-[100px] shrink-0 border-r border-slate-100">
                {timeSlots.map((time) => (
                  <div key={time} className="h-[120px] flex justify-center py-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">{time}</span>
                  </div>
                ))}
              </div>

              {/* Grid Content with 3 Doctor Columns */}
              <div className="flex-1 relative flex">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex-1 border-r border-slate-100 last:border-r-0 relative">
                    {/* Horizontal Divider Lines */}
                    {timeSlots.map((_, idx) => (
                      <div key={idx} className="absolute left-0 right-0 h-px bg-slate-50" style={{ top: `${idx * 120}px` }} />
                    ))}
                  </div>
                ))}

                {/* Appointment Overlays */}
                {/* Column 1 - Sarah Smith */}
                <div className="absolute top-0 left-0 w-[33.33%] h-full pointer-events-none p-2 pt-10">
                  <AppointmentBlock
                    top={40}
                    height={100}
                    color="bg-[#F0F7FF] border-[#3B82F6]"
                    time="08:30 - 09:30 AM"
                    name="Robert Patterson"
                    reason="New Consultation"
                    titleColor="text-[#3B82F6]"
                  />
                  <AppointmentBlock
                    top={190}
                    height={80}
                    color="bg-[#ECFDF5] border-[#10B981]"
                    time="10:00 - 10:30 AM"
                    name="Eliza Thorne"
                    reason="Follow-Up"
                    titleColor="text-[#10B981]"
                  />
                  <AppointmentBlock
                    top={320}
                    height={160}
                    color="bg-[#FFFBEB] border-[#F59E0B]"
                    time="11:30 - 01:00 PM"
                    name="Mark Jenkins"
                    reason="Echocardiogram"
                    titleColor="text-[#F59E0B]"
                  />
                </div>

                {/* Column 2 - Michael Chen */}
                <div className="absolute top-0 left-[33.33%] w-[33.33%] h-full pointer-events-none p-2 pt-0">
                  <AppointmentBlock
                    top={0}
                    height={110}
                    color="bg-[#FEF2F2] border-[#EF4444]"
                    time="08:00 - 09:00 AM"
                    name="Lily Evans (Urgent)"
                    reason="High Fever Review"
                    titleColor="text-[#EF4444]"
                  />
                  <AppointmentBlock
                    top={160}
                    height={120}
                    color="bg-[#F0F7FF] border-[#3B82F6]"
                    time="09:30 - 10:30 AM"
                    name="Noah Williams"
                    reason="New Consultation"
                    titleColor="text-[#3B82F6]"
                  />
                </div>

                {/* Column 3 - Elena Rodriguez */}
                <div className="absolute top-0 left-[66.66%] w-[33.33%] h-full pointer-events-none p-2 pt-12">
                  <AppointmentBlock
                    top={48}
                    height={200}
                    color="bg-[#FFFBEB] border-[#F59E0B]"
                    time="08:30 - 10:30 AM"
                    name="Samuel Costa"
                    reason="Surgical Biopsy"
                    titleColor="text-[#F59E0B]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookAppointmentModal isOpen={isNewAppointmentOpen} onClose={() => setIsNewAppointmentOpen(false)} />
    </div>
  );
}

interface AppointmentBlockProps {
  top: number;
  height: number;
  color: string;
  time: string;
  name: string;
  reason: string;
  titleColor: string;
}

function AppointmentBlock({ top, height, color, time, name, reason, titleColor }: AppointmentBlockProps) {
  return (
    <div
      style={{ top: `${top}px`, height: `${height}px` }}
      className={cn(
        "absolute left-4 right-4 rounded-xl border-l-[3px] p-4 pointer-events-auto cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-start",
        color
      )}
    >
      <span className={cn("text-[10px] font-black uppercase tracking-wider mb-1", titleColor)}>{time}</span>
      <h4 className="text-[14px] font-bold text-slate-800 leading-tight">{name}</h4>
      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{reason}</p>
    </div>
  );
}

/* ── Book Appointment Modal ───────────────────────────────────── */

function BookAppointmentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedVisitType, setSelectedVisitType] = useState("Follow up visit (30 min)");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1100px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-slate-900">Book New Appointment</DialogTitle>
            <p className="text-slate-400 text-sm font-medium">Schedule a new visit for a patient.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-400 hover:bg-slate-50 h-11 px-6">
              Cancel
            </Button>
            <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-100">
              Save & confirm
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar flex bg-[#F9FAFB]/50">
          {/* Left Form Column */}
          <div className="flex-1 p-10 space-y-10 border-r border-slate-50">
            {/* 1. Select Patient */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-widest">Select Patient</h3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input placeholder="Search by name , phone or ID..." className="pl-11 h-14 rounded-2xl border-slate-100 bg-white" />
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-slate-50">
                      <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Michael" />
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-slate-900">Michael R. Harrison</span>
                      <span className="text-[11px] font-bold text-slate-400 mt-1">ID: #PT-84729 • (585) 123-4567</span>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl border-slate-200 text-blue-600 font-bold px-5 h-9">Change</Button>
                </div>
              </div>
            </section>

            {/* 2. Select Provider & Visit Type */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-widest">Select Provider & Visit Type</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 ml-1">Department / Specialty</label>
                  <div className="h-14 px-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer">
                    <span className="text-[14px] font-bold text-slate-700">Cardiology</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 ml-1">Visit Type</label>
                  <div className="relative group">
                    <div className="h-14 px-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer">
                      <span className="text-[14px] font-bold text-slate-700">{selectedVisitType}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                    {/* Dropdown Options */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      {["initial consultation (45 min)", "Follow up visit (30 min)", "Routine checkup (35 min)"].map((type) => (
                        <div 
                          key={type}
                          onClick={() => setSelectedVisitType(type)}
                          className="px-5 py-4 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span className="text-[13px] font-bold text-slate-700 capitalize">{type}</span>
                          {selectedVisitType === type && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white border-2 border-blue-600 rounded-[24px] flex items-center justify-between shadow-md relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Aarav" />
                      <AvatarFallback>AM</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-slate-900">Dr. Aarav Mehta</span>
                      <span className="text-[11px] font-bold text-slate-400 mt-1">Senior Cardiologist • 15 yrs exp.</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-500 border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider">
                    ● Available Today
                  </Badge>
                </div>

                <div className="p-4 bg-white border border-slate-100 rounded-[24px] flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Michael" />
                      <AvatarFallback>MC</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-slate-900">Dr. Michael Harrison</span>
                      <span className="text-[11px] font-bold text-slate-400 mt-1">Senior Cardiologist • 15 yrs exp.</span>
                    </div>
                  </div>
                  <Badge className="bg-orange-50 text-orange-500 border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider">
                    ● Next Available: Tmw
                  </Badge>
                </div>
              </div>
            </section>

            {/* 3. Select Date & Time */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-widest">Select Date & Time</h3>
              </div>

              <div className="flex gap-10">
                {/* Calendar */}
                <div className="w-[300px] space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[15px] font-bold text-slate-900">October 2026</h4>
                    <div className="flex items-center gap-4">
                      <ChevronLeft className="h-4 w-4 text-slate-400" />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-y-3 text-center">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                      <span key={d} className="text-[11px] font-bold text-slate-300 uppercase">{d}</span>
                    ))}
                    {[25, 26, 27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map((day, i) => (
                      <div key={i} className="relative flex flex-col items-center">
                        <span className={cn(
                          "text-[13px] font-bold h-8 w-8 flex items-center justify-center rounded-full cursor-pointer",
                          day === 24 && i > 25 ? "bg-[#3B82F6] text-white" : "text-slate-500"
                        )}>
                          {day}
                        </span>
                        <div className="flex gap-0.5 mt-0.5">
                           {i % 4 === 0 && <div className="h-1 w-1 rounded-full bg-blue-500" />}
                           {i % 3 === 0 && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
                           {i % 7 === 0 && <div className="h-1 w-1 rounded-full bg-rose-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-blue-500" /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Working day</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-emerald-500" /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Available</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-rose-500" /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Full</span></div>
                  </div>
                </div>

                {/* Slots */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Morning
                    </h5>
                    <div className="grid grid-cols-3 gap-3">
                      {["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"].map((time) => (
                        <button 
                          key={time} 
                          className={cn(
                            "py-3 rounded-xl text-[13px] font-bold border transition-all",
                            time === "10:30 AM" ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white border-slate-100 text-slate-500 hover:border-blue-200"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Afternoon
                    </h5>
                    <div className="grid grid-cols-3 gap-3">
                      {["01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"].map((time) => (
                        <button key={time} className="py-3 rounded-xl text-[13px] font-bold border border-slate-100 bg-white text-slate-500 hover:border-blue-200 transition-all">
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Summary Column */}
          <div className="w-[380px] p-10 bg-white shrink-0 space-y-8">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest">Booking Summary</h3>
            </div>

            <div className="space-y-8">
              <SummaryItem icon={User} label="Patient" value="Michael R. Harrison" />
              <SummaryItem icon={Stethoscope} label="Provider" value="Dr. Aarav Mehta" subValue="Cardiology" />
              <SummaryItem icon={CalendarIcon} label="Schedule" value="Tue, Oct 24, 2023" subValue="10:30 AM (30m)" />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Visit type</label>
                  <p className="text-[15px] font-bold text-slate-900">Follow-up Visit</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reason for visit / notes</label>
                  <Textarea 
                    placeholder="Briefly describe the symptoms or reason for this appointment..." 
                    className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/30 text-[13px] font-medium resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <Button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl h-14 font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                <Check className="h-5 w-5" />
                Book Appointment
              </Button>
              <Button variant="outline" className="w-full rounded-2xl h-14 border-slate-200 text-slate-700 font-bold bg-white">
                Save as Draft
              </Button>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
              By booking, you agree to (name of clinic)<br />scheduling and cancellation policies.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}

function SummaryItem({ icon: Icon, label, value, subValue }: SummaryItemProps) {
  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-[#3B82F6]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[15px] font-bold text-slate-900 mt-0.5 truncate">{value}</span>
        {subValue && <span className="text-[12px] font-medium text-slate-500 mt-0.5 truncate">{subValue}</span>}
      </div>
    </div>
  );
}
