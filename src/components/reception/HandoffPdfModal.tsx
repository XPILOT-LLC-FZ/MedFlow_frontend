"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, User, Calendar, Activity, FileText } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { ApiReceptionHandoff, PrescriptionMedicationItem } from "@/types";

interface HandoffPdfModalProps {
  handoff: ApiReceptionHandoff;
  isOpen: boolean;
  onClose: () => void;
}

export function HandoffPdfModal({ handoff, isOpen, onClose }: HandoffPdfModalProps) {
  const { locale } = useTranslation();

  const handlePrint = () => {
    const printContent = document.getElementById("printable-handoff-report");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Clinical Report - ${handoff.patientName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              color: #111827;
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }
            .page { padding: 40px; }
            .header { 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .logo-area h1 { margin: 0; color: #2563eb; font-size: 24px; font-weight: 800; }
            .logo-area p { margin: 4px 0 0; color: #6b7280; font-size: 12px; }
            .report-title { text-align: right; }
            .report-title h2 { margin: 0; font-size: 18px; font-weight: 700; color: #111827; }
            .report-title p { margin: 4px 0 0; color: #6b7280; font-size: 12px; }
            
            .meta-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 30px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 12px;
            }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
            .meta-value { font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 4px; }
            
            .section { margin-bottom: 30px; }
            .section-header { 
              display: flex; 
              align-items: center; 
              gap: 8px; 
              margin-bottom: 12px;
              border-left: 4px solid #2563eb;
              padding-left: 12px;
            }
            .section-title { font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.025em; }
            .section-body { 
              font-size: 14px; 
              color: #334155; 
              background: #ffffff; 
              padding: 0 16px;
              white-space: pre-wrap;
            }
            
            .footer { 
              margin-top: 50px; 
              padding-top: 20px; 
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #94a3b8;
            }
            
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
              .page { padding: 20px; }
            }
          </style>
        </head>
        <body dir="${locale === "ar" ? "rtl" : "ltr"}">
          <div class="page">
            <div class="header">
              <div class="logo-area">
                <h1>MedFlow</h1>
                <p>Clinical Intelligence Platform</p>
              </div>
              <div class="report-title">
                <h2>${locale === "ar" ? "الملاحظات السريرية والتشخيص" : "Clinical Notes & Diagnosis"}</h2>
                <p>${new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "long" })}</p>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">${locale === "ar" ? "المريض" : "PATIENT"}</span>
                <span class="meta-value">${handoff.patientName}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">${locale === "ar" ? "الطبيب المعالج" : "TREATING DOCTOR"}</span>
                <span class="meta-value">Dr. ${handoff.doctorName}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">${locale === "ar" ? "تاريخ الإصدار" : "ISSUE DATE"}</span>
                <span class="meta-value">${new Date(handoff.createdAt).toLocaleString()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">${locale === "ar" ? "رقم المرجع" : "REFERENCE NO."}</span>
                <span class="meta-value">HD-${handoff.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">${locale === "ar" ? "الملاحظات السريرية والتشخيص" : "CLINICAL NOTES & DIAGNOSIS"}</span>
              </div>
              <div class="section-body">
                ${handoff.diagnosis ? `<strong>${locale === "ar" ? "التشخيص: " : "Diagnosis: "}</strong>${handoff.diagnosis}<br><br>` : ""}
                
                ${handoff.notesSnapshot ? `<div style="margin-bottom: 20px;">${handoff.notesSnapshot}</div>` : ""}

                ${handoff.appointment?.prescriptions?.[0] ? `
                  <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0;">${locale === "ar" ? "الأدوية الموصوفة:" : "Prescribed Medications:"}</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                      ${Array.isArray(handoff.appointment.prescriptions[0].medications) 
                        ? (handoff.appointment.prescriptions[0].medications as PrescriptionMedicationItem[]).map(med => `
                          <li>${med?.name || "N/A"}: ${med?.dosage || ""} (${med?.frequency || ""}) [${med?.duration || ""}]</li>
                        `).join("")
                        : `<li>${locale === "ar" ? "لا توجد أدوية محددة" : "No medications listed"}</li>`
                      }
                    </ul>
                  </div>
                ` : ""}

                ${handoff.appointment?.investigationOrders && handoff.appointment.investigationOrders.length > 0 ? `
                  <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0;">${locale === "ar" ? "الفحوصات المطلوبة:" : "Requested Investigations:"}</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                      ${handoff.appointment.investigationOrders.map(inv => `
                        <li>${inv.testName} (${inv.category})</li>
                      `).join("")}
                    </ul>
                  </div>
                ` : ""}
              </div>
            </div>

            <div style="margin-top: 80px; display: flex; justify-content: flex-end;">
              <div style="text-align: center; width: 200px;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px;"></div>
                <span style="font-size: 12px; font-weight: 600;">Doctor's Signature</span>
              </div>
            </div>

            <div class="footer">
              <span>MedFlow Medical Management System</span>
              <span>Generated by Reception Staff</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[28px] border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {locale === "ar" ? "معاينة الملاحظات السريرية والتشخيص" : "Clinical Notes & Diagnosis Preview"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Modal Preview Version */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {locale === "ar" ? "المريض" : "Patient"}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{handoff.patientName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {locale === "ar" ? "الطبيب" : "Doctor"}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Dr. {handoff.doctorName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {locale === "ar" ? "التاريخ" : "Date"}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date(handoff.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{locale === "ar" ? "الملاحظات السريرية والتشخيص" : "Clinical Notes & Diagnosis"}</span>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm leading-relaxed text-slate-600 dark:text-slate-400 min-h-[100px] whitespace-pre-wrap">
                {handoff.diagnosis && (
                  <div className="mb-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {locale === "ar" ? "التشخيص: " : "Diagnosis: "}
                    </span>
                    {handoff.diagnosis}
                  </div>
                )}
                
                {/* Clinical Notes */}
                {handoff.notesSnapshot && (
                  <div className="mb-4">
                    {handoff.notesSnapshot}
                  </div>
                )}

                {/* Actual Saved Data (if available) */}
                {handoff.appointment?.prescriptions?.[0] && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {locale === "ar" ? "الأدوية الموصوفة:" : "Prescribed Medications:"}
                    </h5>
                    {Array.isArray(handoff.appointment.prescriptions[0].medications) && 
                      (handoff.appointment.prescriptions[0].medications as PrescriptionMedicationItem[]).map((med, i) => (
                      <div key={i} className="text-xs mb-1">
                        - {med.name}: {med.dosage} ({med.frequency}) [{med.duration}]
                      </div>
                    ))}
                  </div>
                )}

                {handoff.appointment?.investigationOrders && handoff.appointment.investigationOrders.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {locale === "ar" ? "الفحوصات المطلوبة:" : "Requested Investigations:"}
                    </h5>
                    {handoff.appointment.investigationOrders.map((inv, i) => (
                      <div key={i} className="text-xs mb-1">
                        - {inv.testName} ({inv.category})
                      </div>
                    ))}
                  </div>
                )}

                {!handoff.notesSnapshot && !handoff.appointment?.prescriptions?.[0] && !handoff.appointment?.investigationOrders?.length && (
                   <div className="text-slate-400 italic">
                     {locale === "ar" ? "لا توجد تفاصيل إضافية" : "No additional details available."}
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <div className="flex w-full gap-3 justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl font-bold h-11 px-6">
              {locale === "ar" ? "إلغاء" : "Close"}
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-11 px-6 gap-2">
              <Printer className="h-4 w-4" />
              {locale === "ar" ? "طباعة / PDF" : "Print / PDF"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
