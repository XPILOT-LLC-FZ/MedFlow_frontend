"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle,
  Clock3,
  RefreshCw,
  Users,
  Download,
  TrendingUp,
  Star,
  Eye,
  X,
  Phone,
  Mail,
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import { treatmentPlanService } from "@/services/treatmentPlanService";
import { prescriptionService } from "@/services/prescriptionService";
import { patientService } from "@/services/patientService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiTreatmentPlan, DashboardDoctorSummaryData, ApiPrescription, ApiPatient } from "@/types";
import { cn } from "@/lib/utils";

const isWithinRange = (dateStr: string | Date | null | undefined, range: string) => {
  if (!dateStr) return false;
  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return false;
  
  const now = new Date();
  const diffTime = now.getTime() - targetDate.getTime();
  const absDiffDays = Math.abs(diffTime / (1000 * 60 * 60 * 24));
  
  switch(range) {
    case 'today': return absDiffDays <= 1;
    case 'week': return absDiffDays <= 7;
    case 'month': return absDiffDays <= 30;
    case 'year': return absDiffDays <= 365;
    case 'all': default: return true;
  }
};


const mockCaseTypes = [
  { name: 'Hypertension', value: 285, color: '#EF4444' },
  { name: 'Diabetes', value: 245, color: '#F59E0B' },
  { name: 'Respiratory', value: 178, color: '#3B82F6' },
  { name: 'Cardiovascular', value: 156, color: '#8B5CF6' },
  { name: 'Other', value: 383, color: '#10B981' },
];

const mockMedications = [
  { name: 'Lisinopril', count: 145, max: 145 },
  { name: 'Metformin', count: 132, max: 145 },
  { name: 'Atorvastatin', count: 118, max: 145 },
  { name: 'Omeprazole', count: 95, max: 145 },
  { name: 'Levothyroxine', count: 87, max: 145 },
  { name: 'Amlodipine', count: 76, max: 145 },
  { name: 'Aspirin', count: 68, max: 145 },
  { name: 'Gabapentin', count: 52, max: 145 },
];

const mockDemographics = [
  { name: 'Pediatric (0-17)', value: 28, color: '#3B82F6' },
  { name: 'Adult (18-64)', value: 56, color: '#10B981' },
  { name: 'Senior (65+)', value: 16, color: '#F59E0B' },
];

const mockSatisfaction = {
  rating: 4.8,
  reviews: 342,
  distribution: [
    { stars: 5, count: 256, max: 256 },
    { stars: 4, count: 56, max: 256 },
    { stars: 3, count: 16, max: 256 },
    { stars: 2, count: 7, max: 256 },
    { stars: 1, count: 3, max: 256 },
  ]
};

/* --- SUBCOMPONENTS --- */

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down" | "none";
  trendLabel?: string;
  theme: "blue" | "teal" | "orange" | "green";
}

function StatsCard({ title, value, icon: Icon, trend, trendLabel, theme }: StatsCardProps) {
  const themes = {
    blue: {
      bg: "bg-[#F3F8FF] dark:bg-blue-900/10",
      border: "border-[#E0EDFF] dark:border-blue-800/40",
      iconBox: "bg-[#C3DAFE] dark:bg-blue-900/30",
      icon: "text-[#2563EB] dark:text-blue-400",
      badge: "bg-[#E0EDFF] text-[#2563EB] dark:bg-blue-900/40 dark:text-blue-300",
    },
    green: {
      bg: "bg-[#F0FDF4] dark:bg-emerald-900/10",
      border: "border-[#DCFCE7] dark:border-emerald-800/40",
      iconBox: "bg-[#BBF7D0] dark:bg-emerald-900/30",
      icon: "text-[#16A34A] dark:text-emerald-400",
      badge: "bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    orange: {
      bg: "bg-[#FFF7ED] dark:bg-orange-900/10",
      border: "border-[#FFEDD5] dark:border-orange-800/40",
      iconBox: "bg-[#FED7AA] dark:bg-orange-900/30",
      icon: "text-[#EA580C] dark:text-orange-400",
      badge: "bg-[#FEF3C7] text-[#D97706] dark:bg-orange-900/40 dark:text-orange-300",
    },
    teal: {
      bg: "bg-[#F0FDFA] dark:bg-teal-900/10",
      border: "border-[#CCFBF1] dark:border-teal-800/40",
      iconBox: "bg-[#99F6E4] dark:bg-teal-900/30",
      icon: "text-[#0D9488] dark:text-teal-400",
      badge: "bg-[#CCFBF1] text-[#0D9488] dark:bg-teal-900/40 dark:text-teal-300",
    },
  };

  const current = themes[theme as keyof typeof themes] || themes.blue;

  return (
    <div className={cn(
      "rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-all hover:shadow-md",
      current.bg,
      current.border
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", current.iconBox)}>
          <Icon size={20} className={current.icon} />
        </div>
        {trendLabel && (
          <div className={cn("px-2 py-1 rounded-lg text-[11px] font-black tracking-tight flex items-center gap-1", current.badge)}>
            {trend === "up" && <TrendingUp size={10} />}
            {trendLabel}
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-[14px] font-bold text-slate-500 dark:text-slate-400 mb-2">{title}</p>
        <h3 className="text-[28px] font-black text-slate-900 dark:text-white leading-none">{value}</h3>
      </div>
    </div>
  );
}

interface VisitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ApiTreatmentPlan | null;
}

function VisitDetailsModal({ isOpen, onClose, plan }: VisitDetailsModalProps) {
  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <div>
                <h2 className="text-[22px] font-black text-slate-900 dark:text-white leading-tight">Visit Details</h2>
                <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mt-1">Comprehensive consultation record</p>
              </div>
              <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all dark:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] no-scrollbar">
              {/* Patient Banner */}
              <div className="p-5 rounded-[24px] bg-[#F3F8FF] dark:bg-blue-900/10 flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white shadow-sm ring-4 ring-white/50">
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-xl">
                    {plan.patientName?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[18px] font-black text-slate-900 dark:text-white">{plan.patientName}</h3>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase">Completed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-bold">
                      <CalendarDays size={14} className="text-slate-400" />
                      {new Date(plan.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-bold">
                      <Clock3 size={14} className="text-slate-400" />
                      {new Date(plan.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-bold">
                      <Phone size={14} className="text-slate-400" />
                      +1 (555) 123-4567
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-bold">
                      <Mail size={14} className="text-slate-400" />
                      patient@email.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <h4 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Diagnosis</h4>
                </div>
                <p className="text-[14px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{plan.title}</p>
              </div>

              {/* Clinical Notes */}
              <div className="p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <h4 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Clinical Notes</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[12px] font-black text-slate-900 dark:text-white">Symptoms: </span>
                    <span className="text-[13px] font-bold text-slate-500">{plan.description || "Patient reported mild discomfort."}</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-black text-slate-900 dark:text-white">Examination: </span>
                    <span className="text-[13px] font-bold text-slate-500">Physical examination conducted, vitals recorded within normal range.</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-black text-slate-900 dark:text-white">Tests Ordered: </span>
                    <span className="text-[13px] font-bold text-slate-500">Standard protocol checks applied.</span>
                  </div>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                  <h4 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Vital Signs</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Blood Pressure", value: "120/80 mmHg" },
                    { label: "Heart Rate", value: "72 bpm" },
                    { label: "Temperature", value: "98.6°F" },
                    { label: "Weight", value: "165 lbs" },
                    { label: "Height", value: "5'8\"" },
                    { label: "BMI", value: "25.1" },
                  ].map((vital) => (
                    <div key={vital.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{vital.label}</p>
                      <p className="text-[13px] font-black text-slate-800 dark:text-white leading-none">{vital.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 flex gap-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800">
              <Button className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[14px] shadow-lg shadow-blue-500/25 transition-all">
                Download Report
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-black text-[14px] transition-all">
                Share via WhatsApp
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* --- MAIN PAGE --- */

export default function DoctorAnalyticsPage() {
  const { locale } = useTranslation();
  const toast = useToastStore();
  const { user } = useAuthStore();
  const { fetchDoctors } = useStaffStore();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardDoctorSummaryData | null>(null);
  const [plans, setPlans] = useState<ApiTreatmentPlan[]>([]);
  const [prescriptions, setPrescriptions] = useState<ApiPrescription[]>([]);
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [tableStatusFilter, setTableStatusFilter] = useState<string>("All");

  const [selectedPlan, setSelectedPlan] = useState<ApiTreatmentPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewVisit = (plan: ApiTreatmentPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const loadAnalytics = useCallback(
    async (targetDoctorId: string, refresh = false) => {
      if (!refresh) setIsLoading(true);

      try {
        const [doctorSummary, doctorPlans, doctorPrescriptions, allPatients] = await Promise.all([
          dashboardService.getDoctorSummary({ period: timeRange as "day" | "week" | "month" | "year" }),
          treatmentPlanService.getAll({ doctorId: targetDoctorId }),
          prescriptionService.getAll(),
          patientService.getAll(),
        ]);

        setSummary(doctorSummary);
        setPlans(doctorPlans);
        setPrescriptions(doctorPrescriptions);
        setPatients(allPatients);
      } catch {
        toast.error(locale === "ar" ? "فشل تحميل تحليلات الطبيب" : "Failed to load doctor analytics");
      } finally {
        if (!refresh) setIsLoading(false);
      }
    },
    [locale, toast, timeRange],
  );

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await fetchDoctors();
        const doctors = useStaffStore.getState().doctors;
        const currentDoctor = doctors.find(
          (d) => d.userId === user?.id || d.id === user?.id || d.email?.toLowerCase() === user?.email?.toLowerCase(),
        );

        if (!currentDoctor) {
          toast.error(locale === "ar" ? "لا يوجد ملف طبيب مرتبط" : "No doctor profile linked to current account");
          setIsLoading(false);
          return;
        }

        setDoctorId(currentDoctor.id);
        await loadAnalytics(currentDoctor.id);
      } catch {
        toast.error(locale === "ar" ? "فشل تهيئة صفحة التحليلات" : "Failed to initialize analytics page");
        setIsLoading(false);
      }
    };

    void initialize();
  }, [fetchDoctors, loadAnalytics, locale, toast, user?.email, user?.id]);

  useEffect(() => {
    if (doctorId && !isLoading) {
      void loadAnalytics(doctorId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const todayAppointments = summary?.summaryCards.todayAppointments ?? 0;
  const totalPatients = summary?.summaryCards.totalPatients ?? 0;
  const waitMinutes = summary?.summaryCards.averageWaitMinutes;
  const completedPlansCount = plans.filter(p => p.status === "COMPLETED").length;

  // Fill missing days with 0s if they don't exist for the chart to look better

  const computedMonthlyPatients = useMemo(() => {
    // English/Arabic month names aren't strictly required for keys, but we can match the design's "Jan", "Feb", etc.
    const monthsArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = new Array(12).fill(0);

    const filteredPlans = timeRange === "all" ? plans : plans.filter(p => isWithinRange(p.createdAt || p.updatedAt, timeRange));

    filteredPlans.forEach(plan => {
      const d = plan.createdAt ? new Date(plan.createdAt) : new Date(plan.updatedAt);
      if (!isNaN(d.getTime())) {
        counts[d.getMonth()] += 1;
      }
    });

    return monthsArray.map((month, i) => ({ name: month, patients: counts[i] }));
  }, [plans, timeRange]);

  const computedCaseTypes = useMemo(() => {
    const filteredPlans = plans.filter(p => isWithinRange(p.createdAt || p.updatedAt, timeRange));
    if (filteredPlans.length === 0) return mockCaseTypes; // Fallback if no real data

    const currentMap = new Map<string, number>();
    filteredPlans.forEach(p => {
      const t = p.title || "Other";
      currentMap.set(t, (currentMap.get(t) || 0) + 1);
    });

    const colors = ["#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#F43F5E", "#06B6D4", "#84CC16"];
    const sorted = Array.from(currentMap.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((acc, curr) => acc + curr[1], 0);

    const result = top.map(([name, value], idx) => ({ name, value, color: colors[idx % colors.length] }));
    if (rest > 0) {
      result.push({ name: "Other", value: rest, color: colors[4] });
    }

    return result;
  }, [plans, timeRange]);

  const filteredTablePlans = useMemo(() => {
    let result = [...plans]
      .filter(p => isWithinRange(p.createdAt || p.updatedAt, timeRange))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    if (tableStatusFilter !== "All") {
      result = result.filter(p => p.status === tableStatusFilter);
    }
    return result;
  }, [plans, tableStatusFilter, timeRange]);

  const computedTopMedications = useMemo(() => {
    const filteredPrescriptions = prescriptions.filter(p => isWithinRange(p.createdAt || p.issuedAt || p.updatedAt, timeRange));
    if (filteredPrescriptions.length === 0) return mockMedications;

    const map = new Map<string, number>();

    filteredPrescriptions.forEach(p => {
      let meds: unknown[] = [];
      if (Array.isArray(p.medications)) {
        meds = p.medications;
      } else if (typeof p.medications === "string") {
        try { meds = JSON.parse(p.medications); } catch { /* ignore */ }
      }

      if (Array.isArray(meds)) {
        meds.forEach(med => {
          let name = "Unknown";
          if (typeof med === "string") name = med;
          else if (med && typeof med === "object" && "name" in med) {
            name = String((med as Record<string, unknown>).name);
          }

          name = name.trim();
          if (name && name !== "Unknown") {
            map.set(name, (map.get(name) || 0) + 1);
          }
        });
      }
    });

    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (sorted.length === 0) return mockMedications;

    const maxCount = sorted[0][1];

    return sorted.map(([name, count]) => ({
      name,
      count,
      max: maxCount || 1,
    }));
  }, [prescriptions, timeRange]);

  const computedDemographics = useMemo(() => {
    const filteredPatients = timeRange === "all" ? patients : patients.filter(p => isWithinRange(p.createdAt, timeRange));
    if (filteredPatients.length === 0) return mockDemographics;

    let pediatrics = 0;
    let adults = 0;
    let seniors = 0;

    const currentYear = new Date().getFullYear();

    filteredPatients.forEach(p => {
      if (!p.dateOfBirth) return;
      const dob = new Date(p.dateOfBirth);
      if (isNaN(dob.getTime())) return;

      const age = currentYear - dob.getFullYear();
      if (age <= 17) pediatrics++;
      else if (age <= 64) adults++;
      else seniors++;
    });

    const total = pediatrics + adults + seniors;
    if (total === 0) return mockDemographics;

    return [
      { name: "Pediatric (0-17)", value: Math.round((pediatrics / total) * 100) || 1, color: "#3B82F6" },
      { name: "Adult (18-64)", value: Math.round((adults / total) * 100) || 1, color: "#10B981" },
      { name: "Senior (65+)", value: Math.round((seniors / total) * 100) || 0, color: "#F59E0B" },
    ];
  }, [patients, timeRange]);

  const computedInsightsMetrics = useMemo(() => {
    const mostCommonDiagnosis = computedCaseTypes.length > 0 && computedCaseTypes[0].name !== "No Data"
      ? computedCaseTypes[0].name
      : "N/A";

    const waitStr = summary?.summaryCards.averageWaitMinutes
      ? Math.round(summary.summaryCards.averageWaitMinutes) + " mins"
      : "N/A";

    const currentMonth = new Date().getMonth();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentMonthPatients = computedMonthlyPatients[currentMonth]?.patients || 0;
    const prevMonthPatients = computedMonthlyPatients[prevMonth]?.patients || 0;

    let growthString = "0%";
    if (prevMonthPatients === 0) {
      growthString = currentMonthPatients > 0 ? "+100%" : "0%";
    } else {
      const growth = ((currentMonthPatients - prevMonthPatients) / prevMonthPatients) * 100;
      growthString = (growth > 0 ? "+" : "") + growth.toFixed(1) + "%";
    }

    return {
      mostCommonDiagnosis,
      averageWaitTime: waitStr,
      patientGrowth: growthString
    };
  }, [computedCaseTypes, summary, computedMonthlyPatients]);

  if (isLoading && !summary) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] pb-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between py-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB] shadow-xl shadow-blue-500/20">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {locale === "ar" ? "التقارير والتحليلات" : "Reports & Analytics"}
            </h1>
            <p className="text-[14px] font-bold text-slate-400 dark:text-slate-500 mt-1">
              {locale === "ar" ? "رؤى شاملة لأداء عيادتك" : "Comprehensive insights into your practice performance"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors pointer-events-none" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none w-[140px] pl-11 pr-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-[13px] font-black text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Eye size={12} />
            </div>
          </div>

          <Button className="h-11 px-6 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-100 dark:border-slate-700 font-black text-[13px] transition-all flex items-center gap-2">
            <Download size={16} />
            {locale === "ar" ? "تصدير البيانات" : "Export Data"}
          </Button>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title={locale === "ar" ? "إجمالي المرضى" : "Total Patients"}
          value={totalPatients || 487}
          icon={Users}
          theme="blue"
          trend="up"
          trendLabel="+12%"
        />
        <StatsCard
          title={locale === "ar" ? "متوسط وقت الاستشارة" : "Avg. Consultation Time"}
          value={waitMinutes !== null && waitMinutes !== undefined ? `${waitMinutes}m` : "18m"}
          icon={Clock3}
          theme="green"
          trend="up"
          trendLabel="-3 min"
        />
        <StatsCard
          title={locale === "ar" ? "الحالات المكتملة" : "Completed Cases"}
          value={completedPlansCount || 983}
          icon={CheckCircle}
          theme="orange"
          trend="none"
          trendLabel="+5.7%"
        />
        <StatsCard
          title={locale === "ar" ? "المتابعات" : "Follow-ups"}
          value={todayAppointments || 156}
          icon={TrendingUp}
          theme="teal"
          trend="up"
          trendLabel="+18%"
        />
      </motion.div>

      {/* Main Charts Section - Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">

        {/* Left Column: Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="xl:col-span-2 space-y-6 flex flex-col"
        >
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-3xl p-1 overflow-hidden transition-colors duration-200">
            <CardHeader className="pb-0 pt-5 px-7">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                    {locale === "ar" ? "المرضى بمرور الوقت" : "Patients Over Time"}
                  </CardTitle>
                  <CardDescription className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {locale === "ar" ? "اتجاهات زيارات المرضى الشهرية على مدار العام" : "Monthly patient visit trends throughout the year"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-6 pb-6">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computedMonthlyPatients} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "currentColor", fontWeight: 500 }}
                      className="text-slate-400 dark:text-slate-500"
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "currentColor", fontWeight: 500 }}
                      className="text-slate-400 dark:text-slate-500"
                      ticks={[0, 40, 80, 120, 160]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-2xl border-none bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[120px] text-center dark:bg-slate-900">
                              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                              <p className="text-[18px] font-black text-slate-900 dark:text-white leading-none">
                                {payload[0].value} <span className="text-[12px] text-slate-500 font-bold ml-0.5">patients</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: "#E5E7EB", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="patients"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 7, fill: "#2563EB", stroke: "#fff", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6 flex flex-col"
        >
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-3xl p-1 flex flex-col h-full transition-colors duration-200">
            <CardHeader className="pb-0 pt-5 px-7">
              <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                {locale === "ar" ? "أنواع الحالات" : "Case Types"}
              </CardTitle>
              <CardDescription className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                {locale === "ar" ? "توزيع التشخيصات" : "Distribution of diagnoses"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-7 pb-7 pt-4 flex-1 flex flex-col">
              <div className="h-[200px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computedCaseTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {computedCaseTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg text-[13px]">
                              <span className="font-medium text-slate-500 dark:text-slate-400">{payload[0].name} : </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{payload[0].value}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-auto pt-6 space-y-3">
                {computedCaseTypes.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[13px] font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2: Medications, Insights, Demographics, Satisfaction */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        {/* Left Column (span 2) */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">

          {/* Top Prescribed Medications */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="flex flex-col">
            <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-3xl p-1 shrink-0 transition-colors duration-200">
              <CardHeader className="pb-4 pt-6 px-7">
                <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                  {locale === "ar" ? "أعلى الأدوية الموصوفة" : "Top Prescribed Medications"}
                </CardTitle>
                <CardDescription className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {locale === "ar" ? "الأدوية الأكثر وصفًا للفترة المحددة" : "Most frequently prescribed medications for the selected month"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-7 pb-8 space-y-6">
                {computedTopMedications.map((med, idx) => (
                  <div key={med.name} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[13px] font-black">
                          {idx + 1}
                        </div>
                        <span className="text-[15px] font-black text-slate-900 dark:text-white leading-tight">{med.name}</span>
                      </div>
                      <span className="text-[13px] font-black text-slate-900 dark:text-white">
                        {med.count} <span className="text-slate-400 dark:text-slate-500 font-bold ml-1">prescriptions</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] transition-all duration-1000" 
                        style={{ width: `${(med.count / med.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
        </motion.div>

        {/* Smart Insights */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="flex flex-col">
          <Card className="border-none shadow-sm bg-[#527FF4] rounded-3xl p-1 text-white overflow-hidden relative">
            <CardContent className="p-7 relative z-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-200" />
                  <h3 className="font-semibold tracking-wide text-[16px] text-blue-50">Smart insights</h3>
                </div>
                <div className="flex items-center justify-center h-9 w-9 rounded-[10px] bg-white/10 backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="font-bold text-[16px] text-white">{computedInsightsMetrics.mostCommonDiagnosis}</p>
                  <p className="text-[13px] text-blue-200 font-medium">Most Common Diagnosis</p>
                </div>
                <div>
                  <p className="font-bold text-[16px] text-white">{computedInsightsMetrics.averageWaitTime}</p>
                  <p className="text-[13px] text-blue-200 font-medium">Average Wait Time</p>
                </div>
                <div>
                  <p className="font-bold text-[16px] text-white">{computedInsightsMetrics.patientGrowth}</p>
                  <p className="text-[13px] text-blue-200 font-medium">Patient Growth This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Right Column (span 1) */}
      <div className="space-y-6 flex flex-col">

        {/* Patient Demographics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="flex flex-col">
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-3xl p-1 transition-colors duration-200">
            <CardHeader className="pb-0 pt-6 px-7">
              <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                {locale === "ar" ? "التركيبة السكانية للمرضى" : "Patient Demographics"}
              </CardTitle>
              <CardDescription className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                {locale === "ar" ? "توزيع الأعمار" : "Age distribution breakdown"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-7 pb-7 pt-2">
              <div className="h-[200px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computedDemographics}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {computedDemographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-[13px]">
                              <span className="font-medium text-gray-500">{payload[0].name} : </span>
                              <span className="font-bold text-gray-900">{payload[0].value}%</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 space-y-3">
                {computedDemographics.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[13px] font-medium">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </div>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Satisfaction */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }} className="flex-1 flex flex-col">
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-3xl p-1 flex flex-col flex-1 transition-colors duration-200">
            <CardHeader className="pb-2 pt-6 px-7">
              <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                {locale === "ar" ? "رضا المرضى" : "Patient Satisfaction"}
              </CardTitle>
              <CardDescription className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                {locale === "ar" ? "تقييمات المراجعات الشاملة" : "Overall feedback ratings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-7 pb-7 pt-2 flex flex-col flex-1">
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <h2 className="text-[34px] font-black tracking-tight text-slate-900 dark:text-slate-100 mb-2">{mockSatisfaction.rating}</h2>
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.floor(mockSatisfaction.rating) ? "fill-[#527FF4] text-[#527FF4]" : "fill-blue-100 dark:fill-blue-900/40 text-blue-100 dark:text-blue-900/40"}`}
                    />
                  ))}
                </div>
                <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Based on {mockSatisfaction.reviews} reviews</p>
              </div>

              <div className="mt-4 space-y-3.5 pt-2">
                {mockSatisfaction.distribution.map((dist) => (
                  <div key={dist.stars} className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 w-6 text-[13px] font-bold text-slate-500 dark:text-slate-400">
                      {dist.stars} <Star className="h-3.5 w-3.5 fill-[#527FF4] text-[#527FF4]" />
                    </div>
                    <div className="h-[6px] flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#527FF4]"
                        style={{ width: `${(dist.count / dist.max) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      {dist.count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>

      {/* Row 3: Recent Patient Visits Table */}
      <div className="pt-4">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden transition-colors duration-200">
          <CardHeader className="pb-4 pt-7 px-8 border-b border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent">
            <div>
              <CardTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                {locale === "ar" ? "زيارات المرضى الأخيرة" : "Recent Patient Visits"}
              </CardTitle>
              <CardDescription className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                {locale === "ar" ? "أحدث الاستشارات والتشخيصات" : "Latest consultations and diagnoses"}
              </CardDescription>
            </div>
            <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              {filteredTablePlans.length} of {plans.length} records
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-transparent">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5 px-8 py-5 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mr-2">
                {locale === "ar" ? "تصفية حسب:" : "Filter by:"}
              </span>
              {["All", "COMPLETED", "ACTIVE", "CANCELLED"].map((statusStr) => {
                const isActive = tableStatusFilter === statusStr;
                return (
                  <button
                    key={statusStr}
                    onClick={() => setTableStatusFilter(statusStr)}
                    className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-600"
                        : "bg-transparent text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {statusStr === "All" 
                      ? "All Status" 
                      : statusStr === "ACTIVE" 
                        ? "Follow-up" 
                        : statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase whitespace-nowrap">Patient</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase whitespace-nowrap">Date & Time</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase whitespace-nowrap">Diagnosis</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase whitespace-nowrap">Status</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTablePlans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-[14px] font-medium text-gray-500">
                        {locale === "ar" ? "لا توجد سجلات مطابقة" : "No matching records found"}
                      </td>
                    </tr>
                  ) : (
                    filteredTablePlans.slice(0, 6).map((plan) => (
                      <tr key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3.5">
                            <div className="h-9 w-9 relative rounded-full overflow-hidden shrink-0 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                               {/* Use a generic avatar based on string hash or just first letter */}
                               <span className="text-blue-700 dark:text-blue-400 font-bold text-[14px]">
                                 {plan.patientName?.charAt(0).toUpperCase() || 'P'}
                               </span>
                            </div>
                            <span className="text-[14px] font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{plan.patientName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {new Date(plan.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                              {new Date(plan.updatedAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-[13px] font-medium text-slate-600 dark:text-slate-300 max-w-[420px] leading-relaxed">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{plan.title}</span> 
                            {plan.description && <span className="mx-1.5 text-slate-300 dark:text-slate-700">-</span>} 
                            {plan.description}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap ${
                            plan.status === "COMPLETED" 
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                              : plan.status === "ACTIVE" 
                                ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {plan.status === "ACTIVE" ? "Follow-up" : plan.status.charAt(0).toUpperCase() + plan.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewVisit(plan)}
                            className="h-[34px] px-4 rounded-[10px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 shadow-sm transition-all ml-auto"
                          >
                             <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                             <span className="text-[12px] font-bold">View</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <VisitDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        plan={selectedPlan}
      />

    </div >
  );
}
