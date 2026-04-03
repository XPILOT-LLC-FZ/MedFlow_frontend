"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, Users, Clock, DollarSign, Plus, ArrowRight, Upload,
  FileSpreadsheet, TrendingUp, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsCard } from "@/components/shared/StatsCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { usePaymentsStore, parsePaymentsCSV } from "@/stores/usePaymentsStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";

export default function ReceptionDashboard() {
  const { t, locale } = useTranslation();
  const {
    payments, addPayments,
    getTodayIncome, getMonthIncome, getYearIncome, getMonthlyBreakdown,
  } = usePaymentsStore();
  const { appointments } = useBookingStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvStatus, setCsvStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);

  const todayIncome = getTodayIncome();
  const monthIncome = getMonthIncome();
  const yearIncome = getYearIncome();
  const monthlyData = getMonthlyBreakdown();

  const toast = useToastStore();

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parsePaymentsCSV(text);
      if (parsed.length === 0) {
        toast.error(locale === "ar" ? "لم يتم العثور على بيانات صالحة" : "No valid payment data found");
        setCsvStatus({
          type: "error",
          msg: locale === "ar"
            ? "لم يتم العثور على بيانات صالحة في الملف"
            : "No valid payment data found in the file",
        });
      } else {
        addPayments(parsed);
        toast.success(locale === "ar" ? `تم استيراد ${parsed.length} سجل` : `Imported ${parsed.length} records`);
        setCsvStatus({
          type: "success",
          msg: locale === "ar"
            ? `تم استيراد ${parsed.length} سجل دفع بنجاح`
            : `Successfully imported ${parsed.length} payment records`,
        });
      }
      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const sortedPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date));
  const displayedPayments = showAllPayments ? sortedPayments : sortedPayments.slice(0, 10);

  // Build yearly chart data (last 2 years)
  const currentYear = new Date().getFullYear();
  const yearlyData = [currentYear - 1, currentYear].map((yr) => ({
    name: String(yr),
    revenue: payments
      .filter((p) => p.date.startsWith(String(yr)))
      .reduce((sum, p) => sum + p.amount, 0),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={locale === "ar" ? "لوحة تحكم الاستقبال" : "Reception Dashboard"}
        description={locale === "ar" ? "إدارة المدفوعات والتحليلات المالية" : "Payments management & financial analytics"}
        action={
          <Link href="/reception/booking">
            <Button className="gap-2"><Plus className="h-4 w-4" /> {locale === "ar" ? "حجز سريع" : "Quick Book"}</Button>
          </Link>
        }
      />

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={locale === "ar" ? "دخل اليوم" : "Today's Income"}
          value={`$${todayIncome.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          delay={0}
        />
        <StatsCard
          title={locale === "ar" ? "دخل الشهر" : "Monthly Income"}
          value={`$${monthIncome.toLocaleString()}`}
          change={12}
          icon={<TrendingUp className="h-5 w-5" />}
          delay={0.1}
        />
        <StatsCard
          title={locale === "ar" ? "دخل السنة" : "Yearly Income"}
          value={`$${yearIncome.toLocaleString()}`}
          icon={<Calendar className="h-5 w-5" />}
          delay={0.2}
        />
        <StatsCard
          title={locale === "ar" ? "إجمالي المعاملات" : "Total Transactions"}
          value={payments.length}
          icon={<FileSpreadsheet className="h-5 w-5" />}
          delay={0.3}
        />
      </div>

      {/* CSV Upload */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                {locale === "ar" ? "استيراد المدفوعات (CSV)" : "Import Payments (CSV)"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  {locale === "ar"
                    ? "ارفع ملف CSV يحتوي على: patient_name, service, amount, date"
                    : "Upload a CSV file with columns: patient_name, service, amount, date"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {locale === "ar" ? "اختر ملف CSV" : "Choose CSV File"}
                </Button>
              </div>
              {csvStatus && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    csvStatus.type === "success"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {csvStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {csvStatus.msg}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={locale === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"}
          type="bar"
          data={monthlyData}
          dataKey="revenue"
          delay={0.3}
        />
        <ChartCard
          title={locale === "ar" ? "مقارنة سنوية" : "Yearly Comparison"}
          type="bar"
          data={yearlyData}
          dataKey="revenue"
          delay={0.4}
        />
      </div>

      {/* Payments Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">
              {locale === "ar" ? "سجل المدفوعات" : "Payment Records"}
            </CardTitle>
            {sortedPayments.length > 10 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowAllPayments(!showAllPayments)}>
                {showAllPayments
                  ? locale === "ar" ? "عرض أقل" : "Show Less"
                  : locale === "ar" ? "عرض الكل" : "Show All"}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {locale === "ar" ? "لا توجد مدفوعات بعد. ارفع ملف CSV للبدء." : "No payments yet. Upload a CSV file to get started."}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "ar" ? "المريض" : "Patient"}</TableHead>
                      <TableHead>{locale === "ar" ? "الخدمة" : "Service"}</TableHead>
                      <TableHead>{locale === "ar" ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead>{locale === "ar" ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.patientName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.service}</TableCell>
                        <TableCell>
                          <Badge variant="success" className="text-xs font-mono">
                            ${p.amount.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Waiting Room + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{t("waitingRoom")}</CardTitle>
            <Link href="/reception/waiting-room">
              <Button variant="ghost" size="sm" className="text-xs gap-1">{t("viewAll")} <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "John Smith", doctor: "Dr. Mitchell", time: "9:00 AM", waitTime: "5 min", status: "next" },
              { name: "Maria Garcia", doctor: "Dr. Chen", time: "9:30 AM", waitTime: "20 min", status: "waiting" },
              { name: "Ali Mohammed", doctor: "Dr. Hassan", time: "10:00 AM", waitTime: "35 min", status: "waiting" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${p.status === "next" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.doctor} - {p.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "next" ? "success" : "warning"} className="text-xs">{p.waitTime}</Badge>
                  <Button size="sm" variant="outline" className="text-xs h-7">{t("checkIn")}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("todayAppointments")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.slice(0, 4).map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{apt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{apt.doctorName} - {apt.time}</p>
                </div>
                <Badge
                  variant={
                    apt.status === "confirmed" ? "success"
                    : apt.status === "scheduled" ? "info"
                    : apt.status === "completed" ? "secondary"
                    : "warning"
                  }
                  className="text-xs"
                >
                  {apt.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
