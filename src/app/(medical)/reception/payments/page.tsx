"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const toggleService = (id: string) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));

  const subtotal = services.filter((s) => s.checked).reduce((sum, s) => sum + s.amount * s.qty, 0);
  
  const insuranceDetails = patient?.medicalHistory?.insuranceDetails as Record<string, unknown> | undefined;
  const discountPercent = (insuranceDetails?.discountPercent as number) || 0;
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
      <div className="flex h-screen items-center justify-center bg-[#F3F4F8]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="font-bold text-slate-500">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-[#F3F4F8] min-h-screen pb-20 font-sans space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Checkout &amp; Payment</h1>
            {activeInvoice?.invoiceNumber && (
              <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none font-bold">
                INV-{activeInvoice.invoiceNumber}
              </Badge>
            )}
          </div>
          <p className="text-slate-400 text-sm font-medium">Process visit fees, additional services, and payment methods.</p>
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
          <Button className="h-11 px-6 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[13px] shadow-lg shadow-blue-100 flex items-center gap-2">
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
                  className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-50 last:border-none"
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <button onClick={() => toggleService(service.id)} className="shrink-0">
                      {service.checked
                        ? <CheckSquare className="h-5 w-5 text-[#3B82F6]" />
                        : <Square className="h-5 w-5 text-slate-300" />
                      }
                    </button>
                    <div>
                      <p className={cn("text-[13px] font-bold", service.checked ? "text-slate-900" : "text-slate-400 line-through")}>
                        {service.name}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400">{service.dept}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-[13px] font-bold text-slate-500">{service.code}</div>
                  <div className="col-span-2 text-center text-[13px] font-bold text-slate-500">{service.qty}</div>
                  <div className={cn("col-span-2 text-right text-[14px] font-bold", service.checked ? "text-slate-900" : "text-slate-300")}>
                    ${service.amount.toFixed(2)}
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
                  {chartHistory.map((d) => <span key={d.month}>{d.month}</span>)}
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
          <div className="bg-[#1E3A5F] rounded-[28px] p-6 space-y-5 relative overflow-hidden">
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
      <div className="h-12 px-4 bg-[#F9FAFB] border border-slate-100 rounded-xl flex items-center">
        <input
          type={type}
          defaultValue={value}
          className="w-full bg-transparent text-[13px] font-bold text-slate-800 outline-none"
        />
      </div>
    </div>
  );
}
