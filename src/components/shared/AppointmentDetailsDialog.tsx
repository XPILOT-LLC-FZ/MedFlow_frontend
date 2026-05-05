"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock, ClipboardList, Pill, CheckCircle2, Award, FileText, Video } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { patientDocumentService } from "@/services/patientDocumentService";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import type { ApiAppointment, ApiPatientDocument } from "@/types";

const isClinicalPdfDocument = (
  document: ApiPatientDocument,
  appointmentId?: string,
) => {
  const normalizedName = document.name.toLowerCase();
  const isPdf =
    document.fileType === "application/pdf" || normalizedName.endsWith(".pdf");

  return Boolean(
    isPdf &&
    (!appointmentId || document.appointmentId === appointmentId) &&
    (normalizedName.includes("diagnostic") ||
      normalizedName.includes("clinical") ||
      normalizedName.includes("report")),
  );
};

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: ApiAppointment | null;
  onBookAgain?: () => void;
}

export function AppointmentDetailsDialog({
  isOpen,
  onOpenChange,
  appointment,
  onBookAgain,
}: AppointmentDetailsDialogProps) {
  const { t, locale, isRTL } = useTranslation();
  const [appointmentDocuments, setAppointmentDocuments] = useState<ApiPatientDocument[]>([]);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  useEffect(() => {
    if (!isOpen || !appointment) {
      setAppointmentDocuments([]);
      return;
    }

    let isCancelled = false;

    const loadDocuments = async () => {
      setIsLoadingDocument(true);
      try {
        const documents = await patientDocumentService.getCurrentPatientDocuments();
        if (!isCancelled) {
          setAppointmentDocuments(documents);
        }
      } catch {
        if (!isCancelled) {
          setAppointmentDocuments([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDocument(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      isCancelled = true;
    };
  }, [appointment, isOpen]);

  if (!appointment) return null;

  const consultationNotes = appointment.consultationSession?.notes;
  const prescriptions = appointment.prescriptions || [];
  const investigations = appointment.investigationOrders || [];
  const visitReason = appointment.notes || "Routine medical checkup";
  const clinicalReportDocument =
    appointmentDocuments.find((document) => isClinicalPdfDocument(document, appointment.id)) ||
    appointmentDocuments.find((document) => isClinicalPdfDocument(document));

  // Parse symptoms string into tags
  const symptomTags = visitReason
    ? visitReason.split(",").map((s) => s.trim()).filter(Boolean)
    : ["General symptoms", "Follow up checkup"];

  // Fallback branch / location name
  const locationName = (appointment as unknown as { doctor?: { branch?: { name?: string } } }).doctor?.branch?.name || "Mercy Heart Institute";

  const handlePrintPrescription = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const firstPrescription = prescriptions[0];
    const meds = firstPrescription?.medications || appointment.consultationSession?.medications || [];
    const docName = appointment.doctorName || (appointment.doctor as { fullName?: string })?.fullName || (locale === "ar" ? "طبيب متخصص" : "Specialist Doctor");
    const patName = appointment.patientName || "Patient";
    const dateStr = new Date(appointment.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "long" });

    const medsListHtml = meds.map((med: { name?: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }) => `
      <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <strong style="font-size: 16px; color: #0f172a;">${med.name || "Medication"}</strong>
          <span style="font-size: 12px; background-color: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${med.dosage || "As prescribed"}</span>
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          Freq: ${med.frequency || "Daily"} ${med.duration ? `• Dur: ${med.duration}` : ""}
        </div>
        ${med.instructions ? `<div style="font-size: 12px; color: #475569; font-style: italic; margin-top: 4px;">SIG: ${med.instructions}</div>` : ""}
      </div>
    `).join("");

    const html = `
      <html>
        <head>
          <title>Prescription - ${patName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              color: #111827;
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }
            .page { padding: 40px; max-width: 800px; margin: 0 auto; }
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
                <h2>${locale === "ar" ? "الروشتة الطبية" : "Medical Prescription"}</h2>
                <p>${dateStr}</p>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">${locale === "ar" ? "المريض" : "PATIENT"}</span>
                <span class="meta-value">${patName}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">${locale === "ar" ? "الطبيب المعالج" : "PHYSICIAN"}</span>
                <span class="meta-value">Dr. ${docName}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">Rx</span>
              </div>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 15px;">
                ${medsListHtml || `<p style="color: #64748b; font-style: italic;">${locale === "ar" ? "لا توجد أدوية مسجلة في هذا الموعد" : "No medications listed for this appointment."}</p>`}
              </div>
            </div>

            <div style="margin-top: 60px; display: flex; justify-content: flex-end;">
              <div style="text-align: center; width: 220px;">
                <div style="border-bottom: 1px solid #475569; height: 50px; margin-bottom: 8px;"></div>
                <span style="font-size: 11px; font-weight: 600; color: #475569;">Authorized Signature</span>
              </div>
            </div>

            <div class="footer">
              <span>MedFlow Medical Management System</span>
              <span>Official Patient Record</span>
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

  const handleOpenClinicalPdf = async () => {
    if (!clinicalReportDocument) {
      handlePrintPrescription();
      return;
    }

    try {
      const response = await patientDocumentService.getDocumentDownloadUrl(
        clinicalReportDocument.id,
      );

      if (!response.downloadUrl) {
        throw new Error("No download URL returned");
      }

      window.open(response.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      handlePrintPrescription();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-y-auto no-scrollbar border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[90vh] md:max-w-md md:rounded-[40px] md:my-6",
          "bg-[#f8fafd] dark:bg-slate-900"
        )}
      >
        {/* Top Navigation */}
        <div className="flex items-center px-6 pt-5 pb-1">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {isRTL ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </button>
          <DialogTitle className="flex-1 text-center text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {t("details") || "Details"}
          </DialogTitle>
          <div className="w-10" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-3">

          {/* Card 1: Details Appointment */}
          <div className="bg-white dark:bg-slate-800/40 rounded-xl p-4 space-y-3 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "تفاصيل الموعد" : "Details Appointment"}
            </h3>

            {/* Doctor Info */}
            <div className="bg-[#f8fafd] dark:bg-slate-800/40 rounded-xl p-3 flex items-center gap-3 border border-slate-100/40 dark:border-slate-800/40 shadow-sm">
              <div className="h-14 w-14 rounded-full overflow-hidden shrink-0">
                <Image
                  src={
                    appointment.doctor?.user?.avatarUrl ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${appointment.doctorId}`
                  }
                  alt={appointment.doctorName || "Doctor"}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover rounded-full"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-50 text-sm truncate">
                    Dr. {appointment.doctorName}
                  </h4>
                  <CheckCircle2 className="h-4 w-4 text-blue-500 fill-current" />
                </div>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  {appointment.serviceName || "Cardiologist"}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-[#f8fafd] dark:bg-slate-800/40 rounded-xl p-3 flex items-center gap-2 text-xs md:text-sm font-semibold border border-slate-100/40 dark:border-slate-800/40">
              <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "الموقع:" : "Location:"}{" "}
                <span className="text-blue-500 font-bold">{locationName}</span>
              </span>
            </div>

            {/* Appointment Mode */}
            <div className="bg-[#f8fafd] dark:bg-slate-800/40 rounded-xl p-3 flex items-center gap-2 text-xs md:text-sm font-semibold border border-slate-100/40 dark:border-slate-800/40">
              {appointment.mode === "ONLINE" ? (
                <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
              <span className="text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "نوع الموعد:" : "Appointment Type:"}{" "}
                <span className="text-blue-500 font-bold">
                  {appointment.mode === "ONLINE"
                    ? (locale === "ar" ? "أونلاين" : "Online")
                    : (locale === "ar" ? "في العيادة" : "On-Clinic")}
                </span>
              </span>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f8fafd] dark:bg-slate-800/40 border border-slate-100/40 dark:border-slate-800/40 rounded-xl p-3.5 space-y-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-0.5 leading-snug">
                  {appointment.date}
                </p>
                <p className="text-[10px] font-medium text-blue-400">
                  {locale === "ar" ? "تاريخ الموعد" : "Appointments Date"}
                </p>
              </div>
              <div className="bg-[#f8fafd] dark:bg-slate-800/40 border border-slate-100/40 dark:border-slate-800/40 rounded-xl p-3.5 space-y-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-0.5 leading-snug flex items-center gap-1" dir="ltr">
                  <span>{appointment.startTime}</span>
                  <span>-</span>
                  <span>{appointment.endTime || "30 min"}</span>
                </p>
                <p className="text-[10px] font-medium text-blue-400">
                  {locale === "ar" ? "وقت الموعد" : "Appointments Time"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Visit Reason */}
          <div className="bg-white dark:bg-slate-800/40 rounded-xl p-4 space-y-3 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "سبب الزيارة" : "Visit Reason"}
            </h3>

            {/* Symptoms */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {locale === "ar" ? "الأعراض" : "Symptoms"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {symptomTags.map((symptom, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-100/80 dark:border-slate-800/80 rounded-full px-3 py-1 text-xs text-slate-600 dark:text-slate-300"
                  >
                    {symptom}
                  </div>
                ))}
              </div>
            </div>

            {/* Anamnesis */}
            {consultationNotes && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {locale === "ar" ? "السوابق المرضية" : "Anamnesis"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
                  {consultationNotes}
                </p>
              </div>
            )}

            {/* Clinical PDF */}
            {(() => {
              const firstPrescription = prescriptions[0];
              const meds = firstPrescription?.medications || appointment.consultationSession?.medications || [];
              const hasPrescription = Boolean(clinicalReportDocument) || meds.length > 0;
              return (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {locale === "ar" ? "الملف السريري PDF" : "Clinical PDF"}
                      </span>
                    </div>
                    {hasPrescription ? (
                      <Button
                        variant="link"
                        onClick={() => void handleOpenClinicalPdf()}
                        className="p-0 h-auto text-blue-500 hover:text-blue-600 font-bold text-xs"
                        disabled={isLoadingDocument}
                      >
                        {locale === "ar" ? "عرض / تحميل" : "View / Download"}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium cursor-not-allowed">
                        {locale === "ar" ? "غير متوفر" : "Not available"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
                    {clinicalReportDocument
                      ? (locale === "ar"
                        ? "الملف السريري المعتمد من الطبيب متاح للمشاهدة أو التحميل"
                        : "The signed clinical PDF is available for viewing/downloading")
                      : hasPrescription
                        ? (locale === "ar"
                          ? "لا توجد نسخة PDF محفوظة بعد، وسيتم عرض النسخة المطبوعة كبديل"
                          : "No saved PDF is available yet, so the printed preview will be used")
                        : (locale === "ar"
                          ? "لا يوجد ملف سريري متاح لهذا الموعد بعد"
                          : "No clinical PDF is available for this session yet.")}
                  </p>
                </div>
              );
            })()}
            {/* Created by info (after Visit Reason) */}
            {appointment.createdByName || appointment.createdByRole ? (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{locale === "ar" ? "تم الحجز بواسطة" : "Booked by"}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {appointment.createdByRole === "PATIENT" && useAuthStore.getState().user?.id === appointment.patientId
                      ? (locale === "ar" ? "أنت" : "You")
                      : (appointment.createdByName || appointment.createdByRole)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Card 3: Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="bg-white dark:bg-slate-800/40 rounded-3xl p-5 space-y-4 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {locale === "ar" ? "الأدوية الموصوفة" : "Prescriptions"}
              </h3>

              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="space-y-2">
                    {prescription.medications && prescription.medications.length > 0 ? (
                      prescription.medications.map((med, idx) => (
                        <div
                          key={`${prescription.id}-med-${idx}`}
                          className="p-4 bg-[#f8fafd] dark:bg-blue-900/20 rounded-2xl border border-slate-100/40 dark:border-slate-800/50 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                              {med.name || "Medication"}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-400 leading-normal">
                            {med.dosage || "As prescribed"} • {med.frequency || "As needed"}
                          </p>
                          <div className="flex gap-2 flex-wrap pt-1">
                            {med.duration && (
                              <span className="bg-slate-50/80 dark:bg-slate-800/80 rounded-full px-2.5 py-1 text-xs text-slate-400 border border-slate-100/80 dark:border-slate-800/80">
                                {med.duration}
                              </span>
                            )}
                            <span className="bg-slate-50/80 dark:bg-slate-800/80 rounded-full px-2.5 py-1 text-xs text-slate-400 border border-slate-100/80 dark:border-slate-800/80">
                              {med.frequency || "daily"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {locale === "ar" ? "لا توجد أدوية" : "No medications"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 4: Investigations */}
          {investigations.length > 0 && (
            <div className="bg-white dark:bg-slate-800/40 rounded-3xl p-5 space-y-4 border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {locale === "ar" ? "الاختبارات" : "Lab Tests"}
              </h3>
              <div className="space-y-3">
                {investigations.map((investigation) => (
                  <div
                    key={investigation.id}
                    className="p-4 bg-[#f8fafd] dark:bg-slate-800/40 rounded-2xl border border-slate-100/40 dark:border-slate-800/50 space-y-1"
                  >
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      {investigation.testName || "Test"}
                    </p>
                    {investigation.category && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === "ar" ? "فئة" : "Category"}: {investigation.category}
                      </p>
                    )}
                    {investigation.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal pt-1">
                        {investigation.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100/50 dark:border-slate-800/60 pt-4 space-y-2 text-xs font-bold">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>{locale === "ar" ? "المبلغ الإجمالي" : "Total Amount"}</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {appointment.amount} L.E
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 pt-2 shrink-0 border-t border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 mt-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-600 dark:text-slate-300"
            onClick={() => onOpenChange(false)}
          >
            {locale === "ar" ? "إغلاق" : "Close"}
          </Button>
          {onBookAgain && (
            <Button
              className="flex-1 h-12 rounded-2xl bg-[#2b66ff] hover:bg-[#1c54e0] text-white font-bold transition-colors"
              onClick={() => {
                onOpenChange(false);
                onBookAgain();
              }}
            >
              {locale === "ar" ? "حجز مجددًا" : "Book Again"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
