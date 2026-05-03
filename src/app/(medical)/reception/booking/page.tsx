"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { staffService } from "@/services/staffService";
import { bookingService } from "@/services/bookingService";
import { formatDateKey } from "@/lib/dateUtils";
import type { ApiDoctor, ApiAppointment } from "@/types";

export default function ReceptionSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, appts] = await Promise.all([
        staffService.getDoctors(),
        bookingService.getAll({ 
          startDate: formatDateKey(selectedDate), 
          endDate: formatDateKey(selectedDate) 
        })
      ]);
      setDoctors(docs);
      setAppointments(appts);
    } catch (error) {
      console.error("Failed to fetch schedule data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  const departments = [
    { id: "all", label: "All Departments", checked: true },
    { id: "cardiology", label: "Cardiology", checked: false },
    { id: "pediatrics", label: "Pediatrics", checked: false },
    { id: "orthopedics", label: "Orthopedics", checked: false },
    { id: "dermatology", label: "Dermatology", checked: false },
  ];

  const appointmentTypes = [
    { label: "Consultation", color: "bg-[#3B82F6]", apiType: "CONSULTATION" },
    { label: "Follow-up", color: "bg-[#10B981]", apiType: "FOLLOW_UP" },
    { label: "Procedure", color: "bg-[#F59E0B]", apiType: "PROCEDURE" },
    { label: "Emergency", color: "bg-[#EF4444]", apiType: "EMERGENCY" },
  ];

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  const getPositionForTime = (timeStr: string) => {
    // Expecting "HH:MM" or "HH:MM AM/PM"
    const [time, modifier] = timeStr.split(' ');
    const [hoursStr, minutesStr] = time.split(':').map(Number);
    let hours = hoursStr;
    const minutes = minutesStr;
    
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const startHour = 8; // Grid starts at 8 AM
    const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
    
    // Each hour is 120px, so each minute is 2px
    return totalMinutesFromStart * 2;
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* 1. Left Sidebar */}
      <div className="w-[280px] border-r border-slate-100 flex flex-col p-6 space-y-10 shrink-0 overflow-y-auto no-scrollbar">
        {/* Calendar Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[17px] font-bold text-slate-900">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-3">
              <ChevronLeft onClick={handlePrevDay} className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
              <ChevronRight onClick={handleNextDay} className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
          </div>
          {/* Simple Calendar Placeholder (Real DatePicker could be used) */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d}</span>
            ))}
            {/* Logic for actual days could go here, for now keeping it visually similar but functional for selecting current day */}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <span
                key={day}
                onClick={() => {
                   const d = new Date(selectedDate);
                   d.setDate(day);
                   setSelectedDate(d);
                }}
                className={cn(
                  "text-[12px] font-bold h-8 w-8 flex items-center justify-center rounded-full cursor-pointer transition-all",
                  selectedDate.getDate() === day ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-50"
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
            <span className="text-[14px] font-bold text-slate-700">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-4">
            {loading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            <Button 
              onClick={() => setIsNewAppointmentOpen(true)}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-blue-100 flex items-center gap-2 text-sm transition-all"
            >
              <Plus className="h-5 w-5" />
              New Appointment
            </Button>
          </div>
        </header>

        {/* Scheduler Grid */}
        <div className="flex-1 overflow-auto bg-white flex flex-col no-scrollbar">
          <div className="min-w-[1000px] flex-1 flex flex-col">
            {/* Column Headers */}
            <div className="flex h-[80px] border-b border-slate-100 shrink-0 sticky top-0 bg-white z-10">
              <div className="w-[100px] flex items-center justify-center border-r border-slate-100">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">GMT-5</span>
              </div>
              {doctors.map((doc) => (
                <div key={doc.id} className={cn("flex-1 flex items-center px-8 border-r border-slate-100 last:border-r-0")}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                      <AvatarImage src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`} />
                      <AvatarFallback>D</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-900 leading-tight">{doc.fullName}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{doc.specialization}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Body */}
            <div className="flex-1 relative flex">
              {/* Left Time Column Labels */}
              <div className="w-[100px] shrink-0 border-r border-slate-100">
                {timeSlots.map((time) => (
                  <div key={time} className="h-[120px] flex justify-center py-4 border-b border-slate-50 last:border-none">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">{time}</span>
                  </div>
                ))}
              </div>

              {/* Grid Content with Doctor Columns */}
              <div className="flex-1 relative flex">
                {doctors.map((doc) => (
                  <div key={doc.id} className="flex-1 border-r border-slate-100 last:border-r-0 relative min-h-full">
                    {/* Horizontal Divider Lines */}
                    {timeSlots.map((_, idx) => (
                      <div key={idx} className="absolute left-0 right-0 h-px bg-slate-50" style={{ top: `${idx * 120}px` }} />
                    ))}
                    
                    {/* Real Appointment Overlays for this Doctor */}
                    {appointments.filter(a => a.doctorId === doc.id).map((appt) => {
                      const top = getPositionForTime(appt.startTime);
                      const height = (appt.durationMinutes || 30) * 2; // 1 min = 2px
                      const typeInfo = appointmentTypes.find(t => t.apiType === appt.type) || appointmentTypes[0];
                      
                      return (
                        <AppointmentBlock
                          key={appt.id}
                          top={top}
                          height={height}
                          color={`${typeInfo.color.replace('bg-', 'bg-')}/10 border-${typeInfo.color.split('[')[1].split(']')[0]}`} // Rough mapping for now
                          time={`${appt.startTime} - ${appt.endTime}`}
                          name={appt.patientName}
                          reason={appt.serviceName || appt.type}
                          titleColor={`text-${typeInfo.color.split('[')[1].split(']')[0]}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookAppointmentModal isOpen={isNewAppointmentOpen} onClose={() => setIsNewAppointmentOpen(false)} onBooked={fetchInitialData} />
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
        "absolute left-2 right-2 rounded-xl border-l-[3px] p-3 pointer-events-auto cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-start overflow-hidden",
        color.includes('bg-') ? color : "bg-blue-50 border-blue-500" // Fallback
      )}
    >
      <span className={cn("text-[9px] font-black uppercase tracking-wider mb-0.5", titleColor.startsWith('text-') ? titleColor : "text-blue-600")}>{time}</span>
      <h4 className="text-[12px] font-bold text-slate-800 leading-tight truncate">{name}</h4>
      <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{reason}</p>
    </div>
  );
}

/* ── Book Appointment Modal ───────────────────────────────────── */

import { patientService } from "@/services/patientService";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPatient } from "@/types";

/* ── Book Appointment Modal ───────────────────────────────────── */

function BookAppointmentModal({ isOpen, onClose, onBooked }: { isOpen: boolean; onClose: () => void; onBooked?: () => void }) {
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);
  const [allDoctors, setAllDoctors] = useState<ApiDoctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedType, setSelectedType] = useState<"CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "EMERGENCY">("CONSULTATION");

  // Fetch doctors on mount
  useEffect(() => {
    if (isOpen) {
      void staffService.getDoctors().then(setAllDoctors);
    }
  }, [isOpen]);

  // Search patients
  useEffect(() => {
    if (searchQuery.length > 2) {
      const delay = setTimeout(async () => {
        try {
          const results = await patientService.getAll({ search: searchQuery });
          setPatients(results);
        } catch (e) {
          console.error(e);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      void bookingService.getAvailableSlots(selectedDoctor.id, formatDateKey(selectedDate))
        .then(setAvailableSlots);
    }
  }, [selectedDoctor, selectedDate]);

  const handleBook = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await bookingService.create({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        date: formatDateKey(selectedDate),
        startTime: selectedTime,
        type: selectedType,
        notes: notes,
        amount: selectedDoctor.consultationFee || 0,
      });
      toast.success("Appointment booked successfully");
      onBooked?.();
      onClose();
    } catch (e) {
      toast.error("Failed to book appointment");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
            <Button 
              onClick={handleBook}
              disabled={loading}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-100"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & confirm"}
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
                {!selectedPatient ? (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, phone or ID..." 
                      className="pl-11 h-14 rounded-2xl border-slate-100 bg-white" 
                    />
                    {patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
                        {patients.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedPatient(p)}
                            className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-none"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={p.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.fullName}`} />
                              <AvatarFallback>{p.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{p.fullName}</span>
                              <span className="text-[11px] text-slate-500">{p.phone}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-slate-50">
                        <AvatarImage src={selectedPatient.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedPatient.fullName}`} />
                        <AvatarFallback>{selectedPatient.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-slate-900">{selectedPatient.fullName}</span>
                        <span className="text-[11px] font-bold text-slate-400 mt-1">ID: #{selectedPatient.id.slice(-5).toUpperCase()} • {selectedPatient.phone}</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedPatient(null)} className="rounded-xl border-slate-200 text-blue-600 font-bold px-5 h-9">Change</Button>
                  </div>
                )}
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
                  <label className="text-[13px] font-bold text-slate-500 ml-1">Visit Type</label>
                  <div className="relative group">
                    <div className="h-14 px-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer">
                      <span className="text-[14px] font-bold text-slate-700 capitalize">{selectedType.replace('_', ' ').toLowerCase()}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      {["CONSULTATION", "FOLLOW_UP", "PROCEDURE", "EMERGENCY"].map((type) => (
                        <div 
                          key={type}
                          onClick={() => setSelectedType(type as "CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "EMERGENCY")}
                          className="px-5 py-4 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span className="text-[13px] font-bold text-slate-700 capitalize">{type.replace('_', ' ').toLowerCase()}</span>
                          {selectedType === type && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                {allDoctors.map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={cn(
                      "p-4 bg-white border rounded-[24px] flex items-center justify-between transition-all cursor-pointer",
                      selectedDoctor?.id === doc.id ? "border-2 border-blue-600 shadow-md" : "border-slate-100 hover:border-blue-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {selectedDoctor?.id === doc.id && (
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={doc.user?.avatarUrl || ""} />
                        <AvatarFallback>{doc.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-slate-900">{doc.fullName}</span>
                        <span className="text-[11px] font-bold text-slate-400 mt-1">{doc.specialization} • {doc.experienceYears} yrs exp.</span>
                      </div>
                    </div>
                    <Badge className={cn("border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider", doc.status === "ACTIVE" ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400")}>
                      ● {doc.status === "ACTIVE" ? "Available" : doc.status}
                    </Badge>
                  </div>
                ))}
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
                {/* Simplified Calendar Placeholder */}
                <div className="w-[300px] space-y-6">
                   <p className="text-sm font-bold text-slate-700">Selected: {selectedDate.toLocaleDateString()}</p>
                   <Input 
                    type="date" 
                    value={formatDateKey(selectedDate)} 
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="h-12 rounded-xl"
                   />
                </div>

                {/* Slots */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Available Slots
                    </h5>
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((time) => (
                          <button 
                            key={time} 
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "py-3 rounded-xl text-[13px] font-bold border transition-all",
                              selectedTime === time ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white border-slate-100 text-slate-500 hover:border-blue-200"
                            )}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <p className="col-span-3 text-xs text-slate-400 text-center py-4 italic">No slots available or select a doctor.</p>
                      )}
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
              <SummaryItem icon={User} label="Patient" value={selectedPatient?.fullName || "Not selected"} />
              <SummaryItem icon={Stethoscope} label="Provider" value={selectedDoctor?.fullName || "Not selected"} subValue={selectedDoctor?.specialization} />
              <SummaryItem icon={CalendarIcon} label="Schedule" value={selectedDate.toLocaleDateString()} subValue={selectedTime || "Time not selected"} />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Visit type</label>
                  <p className="text-[15px] font-bold text-slate-900 capitalize">{selectedType.replace('_', ' ').toLowerCase()}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reason for visit / notes</label>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Briefly describe the symptoms or reason for this appointment..." 
                    className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/30 text-[13px] font-medium resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <Button 
                onClick={handleBook}
                disabled={loading}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl h-14 font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /> Book Appointment</>}
              </Button>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
              By booking, you agree to ClinicFlow<br />scheduling and cancellation policies.
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
