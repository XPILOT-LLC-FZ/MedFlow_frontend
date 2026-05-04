"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useToastStore } from "@/stores/useToastStore";
import { patientService } from "@/services/patientService";
import { dashboardService } from "@/services/dashboardService";
import type { ApiPatient, PaginatedPatientsResponse, DashboardStaffSummaryData } from "@/types";

import { useSearchParams, useRouter } from "next/navigation";

export default function ReceptionPatientsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"list" | "new" | "details">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [patientsResponse, setPatientsResponse] = useState<PaginatedPatientsResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStaffSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToastStore();

  // Handle deep linking from URL
  useEffect(() => {
    const id = searchParams.get("id");
    const viewParam = searchParams.get("view");
    if (id) {
      setSelectedPatientId(id);
      setView("details");
    } else if (viewParam === "new") {
      setView("new");
    } else {
      setView("list");
      setSelectedPatientId(null);
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        patientService.getPage({
          search: searchQuery,
          page: currentPage,
          take: 10,
        }),
        dashboardService.getStaffSummary({ period: "day" })
      ]);
      setPatientsResponse(pRes);
      setDashboardData(dRes);
    } catch (err) {
      console.error("Failed to fetch data", err);
      toast.error("Failed to load page data");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSelectPatient = (id: string) => {
    router.push(`/reception/patients?id=${id}`);
  };

  const handleBackToList = () => {
    router.push("/reception/patients");
  };

  if (view === "new") {
    return <AddNewPatientView onBack={handleBackToList} />;
  }

  if (view === "details" && selectedPatientId) {
    return <PatientDetailsView id={selectedPatientId} onBack={handleBackToList} />;
  }

  const patients = patientsResponse?.data || [];
  const meta = patientsResponse?.meta;
  const summary = dashboardData?.summaryCards;
  const nextUp = dashboardData?.queue.nextAppointment;

  const activityLog = dashboardData?.activityLog.map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: log.title,
    desc: log.description,
    icon: log.type === 'APPOINTMENT' ? CalendarIcon : UserPlus,
    color: log.type === 'APPOINTMENT' ? "bg-blue-300" : "bg-blue-500",
  })) || [];

  const occupiedRooms = dashboardData?.doctorsStatus.filter(d => !d.isAvailable).length || 0;
  const totalRooms = dashboardData?.doctorsStatus.length || 8;

  return (
    <div className="p-4 lg:p-8 space-y-6 md:space-y-8 bg-slate-50 min-h-screen pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Patients Directory</h1>
          <p className="text-slate-400 text-[13px] md:text-sm font-medium">Manage and track medical operations across departments.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <span className="text-[13px] md:text-[14px] font-bold text-slate-700 whitespace-nowrap">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button onClick={() => setView("new")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 md:h-12 px-6 md:px-8 font-bold shadow-lg shadow-blue-500/10">
            <Plus className="h-4 w-4 mr-2" /> Add New Patient
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={Users} label="Total registered" value={isLoading ? "..." : (meta?.total?.toString() || "0")} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <SummaryCard 
          icon={Clock} 
          label="Completed Today" 
          value={isLoading ? "..." : (summary?.completed.toString() || "0")} 
          iconBg="bg-orange-50" 
          iconColor="text-orange-600" 
          badge="Live" 
          badgeBg="bg-orange-50" 
          badgeColor="text-orange-500" 
        />
        <SummaryCard icon={UserCheck} label="Waiting" value={isLoading ? "..." : (summary?.scheduledConfirmed.toString() || "0")} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <SummaryCard icon={CreditCard} label="Revenue Today" value={isLoading ? "..." : `${summary?.todayRevenue?.toLocaleString() || 0} L.E`} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-8 space-y-8">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative w-full max-w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                placeholder="Search by name, phone or email..."
                className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/20 focus:ring-blue-600/5 focus:border-blue-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              <TableFilter label="All states" />
              <TableFilter label="VIP Status" />
              <TableFilter label="All time" />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">VIP Tier</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Visits</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">Loading patients...</td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">No patients found.</td>
                  </tr>
                ) : (
                  patients.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.fullName}`} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-500 font-bold">{item.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-slate-800">{item.fullName}</span>
                            <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">PID: {item.id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[14px] font-bold text-slate-700">{item.phone || "N/A"}</span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[14px] font-medium text-slate-500">{item.email || "N/A"}</span>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={cn(
                          "rounded-lg px-2.5 py-1 border-none font-bold text-[10px] uppercase tracking-widest",
                          item.vipTier === "PLATINUM" ? "bg-indigo-100 text-indigo-600" :
                          item.vipTier === "GOLD" ? "bg-amber-100 text-amber-600" :
                          item.vipTier === "SILVER" ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-400"
                        )}>
                          {item.vipTier}
                        </Badge>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[14px] font-bold text-slate-700">{item.totalVisits}</span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            size="sm"
                            className="rounded-xl px-6 font-bold text-[11px] h-9 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10 uppercase tracking-widest"
                            onClick={() => handleSelectPatient(item.id)}
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-50 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${nextUp?.patientName || "Guest"}`} />
                      <AvatarFallback>{nextUp?.patientName?.substring(0, 2).toUpperCase() || "PT"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h4 className="text-[16px] font-bold text-slate-900 truncate max-w-[150px]">{nextUp?.patientName || "No patient waiting"}</h4>
                      <p className="text-[12px] font-bold text-slate-400 mt-0.5">{nextUp?.serviceName || "Next available session"}</p>
                    </div>
                  </div>
                  {nextUp && <span className="text-[12px] font-bold text-blue-600">Up Next</span>}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[13px] font-bold text-slate-400">Scheduled:</span>
                  <span className="text-[13px] font-bold text-slate-800">{nextUp?.time || "--:--"}</span>
                </div>
                <Button 
                  onClick={() => router.push("/reception/waiting-room")}
                  disabled={!nextUp}
                  className="w-full bg-[#5046E5] hover:bg-[#4338CA] text-white rounded-2xl h-14 font-bold shadow-lg shadow-indigo-100 text-[15px]"
                >
                  {nextUp ? "Go to Queue" : "View Queue"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden">
        <CardContent className="p-8 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-slate-900">Provider Status</h2>
            <span className="text-[12px] font-bold text-slate-400 tracking-widest uppercase">{occupiedRooms} / {totalRooms} Busy</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid grid-cols-1 gap-4">
                {dashboardData?.doctorsStatus.slice(0, Math.ceil(totalRooms / 2)).map((doc) => (
                  <div key={doc.doctorId} className="p-5 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-between transition-all hover:border-slate-200">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={doc.avatarUrl || ""} />
                        <AvatarFallback>{doc.fullName.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[14px] font-bold text-slate-800 truncate max-w-[120px]">{doc.fullName}</span>
                    </div>
                    <div className={cn("h-2.5 w-2.5 rounded-full", !doc.isAvailable ? "bg-rose-500 shadow-sm" : "bg-blue-500 shadow-sm")} />
                  </div>
                ))}
             </div>
             <div className="grid grid-cols-1 gap-4">
                {dashboardData?.doctorsStatus.slice(Math.ceil(totalRooms / 2)).map((doc) => (
                  <div key={doc.doctorId} className="p-5 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-between transition-all hover:border-slate-200">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={doc.avatarUrl || ""} />
                        <AvatarFallback>{doc.fullName.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[14px] font-bold text-slate-800 truncate max-w-[120px]">{doc.fullName}</span>
                    </div>
                    <div className={cn("h-2.5 w-2.5 rounded-full", !doc.isAvailable ? "bg-rose-500 shadow-sm" : "bg-blue-500 shadow-sm")} />
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
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToastStore();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    insuranceProvider: "blue",
    insuranceMemberId: "",
    insurancePolicyNumber: "",
    emergencyContactName: "",
    emergencyRelationship: "spouse",
    emergencyPhone: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender as any,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        medicalHistory: {
          address: {
            street: formData.address,
            city: formData.city,
            zip: formData.zipCode,
          },
          insuranceDetails: {
            provider: formData.insuranceProvider,
            memberId: formData.insuranceMemberId,
            policyNumber: formData.insurancePolicyNumber,
            verificationStatus: "pending",
          },
          emergencyContact: {
            name: formData.emergencyContactName,
            relationship: formData.emergencyRelationship,
            phone: formData.emergencyPhone,
          },
          notes: formData.notes,
        },
      };

      await patientService.create(payload as any);
      toast.success("Patient created successfully");
      onBack();
    } catch (err) {
      console.error("Failed to create patient", err);
      toast.error("Failed to create patient record");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-10 bg-slate-50 min-h-screen pb-20 font-sans">
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
          <Button variant="outline" onClick={onBack} disabled={isSaving} className="rounded-xl font-bold text-slate-400 border-slate-100 bg-white hover:bg-slate-50 h-11 px-8">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/10"
          >
            {isSaving ? "Saving..." : "Save Patient"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
        {/* Left Column: Forms */}
        <div className="xl:col-span-7 space-y-8">
          {/* 1. Patient Details */}
          <FormSection title="Patient Details" icon={UserIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <InputField 
                 label="First name" 
                 placeholder="John" 
                 value={formData.firstName} 
                 onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
               />
               <InputField 
                 label="Last name" 
                 placeholder="Doe" 
                 value={formData.lastName} 
                 onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
               />
               <InputField 
                 label="Date of birth" 
                 placeholder="YYYY-MM-DD" 
                 icon={CalendarIcon} 
                 value={formData.dateOfBirth} 
                 onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} 
               />
               <div className="space-y-2">
                 <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                 <select
                   value={formData.gender}
                   onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                   className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/5 transition-all"
                 >
                   <option value="">Select Gender</option>
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                   <option value="other">Other</option>
                 </select>
               </div>
               <InputField 
                 label="Phone number" 
                 placeholder="+1 (555) 000-0000" 
                 value={formData.phone} 
                 onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
               />
               <InputField 
                 label="Email address" 
                 placeholder="john.doe@example.com" 
                 value={formData.email} 
                 onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
               />
            </div>
          </FormSection>

          {/* 2. Address */}
          <FormSection title="Address" icon={MapPin}>
            <div className="space-y-6">
              <InputField 
                label="STREET ADDRESS" 
                placeholder="123 Medical Plaza" 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="CITY" 
                  placeholder="cairo" 
                  value={formData.city} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                />
                <InputField 
                  label="ZIP CODE" 
                  placeholder="62704" 
                  value={formData.zipCode} 
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} 
                />
              </div>
            </div>
          </FormSection>

          {/* 3. Insurance Information */}
          <FormSection title="Insurance Information" icon={ShieldCheck}>
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">PROVIDER</label>
                 <select
                   value={formData.insuranceProvider}
                   onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                   className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/5 transition-all"
                 >
                   <option value="blue">Blue Shield</option>
                   <option value="aetna">Aetna</option>
                   <option value="cigna">Cigna</option>
                 </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="MEMBER ID" 
                  placeholder="MEMBER-123" 
                  value={formData.insuranceMemberId} 
                  onChange={(e) => setFormData({ ...formData, insuranceMemberId: e.target.value })} 
                />
                <InputField 
                  label="POLICY NUMBER" 
                  placeholder="POL-889" 
                  value={formData.insurancePolicyNumber} 
                  onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })} 
                />
              </div>
            </div>
          </FormSection>

          {/* 4. Emergency Contact */}
          <FormSection title="Emergency Contact" icon={UserIcon}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField 
                label="CONTACT NAME" 
                placeholder="Jane Doe" 
                value={formData.emergencyContactName} 
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} 
              />
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">RELATIONSHIP</label>
                <select
                  value={formData.emergencyRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/5 transition-all"
                >
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <InputField 
                label="PHONE NUMBER" 
                placeholder="+1 (555) 123-4567" 
                value={formData.emergencyPhone} 
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })} 
              />
            </div>
          </FormSection>

          {/* 5. Additional Notes */}
          <FormSection title="Additional Notes" icon={MessageSquare}>
            <textarea
              placeholder="Enter any additional clinical notes or special instructions..."
              rows={5}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4 text-[14px] font-medium text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all"
            />
          </FormSection>

          {/* Patient Consent */}
          <div className="flex items-start gap-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
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
              disabled={isSaving}
              className="h-12 px-8 rounded-xl border border-slate-100 bg-white text-[13px] font-bold text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]"
            >
              {isSaving ? "Creating..." : "Save Patient"}
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
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-[20px] flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-[12px] font-bold">JD</div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-900 leading-tight">Johnathan Doe</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">DOB: 08/17/1988</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-[#D97706]">85% match</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-[20px] flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all">
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
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InputField({ label, placeholder, icon: Icon, value, onChange }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <Input 
          placeholder={placeholder} 
          value={value}
          onChange={onChange}
          className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-600/5 transition-all text-sm font-medium" 
        />
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
         completed ? "bg-emerald-500 text-white" : (active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "bg-slate-50 text-slate-300")
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
    "Waiting": "bg-purple-50 text-purple-600",
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
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {number}
    </button>
  );
}

/* ── Patient Details View ──────────────────────────────────────── */

function PatientDetailsView({ id, onBack }: { id: string; onBack: () => void }) {
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const toast = useToastStore();

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientService.getById(id);
      setPatient(data);
    } catch (err) {
      console.error("Failed to fetch patient details", err);
      toast.error("Failed to load patient details");
      onBack();
    } finally {
      setIsLoading(false);
    }
  }, [id, onBack, toast]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const handleVerifyInsurance = async (status: 'verified' | 'rejected' | 'pending') => {
    try {
      await patientService.verifyInsurance(id, {
        status: status === 'pending' ? 'verified' : status as any, // Simple toggle/update logic
        verifiedBy: "Reception Staff",
        discountPercent: status === 'verified' ? 20 : 0,
        discountNote: status === 'verified' ? "Verified via insurance portal" : "Provider rejected coverage"
      });
      toast.success(`Insurance status updated to ${status}`);
      void fetchDetails();
    } catch (err) {
      toast.error("Failed to update insurance status");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-slate-400 font-bold animate-pulse text-lg">Loading profile data...</div>
      </div>
    );
  }

  if (!patient) return null;

  const mh = (patient.medicalHistory as Record<string, unknown>) || {};
  const insurance = (mh.insuranceDetails as Record<string, unknown>) || {};
  const emergency = (mh.emergencyContact as Record<string, unknown>) || {};
  const allergies = (mh.allergies as Array<{ name: string; severity: string; notes?: string }>) || [];
  const currentMeds = (mh.currentMedications as Array<{ name: string; dosage: string }>) || [];
  const vitals = (mh.vitals as Record<string, string>) || {};

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-[22px] font-bold text-slate-900">Detailed Patient Information</h1>
          <p className="text-slate-400 text-[13px] font-medium">Comprehensive intake form and history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-slate-100 bg-white font-bold text-slate-400 hover:bg-slate-50 h-11 px-8 text-[13px]">
            Back to Directory
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/10 text-[13px]">
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-7 space-y-8">
          {/* Patient Hero Card */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
                <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${patient.fullName}`} />
                  <AvatarFallback className="text-xl font-bold bg-blue-50 text-blue-600">{patient.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1.5 md:space-y-2">
                  <h2 className="text-[18px] md:text-[20px] font-bold text-slate-900">{patient.fullName}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                    <span className="text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-tighter">ID: #PT-{patient.id.slice(-6).toUpperCase()}</span>
                    {patient.dateOfBirth && (
                      <span className="text-[11px] md:text-[12px] font-bold text-slate-400">
                        DOB: {new Date(patient.dateOfBirth).toLocaleDateString()} ({new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <span className="text-[11px] md:text-[12px] font-bold text-slate-500">Blood type: {patient.bloodType || "N/A"}</span>
                    <span className="text-[11px] md:text-[12px] font-bold text-slate-500">Gender: {patient.gender || "N/A"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors shadow-sm">
                  <span className="text-blue-600 text-lg md:text-xl">📞</span>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors shadow-sm">
                  <span className="text-blue-600 text-lg md:text-xl">✉️</span>
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
                  {(mh.conditions as string[] || []).length === 0 ? (
                    <span className="text-sm text-slate-400 font-medium italic">No recorded conditions.</span>
                  ) : (
                    (mh.conditions as string[]).map((cond) => (
                      <div key={cond} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[13px] font-bold text-slate-700">{cond}</span>
                        <X className="h-3 w-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                      </div>
                    ))
                  )}
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
                    {currentMeds.length === 0 ? (
                      <p className="text-sm text-slate-400 font-medium italic">No active medications.</p>
                    ) : (
                      currentMeds.map((med, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0">
                          <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <p className="text-[14px] font-bold text-slate-800">{med.name}</p>
                            <p className="text-[11px] font-medium text-slate-400">{med.dosage}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Known Allergies */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Known allergies</label>
                  <div className="space-y-3">
                    {allergies.length === 0 ? (
                      <p className="text-sm text-slate-400 font-medium italic">No known allergies.</p>
                    ) : (
                      allergies.map((allergy, i) => (
                        <div key={i} className={cn("p-4 rounded-xl border", allergy.severity === "High" ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100")}>
                          <p className={cn("text-[14px] font-bold", allergy.severity === "High" ? "text-rose-600" : "text-slate-700")}>{allergy.name}</p>
                          <p className={cn("text-[11px] font-medium mt-0.5", allergy.severity === "High" ? "text-rose-400" : "text-slate-400")}>{allergy.notes || "No additional notes."}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Past Surgeries */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Past Surgeries / Major Procedures</label>
                {(mh.surgeries as Array<{ title: string; date: string; doctor: string }> || []).map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl mb-3">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <span className="text-lg">🏥</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{s.title}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{s.date} • {s.doctor}</p>
                      </div>
                    </div>
                    <button className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
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
                <Badge className={cn(
                  "rounded-full px-4 py-1.5 border-none font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5",
                  insurance.verificationStatus === "verified" ? "bg-emerald-50 text-emerald-600" :
                  insurance.verificationStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                )}>
                  {insurance.verificationStatus === "verified" ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                   insurance.verificationStatus === "rejected" ? <X className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {String(insurance.verificationStatus || "unverified").toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-10">
                {/* Left: Provider Details */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Primary Insurance Provider</label>
                    <p className="text-[15px] font-bold text-slate-900">{String(insurance.provider || "N/A")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category / Plan</label>
                    <p className="text-[15px] font-bold text-slate-800">{String(insurance.category || "N/A")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Policy Number</label>
                    <p className="text-[15px] font-bold text-slate-800 font-mono">{String(insurance.policyNumber || "N/A")}</p>
                  </div>
                </div>

                {/* Right: Coverage Details */}
                <div className="space-y-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Coverage Details</label>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-[13px] font-bold text-slate-500">Discount Percent</span>
                    <span className="text-[14px] font-black text-slate-800">{String(insurance.discountPercent || "0")}%</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verification Note</label>
                    <p className="text-[13px] font-medium text-slate-600 italic">
                      &quot;{String(insurance.discountNote || "No verification notes provided.")}&quot;
                    </p>
                  </div>
                  
                  {insurance.verificationStatus !== "verified" ? (
                    <div className="flex flex-col gap-3 pt-2">
                      <Button 
                        onClick={() => handleVerifyInsurance("verified")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-bold text-[13px]"
                      >
                        Verify & Apply Discount
                      </Button>
                      <Button 
                        onClick={() => handleVerifyInsurance("rejected")}
                        variant="outline"
                        className="w-full border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl h-11 font-bold text-[13px]"
                      >
                        Reject Coverage
                      </Button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleVerifyInsurance("pending")}
                      className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-2"
                    >
                      Re-verify coverage
                    </button>
                  )}
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
              <h3 className="text-[16px] font-bold text-slate-900">Recorded Vitals (Latest)</h3>
              <div className="space-y-6">
                <VitalRow emoji="❤️" label="Heart Rate" value={vitals.heartRate || "--"} unit="BPM" color="text-red-500" />
                <VitalRow emoji="🩺" label="Blood Pressure" value={vitals.bp || "--"} unit="mmhg" color="text-blue-500" />
                <VitalRow emoji="🩸" label="Glucose" value={vitals.glucose || "--"} unit="mg/dL" color="text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[16px] font-bold text-slate-900">Emergency Contact</h3>
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-[20px] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[15px] font-bold text-slate-900">{String(emergency.name || "N/A")}</h4>
                  <button className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
                <p className="text-[12px] font-bold text-slate-400 -mt-2">{String(emergency.relationship || "Contact")}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                    <span>📞</span> {String(emergency.phone || "N/A")}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                    <span>✉️</span> {String(emergency.email || "N/A")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center gap-2 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors w-full justify-center py-2"
              >
                <Plus className="h-4 w-4" /> Edit contact info
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
          <Button className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[14px]">
            Add Contact
          </Button>
        </div>
      </div>
    </div>
  );
}



