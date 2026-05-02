"use client";

import { useState } from "react";
import {
  Users,
  Clock,
  UserCheck,
  CreditCard,
  Search,
  ChevronDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Activity,
  MessageSquare,
  UserPlus,
  Edit2,
  Calendar as CalendarIcon,
  Sparkles,
  User as UserIcon,
  MapPin,
  ShieldCheck,
  Upload,
  Star,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

export default function ReceptionPatientsPage() {
  const [view, setView] = useState<"list" | "new" | "details">("list");
  const [searchQuery, setSearchQuery] = useState("");

  if (view === "new") {
    return <AddNewPatientView onBack={() => setView("list")} />;
  }

  if (view === "details") {
    return <PatientDetailsView onBack={() => setView("list")} />;
  }

  const patients = [
    {
      id: "1",
      name: "Linda Harrison",
      pid: "#MH-9021",
      doctor: "Dr. Smith",
      time: "10:45 AM",
      type: "CONSULTATION",
      status: "Ready for Checkout",
      avatar: "Linda",
    },
    {
      id: "2",
      name: "David Chen",
      pid: "#MH-4421",
      doctor: "Dr. Smith",
      time: "10:45 AM",
      type: "CONSULTATION",
      status: "Waiting",
      avatar: "David",
    },
    {
      id: "3",
      name: "David Chen",
      pid: "#MH-4421",
      doctor: "Dr. Smith",
      time: "10:45 AM",
      type: "CONSULTATION",
      status: "Ready for Checkout",
      avatar: "David",
    },
    {
      id: "4",
      name: "David Chen",
      pid: "#MH-4421",
      doctor: "Dr. Smith",
      time: "10:45 AM",
      type: "FOLLOW-UP",
      status: "Waiting",
      avatar: "David",
    },
    {
      id: "5",
      name: "Sarah Montgomery",
      pid: "#MH-8571",
      doctor: "Dr. Smith",
      time: "10:45 AM",
      type: "FOLLOW-UP",
      status: "In Session",
      avatar: "Sarah",
      fallback: "SM",
    },
    {
      id: "6",
      name: "James Wilson",
      pid: "#MH-2234",
      doctor: "Dr. Smith",
      time: "10:45 AM",
      type: "FOLLOW-UP",
      status: "Done",
      avatar: "James",
    },
  ];

  const activityLog = [
    {
      time: "TODAY 09:45 AM",
      title: "New Patient Added",
      desc: "Marcus Richardson was successfully registered by Receptionist Sarah.",
      icon: UserPlus,
      color: "bg-blue-500",
    },
    {
      time: "YESTERDAY 02:15 PM",
      title: "Profile Updated",
      desc: "Elena Rodriguez updated her primary contact and insurance info.",
      icon: Edit2,
      color: "bg-slate-300",
    },
    {
      time: "OCT 23, 2023",
      title: "Appointment Rescheduled",
      desc: "David Chen moved his checkup from Nov 1st to Nov 2nd.",
      icon: CalendarIcon,
      color: "bg-blue-300",
    },
  ];

  const rooms = [
    { id: "RM 101", occupied: true },
    { id: "RM 102", occupied: true },
    { id: "RM 103", occupied: false },
    { id: "RM 104", occupied: true },
    { id: "RM 105", occupied: true },
    { id: "RM 106", occupied: false },
    { id: "RM 107", occupied: true },
    { id: "RM 108", occupied: true },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F9FAFB] min-h-screen pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prescriptions</h1>
          <p className="text-slate-400 text-sm font-medium">Manage and track medical operations across departments.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <span className="text-[14px] font-bold text-slate-700">Monday, Oct 24th, 2026</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button onClick={() => setView("new")} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-blue-100">
            + Add New Patient
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={Users} label="Total arrived" value="12" iconBg="bg-blue-50" iconColor="text-blue-600" />
        <SummaryCard 
          icon={Clock} 
          label="Waiting" 
          value="3" 
          iconBg="bg-orange-50" 
          iconColor="text-orange-600" 
          badge="Avg 14 min" 
          badgeBg="bg-orange-50" 
          badgeColor="text-orange-500" 
        />
        <SummaryCard icon={UserCheck} label="In Progress" value="7" iconBg="bg-purple-50" iconColor="text-purple-600" />
        <SummaryCard icon={CreditCard} label="Ready for checkout" value="6" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-8 space-y-8">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative w-full max-w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                placeholder="Search tasks or patients..."
                className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/20 focus:ring-blue-600/5 focus:border-blue-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              <TableFilter label="All states" />
              <TableFilter label="All Doctors" />
              <TableFilter label="All time" />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ASSIGNED DOCTOR</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">APPT. TIME</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                          <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.avatar}`} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-500 font-bold">{item.fallback || item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-slate-800">{item.name}</span>
                          <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">PID: {item.pid}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                          <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.doctor}`} />
                          <AvatarFallback>D</AvatarFallback>
                        </Avatar>
                        <span className="text-[14px] font-bold text-slate-700">{item.doctor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-[14px] font-bold text-slate-700">{item.time}</span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-3">
                        {item.status === "Done" ? (
                           <Button size="sm" className="rounded-xl px-5 font-bold text-[11px] h-9 bg-slate-50 text-slate-400 hover:bg-slate-100 uppercase tracking-widest">
                             Records
                           </Button>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              className="rounded-xl px-6 font-bold text-[11px] h-9 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 uppercase tracking-widest"
                            >
                              {item.status.includes("Checkout") ? "Pay" : "Check In"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl px-5 font-bold text-[11px] h-9 border-slate-100 text-slate-400 hover:bg-slate-50 uppercase tracking-widest"
                              onClick={() => { setView("details"); }}
                            >
                              Details
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
            <p className="text-[13px] font-bold text-slate-400">
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

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <Card className="xl:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden">
          <CardContent className="p-8 space-y-10">
            <h2 className="text-[18px] font-bold text-slate-900">Recent Activity Log</h2>
            <div className="relative space-y-12 pl-4">
              <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-100" />
              {activityLog.map((log, i) => (
                <div key={i} className="relative flex gap-10">
                  <div className={cn("h-4 w-4 rounded-full mt-1.5 shrink-0 z-10 border-4 border-white shadow-sm ring-1 ring-slate-100", log.color)} />
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</span>
                    <h4 className="text-[15px] font-bold text-slate-800">{log.title}</h4>
                    <p className="text-[13px] font-medium text-slate-400 max-w-xl">{log.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-2 space-y-8">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden p-8 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[18px] font-bold text-slate-900">Next in Queue</h2>
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-6 bg-[#F9FAFB] rounded-[24px] border border-slate-50 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                      <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Leo" />
                      <AvatarFallback>LH</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h4 className="text-[16px] font-bold text-slate-900">Leo Harrison</h4>
                      <p className="text-[12px] font-bold text-slate-400 mt-0.5">Peds Check-up</p>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-blue-600">Arrived</span>
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[13px] font-bold text-slate-400">Scheduled:</span>
                  <span className="text-[13px] font-bold text-slate-800">10:30 AM</span>
                </div>
                <Button className="w-full bg-[#5046E5] hover:bg-[#4338CA] text-white rounded-2xl h-14 font-bold shadow-lg shadow-indigo-100 text-[15px]">
                  Call to Station 3
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden">
        <CardContent className="p-8 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-slate-900">Room Occupancy</h2>
            <span className="text-[12px] font-bold text-slate-400 tracking-widest uppercase">6 / 8 Full</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid grid-cols-1 gap-4">
                {rooms.slice(0, 4).map((room) => (
                  <div key={room.id} className="p-5 bg-[#F9FAFB] border border-slate-50 rounded-2xl flex items-center justify-between transition-all hover:border-slate-200">
                    <span className="text-[14px] font-bold text-slate-800">{room.id}</span>
                    <div className={cn("h-2.5 w-2.5 rounded-full", room.occupied ? "bg-rose-500 shadow-sm" : "bg-blue-500 shadow-sm")} />
                  </div>
                ))}
             </div>
             <div className="grid grid-cols-1 gap-4">
                {rooms.slice(4).map((room) => (
                  <div key={room.id} className="p-5 bg-[#F9FAFB] border border-slate-50 rounded-2xl flex items-center justify-between transition-all hover:border-slate-200">
                    <span className="text-[14px] font-bold text-slate-800">{room.id}</span>
                    <div className={cn("h-2.5 w-2.5 rounded-full", room.occupied ? "bg-rose-500 shadow-sm" : "bg-blue-500 shadow-sm")} />
                  </div>
                ))}
             </div>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
             <div className="flex items-center gap-2.5"><div className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Occupied</span></div>
             <div className="flex items-center gap-2.5"><div className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Available</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Add New Patient View ──────────────────────────────────────── */

function AddNewPatientView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-4 lg:p-8 space-y-10 bg-[#F9FAFB] min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
             <span>Patient</span>
             <ChevronRight className="h-3.5 w-3.5" />
             <span className="text-slate-900">Add new patient</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add new patient</h1>
          <p className="text-slate-400 text-[13px] font-medium">Enter patient details to create a new record.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-xl font-bold text-slate-400 border-slate-100 bg-white hover:bg-slate-50 h-11 px-8">
            Cancel
          </Button>
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-100">
            Save Patient
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
        {/* Left Column: Forms */}
        <div className="xl:col-span-7 space-y-8">
          {/* 1. Patient Details */}
          <FormSection title="Patient Details" icon={UserIcon}>
            <div className="grid grid-cols-2 gap-6">
               <InputField label="First name" placeholder="John" />
               <InputField label="Last name" placeholder="Doe" />
               <InputField label="Date of birth" placeholder="MM / DD / YYYY" icon={CalendarIcon} />
               <div className="space-y-2">
                 <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                 <Select
                   placeholder="Select Gender"
                   options={[
                     { value: "male", label: "Male" },
                     { value: "female", label: "Female" },
                     { value: "other", label: "Other" },
                   ]}
                   className="h-12 rounded-xl border-slate-100 bg-[#F9FAFB]/50 focus:ring-blue-600/5 transition-all text-slate-600"
                 />
               </div>
               <InputField label="Phone number" placeholder="+1 (555) 000-0000" />
               <InputField label="Email address" placeholder="john.doe@example.com" />
            </div>
          </FormSection>

          {/* 2. Address */}
          <FormSection title="Address" icon={MapPin}>
            <div className="space-y-6">
              <InputField label="STREET ADDRESS" placeholder="123 Medical Plaza" />
              <div className="grid grid-cols-2 gap-6">
                <InputField label="CITY" placeholder="cairo" />
                <InputField label="ZIP CODE" placeholder="62704" />
              </div>
            </div>
          </FormSection>

          {/* 3. Insurance Information */}
          <FormSection title="Insurance Information" icon={ShieldCheck}>
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">PROVIDER</label>
                 <Select
                   placeholder="Select Provider"
                   options={[
                     { value: "blue", label: "Blue Shield" },
                     { value: "aetna", label: "Aetna" },
                     { value: "cigna", label: "Cigna" },
                   ]}
                   defaultValue="blue"
                   className="h-12 rounded-xl border-slate-100 bg-[#F9FAFB]/50 focus:ring-blue-600/5 transition-all"
                 />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <InputField label="MEMBER ID" placeholder="cairo" />
                <InputField label="POLICY NUMBER" placeholder="62704" />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">INSURANCE CARD PHOTO</label>
                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-12 bg-white flex flex-col items-center justify-center gap-3 group hover:border-blue-200 transition-all cursor-pointer">
                   <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <Upload className="h-6 w-6 text-slate-300 group-hover:text-blue-400" />
                   </div>
                   <div className="text-center">
                     <p className="text-[14px] font-bold text-slate-600">Click to upload or drag and drop</p>
                     <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">PNG, JPG, up to 10MB</p>
                   </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* 4. Emergency Contact */}
          <FormSection title="Emergency Contact" icon={UserIcon}>
            <div className="grid grid-cols-3 gap-6">
              <InputField label="CONTACT NAME" placeholder="Jane Doe" />
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">RELATIONSHIP</label>
                <Select
                  placeholder="Select"
                  defaultValue="spouse"
                  options={[
                    { value: "spouse", label: "Spouse" },
                    { value: "parent", label: "Parent" },
                    { value: "sibling", label: "Sibling" },
                    { value: "child", label: "Child" },
                    { value: "friend", label: "Friend" },
                    { value: "other", label: "Other" },
                  ]}
                  className="h-12 rounded-xl border-slate-100 bg-[#F9FAFB]/50 focus:ring-blue-600/5 transition-all"
                />
              </div>
              <InputField label="PHONE NUMBER" placeholder="+1 (555) 123-4567" />
            </div>
          </FormSection>

          {/* 5. Additional Notes */}
          <FormSection title="Additional Notes" icon={MessageSquare}>
            <textarea
              placeholder="Enter any additional clinical notes or special instructions..."
              rows={5}
              className="w-full rounded-xl border border-slate-100 bg-[#F9FAFB]/50 px-4 py-4 text-[14px] font-medium text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all"
            />
          </FormSection>

          {/* Patient Consent */}
          <div className="flex items-start gap-4 p-6 bg-[#F9FAFB] border border-slate-100 rounded-2xl">
            <input type="checkbox" id="consent" className="mt-1 h-4 w-4 rounded border-slate-200 accent-blue-600 cursor-pointer shrink-0" />
            <label htmlFor="consent" className="text-[13px] font-bold text-slate-700 cursor-pointer leading-relaxed">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">Patient Consent & Privacy Policy</span>
              I confirm that the patient has been informed of our privacy policy and has signed the necessary consent forms for clinical data processing.
            </label>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={onBack}
              className="h-12 px-8 rounded-xl border border-slate-100 bg-white text-[13px] font-bold text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <Button variant="outline" className="h-12 px-8 rounded-xl border-blue-200 text-blue-600 font-bold bg-white hover:bg-blue-50 transition-all text-[13px]">
              Save &amp; Book Appointment
            </Button>
            <Button className="h-12 px-8 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-lg shadow-blue-100 text-[13px]">
              Save Patient
            </Button>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="xl:col-span-3 space-y-8">
          {/* QUICK TAGS */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden p-6 space-y-6">
             <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">QUICK TAGS</h3>
             <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#FFFBEB] text-[#D97706] border-none rounded-lg px-3 py-1.5 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                  <Star className="h-3 w-3 fill-current" /> VIP
                </Badge>
                <Badge className="bg-[#ECFDF5] text-[#059669] border-none rounded-lg px-3 py-1.5 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                  <Activity className="h-3 w-3" /> Walk-in
                </Badge>
                <button className="h-8 px-3 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-400 flex items-center gap-1.5 hover:bg-slate-50 transition-all">
                  <Plus className="h-3 w-3" /> Add Tag
                </button>
             </div>
          </Card>

          {/* SIMILAR RECORDS */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden p-6 space-y-6">
             <div className="space-y-1">
               <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">SIMILAR RECORDS (2)</h3>
               <p className="text-[10px] font-bold text-slate-400 leading-tight">Checking for existing patients as you type...</p>
             </div>
             
             <div className="space-y-3">
                <div className="p-4 bg-[#FFF9F0] border-2 border-[#FFD39A] rounded-[20px] flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-[12px] font-bold">JD</div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-900 leading-tight">Johnathan Doe</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">DOB: 08/17/1988</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-[#D97706]">85% match</span>
                </div>

                <div className="p-4 bg-[#F9FAFB] border border-slate-100 rounded-[20px] flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[12px] font-bold">JD</div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-900 leading-tight">Johnathan Doe</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">DOB: 08/17/1988</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-slate-300">40% match</span>
                </div>
             </div>
             <p className="text-[10px] font-medium text-slate-400 text-center leading-relaxed italic">
               If this is a returning patient, click a card above to load their profile instead of creating a new one.
             </p>
          </Card>

          {/* REGISTRATION PROGRESS */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden p-6 space-y-6">
             <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">REGISTRATION PROGRESS</h3>
             <div className="space-y-6 pl-1">
                <ProgressItem active completed label="Personal Details" number={1} />
                <ProgressItem active label="Insurance & Coverage" number={2} />
                <ProgressItem label="Emergency Contacts" number={3} />
                <ProgressItem label="Confirmation" number={4} />
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function FormSection({ title, icon: Icon, children }: FormSectionProps) {
  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[32px] bg-white overflow-hidden p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#6366F1]" />
        </div>
        <h2 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

interface InputFieldProps {
  label: string;
  placeholder: string;
  icon?: React.ElementType;
}

function InputField({ label, placeholder, icon: Icon }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <Input placeholder={placeholder} className="h-12 rounded-xl border-slate-100 bg-[#F9FAFB]/50 focus:ring-blue-600/5 transition-all text-sm font-medium" />
        {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />}
      </div>
    </div>
  );
}

interface ProgressItemProps {
  label: string;
  number: number;
  active?: boolean;
  completed?: boolean;
}

function ProgressItem({ label, number, active, completed }: ProgressItemProps) {
  return (
    <div className="flex items-center gap-4 group">
       <div className={cn(
         "h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-black transition-all",
         completed ? "bg-[#10B981] text-white" : (active ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-100" : "bg-slate-50 text-slate-300")
       )}>
         {completed ? <CheckCircle2 className="h-5 w-5" /> : number}
       </div>
       <span className={cn(
         "text-[13px] font-bold transition-colors",
         completed || active ? "text-slate-800" : "text-slate-300"
       )}>{label}</span>
    </div>
  );
}

/* ── Original Sub-components ──────────────────────────────────────────── */

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
}

function SummaryCard({ icon: Icon, label, value, iconBg, iconColor, badge, badgeBg, badgeColor }: SummaryCardProps) {
  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6 md:p-8 flex items-center gap-6">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-7 w-7", iconColor)} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-400">{label}</span>
            {badge && (
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap uppercase tracking-tighter", badgeBg, badgeColor)}>
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function TableFilter({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap">
      <span className="text-[13px] font-bold text-slate-500">{label}</span>
      <ChevronDown className="h-4 w-4 text-slate-400" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    "Ready for Checkout": "bg-blue-50 text-blue-500",
    "Waiting": "bg-[#F5F3FF] text-[#7C3AED]",
    "In Session": "bg-orange-50 text-orange-400",
    "Done": "bg-slate-100 text-slate-400",
  };
  return (
    <Badge className={cn("rounded-[12px] px-4 py-1.5 border-none font-black text-[10px] uppercase tracking-widest whitespace-nowrap", configs[status] || "bg-slate-50 text-slate-500")}>
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
        "h-10 w-10 flex items-center justify-center rounded-xl border border-slate-100 transition-all",
        disabled ? "bg-slate-50 text-slate-100 cursor-not-allowed" : "bg-white text-slate-400 hover:border-blue-600 hover:text-blue-600 shadow-sm"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PaginationNumber({ number, active }: { number: number; active?: boolean }) {
  return (
    <button
      className={cn(
        "h-10 w-10 flex items-center justify-center rounded-xl font-bold text-[14px] transition-all",
        active ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {number}
    </button>
  );
}

/* ── Patient Details View ──────────────────────────────────────── */

function PatientDetailsView({ onBack }: { onBack: () => void }) {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const medications = [
    { name: "Metformin", dosage: "500mg, Once daily" },
    { name: "Lisinopril", dosage: "5mg, Once daily" },
    { name: "Lisinopril", dosage: "5mg, Once daily" },
    { name: "Lisinopril", dosage: "5mg, Once daily" },
  ];

  const allergies = [
    { name: "Penicillin", desc: "Severe rash, hives, anaphylaxis risk", severe: true },
    { name: "Latex", desc: "Mild contact dermatitis", severe: false },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F9FAFB] min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-[22px] font-bold text-slate-900">Detailed Patient Information</h1>
          <p className="text-slate-400 text-[13px] font-medium">Comprehensive intake form and history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-slate-100 bg-white font-bold text-slate-400 hover:bg-slate-50 h-11 px-8 text-[13px]">
            Back to list
          </Button>
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-100 text-[13px]">
            Save & confirm
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-7 space-y-8">
          {/* Patient Hero Card */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Michael" />
                  <AvatarFallback className="text-xl font-bold bg-blue-50 text-blue-600">MH</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h2 className="text-[20px] font-bold text-slate-900">Michael R. Harrison</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tighter">ID: #PT-84729</span>
                    <span className="text-[12px] font-bold text-slate-400">DOB: 14 Aug 1983 (43y)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] font-bold text-slate-500">Blood type: O+</span>
                    <span className="text-[12px] font-bold text-slate-500">Weight: 85 kg</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <span className="text-blue-600 text-xl">📞</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <span className="text-blue-600 text-xl">✉️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">Medical History</h3>
              </div>

              {/* Existing Conditions */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Existing Conditions</label>
                <div className="flex flex-wrap items-center gap-2">
                  {["Hypertension", "Type 2 Diabetes"].map((cond) => (
                    <div key={cond} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[13px] font-bold text-slate-700">{cond}</span>
                      <X className="h-3 w-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                    </div>
                  ))}
                  <Input placeholder="search and add conditions..." className="w-[220px] h-9 rounded-lg border-slate-100 bg-slate-50 text-[13px]" />
                  <button className="h-9 w-9 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <Plus className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Medications + Allergies Grid */}
              <div className="grid grid-cols-2 gap-8">
                {/* Current Medications */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current medications</label>
                  <div className="space-y-3">
                    {medications.map((med, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <div>
                          <p className="text-[14px] font-bold text-slate-800">{med.name}</p>
                          <p className="text-[11px] font-medium text-slate-400">{med.dosage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Known Allergies */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Known allergies</label>
                  <div className="space-y-3">
                    {allergies.map((allergy, i) => (
                      <div key={i} className={cn("p-4 rounded-xl border", allergy.severe ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100")}>
                        <p className={cn("text-[14px] font-bold", allergy.severe ? "text-rose-600" : "text-slate-700")}>{allergy.name}</p>
                        <p className={cn("text-[11px] font-medium mt-0.5", allergy.severe ? "text-rose-400" : "text-slate-400")}>{allergy.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Past Surgeries */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Past Surgeries / Major Procedures</label>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                      <span className="text-lg">🏥</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-800">Appendectomy</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">March 2015 • Dr. Sarah Jenkins</p>
                    </div>
                  </div>
                  <button className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <X className="h-4 w-4 text-red-400" />
                  </button>
                </div>
                <button className="flex items-center gap-2 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  <Plus className="h-4 w-4" /> Add procedure
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Verification & Billing */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">Insurance Verification & Billing</h3>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-10">
                {/* Left: Provider Details */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Primary Insurance Provider</label>
                    <p className="text-[15px] font-bold text-slate-900">BlueCross BlueShield</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Group Number</label>
                    <p className="text-[15px] font-bold text-slate-800 font-mono">GRP-1029</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Policy Number</label>
                    <p className="text-[15px] font-bold text-slate-800 font-mono">BC85-89765432I4</p>
                  </div>
                </div>

                {/* Right: Coverage Details */}
                <div className="space-y-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Coverage Details</label>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-[13px] font-bold text-slate-500">Co-pay (Specialist)</span>
                    <span className="text-[14px] font-black text-slate-800">40.00 LE</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-500">Deductible Met</span>
                      <span className="text-[14px] font-black text-blue-600">1,200 / 2,000 LE</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <button className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-2">
                    Re-verify coverage
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-3 space-y-8">
          {/* Live Health Trends */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <h3 className="text-[16px] font-bold text-slate-900">Live Health Trends</h3>
              <div className="space-y-6">
                <VitalRow emoji="❤️" label="Heart Rate" value="72" unit="BPM" color="text-red-500" />
                <VitalRow emoji="🩺" label="Blood Pressure" value="128/82" unit="mmhg" color="text-blue-500" />
                <VitalRow emoji="🩸" label="Glucose" value="94" unit="mg/dL" color="text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[16px] font-bold text-slate-900">Emergency Contact</h3>
              <div className="p-5 bg-[#F9FAFB] border border-slate-100 rounded-[20px] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[15px] font-bold text-slate-900">Sarah Harrison</h4>
                  <button className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
                <p className="text-[12px] font-bold text-slate-400 -mt-2">Spouse</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                    <span>📞</span> +1 (505) 887-8543
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                    <span>✉️</span> sarah.h@example.com
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center gap-2 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors w-full justify-center py-2"
              >
                <Plus className="h-4 w-4" /> Add secondary contact
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showEmergencyModal && <AddEmergencyContactModal onClose={() => setShowEmergencyModal(false)} />}
    </div>
  );
}

interface VitalRowProps {
  emoji: string;
  label: string;
  value: string;
  unit: string;
  color: string;
}

function VitalRow({ emoji, label, value, unit, color }: VitalRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{emoji}</span>
        <span className="text-[13px] font-bold text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-black", color)}>{value}</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{unit}</span>
      </div>
    </div>
  );
}

function AddEmergencyContactModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-[17px] font-bold text-slate-900">Add emergency contact</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-8 pt-6 pb-4 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">First name</label>
            <Input placeholder="Enter your name" className="h-12 rounded-xl border-slate-200 bg-white text-[14px] focus:ring-blue-50 focus:border-blue-300 shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">Last name</label>
            <Input placeholder="Enter your last name" className="h-12 rounded-xl border-slate-200 bg-white text-[14px] focus:ring-blue-50 focus:border-blue-300 shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">Relationship</label>
            <Select
              placeholder="Select your relationship"
              options={[
                { value: "spouse", label: "Spouse" },
                { value: "parent", label: "Parent" },
                { value: "sibling", label: "Sibling" },
                { value: "child", label: "Child" },
                { value: "friend", label: "Friend" },
                { value: "other", label: "Other" },
              ]}
              className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">Phone number</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 h-12 px-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer">
                <span className="text-base">🇪🇬</span>
                <span className="text-[13px] font-bold text-slate-600">+20</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <Input placeholder="000 000 0000" className="flex-1 h-12 rounded-xl border-slate-200 bg-white text-[14px] shadow-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">Email</label>
            <Input placeholder="youremail@example.com" className="h-12 rounded-xl border-slate-200 bg-white text-[14px] focus:ring-blue-50 focus:border-blue-300 shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">Address</label>
            <Input placeholder="Street Name, Building, Apartment" className="h-12 rounded-xl border-slate-200 bg-white text-[14px] focus:ring-blue-50 focus:border-blue-300 shadow-sm" />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-8 py-6 flex items-center gap-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-500 font-bold bg-white hover:bg-slate-50 text-[14px]">
            Cancel
          </Button>
          <Button className="flex-1 h-12 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-lg shadow-blue-100 text-[14px]">
            Add Contact
          </Button>
        </div>
      </div>
    </div>
  );
}

