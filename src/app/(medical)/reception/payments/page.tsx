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
import { calculatePaymentTotals, type CheckedService } from "./utils";
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

interface ChartHistoryItem {
  month: string;
  value: number;
}

export default function CheckoutPaymentPage() {
  const { t, isRTL } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToastStore();
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

  // Manual Rate State
  const [addRate, setAddRate] = useState(0);


  // Card Details State
  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: ""
  });

  const [,] = useState(false);

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

      let p: ApiPatient | null = null;
      if (appt.patientId) {
        p = await patientService.getById(appt.patientId);
        setPatient(p);

        try {
          const history = await patientService.getPatientPayments(appt.patientId);
          setBillingHistory(history.map(h => ({
            month: new Date(h.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", { month: 'short' }),
            value: h.totalAmount
          })).reverse().slice(-6));
        } catch (e) {
          console.warn("Could not load billing history", e);
        }
      }

      if (appt.invoices && appt.invoices.length > 0) {
        const inv = appt.invoices[0];
        const items = (inv.items as Record<string, unknown>[]) || [];

        if (items.length > 0) {
          setServices(items.map((item, idx) => ({
            id: `inv-item-${idx}`,
            name: (item.description as string) || (isRTL ? "خدمة طبية" : "Medical Service"),
            dept: appt.type || (isRTL ? "خدمة العيادة" : "Clinic Service"),
            code: (item.code as string) || "99204",
            qty: (item.quantity as number) || 1,
            amount: (item.amount as number) || 0,
            checked: true
          })));
        } else {
          setServices([{
            id: appt.id,
            name: appt.serviceName || (isRTL ? "كشف" : "Consultation"),
            dept: appt.type || (isRTL ? "خدمة طبية" : "Medical Service"),
            code: "99204",
            qty: 1,
            amount: inv.totalAmount || appt.amount || 0,
            checked: true
          }]);
        }

        if (inv.paymentStatus === "PAID" || inv.paymentMethodType === "ONLINE_CARD" || inv.paymentMethodType === "ONLINE_WALLET") {
          setPaid(true);
        }
      } else {
        setServices([{
          id: appt.id,
          name: appt.serviceName || (isRTL ? "كشف" : "Consultation"),
          dept: appt.type || (isRTL ? "خدمة طبية" : "Medical Service"),
          code: "99204",
          qty: 1,
          amount: appt.amount || 0,
          checked: true
        }]);
      }
    } catch (err) {
      console.error("Failed to fetch payment data", err);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, toast, isRTL, t]);

  const fetchPending = useCallback(async () => {
    try {
      const all = await bookingService.getAll({ status: "COMPLETED" });
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

  const { subtotal, totalDue, insuranceCoverage, specialDiscount } = calculatePaymentTotals(
    services,
    0,
    false,
    addRate,
    appointment?.insuranceDiscount || 0,
    appointment?.specialDiscount || 0
  );

  const handlePrint = () => {
    const inv = activeInvoice;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const pName = appointment?.patientName || patient?.fullName || (isRTL ? "خارجي" : "Walk-in");
    const date = new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const invoiceID = inv?.invoiceNumber ? "INV-" + inv.invoiceNumber : "RECEIPT-" + (appointmentId?.slice(-6).toUpperCase() || "N/A");

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
              <h1>${isRTL ? "إيصال دفع" : "PAYMENT RECEIPT"}</h1>
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
              <div class="info-item"><span class="info-label">${isRTL ? "الاسم:" : "Name:"}</span><span class="info-value">${pName}</span></div>
              <div class="info-item"><span class="info-label">${isRTL ? "رقم المريض:" : "Patient ID:"}</span><span class="info-value">#PT-${patient?.id?.slice(-6).toUpperCase() || "N/A"}</span></div>
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
              ${services.filter(s => s.checked).map(s => `
                <tr>
                  <td>${s.name}</td>
                  <td style="text-align: center;">${s.qty}</td>
                  <td style="text-align: ${isRTL ? 'left' : 'right'};">${s.amount.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</td>
                  <td style="text-align: ${isRTL ? 'left' : 'right'};">${(s.amount * s.qty).toLocaleString()} ${isRTL ? "ج.م" : "LE"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">${isRTL ? "المجموع الفرعي" : "Subtotal"}</span>
              <span style="font-weight: 700;">${subtotal.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</span>
            </div>
            ${insuranceCoverage > 0 ? `
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">${isRTL ? "خصم التأمين" : "Insurance Discount"}</span>
              <span style="font-weight: 700; color: #ef4444;">-${insuranceCoverage.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</span>
            </div>
            ` : ""}
            ${specialDiscount > 0 ? `
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">${isRTL ? "خصم النقاط / خاص" : "Points / Special Discount"}</span>
              <span style="font-weight: 700; color: #ef4444;">-${specialDiscount.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</span>
            </div>
            ` : ""}
            ${addRate > 0 ? `
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">${isRTL ? "رسوم إضافية" : "Additional Fee"}</span>
              <span style="font-weight: 700;">+${addRate.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</span>
            </div>
            ` : ""}
            <div class="total-row grand-total">
              <span>${isRTL ? "الإجمالي النهائي" : "Final Total"}</span>
              <span>${totalDue.toLocaleString()} ${isRTL ? "ج.م" : "LE"}</span>
            </div>
          </div>

          <div class="footer">
            ${isRTL ? "شكراً لزيارتكم MedFlow. نتمنى لكم دوام الصحة." : "Thank you for visiting MedFlow. We wish you good health."}
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
    toast.success(isRTL ? "بدأت الطباعة..." : "Print started...");
  };

  const handleProcessPayment = async () => {
    if (paymentMethod === "card" && (!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv)) {
      toast.error(isRTL ? "يرجى إكمال تفاصيل البطاقة" : "Please complete card details");
      return;
    }

    setProcessing(true);
    try {
      // Simulate real network latency and gateway interaction
      await new Promise(resolve => setTimeout(resolve, 2500));

      const methodMap = {
        card: "ONSITE_CARD",
        cash: "ONSITE_CASH",
      };

      if (appointmentId) {
        await bookingService.updateStatus(appointmentId, "COMPLETED", {
          paymentMethod: methodMap[paymentMethod as keyof typeof methodMap],
          amount: totalDue,
          tax: addRate,
        });
      }
      setPaid(true);
      toast.success(t("statusUpdatedSuccessfully"));
    } catch {
      toast.error(t("error"));
    } finally {
      setProcessing(false);
    }
  };

  const chartH = 120;
  const chartW = 340;
  const chartHistory = billingHistory.length > 0 ? billingHistory : BILLING_HISTORY;
  const maxVal = Math.max(...chartHistory.map((d) => d.value), 100);

  // Calculate points defensively to avoid NaN when history is short or empty
  const pts = chartHistory.map((d, i) => {
    const x = chartHistory.length > 1 ? (i / (chartHistory.length - 1)) * chartW : 0;
    const y = chartH - (Math.max(0, d.value) / maxVal) * chartH;
    return `${x},${y}`;
  }).join(" ");

  const areaPath = pts ? `M0,${chartH} L${pts.split(" ").join(" L")} L${chartW},${chartH} Z` : `M0,${chartH} L${chartW},${chartH} Z`;
  const linePath = pts ? `M${pts.split(" ").join(" L")}` : "";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="font-bold text-slate-500">{isRTL ? "جاري تحميل تفاصيل الدفع..." : "Loading checkout details..."}</p>
        </div>
      </div>
    );
  }

  if (!appointmentId) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 bg-slate-50 min-h-screen font-sans space-y-7">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">{t("payment") || (isRTL ? "تحصيل المدفوعات" : "Payments")}</h1>
            <p className="text-slate-400 text-sm font-medium">{isRTL ? "اختر مريضاً من قائمة الزيارات المكتملة لمعالجة دفعه." : "Choose a patient from the completed visits list to process their payment."}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/reception/waiting-room')} className="rounded-2xl border-slate-200">
            {t("waitingRoom")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingCheckouts.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-[28px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Users className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold">{t("noPatientsInQueue")}</p>
              <p className="text-sm">{isRTL ? "تمت تسوية جميع الزيارات المكتملة." : "All completed visits have been settled."}</p>
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
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{appt.patientName || "Unknown Patient"}</h3>
                    <p className="text-[12px] text-slate-400 font-medium">{t("date")}: {appt.startTime} • {appt.date}</p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">{t("doctor")}</span>
                    <span className="font-bold text-slate-700">{appt.doctorName || "---"}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">{t("type")}</span>
                    <span className="font-bold text-slate-700">{appt.serviceName || t("consultation")}</span>
                  </div>
                  <div className="flex justify-between text-[13px] pt-1">
                    <span className="text-slate-400">{t("totalAmount")}</span>
                    <span className="font-black text-blue-600">{(appt.amount ?? 0).toFixed(2)} {isRTL ? "ج.م" : "LE"}</span>
                  </div>
                </div>
                <Button className="w-full mt-5 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 border-none shadow-none font-bold text-[13px]">
                  {isRTL ? "إتمام الدفع" : "Process Checkout"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20 font-sans space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl hover:bg-white/50 transition-colors"
          >
            {isRTL ? <ArrowLeft className="h-5 w-5 text-slate-500 rotate-180" /> : <ArrowLeft className="h-5 w-5 text-slate-500" />}
          </Button>
          <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{isRTL ? "إتمام الخروج والدفع" : "Checkout & Payment"}</h1>
              {activeInvoice?.invoiceNumber && (
                <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none font-bold">
                  INV-{activeInvoice.invoiceNumber}
                </Badge>
              )}
            </div>
            <p className="text-slate-400 text-sm font-medium">{isRTL ? "معالجة رسوم الزيارة، والخدمات الإضافية، وطرق الدفع." : "Process visit fees, additional services, and payment methods."}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span className="text-[13px] font-bold text-slate-700">
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
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
            onClick={handlePrint}
            className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 text-[13px] shadow-sm flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> {isRTL ? "طباعة الفاتورة" : "Print Invoice"}
          </Button>
          <Button className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] shadow-lg shadow-blue-500/10 flex items-center gap-2">
            <Send className="h-4 w-4" /> {isRTL ? "إرسال الإيصال" : "Send Receipt"}
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
                <div className={isRTL ? "text-right" : "text-left"}>
                  <h2 className="text-[16px] font-bold text-slate-900">{patient?.fullName || (isRTL ? "مريض خارجي" : "Walk-in Patient")}</h2>
                  <div className="flex items-center gap-3 text-[12px] font-bold text-slate-400 mt-0.5">
                    <span>ID: #PT-{patient?.id.slice(-6).toUpperCase() || "N/A"}</span>
                    <span>•</span>
                    <span>DOB: {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-50">
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "تاريخ الزيارة" : "Visit Date"}</p>
                <p className="text-[13px] font-bold text-slate-700 mt-1">{appointment?.date} • {appointment?.startTime}</p>
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("doctor")}</p>
                <p className="text-[13px] font-bold text-slate-700 mt-1">{appointment?.doctorName || (isRTL ? "طبيب العيادة" : "Staff Physician")}</p>
              </div>
            </div>
          </div>

          {/* Checkout Summary */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "ملخص الدفع" : "Checkout summary"}</h3>
              <button className="flex items-center gap-1.5 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                <Plus className="h-4 w-4" /> {isRTL ? "إضافة بند" : "Add Item"}
              </button>
            </div>

            {/* Table Header */}
            <div className={cn("grid grid-cols-12 gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100", isRTL ? "text-right" : "text-left")}>
              <div className="col-span-6">{isRTL ? "تفاصيل الخدمة" : "Service Details"}</div>
              <div className="col-span-2 text-center">{isRTL ? "الكود" : "Code"}</div>
              <div className="col-span-2 text-center">{isRTL ? "الكمية" : "QTY"}</div>
              <div className={cn("col-span-2", isRTL ? "text-left" : "text-right")}>{isRTL ? "المبلغ" : "Amount"}</div>
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
                    <div className={cn("min-w-0", isRTL ? "text-right" : "text-left")}>
                      <p className={cn("text-[13px] font-bold truncate", service.checked ? "text-slate-900" : "text-slate-400 line-through")}>
                        {service.name}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400">{service.dept}</p>
                    </div>
                  </div>
                  <div className={cn("flex sm:contents items-center justify-between w-full sm:w-auto", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className="sm:col-span-2 sm:text-center text-[13px] font-bold text-slate-500">
                      <span className="sm:hidden text-slate-400 mr-2 uppercase text-[10px]">{isRTL ? "الكود:" : "Code:"}</span>
                      {service.code}
                    </div>
                    <div className="sm:col-span-2 sm:text-center text-[13px] font-bold text-slate-500">
                      <span className="sm:hidden text-slate-400 mr-2 uppercase text-[10px]">{isRTL ? "الكمية:" : "Qty:"}</span>
                      {service.qty}
                    </div>
                    <div className={cn("sm:col-span-2 text-[14px] font-bold", isRTL ? "sm:text-left" : "sm:text-right", service.checked ? "text-slate-900" : "text-slate-300")}>
                      {service.amount.toFixed(2)} {isRTL ? "ج.م" : "$"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Administrative Options */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">


              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-blue-500" />
                  <span className="text-[13px] font-bold text-slate-700">{isRTL ? "رسوم إضافية" : "Additional Rate/Fee"}</span>
                </div>
                <input
                  type="number"
                  value={addRate}
                  onChange={(e) => setAddRate(Number(e.target.value) || 0)}
                  className="w-24 h-9 bg-white border border-slate-200 rounded-xl px-3 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                <span className="text-[13px] font-bold text-slate-500">{isRTL ? "المجموع الفرعي:" : "Subtotal:"}</span>
                <span className="text-[14px] font-bold text-slate-900">{subtotal.toFixed(2)} {isRTL ? "ج.م" : "$"}</span>
              </div>
              {insuranceCoverage > 0 && (
                <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-[13px] font-bold text-emerald-600">
                    {isRTL ? "تغطية التأمين:" : "Insurance Coverage:"}
                  </span>
                  <span className="text-[14px] font-bold text-emerald-600">
                    -{insuranceCoverage.toFixed(2)} {isRTL ? "ج.م" : "$"}
                  </span>
                </div>
              )}
              {specialDiscount > 0 && (
                <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-[13px] font-bold text-blue-600">
                    {isRTL ? "خصم النقاط / خاص:" : "Points / Special Discount:"}
                  </span>
                  <span className="text-[14px] font-bold text-blue-600">
                    -{specialDiscount.toFixed(2)} {isRTL ? "ج.م" : "$"}
                  </span>
                </div>
              )}

              {addRate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-blue-600">{isRTL ? "رسوم إضافية:" : "Additional Fee:"}</span>
                  <span className="text-[14px] font-bold text-blue-600">+{addRate.toFixed(2)} {isRTL ? "ج.م" : "$"}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[15px] font-bold text-slate-900">{isRTL ? "الإجمالي المستحق" : "Total Due"}</span>
                <span className="text-[22px] font-black text-[#3B82F6] tracking-tighter">{totalDue.toFixed(2)} {isRTL ? "ج.م" : "$"}</span>
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
                <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "سجل مدفوعات المريض" : "Patient Billing History"}</h3>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="text-[12px] font-bold text-slate-600">{isRTL ? "آخر 6 أشهر" : "last 6 months"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className={cn("flex flex-col justify-between text-[10px] font-bold text-slate-300 h-[120px]", isRTL ? "text-left pl-1" : "text-right pr-1")}>
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
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                    <line
                      key={frac}
                      x1={0} y1={frac * chartH}
                      x2={chartW} y2={frac * chartH}
                      stroke="#F1F5F9" strokeWidth="1"
                    />
                  ))}
                  <path d={areaPath} fill="url(#areaGradient)" />
                  <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {chartHistory.map((d, i) => {
                    const x = chartHistory.length > 1 ? (i / (chartHistory.length - 1)) * chartW : 0;
                    const y = chartH - (Math.max(0, d.value) / maxVal) * chartH;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
                      </g>
                    );
                  })}
                  {chartHistory.map((d, i) => {
                    if (i < chartHistory.length - 2) return null;
                    const x = chartHistory.length > 1 ? (i / (chartHistory.length - 1)) * chartW : 0;
                    const y = chartH - (Math.max(0, d.value) / maxVal) * chartH;
                    return (
                      <g key={`tooltip-${i}`}>
                        <rect x={x - 22} y={y - 24} width={44} height={18} rx={5} fill="#1E3A5F" />
                        <text x={x} y={y - 11} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{d.value.toFixed(0)}</text>
                      </g>
                    );
                  })}
                </svg>
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
            <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "طريقة الدفع" : "Payment Method"}</h3>

            {/* Method Options */}
            <div className="space-y-3">
              <PaymentOption
                selected={paymentMethod === "card"}
                onClick={() => setPaymentMethod("card")}
                icon={<CreditCard className="h-5 w-5 text-blue-600" />}
                iconBg="bg-blue-50"
                title={isRTL ? "بطاقة ائتمان" : "Credit card"}
                subtitle={isRTL ? "فيزا تنتهي بـ 4242" : "Visa ending in 4242"}
              />

              <PaymentOption
                selected={paymentMethod === "cash"}
                onClick={() => setPaymentMethod("cash")}
                icon={<span className="text-slate-500 font-black text-sm">$</span>}
                iconBg="bg-slate-50"
                title={isRTL ? "نقداً" : "Cash"}
                subtitle={isRTL ? "الدفع عند المكتب" : "Pay at desk"}
              />
            </div>

            {/* Card Form */}
            {paymentMethod === "card" && (
              <div className="space-y-4 pt-2">
                <CardField
                  label={isRTL ? "اسم حامل البطاقة" : "Cardholder Name"}
                  value={cardDetails.name}
                  type="text"
                  onChange={(v) => setCardDetails(prev => ({ ...prev, name: v }))}
                  placeholder={isRTL ? "الاسم كما هو على البطاقة" : "Name as on card"}
                />
                <CardField
                  label={isRTL ? "رقم البطاقة" : "Card Number"}
                  value={cardDetails.number}
                  type="text"
                  onChange={(v) => setCardDetails(prev => ({ ...prev, number: v }))}
                  placeholder="xxxx xxxx xxxx xxxx"
                />
                <div className="grid grid-cols-2 gap-3">
                  <CardField
                    label={isRTL ? "تاريخ الانتهاء" : "Expiry Date"}
                    value={cardDetails.expiry}
                    type="text"
                    onChange={(v) => setCardDetails(prev => ({ ...prev, expiry: v }))}
                    placeholder="MM/YY"
                  />
                  <CardField
                    label={isRTL ? "رمز الأمان" : "CVV"}
                    value={cardDetails.cvv}
                    type="password"
                    onChange={(v) => setCardDetails(prev => ({ ...prev, cvv: v }))}
                    placeholder="***"
                  />
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
                  {isRTL ? "تم الدفع" : "PAID"}
                </div>
              </div>
            )}
            <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
              <p className="text-[12px] font-bold text-blue-300">{isRTL ? "إجمالي المبلغ المستحق" : "Total Amount to Pay"}</p>
              <p className="text-[40px] font-black text-white tracking-tighter leading-none">
                {totalDue.toFixed(2)} {isRTL ? "ج.م" : "$"}
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
              {paid ? (isRTL ? "اكتمل الدفع ✓" : "Payment Complete ✓") : processing ? (isRTL ? "جاري المعالجة..." : "Processing...") : (isRTL ? "إتمام الدفع" : "Process Payment")}
            </Button>

            {paid && (
              <Button
                variant="ghost"
                onClick={() => router.push("/reception/waiting-room")}
                className="w-full text-blue-300 hover:text-white hover:bg-white/10 font-bold text-[13px]"
              >
                {t("waitingRoom")}
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-blue-300">
              <Lock className="h-3.5 w-3.5" />
              {isRTL ? "تشفير آمن 256 بت" : "Secure 256-bit encryption"}
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
  const { isRTL } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
        isRTL ? "flex-row-reverse text-right" : "flex-row text-left",
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
      <div className={isRTL ? "mr-auto" : "ml-auto"}>
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


/* ── Receipt Modal ────────────────────────────────────────────── */

function CardField({ label, value, type, onChange, placeholder }: { label: string; value: string; type: string; onChange: (v: string) => void, placeholder?: string }) {
  const { isRTL } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className={cn("text-[11px] font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{label}</label>
      <div className="h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center group focus-within:border-blue-400 focus-within:bg-white transition-all">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("w-full bg-transparent text-[13px] font-bold text-slate-800 outline-none placeholder:text-slate-300", isRTL && "text-right")}
        />
      </div>
    </div>
  );
}
