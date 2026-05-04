"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Printer,
  Send,
  CheckSquare,
  Square,
  Plus,
  CreditCard,
  Shield,
  ChevronDown,
  Lock,
  TrendingUp,
  ArrowLeft,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { bookingService } from "@/services/bookingService";
import { patientService } from "@/services/patientService";
import { useToastStore } from "@/stores/useToastStore";
import { useTranslation } from "@/hooks/useTranslation";
import type { ApiAppointment, ApiPatient, ApiInvoice } from "@/types";

const BILLING_HISTORY = [
  { month: "Jan", value: 80 },
  { month: "Feb", value: 120 },
  { month: "Mar", value: 160 },
  { month: "Apr", value: 290 },
  { month: "May", value: 270 },
  { month: "Jun", value: 200 },
];

interface CheckedService {
  id: string;
  name: string;
  dept: string;
  code: string;
  qty: number;
  amount: number;
  checked: boolean;
}

interface ChartHistoryItem {
  month: string;
  value: number;
}

export default function CheckoutPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToastStore();
  const { locale } = useTranslation();
  const appointmentId = searchParams.get("appointmentId");

  const [appointment, setAppointment] = useState<ApiAppointment | null>(null);
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [services, setServices] = useState<CheckedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "insurance" | "cash">("card");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [billingHistory, setBillingHistory] = useState<ChartHistoryItem[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<ApiInvoice | null>(null);
  const [pendingCheckouts, setPendingCheckouts] = useState<ApiAppointment[]>([]);

  const fetchData = useCallback(async () => {
    if (!appointmentId) {
      setIsLoading(false);
      return;
    }

    try {
      const appt = await bookingService.getById(appointmentId);
      setAppointment(appt);

      if (appt.invoices && appt.invoices.length > 0) {
        setActiveInvoice(appt.invoices[0]);
      }

      if (appt.patientId) {
        const p = await patientService.getById(appt.patientId);
        setPatient(p);

        // Fetch billing history for chart
        try {
          const history = await patientService.getPatientPayments(appt.patientId);
          setBillingHistory(history.map(h => ({
            month: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short' }),
            value: h.totalAmount
          })).reverse().slice(-6));
        } catch (e) {
          console.warn("Could not load billing history", e);
        }
      }

      if (appt.invoices && appt.invoices.length > 0) {
        const inv = appt.invoices[0]; // Take the latest/primary invoice
        const items = (inv.items as Record<string, unknown>[]) || [];

        if (items.length > 0) {
          setServices(items.map((item, idx) => ({
            id: `inv-item-${idx}`,
            name: (item.description as string) || "Medical Service",
            dept: appt.type || "Clinic Service",
            code: (item.code as string) || "99204",
            qty: (item.quantity as number) || 1,
            amount: (item.amount as number) || 0,
            checked: true
          })));
        } else {
          setServices([{
            id: appt.id,
            name: appt.serviceName || "Consultation",
            dept: appt.type || "Medical Service",
            code: "99204",
            qty: 1,
            amount: inv.totalAmount || appt.amount || 0,
            checked: true
          }]);
        }

        if (inv.paymentStatus === "PAID") {
          setPaid(true);
        }
      } else {
        setServices([{
          id: appt.id,
          name: appt.serviceName || "Consultation",
          dept: appt.type || "Medical Service",
          code: "99204",
          qty: 1,
          amount: appt.amount || 0,
          checked: true
        }]);
      }
    } catch (err) {
      console.error("Failed to fetch payment data", err);
      toast.error("Failed to load appointment details");
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, toast]);

  const fetchPending = useCallback(async () => {
    try {
      const all = await bookingService.getAll({ status: "COMPLETED" });
      // Filter those who don't have a PAID invoice
      const unpaid = all.filter(a => {
        if (!a.invoices || a.invoices.length === 0) return true;
        return a.invoices.some(inv => inv.paymentStatus !== "PAID");
      });
      setPendingCheckouts(unpaid);
    } catch (e) {
      console.warn("Could not load pending checkouts", e);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    void fetchPending();
  }, [fetchData, fetchPending]);

  const toggleService = (id: string) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));

  const subtotal = services.filter((s) => s.checked).reduce((sum, s) => sum + s.amount * s.qty, 0);

  const discountPercent = (patient?.medicalHistory?.insuranceDetails as Record<string, unknown>)?.discountPercent as number || 0;
  const insuranceCoverage = Math.round(subtotal * (discountPercent / 100));
  const totalDue = subtotal - insuranceCoverage;

  const handleProcessPayment = async () => {
    setProcessing(true);
    try {
      const methodMap = {
        card: "ONSITE_CARD",
        cash: "ONSITE_CASH",
        insurance: "ONSITE_CARD",
      };

      if (appointmentId) {
        await bookingService.updateStatus(appointmentId, "COMPLETED", {
          paymentMethod: methodMap[paymentMethod as keyof typeof methodMap],
          amount: totalDue,
        });
      }
      setPaid(true);
      toast.success(locale === "ar" ? "تم معالجة الدفع بنجاح" : "Payment processed successfully");
    } catch {
      toast.error(locale === "ar" ? "فشلت عملية الدفع" : "Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  /* ── Mini SVG area chart ── */
  const chartH = 120;
  const chartW = 340;
  const chartHistory = billingHistory.length > 0 ? billingHistory : BILLING_HISTORY;
  const maxVal = Math.max(...chartHistory.map((d) => d.value), 100);
  const pts = chartHistory.map((d, i) => {
    const x = (i / (chartHistory.length - 1)) * chartW;
    const y = chartH - (d.value / maxVal) * chartH;
    return `${x},${y}`;
  }).join(" ");
  const areaPath = `M0,${chartH} L${pts.split(" ").join(" L")} L${chartW},${chartH} Z`;
  const linePath = `M${pts.split(" ").join(" L")}`;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="font-bold text-slate-500">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  if (!appointmentId) {
    return (
      <div className="p-4 lg:p-8 bg-slate-50 min-h-screen font-sans space-y-7">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Select Patient for Checkout</h1>
            <p className="text-slate-400 text-sm font-medium">Choose a patient from the completed visits list to process their payment.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/reception/waiting-room')} className="rounded-2xl border-slate-200">
            Back to Queue
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingCheckouts.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-[28px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Users className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold">No pending checkouts found</p>
              <p className="text-sm">All completed visits have been settled.</p>
            </div>
          ) : (
            pendingCheckouts.map(appt => (
              <div
                key={appt.id}
                onClick={() => router.push(`/reception/payments?appointmentId=${appt.id}`)}
                className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${appt.patientName || "Unknown"}`} />
                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{(appt.patientName || "UN").substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{appt.patientName || "Unknown Patient"}</h3>
                    <p className="text-[12px] text-slate-400 font-medium">Appt: {appt.startTime} • {appt.date}</p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Doctor</span>
                    <span className="font-bold text-slate-700">{appt.doctorName || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Service</span>
                    <span className="font-bold text-slate-700">{appt.serviceName || "Consultation"}</span>
                  </div>
                  <div className="flex justify-between text-[13px] pt-1">
                    <span className="text-slate-400">Total Due</span>
                    <span className="font-black text-blue-600">${(appt.amount ?? 0).toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full mt-5 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 border-none shadow-none font-bold text-[13px]">
                  Process Checkout
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20 font-sans space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Checkout &amp; Payment</h1>
              {activeInvoice?.invoiceNumber && (
                <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none font-bold">
                  INV-{activeInvoice.invoiceNumber}
                </Badge>
              )}
              {appointmentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/reception/payments')}
                  className="text-blue-600 hover:text-blue-700 font-bold text-[11px] h-7 px-2 bg-blue-50 hover:bg-blue-100 rounded-lg ml-2"
                >
                  Switch Patient
                </Button>
              )}
            </div>
            <p className="text-slate-400 text-sm font-medium">Process visit fees, additional services, and payment methods.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span className="text-[13px] font-bold text-slate-700">
              {new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 text-[13px] shadow-sm flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </Button>
          <Button className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] shadow-lg shadow-blue-500/10 flex items-center gap-2">
            <Send className="h-4 w-4" /> Send Receipt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-7">
        {/* ── Left Column ── */}
        <div className="xl:col-span-7 space-y-6">
          {/* Patient Info Bar */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <Avatar className="h-14 w-14 border-4 border-white shadow-md shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${patient?.fullName || "Guest"}`} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-lg">{patient?.fullName?.substring(0, 2).toUpperCase() || "PT"}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900">{patient?.fullName || "Walk-in Patient"}</h2>
                  <div className="flex items-center gap-3 text-[12px] font-bold text-slate-400 mt-0.5">
                    <span>ID: #PT-{patient?.id.slice(-6).toUpperCase() || "N/A"}</span>
                    <span>•</span>
                    <span>DOB: {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="text-[12px] font-bold text-slate-500">INSURANCE</span>
                <span className="text-[12px] font-bold text-slate-900 ml-1">{(patient?.medicalHistory?.insuranceDetails as Record<string, unknown>)?.provider as string || "No Insurance"}</span>
                {(patient?.medicalHistory?.insuranceDetails as Record<string, unknown>)?.verificationStatus === "verified" ? (
                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg ml-2">✓ Verified</span>
                ) : (
                  <span className="text-[11px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg ml-2">Pending</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Date</p>
                <p className="text-[13px] font-bold text-slate-700 mt-1">{appointment?.date} • {appointment?.startTime}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doctor</p>
                <p className="text-[13px] font-bold text-slate-700 mt-1">{appointment?.doctorName || "Staff Physician"}</p>
              </div>
            </div>
          </div>

          {/* Checkout Summary */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-900">Checkout summary</h3>
              <button className="flex items-center gap-1.5 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
              <div className="col-span-6">Service Details</div>
              <div className="col-span-2 text-center">Code</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {/* Service Rows */}
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col sm:grid sm:grid-cols-12 gap-4 sm:gap-2 items-start sm:items-center py-4 border-b border-slate-50 last:border-none"
                >
                  <div className="sm:col-span-6 flex items-center gap-3 w-full">
                    <button onClick={() => toggleService(service.id)} className="shrink-0">
                      {service.checked
                        ? <CheckSquare className="h-5 w-5 text-[#3B82F6]" />
                        : <Square className="h-5 w-5 text-slate-300" />
                      }
                    </button>
                    <div className="min-w-0">
                      <p className={cn("text-[13px] font-bold truncate", service.checked ? "text-slate-900" : "text-slate-400 line-through")}>
                        {service.name}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400">{service.dept}</p>
                    </div>
                  </div>
                  <div className="flex sm:contents items-center justify-between w-full sm:w-auto">
                    <div className="sm:col-span-2 sm:text-center text-[13px] font-bold text-slate-500">
                      <span className="sm:hidden text-slate-400 mr-2 uppercase text-[10px]">Code:</span>
                      {service.code}
                    </div>
                    <div className="sm:col-span-2 sm:text-center text-[13px] font-bold text-slate-500">
                      <span className="sm:hidden text-slate-400 mr-2 uppercase text-[10px]">Qty:</span>
                      {service.qty}
                    </div>
                    <div className={cn("sm:col-span-2 sm:text-right text-[14px] font-bold", service.checked ? "text-slate-900" : "text-slate-300")}>
                      ${service.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-500">Subtotal:</span>
                <span className="text-[14px] font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-emerald-600">
                  {patient?.medicalHistory?.insuranceDetails ? ((patient.medicalHistory.insuranceDetails as Record<string, unknown>).provider as string) : "Insurance"} Coverage ({discountPercent}%):
                </span>
                <span className="text-[14px] font-bold text-emerald-600">-${insuranceCoverage.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[15px] font-bold text-slate-900">Total Due</span>
                <span className="text-[22px] font-black text-[#3B82F6] tracking-tighter">${totalDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Patient Billing History */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">Patient Billing History</h3>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="text-[12px] font-bold text-slate-600">last 6 months</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Y-axis labels + chart */}
            <div className="flex gap-4">
              <div className="flex flex-col justify-between text-[10px] font-bold text-slate-300 h-[120px] text-right pr-1">
                <span>400</span>
                <span>300</span>
                <span>200</span>
                <span>100</span>
                <span>0</span>
              </div>
              <div className="flex-1 space-y-2">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full"
                  style={{ height: "120px" }}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                    <line
                      key={frac}
                      x1={0} y1={frac * chartH}
                      x2={chartW} y2={frac * chartH}
                      stroke="#F1F5F9" strokeWidth="1"
                    />
                  ))}
                  {/* Area fill */}
                  <path d={areaPath} fill="url(#areaGradient)" />
                  {/* Line */}
                  <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {/* Data points */}
                  {chartHistory.map((d, i) => {
                    const x = (i / (chartHistory.length - 1)) * chartW;
                    const y = chartH - (d.value / maxVal) * chartH;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
                      </g>
                    );
                  })}
                  {/* Tooltip markers for recent points */}
                  {chartHistory.map((d, i) => {
                    if (i < chartHistory.length - 2) return null; // Only show for last 2 points
                    const x = (i / (chartHistory.length - 1)) * chartW;
                    const y = chartH - (d.value / maxVal) * chartH;
                    return (
                      <g key={`tooltip-${i}`}>
                        <rect x={x - 22} y={y - 24} width={44} height={18} rx={5} fill="#1E3A5F" />
                        <text x={x} y={y - 11} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">${d.value.toFixed(0)}</text>
                      </g>
                    );
                  })}
                </svg>
                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] font-bold text-slate-300 px-0">
                  {chartHistory.map((d, index) => <span key={`${d.month}-${index}`}>{d.month}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column — Payment ── */}
        <div className="xl:col-span-3 space-y-5">
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-5">
            <h3 className="text-[16px] font-bold text-slate-900">Payment Method</h3>

            {/* Method Options */}
            <div className="space-y-3">
              <PaymentOption
                selected={paymentMethod === "card"}
                onClick={() => setPaymentMethod("card")}
                icon={<CreditCard className="h-5 w-5 text-blue-600" />}
                iconBg="bg-blue-50"
                title="Credit card"
                subtitle="Visa ending in 4242"
              />
              <PaymentOption
                selected={paymentMethod === "insurance"}
                onClick={() => setPaymentMethod("insurance")}
                icon={<Shield className="h-5 w-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
                title="Insurance"
                subtitle="Direct Billing"
              />
              <PaymentOption
                selected={paymentMethod === "cash"}
                onClick={() => setPaymentMethod("cash")}
                icon={<span className="text-slate-500 font-black text-sm">$</span>}
                iconBg="bg-slate-50"
                title="Cash"
                subtitle="Pay at desk"
              />
            </div>

            {/* Card Form */}
            {paymentMethod === "card" && (
              <div className="space-y-4 pt-2">
                <CardField label="Cardholder Name" value="Robert Chen" type="text" />
                <CardField label="Card Number" value="•••• •••• •••• 4242" type="text" />
                <div className="grid grid-cols-2 gap-3">
                  <CardField label="Expiry Date" value="10/25" type="text" />
                  <CardField label="CVV" value="•••" type="text" />
                </div>
              </div>
            )}
          </div>

          {/* Total + Process Payment */}
          <div className="bg-slate-900 rounded-[28px] p-6 space-y-5 relative overflow-hidden">
            {/* Paid overlay */}
            {paid && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="border-4 border-emerald-400 text-emerald-400 text-[38px] font-black px-5 py-2 rounded-xl opacity-60 rotate-[-15deg] tracking-widest">
                  PAID
                </div>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-blue-300">Total Amount to Pay</p>
              <p className="text-[40px] font-black text-white tracking-tighter leading-none">
                ${totalDue.toFixed(2)}
              </p>
            </div>

            <Button
              onClick={handleProcessPayment}
              disabled={processing || paid}
              className={cn(
                "w-full h-13 rounded-2xl font-bold text-[14px] transition-all",
                paid
                  ? "bg-emerald-400/20 text-emerald-300 cursor-not-allowed"
                  : "bg-white hover:bg-slate-50 text-[#1E3A5F]"
              )}
            >
              {paid ? "Payment Complete ✓" : processing ? "Processing..." : "Process Payment"}
            </Button>

            {paid && (
              <Button
                variant="ghost"
                onClick={() => router.push("/reception/waiting-room")}
                className="w-full text-blue-300 hover:text-white hover:bg-white/10 font-bold text-[13px]"
              >
                Return to Waiting Room
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-blue-300">
              <Lock className="h-3.5 w-3.5" />
              Secure 256-bit encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

interface PaymentOptionProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

function PaymentOption({ selected, onClick, icon, iconBg, title, subtitle }: PaymentOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
        selected
          ? "border-blue-400 bg-blue-50/60"
          : "border-slate-100 bg-white hover:border-slate-200"
      )}
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-900">{title}</p>
        <p className="text-[11px] font-bold text-slate-400">{subtitle}</p>
      </div>
      <div className="ml-auto">
        <div className={cn(
          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
          selected ? "border-blue-500" : "border-slate-200"
        )}>
          {selected && <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
        </div>
      </div>
    </button>
  );
}

function CardField({ label, value, type }: { label: string; value: string; type: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center">
        <input
          type={type}
          defaultValue={value}
          className="w-full bg-transparent text-[13px] font-bold text-slate-800 outline-none"
        />
      </div>
    </div>
  );
}


