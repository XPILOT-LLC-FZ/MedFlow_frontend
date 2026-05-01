"use client";

import React, { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/* ── Mock Data ─────────────────────────────────────────────────── */
const SERVICES = [
  { id: "1", name: "Specialist Consultation", dept: "Cardiology Dept.", code: "99204", qty: 1, amount: 180, checked: true },
  { id: "2", name: "ECG / EKG", dept: "Diagnostic Test", code: "93000", qty: 1, amount: 55, checked: true },
  { id: "3", name: "Blood Panel", dept: "Laboratory", code: "99204", qty: 1, amount: 45, checked: true },
];

const BILLING_HISTORY = [
  { month: "Jan", value: 80 },
  { month: "Feb", value: 120 },
  { month: "Mar", value: 160 },
  { month: "Apr", value: 290 },
  { month: "May", value: 270 },
  { month: "Jun", value: 200 },
];

export default function CheckoutPaymentPage() {
  const [services, setServices] = useState(SERVICES);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "insurance" | "cash">("card");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  const toggleService = (id: string) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));

  const subtotal = services.filter((s) => s.checked).reduce((sum, s) => sum + s.amount * s.qty, 0);
  const insuranceCoverage = Math.round(subtotal * 0.8);
  const totalDue = subtotal - insuranceCoverage;

  const handleProcessPayment = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    setPaid(true);
  };

  /* ── Mini SVG area chart ── */
  const chartH = 120;
  const chartW = 340;
  const maxVal = Math.max(...BILLING_HISTORY.map((d) => d.value));
  const pts = BILLING_HISTORY.map((d, i) => {
    const x = (i / (BILLING_HISTORY.length - 1)) * chartW;
    const y = chartH - (d.value / maxVal) * chartH;
    return `${x},${y}`;
  }).join(" ");
  const areaPath = `M0,${chartH} L${pts.split(" ").join(" L")} L${chartW},${chartH} Z`;
  const linePath = `M${pts.split(" ").join(" L")}`;

  return (
    <div className="p-4 lg:p-8 bg-[#F3F4F8] min-h-screen pb-20 font-sans space-y-7">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Checkout &amp; Payment</h1>
          <p className="text-slate-400 text-sm font-medium">Process visit fees, additional services, and payment methods.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span className="text-[13px] font-bold text-slate-700">Monday, Oct 24th, 2026</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button variant="outline" className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 text-[13px] shadow-sm flex items-center gap-2">
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
                  <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Michael" />
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-lg">MR</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900">Michael R. Harrison</h2>
                  <div className="flex items-center gap-3 text-[12px] font-bold text-slate-400 mt-0.5">
                    <span>ID: #PT-84729</span>
                    <span>•</span>
                    <span>DOB: 14 Aug 1983 (43y)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="text-[12px] font-bold text-slate-500">INSURANCE</span>
                <span className="text-[12px] font-bold text-slate-900 ml-1">Astra PPO</span>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg ml-2">✓ Verified</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Date</p>
                <p className="text-[13px] font-bold text-slate-700 mt-1">Oct 24, 2026 • 10:30 AM EST</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doctor</p>
                <p className="text-[13px] font-bold text-slate-700 mt-1">Dr. James Wilson • Cardiology Dept.</p>
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
                <span className="text-[13px] font-bold text-emerald-600">Insurance Coverage (80%):</span>
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
                  {BILLING_HISTORY.map((d, i) => {
                    const x = (i / (BILLING_HISTORY.length - 1)) * chartW;
                    const y = chartH - (d.value / maxVal) * chartH;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
                      </g>
                    );
                  })}
                  {/* Apr/May tooltip markers */}
                  {BILLING_HISTORY.map((d, i) => {
                    if (i !== 3 && i !== 4) return null;
                    const x = (i / (BILLING_HISTORY.length - 1)) * chartW;
                    const y = chartH - (d.value / maxVal) * chartH;
                    return (
                      <g key={`tooltip-${i}`}>
                        <rect x={x - 22} y={y - 24} width={44} height={18} rx={5} fill="#1E3A5F" />
                        <text x={x} y={y - 11} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">${d.value}</text>
                      </g>
                    );
                  })}
                </svg>
                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] font-bold text-slate-300 px-0">
                  {BILLING_HISTORY.map((d) => <span key={d.month}>{d.month}</span>)}
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

function PaymentOption({ selected, onClick, icon, iconBg, title, subtitle }: any) {
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
