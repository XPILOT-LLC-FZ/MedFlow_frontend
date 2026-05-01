"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  CalendarDays,
  ChevronDown,
  Upload,
  Plus,
  Eye,
  Printer,
  MoreVertical,
  TrendingUp,
  AlertCircle,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Mock Data ─────────────────────────────────────────────────── */
const INVOICES = Array.from({ length: 37 }, (_, i) => ({
  id: `INV-2023-${String(i + 1).padStart(3, "0")}`,
  date: "Oct 24, 2024",
  patient: { name: "Robert Chen", avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Robert${i}` },
  service: "Cardiology Consultation",
  amount: 150.0,
  status: (["paid", "pending", "overdue", "paid", "paid", "paid"] as const)[i % 6],
}));

type Status = "all" | "paid" | "pending" | "overdue";
const STATUS_LABELS: Record<Status, string> = { all: "All states", paid: "Paid", pending: "Pending", overdue: "Overdue" };
const PAGE_SIZE = 10;

export default function InvoiceListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [statusOpen, setStatusOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const statusRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) setDeptOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = INVOICES.filter((inv) => {
    const matchSearch = inv.patient.name.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "all" || inv.status === status;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = pageItems.length > 0 && pageItems.every((i) => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelected((prev) => { const n = new Set(prev); pageItems.forEach((i) => n.delete(i.id)); return n; });
    else setSelected((prev) => { const n = new Set(prev); pageItems.forEach((i) => n.add(i.id)); return n; });
  };

  /* Page numbers to display */
  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  return (
    <div className="p-4 lg:p-8 bg-[#F3F4F8] min-h-screen pb-20 font-sans space-y-7">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Invoice List</h1>
          <p className="text-slate-400 text-sm font-medium">Manage, print, and track all financial records and payment statuses.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="text-[13px] font-bold text-slate-700">this month</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button variant="outline" className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 text-[13px] shadow-sm flex items-center gap-2">
            <Upload className="h-4 w-4" /> Export
          </Button>
          <Button className="h-11 px-6 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[13px] shadow-lg shadow-blue-100 flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Total billed"
          value="124,500 LE"
          trend="+12% vs last month"
          trendUp
        />
        <StatCard
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
          iconBg="bg-red-50"
          label="Outstanding Balance"
          value="124,500 LE"
          trend="↑ 1% vs last month"
          trendUp={false}
        />
        <StatCard
          icon={<BarChart2 className="h-6 w-6 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Collection Rate"
          value="94.2%"
          trend="+12% vs last month"
          trendUp
        />
      </div>

      {/* ── Main Table Card ── */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-50">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px] h-11 px-4 bg-[#F9FAFB] border border-slate-100 rounded-2xl">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by ID or Patient Name"
              className="flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-300"
            />
          </div>

          {/* Status Dropdown */}
          <div ref={statusRef} className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-2 h-11 px-5 bg-[#F9FAFB] border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {STATUS_LABELS[status]}
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", statusOpen && "rotate-180")} />
            </button>
            {statusOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 min-w-[180px] py-2 overflow-hidden">
                {(["all", "paid", "pending", "overdue"] as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setStatusOpen(false); setPage(1); }}
                    className="flex items-center gap-3 w-full px-5 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    {status === s && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    {status !== s && <span className="w-4 shrink-0" />}
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Department Dropdown */}
          <div ref={deptRef} className="relative">
            <button
              onClick={() => setDeptOpen(!deptOpen)}
              className="flex items-center gap-2 h-11 px-5 bg-[#F9FAFB] border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              All department
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", deptOpen && "rotate-180")} />
            </button>
            {deptOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 min-w-[200px] py-2 overflow-hidden">
                {["All department", "Cardiology", "General", "Neurology", "Laboratory"].map((d) => (
                  <button key={d} onClick={() => setDeptOpen(false)} className="flex items-center gap-3 w-full px-5 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                    {d === "All department" && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    {d !== "All department" && <span className="w-4 shrink-0" />}
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 h-11 px-5 bg-[#F9FAFB] border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            Monday, Oct 24th, 2026
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          {/* Bulk Actions */}
          <button className="flex items-center gap-2 h-11 px-5 bg-[#F9FAFB] border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors ml-auto">
            Bulk Actions
            <span className="h-5 w-5 rounded-full bg-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center">
              {selected.size}
            </span>
          </button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
          <div className="col-span-1 flex items-center">
            <button
              onClick={toggleAll}
              className={cn(
                "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                allSelected ? "bg-[#3B82F6] border-[#3B82F6]" : "border-slate-200 hover:border-blue-300"
              )}
            >
              {allSelected && <Check className="h-3 w-3 text-white" />}
            </button>
          </div>
          <div className="col-span-2">Invoice ID</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-2">Patient Name</div>
          <div className="col-span-2">Service Type</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-50">
          {pageItems.map((inv) => (
            <div
              key={inv.id}
              className={cn(
                "grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors",
                selected.has(inv.id) && "bg-blue-50/40"
              )}
            >
              {/* Checkbox */}
              <div className="col-span-1">
                <button
                  onClick={() => toggleSelect(inv.id)}
                  className={cn(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                    selected.has(inv.id) ? "bg-[#3B82F6] border-[#3B82F6]" : "border-slate-200 hover:border-blue-300"
                  )}
                >
                  {selected.has(inv.id) && <Check className="h-3 w-3 text-white" />}
                </button>
              </div>

              {/* Invoice ID */}
              <div className="col-span-2">
                <span className="text-[13px] font-bold text-slate-700">{inv.id}</span>
              </div>

              {/* Date */}
              <div className="col-span-1">
                <span className="text-[12px] font-bold text-slate-400">{inv.date}</span>
              </div>

              {/* Patient */}
              <div className="col-span-2 flex items-center gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={inv.patient.avatar} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-[10px] font-bold">RC</AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-bold text-slate-800 truncate">{inv.patient.name}</span>
              </div>

              {/* Service */}
              <div className="col-span-2">
                <span className="text-[12px] font-bold text-slate-500 leading-tight">{inv.service}</span>
              </div>

              {/* Amount */}
              <div className="col-span-2">
                <span className="text-[15px] font-black text-slate-900">
                  {inv.amount.toFixed(2)} <span className="text-[12px] font-bold text-slate-400">LE</span>
                </span>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <StatusBadge status={inv.status} />
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1.5">
                <button className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <Eye className="h-4 w-4 text-slate-400" />
                </button>
                <button className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <Printer className="h-4 w-4 text-slate-400" />
                </button>
                <button className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-5 border-t border-slate-50">
          <p className="text-[12px] font-bold text-slate-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>

            {pageNums().map((num, idx) =>
              num === "..." ? (
                <span key={`ellipsis-${idx}`} className="h-9 w-9 flex items-center justify-center text-[13px] font-bold text-slate-300">
                  ...
                </span>
              ) : (
                <button
                  key={num}
                  onClick={() => setPage(num as number)}
                  className={cn(
                    "h-9 w-9 rounded-xl text-[13px] font-bold transition-all",
                    page === num
                      ? "bg-[#3B82F6] text-white shadow-md shadow-blue-100"
                      : "border border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {num}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

function StatCard({ icon, iconBg, label, value, trend, trendUp }: any) {
  return (
    <div className="bg-white rounded-[24px] shadow-[0_2px_16px_rgb(0,0,0,0.04)] p-6 flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[26px] font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        <p className={cn("text-[11px] font-bold", trendUp ? "text-emerald-500" : "text-red-400")}>
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      </div>
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "paid" | "pending" | "overdue" }) {
  const styles = {
    paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    overdue: "bg-red-50 text-red-500 border-red-100",
  };
  return (
    <span className={cn("inline-flex px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide", styles[status])}>
      {status}
    </span>
  );
}
