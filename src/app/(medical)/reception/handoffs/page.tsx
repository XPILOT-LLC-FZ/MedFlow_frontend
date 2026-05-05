"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  ClipboardList, 
  Search, 
  FileText, 
  CheckCircle2, 
  Download, 
  RefreshCw,
  User,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { bookingService } from "@/services/bookingService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import type { ApiReceptionHandoff } from "@/types";
import { HandoffPdfModal } from "@/components/reception/HandoffPdfModal";
import { motion, AnimatePresence } from "framer-motion";

export default function ReceptionHandoffsPage() {
  const { t, isRTL, locale } = useTranslation();
  const toastSuccess = useToastStore((state) => state.success);
  const toastError = useToastStore((state) => state.error);

  const [handoffs, setHandoffs] = useState<ApiReceptionHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"NEW" | "REVIEWED" | "ALL">("NEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHandoff, setSelectedHandoff] = useState<ApiReceptionHandoff | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const fetchHandoffs = useCallback(async () => {
    try {
      const result = await bookingService.getReceptionHandoffs({ 
        status: activeTab === "ALL" ? undefined : activeTab as "NEW" | "REVIEWED",
        limit: 50 
      });
      setHandoffs(result);
    } catch (error) {
      console.error("Failed to fetch handoffs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchHandoffs();
    const interval = setInterval(fetchHandoffs, 30000); 
    return () => clearInterval(interval);
  }, [fetchHandoffs]);

  const handleMarkAsReviewed = async (handoffId: string) => {
    try {
      await bookingService.markReceptionHandoffReviewed(handoffId);
      toastSuccess(t("statusUpdatedSuccessfully"));
      void fetchHandoffs();
    } catch {
      toastError(t("error"));
    }
  };

  const openPdfPreview = (handoff: ApiReceptionHandoff) => {
    setSelectedHandoff(handoff);
    setIsPdfModalOpen(true);
  };

  const filteredHandoffs = handoffs.filter(h => 
    h.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.diagnosis || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(isRTL ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return isRTL ? "الآن" : "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return formatDate(dateStr);
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 max-w-7xl relative -m-4 md:-m-6">
      <PageHeader
        title={t("clinicalNotesAndDiagnosis") || (isRTL ? "الملاحظات السريرية والتشخيص" : "Clinical Notes & Diagnosis")}
        description={isRTL ? "إدارة الملاحظات السريرية والتشخيصات المحولة للاستقبال" : "Manage clinical notes and diagnoses sent to reception for processing"}
        action={
          <Button variant="outline" size="sm" onClick={() => { setIsLoading(true); void fetchHandoffs(); }} className={cn("gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {t("refresh") || (isRTL ? "تحديث" : "Refresh")}
          </Button>
        }
      />

      <div className={cn("flex flex-col md:flex-row gap-4 items-center justify-between", isRTL ? "md:flex-row-reverse" : "md:flex-row")}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full md:w-auto">
          <TabsList className={cn("grid grid-cols-3 w-full md:w-[400px] h-11 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl", isRTL ? "flex-row-reverse" : "flex-row")}>
            <TabsTrigger value="NEW" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
              {t("new") || (isRTL ? "جديد" : "New")}
              {handoffs.filter(h => h.status === "NEW").length > 0 && (
                <Badge className={cn("bg-blue-600 hover:bg-blue-600 px-1.5 h-4 min-w-[16px] text-[10px] font-bold", isRTL ? "mr-2" : "ml-2")}>
                  {handoffs.filter(h => h.status === "NEW").length.toLocaleString(isRTL ? "ar-EG" : "en-US")}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="REVIEWED" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
              {t("reviewed") || (isRTL ? "تمت المراجعة" : "Reviewed")}
            </TabsTrigger>
            <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
              {t("all")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400", isRTL ? "right-3" : "left-3")} />
          <Input 
            placeholder={isRTL ? "البحث عن مريض أو طبيب..." : "Search patient or doctor..."}
            className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl", isRTL ? "pr-9 text-right" : "pl-9 text-left")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading && handoffs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl border border-slate-100 bg-white animate-pulse" />
            ))}
          </div>
        ) : filteredHandoffs.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/50 rounded-3xl py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isRTL ? "لا توجد أوامر حالياً" : "No orders found"}
              </h3>
              <p className="text-slate-500 text-sm max-w-xs mt-1">
                {isRTL ? "سيظهر هنا أي تقارير أو ملاحظات يتم إرسالها من قبل الأطباء." : "Reports and notes sent by doctors will appear here for processing."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredHandoffs.map((handoff) => (
                <motion.div
                  key={handoff.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={cn("group border-none shadow-sm hover:shadow-md transition-all rounded-[24px] overflow-hidden", 
                    handoff.status === "NEW" ? "bg-white dark:bg-slate-950 ring-1 ring-blue-500/10" : "bg-slate-50/50 dark:bg-slate-900/50 grayscale-[0.5]"
                  )}>
                    <CardHeader className="pb-3">
                      <div className={cn("flex justify-between items-start mb-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <div className={cn("h-2 w-2 rounded-full", handoff.status === "NEW" ? "bg-blue-600 animate-pulse" : "bg-slate-400")} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {getTimeAgo(handoff.createdAt)}
                          </span>
                        </div>
                        <Badge variant={handoff.status === "NEW" ? "info" : "secondary"} className="text-[10px] font-bold rounded-lg border-none">
                          {handoff.status === "NEW" 
                            ? (isRTL ? "جديد" : "NEW") 
                            : (isRTL ? "تمت المراجعة" : "REVIEWED")}
                        </Badge>
                      </div>
                      <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                        <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className={cn("min-w-0", isRTL ? "text-right" : "text-left")}>
                          <CardTitle className="text-[16px] font-bold text-slate-900 dark:text-slate-100 truncate">
                            {handoff.patientName}
                          </CardTitle>
                          <CardDescription className={cn("text-[12px] font-medium flex items-center gap-1.5 truncate", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <Activity className="h-3 w-3" />
                            {isRTL ? "د." : "Dr."} {handoff.doctorName}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-slate-50/50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className={cn("flex items-center gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <FileText className="h-3 w-3 text-blue-600" />
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                            {isRTL ? "الملاحظات السريرية والتشخيص" : "CLINICAL NOTES & DIAGNOSIS"}
                          </span>
                        </div>
                        <div className={cn("text-[13px] font-medium text-slate-600 dark:text-slate-400 line-clamp-4", isRTL ? "text-right" : "text-left")}>
                          {handoff.diagnosis && (
                            <div className="mb-1 text-slate-900 dark:text-slate-200 font-bold">
                              {isRTL ? "التشخيص: " : "Diagnosis: "}{handoff.diagnosis}
                            </div>
                          )}
                          {handoff.notesSnapshot && (
                            <div className="mb-2">
                              {handoff.notesSnapshot}
                            </div>
                          )}
                          
                          <div className={cn("flex flex-wrap gap-2 mt-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                            {handoff.appointment?.prescriptions?.[0] && (
                              <Badge variant="outline" className="bg-green-50/50 text-green-600 border-green-100 text-[10px] py-0 h-5">
                                {isRTL ? "وصفة طبية" : "Prescription"}
                              </Badge>
                            )}
                            {handoff.appointment?.investigationOrders && handoff.appointment.investigationOrders.length > 0 && (
                              <Badge variant="outline" className="bg-orange-50/50 text-orange-600 border-orange-100 text-[10px] py-0 h-5">
                                {isRTL ? "فحوصات" : "Investigations"} ({handoff.appointment.investigationOrders.length.toLocaleString(isRTL ? "ar-EG" : "en-US")})
                              </Badge>
                            )}
                          </div>

                          {!handoff.notesSnapshot && !handoff.appointment?.prescriptions?.[0] && !handoff.appointment?.investigationOrders?.length && (
                             (isRTL ? "لا توجد ملاحظات إضافية" : "No additional notes provided")
                          )}
                        </div>
                      </div>

                      <div className={cn("flex gap-2 pt-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                        <Button 
                          className="flex-1 h-10 bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold gap-2 shadow-sm transition-all"
                          onClick={() => openPdfPreview(handoff)}
                        >
                          <Download className="h-4 w-4" />
                          {isRTL ? "عرض و تحميل" : "View & PDF"}
                        </Button>
                        
                        {handoff.status === "NEW" && (
                          <Button 
                            variant="outline" 
                            className="flex-1 h-10 border-slate-200 dark:border-slate-800 rounded-xl text-[12px] font-bold gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all"
                            onClick={() => handleMarkAsReviewed(handoff.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {isRTL ? "إنهاء المهمة" : "Done"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {selectedHandoff && (
        <HandoffPdfModal 
          handoff={selectedHandoff} 
          isOpen={isPdfModalOpen} 
          onClose={() => setIsPdfModalOpen(false)} 
        />
      )}
    </div>
  );
}
