"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { billingService, type InvoiceStats } from "@/services/billingService";
import type { ApiInvoice } from "@/types";
import { useToastStore } from "@/stores/useToastStore";
import { useTranslation } from "@/hooks/useTranslation";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

type Status = "all" | "paid" | "pending" | "overdue";
const PAGE_SIZE = 10;

export default function InvoiceListPage() {
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [statusOpen, setStatusOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ApiInvoice | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const toast = useToastStore();

  const statusRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);

  const STATUS_LABELS: Record<Status, string> = { 
    all: t("allStates") || (isRTL ? "جميع الحالات" : "All states"), 
    paid: t("paid"), 
    pending: t("pending"), 
    overdue: t("overdue") || (isRTL ? "متأخر" : "Overdue")
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, s] = await Promise.all([
        billingService.getAll({ search, status, page, limit: PAGE_SIZE }),
        billingService.getStats()
      ]);
      setInvoices(res.items);
      setTotalItems(res.total);
      setStats(s);
    } catch {
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [search, status, page, toast, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const allSelected = invoices.length > 0 && invoices.every((i) => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelected((prev) => { const n = new Set(prev); invoices.forEach((i) => n.delete(i.id)); return n; });
    else setSelected((prev) => { const n = new Set(prev); invoices.forEach((i) => n.add(i.id)); return n; });
  };

  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const handlePrint = (inv: ApiInvoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const patientName = inv.appointment?.patientName || inv.patientName || (isRTL ? "خارجي" : "Walk-in");
    const serviceName = inv.appointment?.serviceName || t("consultation");
    const date = new Date(inv.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const invoiceID = "INV-" + (inv.invoiceNumber || inv.id.slice(-6).toUpperCase());

    printWindow.document.write(`
      <html>
        <head>
          <title>${invoiceID}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #334155; direction: ${isRTL ? 'rtl' : 'ltr'}; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
            .logo { font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -1px; }
            .invoice-info { text-align: ${isRTL ? 'left' : 'right'}; }
            .invoice-info h1 { margin: 0; font-size: 24px; color: #0f172a; }
            .invoice-info p { margin: 5px 0; font-size: 14px; color: #64748b; font-weight: 600; }
            
            .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
            .info-box { background: #f8fafc; padding: 20px; rounded: 12px; border: 1px solid #f1f5f9; }
            .info-item { margin-bottom: 8px; font-size: 14px; }
            .info-label { font-weight: 600; color: #64748b; margin-${isRTL ? 'left' : 'right'}: 8px; }
            .info-value { font-weight: 700; color: #1e293b; }

            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: ${isRTL ? 'right' : 'left'}; padding: 12px 15px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
            td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600; }
            
            .totals { margin-top: 40px; display: flex; flex-direction: column; align-items: flex-end; }
            .total-row { display: flex; justify-content: space-between; width: 250px; margin-bottom: 10px; font-size: 14px; }
            .grand-total { margin-top: 15px; padding-top: 15px; border-top: 2px solid #f1f5f9; font-size: 20px; font-weight: 900; color: #2563eb; }
            
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; font-weight: 600; }
            
            @media print {
              body { padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">MedFlow</div>
            <div class="invoice-info">
              <h1>${isRTL ? "فاتورة ضريبية" : "TAX INVOICE"}</h1>
              <p>${invoiceID}</p>
              <p>${date}</p>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-title">${isRTL ? "مقدم الخدمة" : "SERVICE PROVIDER"}</div>
              <div class="info-item"><span class="info-value">MedFlow Medical Center</span></div>
              <div class="info-item"><span class="info-value">123 Medical Plaza, Cairo</span></div>
            </div>
            <div>
              <div class="section-title">${isRTL ? "بيانات المريض" : "PATIENT DETAILS"}</div>
              <div class="info-item"><span class="info-label">${isRTL ? "الاسم:" : "Name:"}</span><span class="info-value">${patientName}</span></div>
              <div class="info-item"><span class="info-label">${isRTL ? "رقم المريض:" : "Patient ID:"}</span><span class="info-value">#PT-${inv.patientId?.slice(-6).toUpperCase() || "N/A"}</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${isRTL ? "الوصف" : "DESCRIPTION"}</th>
                <th style="text-align: center;">${isRTL ? "الكمية" : "QTY"}</th>
                <th style="text-align: ${isRTL ? 'left' : 'right'};">${isRTL ? "السعر" : "PRICE"}</th>
                <th style="text-align: ${isRTL ? 'left' : 'right'};">${isRTL ? "الإجمالي" : "TOTAL"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${serviceName}</td>
                <td style="text-align: center;">1</td>
                <td style="text-align: ${isRTL ? 'left' : 'right'};">${inv.totalAmount.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</td>
                <td style="text-align: ${isRTL ? 'left' : 'right'};">${inv.totalAmount.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">${isRTL ? "المجموع الفرعي" : "Subtotal"}</span>
              <span style="font-weight: 700;">${inv.totalAmount.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</span>
            </div>
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">${isRTL ? "الخصم" : "Discount"}</span>
              <span style="font-weight: 700;">0.00 ${isRTL ? "ج.م" : "LE"}</span>
            </div>
            <div class="total-row grand-total">
              <span>${isRTL ? "الإجمالي" : "Total"}</span>
              <span>${inv.totalAmount.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</span>
            </div>
          </div>

          <div class="footer">
            ${isRTL ? "شكراً لاختياركم MedFlow. تمنياتنا لكم بالشفاء العاجل." : "Thank you for choosing MedFlow. We wish you a speedy recovery."}
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(t("printStarted") || "Print started...");
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20 font-sans space-y-7">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
          <h1 className="text-2xl font-bold text-slate-900">{t("invoiceList") || (isRTL ? "قائمة الفواتير" : "Invoice List")}</h1>
          <p className="text-slate-400 text-sm font-medium">{isRTL ? "إدارة وطباعة وتتبع جميع السجلات المالية وحالات الدفع." : "Manage, print, and track all financial records and payment statuses."}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="text-[13px] font-bold text-slate-700">{isRTL ? "هذا الشهر" : "this month"}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button variant="outline" className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 text-[13px] shadow-sm flex items-center gap-2">
            <Upload className="h-4 w-4" /> {t("export")}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-2xl font-bold text-[13px] shadow-lg shadow-blue-500/10 flex items-center gap-2">
            <Plus className="h-4 w-4" /> {t("newInvoice") || (isRTL ? "فاتورة جديدة" : "New Invoice")}
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label={t("totalBilled") || (isRTL ? "إجمالي الفواتير" : "Total billed")}
          value={`${(stats?.totalBilled || 0).toLocaleString(isRTL ? "ar-EG" : "en-US")} ${isRTL ? "ج.م" : "LE"}`}
          trend={isRTL ? "+12% عن الشهر الماضي" : "+12% vs last month"}
          trendUp
        />
        <StatCard
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
          iconBg="bg-red-50"
          label={t("outstandingBalance") || (isRTL ? "المبالغ المستحقة" : "Outstanding Balance")}
          value={`${(stats?.outstandingBalance || 0).toLocaleString(isRTL ? "ar-EG" : "en-US")} ${isRTL ? "ج.م" : "LE"}`}
          trend={isRTL ? "↑ 1% عن الشهر الماضي" : "↑ 1% vs last month"}
          trendUp={false}
        />
        <StatCard
          icon={<BarChart2 className="h-6 w-6 text-blue-600" />}
          iconBg="bg-blue-50"
          label={t("collectionRate") || (isRTL ? "معدل التحصيل" : "Collection Rate")}
          value={`${(stats?.collectionRate || 0).toLocaleString(isRTL ? "ar-EG" : "en-US")}%`}
          trend={isRTL ? "+12% عن الشهر الماضي" : "+12% vs last month"}
          trendUp
        />
      </div>

      {/* ── Main Table Card ── */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Filter Bar */}
        <div className={cn("flex flex-wrap items-center gap-3 p-5 border-b border-slate-50", isRTL ? "flex-row-reverse" : "flex-row")}>
          {/* Search */}
          <div className={cn("flex items-center gap-2 flex-1 min-w-[220px] h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl", isRTL ? "flex-row-reverse" : "flex-row")}>
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={isRTL ? "البحث برقم الفاتورة أو اسم المريض" : "Search by ID or Patient Name"}
              className={cn("flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-300", isRTL && "text-right")}
            />
          </div>

          {/* Status Dropdown */}
          <div ref={statusRef} className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className={cn("flex items-center gap-2 h-11 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors", isRTL ? "flex-row-reverse" : "flex-row")}
            >
              {STATUS_LABELS[status]}
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", statusOpen && "rotate-180")} />
            </button>
            {statusOpen && (
              <div className={cn("absolute top-[calc(100%+8px)] z-50 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 min-w-[180px] py-2 overflow-hidden", isRTL ? "right-0" : "left-0")}>
                {(["all", "paid", "pending", "overdue"] as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setStatusOpen(false); setPage(1); }}
                    className={cn("flex items-center gap-3 w-full px-5 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}
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
              className={cn("flex items-center gap-2 h-11 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors", isRTL ? "flex-row-reverse" : "flex-row")}
            >
              {t("allDepartments")}
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", deptOpen && "rotate-180")} />
            </button>
            {deptOpen && (
              <div className={cn("absolute top-[calc(100%+8px)] z-50 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 min-w-[200px] py-2 overflow-hidden", isRTL ? "right-0" : "left-0")}>
                {[t("allDepartments"), t("cardiology"), t("pediatrics"), t("orthopedics"), t("dermatology")].map((d) => (
                  <button key={d} onClick={() => setDeptOpen(false)} className={cn("flex items-center gap-3 w-full px-5 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
                    <span className="w-4 shrink-0" />
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className={cn("flex items-center gap-2 h-11 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors", isRTL ? "flex-row-reverse" : "flex-row")}>
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span className="text-[13px] font-bold">
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          {/* Bulk Actions */}
          <button className={cn("flex items-center gap-2 h-11 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors", isRTL ? "mr-auto flex-row-reverse" : "ml-auto flex-row")}>
            {t("bulkActions") || (isRTL ? "إجراءات جماعية" : "Bulk Actions")}
            <span className="h-5 w-5 rounded-full bg-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center">
              {selected.size}
            </span>
          </button>
        </div>

        {/* Table Header - Hidden on Mobile */}
        <div className={cn("hidden md:grid grid-cols-12 gap-3 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50", isRTL ? "text-right" : "text-left")}>
          <div className="col-span-1 flex items-center">
            <button
              onClick={toggleAll}
              className={cn(
                "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                allSelected ? "bg-blue-600 border-[#3B82F6]" : "border-slate-200 hover:border-blue-300"
              )}
            >
              {allSelected && <Check className="h-3 w-3 text-white" />}
            </button>
          </div>
          <div className="col-span-2">{t("invoiceId") || (isRTL ? "رقم الفاتورة" : "Invoice ID")}</div>
          <div className="col-span-2">{t("date")}</div>
          <div className="col-span-2">{t("patientName") || (isRTL ? "اسم المريض" : "Patient Name")}</div>
          <div className="col-span-2">{t("serviceType") || (isRTL ? "نوع الخدمة" : "Service Type")}</div>
          <div className="col-span-1">{t("amount")}</div>
          <div className="col-span-1">{t("status")}</div>
          <div className={cn("col-span-1", isRTL ? "text-left" : "text-right")}>{isRTL ? "خيارات" : "Actions"}</div>
        </div>

        {/* Table Rows / Cards */}
        <div className="divide-y divide-slate-50 min-h-[400px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {invoices.length === 0 && !isLoading && (
            <div className="py-20 text-center">
              <p className="text-slate-400 font-bold">{isRTL ? "لم يتم العثور على فواتير" : "No invoices found"}</p>
            </div>
          )}
          {invoices.map((inv) => {
            const invExtra = inv as unknown as {
              appointment?: {
                patient?: { user?: { avatarUrl?: string } };
                patientName?: string;
                serviceName?: string;
              };
            };
            return (
            <div
              key={inv.id}
              className={cn(
                "flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-3 px-6 py-5 md:py-4 items-start md:items-center hover:bg-slate-50/60 transition-colors",
                isRTL ? "md:text-right" : "md:text-left",
                selected.has(inv.id) && "bg-blue-50/40"
              )}
            >
              <div className={cn("col-span-1 flex items-center justify-between w-full md:w-auto", isRTL ? "flex-row-reverse" : "flex-row")}>
                <button
                  onClick={() => toggleSelect(inv.id)}
                  className={cn(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                    selected.has(inv.id) ? "bg-blue-600 border-[#3B82F6]" : "border-slate-200 hover:border-blue-300"
                  )}
                >
                  {selected.has(inv.id) && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="md:hidden">
                  <StatusBadge 
                    status={
                      inv.paymentMethodType === "ONLINE_CARD" || inv.paymentMethodType === "ONLINE_WALLET" 
                        ? "paid" 
                        : inv.paymentStatus.toLowerCase()
                    } 
                  />
                </div>
              </div>

              {/* Invoice ID */}
              <div 
                onClick={() => inv.appointmentId && router.push(`/reception/payments?appointmentId=${inv.appointmentId}`)}
                className="col-span-2 flex flex-col md:block cursor-pointer group"
              >
                <span className="md:hidden text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{isRTL ? "رقم الفاتورة" : "Invoice ID"}</span>
                <span className="text-[14px] md:text-[13px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">INV-{inv.invoiceNumber || inv.id.slice(-6).toUpperCase()}</span>
              </div>

              {/* Date */}
              <div className="col-span-2 hidden md:block">
                <span className="text-[12px] font-bold text-slate-400">
                  {new Date(inv.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", { month: 'short', day: 'numeric', year: '2-digit' })}
                </span>
              </div>

              {/* Patient */}
              <div className={cn("col-span-2 flex items-center gap-3 w-full", isRTL ? "flex-row-reverse" : "flex-row")}>
                <Avatar className="h-9 w-9 md:h-8 md:w-8 shrink-0">
                  <AvatarImage src={invExtra.appointment?.patient?.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${invExtra.appointment?.patientName || "Guest"}`} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-[10px] font-bold">PT</AvatarFallback>
                </Avatar>
                <div className={cn("flex flex-col min-w-0", isRTL ? "text-right" : "text-left")}>
                   <span className="md:hidden text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{isRTL ? "المريض" : "Patient"}</span>
                   <span className="text-[14px] md:text-[13px] font-bold text-slate-800 truncate">{invExtra.appointment?.patientName || (isRTL ? "خارجي" : "Walk-in")}</span>
                </div>
              </div>

              {/* Service */}
              <div className="col-span-2 hidden sm:flex flex-col md:block">
                <span className="md:hidden text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{isRTL ? "الخدمة" : "Service"}</span>
                <span className="text-[12px] font-bold text-slate-500 leading-tight">{invExtra.appointment?.serviceName || t("consultation")}</span>
              </div>

              {/* Amount */}
              <div className="col-span-1 flex flex-col md:block w-full md:w-auto">
                <span className="md:hidden text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{t("amount")}</span>
                <span className="text-[18px] md:text-[15px] font-black text-slate-900">
                  {inv.totalAmount.toLocaleString(isRTL ? "ar-EG" : "en-US", { minimumFractionDigits: 2 })} <span className="text-[12px] font-bold text-slate-400">{isRTL ? "ج.م" : "LE"}</span>
                </span>
              </div>

              {/* Status */}
              <div className="hidden md:block col-span-1">
                <StatusBadge 
                  status={
                    inv.paymentMethodType === "ONLINE_CARD" || inv.paymentMethodType === "ONLINE_WALLET" 
                      ? "paid" 
                      : inv.paymentStatus.toLowerCase()
                  } 
                />
              </div>

              {/* Actions */}
              <div className={cn("col-span-1 flex items-center justify-end gap-2 md:gap-1.5 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-slate-50 mt-1 md:mt-0", isRTL ? "flex-row-reverse" : "flex-row")}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-10 md:h-8 w-10 md:w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors border md:border-none border-slate-100 md:bg-transparent bg-white">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 rounded-2xl p-2 shadow-xl border-slate-100 dark:border-slate-800">
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setDetailsOpen(true);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200"
                    >
                      <Eye className="h-4 w-4 text-slate-400" />
                      {isRTL ? "عرض التفاصيل" : "Show Details"}
                    </DropdownMenuItem>

                    {(() => {
                      const isPaid = inv.paymentStatus === "PAID" || inv.paymentMethodType === "ONLINE_CARD" || inv.paymentMethodType === "ONLINE_WALLET";
                      if (isPaid) return null;
                      return (
                        <DropdownMenuItem 
                          onClick={() => inv.appointmentId && router.push(`/reception/payments?appointmentId=${inv.appointmentId}`)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-blue-600 dark:text-blue-400"
                        >
                          <CreditCard className="h-4 w-4" />
                          {isRTL ? "تحصيل الدفع" : "Collect Payment"}
                        </DropdownMenuItem>
                      );
                    })()}

                    <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800" />
                    
                    <DropdownMenuItem 
                      onClick={() => handlePrint(inv)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200"
                    >
                      <Printer className="h-4 w-4 text-slate-400" />
                      {isRTL ? "طباعة الفاتورة" : "Print Invoice"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className={cn("flex items-center justify-between px-6 py-5 border-t border-slate-50", isRTL ? "flex-row-reverse" : "flex-row")}>
          <p className="text-[12px] font-bold text-slate-400">
            {isRTL 
              ? `عرض ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalItems)} من ${totalItems} نتيجة`
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalItems)} of ${totalItems} results`
            }
          </p>
          <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              {isRTL ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronLeft className="h-4 w-4 text-slate-500" />}
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
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                      : "border border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {(num as number).toLocaleString(isRTL ? "ar-EG" : "en-US")}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              {isRTL ? <ChevronLeft className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Details Dialog ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-[28px] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {isRTL ? "تفاصيل الفاتورة" : "Invoice Details"}
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">
                  INV-{selectedInvoice?.invoiceNumber || selectedInvoice?.id.slice(-6).toUpperCase()}
                </DialogDescription>
              </div>
              <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Patient & Service info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "المريض" : "Patient"}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {selectedInvoice?.patientName || (isRTL ? "خارجي" : "Walk-in")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "الخدمة" : "Service"}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {selectedInvoice?.appointment?.serviceName || t("consultation")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t("date")}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {selectedInvoice?.createdAt && new Date(selectedInvoice.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[13px] font-bold text-slate-500">{isRTL ? "إجمالي المبلغ" : "Total Amount"}</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {selectedInvoice?.totalAmount.toLocaleString(isRTL ? "ar-EG" : "en-US")} {isRTL ? "ج.م" : "LE"}
                </span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-[13px] font-bold text-slate-500">{isRTL ? "المبلغ المدفوع" : "Paid Amount"}</span>
                <span className="text-md font-bold text-emerald-600">
                  {(() => {
                    const isOnline = selectedInvoice?.paymentMethodType === "ONLINE_CARD" || selectedInvoice?.paymentMethodType === "ONLINE_WALLET";
                    const isPaid = selectedInvoice?.paymentStatus === "PAID" || isOnline;
                    const amount = selectedInvoice?.paidAmount ?? (isPaid ? selectedInvoice?.totalAmount : 0);
                    return (amount || 0).toLocaleString(isRTL ? "ar-EG" : "en-US") + " " + (isRTL ? "ج.م" : "LE");
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-[13px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{isRTL ? "الحالة" : "Status"}</span>
                <StatusBadge 
                  status={(() => {
                    const isOnline = selectedInvoice?.paymentMethodType === "ONLINE_CARD" || selectedInvoice?.paymentMethodType === "ONLINE_WALLET";
                    if (isOnline) return "paid";
                    return selectedInvoice?.paymentStatus?.toLowerCase() || "pending";
                  })()} 
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/30 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setDetailsOpen(false)}
              className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-700 font-bold"
            >
              {isRTL ? "إغلاق" : "Close"}
            </Button>
            <Button 
              onClick={() => selectedInvoice && handlePrint(selectedInvoice)}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Printer className="h-4 w-4 mr-2" />
              {t("print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

function StatCard({ icon, iconBg, label, value, trend, trendUp }: StatCardProps) {
  const { isRTL } = useTranslation();
  return (
    <div className={cn("bg-white rounded-[24px] shadow-[0_2px_16px_rgb(0,0,0,0.04)] p-6 flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("space-y-2", isRTL ? "text-right" : "text-left")}>
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[26px] font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        <p className={cn("text-[11px] font-bold", trendUp ? "text-emerald-500" : "text-red-400")}>
          {isRTL ? (trendUp ? "↑" : "↓") : (trendUp ? "↑" : "↓")} {trend}
        </p>
      </div>
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    overdue: "bg-red-50 text-red-500 border-red-100",
    partial: "bg-blue-50 text-blue-600 border-blue-100",
    refunded: "bg-slate-50 text-slate-400 border-slate-100",
  };
  const normalizedStatus = status.toLowerCase();
  return (
    <span className={cn("inline-flex px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide", styles[normalizedStatus] || "bg-slate-50 text-slate-500 border-slate-100")}>
      {t(normalizedStatus as TranslationKey) || normalizedStatus}
    </span>
  );
}
