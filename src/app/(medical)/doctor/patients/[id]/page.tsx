"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  HeartPulse,
  Plus,
  Send,
  UserRound,
  X,
  Mic,
  LinkIcon,
  RefreshCw,
  Check,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { patientService } from "@/services/patientService";
import { bookingService } from "@/services/bookingService";
import { labResultService } from "@/services/labResultService";
import { prescriptionService } from "@/services/prescriptionService";
import { investigationService } from "@/services/investigationService";
import { patientDocumentService } from "@/services/patientDocumentService";
import { patientReportService } from "@/services/patientReportService";
import { whatsAppService } from "@/services/whatsAppService";
import { staffService } from "@/services/staffService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import type {
  ApiAppointment,
  ApiInvestigation,
  ApiLabResult,
  ApiPatient,
  ApiPatientDocument,
  ApiPrescription,
  PrescriptionMedicationItem,
} from "@/types";

const formatDate = (date?: string, locale = "en") => {
  if (!date) return "-";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "-";
  return value.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getAge = (dateOfBirth?: string) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const investigationCatalog = [
  "Complete Blood Count (CBC)",
  "Lipid Panel",
  "HbA1c",
  "Kidney Function Test",
  "Liver Function Test",
  "Thyroid Panel",
  "Chest X-Ray",
  "ECG",
  "Echo Cardiography",
  "Abdominal Ultrasound",
  "CT Scan",
  "MRI",
];

const deriveChronicConditions = (patient: ApiPatient) => {
  const conditions: Set<string> = new Set();
  
  // Directly pull structured data (populated by backend from onboarding)
  const history = patient.medicalHistory as Record<string, unknown> | undefined;
  
  if (Array.isArray(history?.chronicDiseases)) {
    (history?.chronicDiseases as unknown[]).forEach(item => conditions.add(String(item)));
  } else if (typeof history?.chronicDiseases === 'string') {
    history.chronicDiseases.split(',').forEach(item => {
      const trimmed = item.trim();
      if (trimmed) conditions.add(trimmed);
    });
  }

  // Fallback heuristics for older records without structured onboarding data
  if (conditions.size === 0) {
    const text = `${patient.notes || ""} ${JSON.stringify(patient.medicalHistory || {})}`.toLowerCase();
    if (text.includes("hypertension") || text.includes("ضغط")) conditions.add("Hypertension");
    if (text.includes("diabetes") || text.includes("سكري")) conditions.add("Diabetes");
    if (text.includes("asthma") || text.includes("ربو")) conditions.add("Asthma");
  }

  return Array.from(conditions).slice(0, 3);
};

export default function DoctorPatientDetailsPage() {
  const { locale } = useTranslation();
  const toastSuccess = useToastStore((state) => state.success);
  const toastError = useToastStore((state) => state.error);
  const toastInfo = useToastStore((state) => state.info);
  const params = useParams<{ id: string }>();
  const patientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [labResults, setLabResults] = useState<ApiLabResult[]>([]);
  const [prescriptions, setPrescriptions] = useState<ApiPrescription[]>([]);
  const [investigations, setInvestigations] = useState<ApiInvestigation[]>([]);
  const [documents, setDocuments] = useState<ApiPatientDocument[]>([]);

  const [activeTab, setActiveTab] = useState("history");
  const [notesDraft, setNotesDraft] = useState("");

  const [diagnosisDraft, setDiagnosisDraft] = useState("");
  const [prescriptionNotesDraft, setPrescriptionNotesDraft] = useState("");
  const [medications, setMedications] = useState<PrescriptionMedicationItem[]>([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [selectedInvestigations, setSelectedInvestigations] = useState<Record<string, boolean>>({});
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [isSendingDiagnosticReport, setIsSendingDiagnosticReport] = useState(false);
  const [previewFile, setPreviewFile] = useState<ApiPatientDocument | null>(
    null,
  );

  const [lastPrescriptionId, setLastPrescriptionId] = useState<string | null>(null);

  const [favoriteMedications, setFavoriteMedications] = useState<PrescriptionMedicationItem[]>([]);

  const previewDocument = async (document: ApiPatientDocument) => {
    if (!patientId) {
      return;
    }

    try {
      const result = await patientDocumentService.getDocumentDownloadUrlForPatient(
        patientId,
        document.id,
      );
      setPreviewFile({ ...document, fileUrl: result.downloadUrl });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر تحميل الملف"
            : "Failed to load file";
      toastError(message);
    }
  };

  useEffect(() => {
    if (!patientId) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [
          patientResult,
          appointmentResult,
          labResult,
          prescriptionResult,
          investigationResult,
          documentResult,
          doctorProfileResult,
        ] = await Promise.allSettled([
          patientService.getById(patientId),
          bookingService.getAll({ patientId }),
          labResultService.getAll({ patientId }),
          prescriptionService.getAll({ patientId }),
          investigationService.getAll({ patientId }),
          patientDocumentService.getAll(patientId),
          staffService.getMyDoctorProfile(),
        ] as const);

        if (patientResult.status !== "fulfilled") {
          throw patientResult.reason;
        }

        if (isCancelled) {
          return;
        }

        const appointmentData =
          appointmentResult.status === "fulfilled" && Array.isArray(appointmentResult.value)
            ? appointmentResult.value
            : [];
        const labData =
          labResult.status === "fulfilled" && Array.isArray(labResult.value)
            ? labResult.value
            : [];
        const prescriptionData =
          prescriptionResult.status === "fulfilled" && Array.isArray(prescriptionResult.value)
            ? prescriptionResult.value
            : [];
        const investigationData =
          investigationResult.status === "fulfilled" && Array.isArray(investigationResult.value)
            ? investigationResult.value
            : [];
        const documentData =
          documentResult.status === "fulfilled" && Array.isArray(documentResult.value)
            ? documentResult.value
            : [];

        const hasPartialFailure =
          appointmentResult.status === "rejected" ||
          labResult.status === "rejected" ||
          prescriptionResult.status === "rejected" ||
          investigationResult.status === "rejected" ||
          documentResult.status === "rejected";

        if (hasPartialFailure) {
          toastInfo(
            locale === "ar"
              ? "بعض البيانات السريرية غير متاحة حالياً"
              : "Some clinical data is temporarily unavailable",
          );
        }

        const sortedAppointments = [...appointmentData].sort((a, b) => {
          const aDate = new Date(`${a.date}T${a.startTime || "00:00"}:00`).getTime();
          const bDate = new Date(`${b.date}T${b.startTime || "00:00"}:00`).getTime();
          return bDate - aDate;
        });

        setPatient(patientResult.value);
        setAppointments(sortedAppointments);
        setLabResults(labData);
        setPrescriptions(prescriptionData);
        setInvestigations(investigationData);
        setDocuments(documentData);

        const recentNotes = sortedAppointments[0]?.consultationSession?.notes || "";
        setNotesDraft(recentNotes);

        const latestPrescription = prescriptionData[0];
        if (latestPrescription) {
          setLastPrescriptionId(latestPrescription.id);
          setDiagnosisDraft(latestPrescription.diagnosis || "");
          setPrescriptionNotesDraft(latestPrescription.notes || "");
          setMedications(
            Array.isArray(latestPrescription.medications) && latestPrescription.medications.length > 0
              ? latestPrescription.medications
              : [{ name: "", dosage: "", frequency: "", duration: "" }],
          );
        }

        const existingInvestigations: Record<string, boolean> = {};
        investigationData.forEach((item) => {
          existingInvestigations[item.testName] = true;
        });
        setSelectedInvestigations(existingInvestigations);

        // Load doctor's prescription preferences
        if (doctorProfileResult.status === "fulfilled") {
          const doctorData = doctorProfileResult.value;
          const prefs = doctorData.preferences as { 
            prescriptionSettings?: { 
              favoriteMedications?: PrescriptionMedicationItem[] 
            } 
          } | null;
          
          if (prefs?.prescriptionSettings?.favoriteMedications?.length) {
            setFavoriteMedications(prefs.prescriptionSettings.favoriteMedications);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : locale === "ar"
              ? "تعذر تحميل تفاصيل المريض"
              : "Failed to load patient details";
        toastError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAll();

    return () => {
      isCancelled = true;
    };
  }, [locale, patientId, toastError, toastInfo]);

  const savePrescriptionAndInvestigations = async () => {
    if (!patientId || !patient) return;

    const latestAppointmentId = appointments[0]?.id;

    const normalizedMeds = medications
      .map((item) => ({
        name: item.name.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        duration: item.duration?.trim() || undefined,
        instructions: item.instructions?.trim() || undefined,
      }))
      .filter((item) => item.name && item.dosage && item.frequency);

    if (normalizedMeds.length === 0) {
      toastError(
        locale === "ar"
          ? "أضف دواء واحد على الأقل"
          : "Please add at least one medication",
      );
      return;
    }

    setIsSavingPrescription(true);
    try {
      if (lastPrescriptionId) {
        await prescriptionService.update(lastPrescriptionId, {
          diagnosis: diagnosisDraft || null,
          notes: prescriptionNotesDraft || null,
          medications: normalizedMeds,
          status: "ISSUED",
          issuedAt: new Date().toISOString(),
        });
      } else {
        const created = await prescriptionService.create({
          patientId,
          diagnosis: diagnosisDraft || null,
          notes: prescriptionNotesDraft || null,
          medications: normalizedMeds,
          status: "ISSUED",
          issuedAt: new Date().toISOString(),
        });
        setLastPrescriptionId(created.id);
      }

      const existingNames = new Set(investigations.map((item) => item.testName));
      const selectedNames = Object.entries(selectedInvestigations)
        .filter(([, value]) => Boolean(value))
        .map(([name]) => name);

      for (const testName of selectedNames) {
        if (existingNames.has(testName)) continue;
        await investigationService.create({
          patientId,
          category: testName.toLowerCase().includes("x-ray") || testName.toLowerCase().includes("ct") || testName.toLowerCase().includes("mri")
            ? "IMAGING"
            : "LAB",
          testName,
          status: "ORDERED",
          priority: "NORMAL",
        });
      }

      const [nextPrescriptions, nextInvestigations] = await Promise.all([
        prescriptionService.getAll({ patientId }),
        investigationService.getAll({ patientId }),
      ]);
      setPrescriptions(nextPrescriptions);
      setInvestigations(nextInvestigations);

      let handoffCreated = false;
      if (latestAppointmentId) {
        try {
          await bookingService.createReceptionHandoff(latestAppointmentId, {
            diagnosis: diagnosisDraft.trim() || undefined,
            notesSnapshot:
              prescriptionNotesDraft.trim() || notesDraft.trim() || undefined,
          });
          handoffCreated = true;
        } catch (handoffError) {
          toastInfo(
            handoffError instanceof Error
              ? handoffError.message
              : locale === "ar"
                ? "تم حفظ البيانات لكن تعذر إرسال المهمة للاستقبال"
                : "Saved, but failed to notify reception",
          );
        }
      }

      toastSuccess(
        handoffCreated
          ? locale === "ar"
            ? "تم حفظ الوصفة وإرسال المهمة للاستقبال"
            : "Consultation saved and sent to reception"
          : locale === "ar"
            ? "تم حفظ الوصفة والتحويلات"
            : "Prescription and investigations saved",
      );
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Failed to save prescription");
    } finally {
      setIsSavingPrescription(false);
    }
  };

  const sendWhatsAppToPatient = async () => {
    if (!patient?.phone) {
      toastError(locale === "ar" ? "رقم هاتف المريض غير متوفر" : "Patient phone is missing");
      return;
    }

    const normalizedPhone = patient.phone.replace(/\s+/g, "");
    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
      toastError(
        locale === "ar"
          ? "رقم هاتف المريض غير صالح. استخدم صيغة دولية مثل +201234567890"
          : "Patient phone is invalid. Use international format like +201234567890",
      );
      return;
    }

    try {
      const result = await whatsAppService.send({
        to: normalizedPhone,
        patientId: patient.id,
        message:
          locale === "ar"
            ? `مرحباً ${patient.fullName}، تم تحديث وصفتك الطبية في MedFlow.`
            : `Hello ${patient.fullName}, your clinical prescription has been updated in MedFlow.`,
      });

      if (result.sent) {
        toastSuccess(locale === "ar" ? "تم إرسال الرسالة عبر واتساب" : "WhatsApp message sent");
      } else {
        toastInfo(result.reason || "WhatsApp is disabled");
      }
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Failed to send WhatsApp message");
    }
  };

  const sendDiagnosticReportToPatient = async () => {
    if (!patientId || !patient) return;

    const findings = prescriptionNotesDraft.trim() || notesDraft.trim();
    const impression = diagnosisDraft.trim() || findings;
    const studyReason = notesDraft.trim() || diagnosisDraft.trim();

    if (!findings || !impression || !studyReason) {
      toastError(
        locale === "ar"
          ? "أضف بيانات سريرية كافية قبل إنشاء التقرير"
          : "Please add enough clinical data before generating the report",
      );
      return;
    }

    const selectedTests = Object.entries(selectedInvestigations)
      .filter(([, value]) => Boolean(value))
      .map(([name]) => name);

    const serviceRequested =
      selectedTests.length > 0
        ? selectedTests.join(", ")
        : locale === "ar"
          ? "تقرير تشخيصي سريري"
          : "Clinical Diagnostic Report";

    setIsSendingDiagnosticReport(true);
    try {
      const result = await patientReportService.generateAndSendDiagnosticReport(patientId, {
        specialty: "Diagnostic Imaging",
        serviceRequested,
        studyReason,
        findings,
        impression,
        advisedClinicalCorrelation: true,
        patientNumber: `PAT-${patient.id.slice(0, 8).toUpperCase()}`,
        whatsappCaption:
          locale === "ar"
            ? `مرحباً ${patient.fullName}، التقرير التشخيصي جاهز وتمت مشاركته بصيغة PDF.`
            : `Hello ${patient.fullName}, your diagnostic report is ready and shared as a signed PDF.`,
      });

      const nextDocuments = await patientDocumentService.getAll(patientId);
      setDocuments(nextDocuments);

      if (result.whatsapp.sent) {
        if (result.mediaAttached) {
          toastSuccess(
            locale === "ar"
              ? "تم إنشاء التقرير وإرساله كمرفق عبر واتساب"
              : "Diagnostic report generated and sent as WhatsApp attachment",
          );
        } else {
          toastInfo(
            result.mediaFallbackReason ||
              (locale === "ar"
                ? "تم إنشاء التقرير وإرسال رابط التنزيل عبر واتساب"
                : "Report generated and a download link was sent via WhatsApp"),
          );
        }
      } else {
        toastInfo(
          result.whatsapp.reason ||
            (locale === "ar"
              ? "تم إنشاء التقرير لكن لم يتم الإرسال عبر واتساب"
              : "Report generated but WhatsApp delivery was not completed"),
        );
      }
    } catch (error) {
      toastError(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "فشل إنشاء أو إرسال التقرير"
            : "Failed to generate or send report",
      );
    } finally {
      setIsSendingDiagnosticReport(false);
    }
  };

  if (!patientId) {
    return (
      <div className="max-w-4xl space-y-4">
        <p className="text-sm text-muted-foreground">
          {locale === "ar" ? "معرف المريض غير صالح" : "Invalid patient id"}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-14 rounded-xl border bg-muted/30" />
        <div className="h-52 rounded-xl border bg-muted/30" />
        <div className="h-72 rounded-xl border bg-muted/30" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Link href="/doctor/patients">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {locale === "ar" ? "العودة إلى المرضى" : "Back to Patients"}
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {locale === "ar"
              ? "لا يمكن تحميل بيانات هذا المريض"
              : "Unable to load this patient data"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const age = getAge(patient.dateOfBirth);
  const chronicConditions = deriveChronicConditions(patient);
  const allergies = Array.isArray(patient.allergies) ? patient.allergies : [];
  const latestVisit = appointments[0];
  const documentLookup = new Map(
    documents.map((document) => [document.id, document] as const),
  );
  const patientUploadedDocuments = [...documents]
    .filter((document) => {
      // Include if explicitly marked as patient uploaded OR if uploader matches patient user ID
      const isExplicitlyPatient = document.uploadedByPatient === true;
      const matchesPatientId = patient.user?.id && document.uploadedBy === patient.user.id;
      return isExplicitlyPatient || matchesPatientId;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/doctor/patients">
          <Button variant="ghost" className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 p-0 hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-[15px] font-medium text-slate-500 dark:text-slate-400">
          <span className="hover:text-slate-900 transition-colors">{locale === "ar" ? "المرضى" : "Patients"}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">{patient.fullName}</span>
        </div>
      </div>

      <Card className="border-none shadow-none overflow-hidden rounded-[24px] bg-white dark:bg-slate-950">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Profile Panel */}
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-[4px] border-white dark:border-slate-900 shadow-sm">
                <UserRound className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {patient.fullName}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    {age !== null ? `${age} ${locale === "ar" ? "سنة" : "y/o"}` : locale === "ar" ? "العمر غير متاح" : "Age N/A"}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <Badge className="bg-[#EBF5FF] dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-none px-2 py-0.5 text-[11px] font-bold rounded-md">
                    {patient.bloodType || "A+"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Allergies Panel */}
            <div className="lg:col-span-4 rounded-2xl bg-[#FFF5F5] dark:bg-rose-950/20 border border-[#FFEAEA] dark:border-rose-900/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-[#FF5A5A]" />
                <span className="text-[12px] font-black text-[#FF5A5A] uppercase tracking-wider">
                  {locale === "ar" ? "الحساسية" : "ALLERGIES"}
                </span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {allergies.length === 0 ? (
                  <li className="text-[12px] font-medium text-[#FF5A5A]/70">
                    {locale === "ar" ? "لا توجد" : "None"}
                  </li>
                ) : (
                  allergies.map((item) => (
                    <li key={item} className="px-2 py-0.5 rounded-md bg-white/50 border border-[#FFEAEA] text-[12px] font-bold text-[#FF5A5A]">
                      {item}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Chronic Conditions Panel */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <HeartPulse className="h-4 w-4 text-blue-500" />
                <span className="text-[12px] font-black text-slate-900 dark:text-slate-100">
                  {locale === "ar" ? "الأمراض المزمنة" : "Conditions"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {chronicConditions.length === 0 ? (
                  <p className="text-[12px] font-medium text-slate-400">
                    {locale === "ar" ? "لا يوجد" : "None"}
                  </p>
                ) : (
                  chronicConditions.map((condition) => (
                    <div key={condition} className="rounded-lg bg-[#FFF9F0] dark:bg-amber-950/20 border border-[#FFF0D8] dark:border-amber-900/40 px-3 py-1 text-[12px] font-bold text-[#D97706]">
                      {condition}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="mt-6 rounded-[20px] bg-[#F4F9FF] dark:bg-blue-950/20 p-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-xl bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-0.5 shadow-sm shadow-blue-500/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{locale === "ar" ? "معرف المريض" : "ID"}</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-slate-100">PAT-{patient.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-0.5 shadow-sm shadow-blue-500/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{locale === "ar" ? "الهاتف" : "Phone"}</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-slate-100">{patient.phone || "-"}</span>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-0.5 shadow-sm shadow-blue-500/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{locale === "ar" ? "آخر زيارة" : "Last Visit"}</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-slate-100">{formatDate(latestVisit?.date, locale)}</span>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-0.5 shadow-sm shadow-blue-500/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{locale === "ar" ? "الموقع" : "Location"}</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-slate-100 truncate">{patient.address || "Hadeka, Giza"}</span>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-0.5 shadow-sm shadow-blue-500/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{locale === "ar" ? "الزيارات" : "Visits"}</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-slate-100">{patient.totalVisits || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex items-center justify-start gap-4 w-full bg-slate-50/50 dark:bg-slate-900/50 p-1.5 h-auto border-none rounded-[18px] mb-8">
          {["history", "labs", "clinical"].map((tab) => (
            <TabsTrigger 
              key={tab}
              value={tab} 
              className="px-6 py-2.5 rounded-xl bg-transparent data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 text-[13px] font-bold text-slate-600 dark:text-slate-400 transition-all duration-300 border-none"
            >
              {tab === "history" && (locale === "ar" ? "سجل الزيارات" : "Visit history")}
              {tab === "labs" && (locale === "ar" ? "نتائج التحاليل" : "Lab results")}
              {tab === "clinical" && (locale === "ar" ? "الاستشارة الطبية" : "Clinical & Prescription")}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="history" className="mt-0">
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <Card className="border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
                <CardContent className="py-10 text-center">
                  <p className="text-slate-500 text-[13px] font-medium">
                    {locale === "ar" ? "لا توجد زيارات" : "No recorded visits"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((visit) => (
                  <article key={visit.id} className="relative rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 transition-all hover:border-blue-200 group">
                    {/* Status Dot */}
                    <div className="absolute left-6 top-7 h-2.5 w-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                    
                    <div className="pl-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="space-y-1">
                          <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                            {visit.serviceName || (locale === "ar" ? "متابعة" : "Follow-up visit")}
                          </h4>
                          <p className="text-[11px] font-bold text-slate-400">
                            {formatDate(visit.date, locale)}
                          </p>
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Dr. {visit.doctorName?.split(' ').pop()}
                        </span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <h5 className="text-[13px] font-black text-slate-800 dark:text-slate-200 mb-3">
                          {locale === "ar" ? "الوصفات" : "Prescriptions"}
                        </h5>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                          {visit.consultationSession?.medications && Array.isArray(visit.consultationSession?.medications) ? (
                            visit.consultationSession.medications.map((med: PrescriptionMedicationItem, idx: number) => (
                              <li key={idx} className="flex items-center gap-2 text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                <span className="text-slate-300">•</span>
                                {med.name} {med.dosage}
                              </li>
                            ))
                          ) : (
                            <li className="text-[12px] font-medium text-slate-400 italic">
                              {locale === "ar" ? "لا توجد أدوية مسجلة" : "No prescriptions recorded"}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="labs" className="mt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {labResults.length === 0 && patientUploadedDocuments.length === 0 ? (
                <Card className="border-dashed border-slate-200 bg-slate-50/50 rounded-[24px]">
                  <CardContent className="py-12 text-center">
                    <p className="text-slate-500 text-[14px] font-medium">
                      {locale === "ar" ? "لا توجد نتائج أو ملفات" : "No lab results or uploaded files"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Structured Lab Results */}
                  {labResults.map((result) => {
                    const linkedDocument =
                      (result.documentId
                        ? documentLookup.get(result.documentId)
                        : result.document?.id
                          ? documentLookup.get(result.document.id)
                          : undefined) ||
                      null;

                    const isNormal = result.status === "NORMAL";
                    const cardStyles = isNormal
                      ? "bg-[#F0FDF4] border-[#DCFCE7] dark:bg-emerald-950/20 dark:border-emerald-900/30"
                      : "bg-[#FFF7ED] border-[#FFEDD5] dark:bg-orange-950/20 dark:border-orange-900/30";
                    
                    const badgeStyles = isNormal
                      ? "bg-[#DCFCE7] text-[#166534]"
                      : "bg-[#FFEDD5] text-[#9A3412]";

                    return (
                      <article key={result.id} className={`relative rounded-[18px] border p-6 transition-all hover:shadow-sm ${cardStyles}`}>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">{result.testName}</h4>
                          <span className="text-[11px] font-bold text-slate-400">
                            {formatDate(result.resultDate, locale)}
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                            {result.resultSummary || (locale === "ar" ? "بدون ملخص" : "No result summary available")}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-slate-400">{locale === "ar" ? "النتيجة" : "Result"}</span>
                              <Badge className={`px-2 py-0.5 rounded-md border-none text-[11px] font-black uppercase tracking-tight shadow-none ${badgeStyles}`}>
                                {isNormal ? (locale === "ar" ? "طبيعي" : "normal") : (locale === "ar" ? "غير طبيعي" : "abnormal")}
                              </Badge>
                            </div>

                            <Button
                              className="h-10 px-6 rounded-2xl bg-[#4F46E5] text-white hover:bg-[#4338CA] font-bold text-[13px] transition-all shadow-md shadow-indigo-600/10"
                              disabled={!linkedDocument}
                              onClick={() => linkedDocument && void previewDocument(linkedDocument)}
                            >
                              {locale === "ar" ? "فتح PDF" : "open pdf"}
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {/* Patient Uploaded Documents (Styled as Results) */}
                  {patientUploadedDocuments.map((document) => (
                    <article key={document.id} className="relative rounded-[18px] border border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 p-6 transition-all hover:border-blue-200">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">{document.name}</h4>
                        <span className="text-[11px] font-bold text-slate-400">
                          {formatDate(document.createdAt, locale)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-[13px] font-medium text-slate-500 uppercase tracking-widest">
                            {locale === "ar" ? "ملف مرفوع" : "Patient Upload"}
                          </span>
                        </div>

                        <Button
                          className="h-10 px-6 rounded-2xl bg-slate-800 text-white hover:bg-slate-900 font-bold text-[13px] transition-all"
                          onClick={() => void previewDocument(document)}
                        >
                          {locale === "ar" ? "عرض الملف" : "view file"}
                        </Button>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="mt-0">
          <div className="space-y-6">
            {/* 1. Clinical Notes & Diagnosis */}
            <div className="rounded-[24px] border border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
                    {locale === "ar" ? "الملاحظات السريرية والتشخيص" : "Clinical Notes & Diagnosis"}
                  </h3>
                </div>
                <Button
                  size="sm"
                  className="h-9 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-[12px] font-bold shadow-md shadow-blue-600/10 transition-all gap-2"
                >
                  <Mic className="h-4 w-4" />
                  {locale === "ar" ? "الإدخال الصوتي" : "Voice Input"}
                </Button>
              </div>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder={locale === "ar" ? "أدخل الأعراض والنتائج والتشخيص..." : "Enter patient symptoms, examination findings, and diagnosis..."}
                className="w-full min-h-[120px] rounded-xl bg-white border border-slate-100 p-4 text-[14px] font-medium focus:ring-2 focus:ring-blue-600/5 transition-all resize-none"
              />
            </div>

            {/* 2. Prescription */}
            <div className="rounded-[24px] border border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-blue-600" />
                  <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
                    {locale === "ar" ? "الوصفة الطبية" : "Prescription"}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-blue-600 font-bold hover:bg-blue-50 text-[12px] rounded-xl"
                    onClick={() => setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {locale === "ar" ? "إضافة دواء" : "Add Medication"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 border-none rounded-xl text-[12px] font-bold transition-all gap-2"
                    onClick={() => {
                      if (lastPrescriptionId) {
                        const latest = prescriptions[0];
                        if (latest && Array.isArray(latest.medications)) {
                          setMedications(latest.medications);
                          toastSuccess(locale === "ar" ? "تم تكرار الوصفة السابقة" : "Last prescription repeated");
                        }
                      }
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {locale === "ar" ? "تكرار آخر وصفة" : "Repeat Last"}
                  </Button>
                </div>
              </div>

              {/* Favorites Quick Access */}
              {favoriteMedications.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {locale === "ar" ? "المفضلة" : "Favorite Meds"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {favoriteMedications.map((fav, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMedications([...medications, { ...fav }])}
                        className="px-3 py-1.5 rounded-full bg-blue-50/50 border border-blue-100/50 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-all"
                      >
                        + {fav.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-3">
                  {medications.map((med, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-2xl bg-[#F0F7FF] border border-blue-50 group">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                        <Input
                          placeholder={locale === "ar" ? "الدواء" : "Medicine"}
                          value={med.name}
                          onChange={(e) => {
                            const next = [...medications];
                            next[index].name = e.target.value;
                            setMedications(next);
                          }}
                          className="h-9 bg-white border-slate-100 text-[13px] font-bold rounded-lg shadow-sm"
                        />
                        <Input
                          placeholder={locale === "ar" ? "الجرعة" : "Dosage"}
                          value={med.dosage}
                          onChange={(e) => {
                            const next = [...medications];
                            next[index].dosage = e.target.value;
                            setMedications(next);
                          }}
                          className="h-9 bg-white border-slate-100 text-[13px] font-medium rounded-lg shadow-sm"
                        />
                        <Input
                          placeholder={locale === "ar" ? "التكرار" : "Frequency"}
                          value={med.frequency}
                          onChange={(e) => {
                            const next = [...medications];
                            next[index].frequency = e.target.value;
                            setMedications(next);
                          }}
                          className="h-9 bg-white border-slate-100 text-[13px] font-medium rounded-lg shadow-sm"
                        />
                        <Input
                          placeholder={locale === "ar" ? "المدة" : "Duration"}
                          value={med.duration}
                          onChange={(e) => {
                            const next = [...medications];
                            next[index].duration = e.target.value;
                            setMedications(next);
                          }}
                          className="h-9 bg-white border-slate-100 text-[13px] font-medium rounded-lg shadow-sm"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        onClick={() => setMedications(medications.filter((_, i) => i !== index))}
                        disabled={medications.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Investigation Orders */}
            <div className="rounded-[24px] border border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 bg-blue-600 rounded-full" />
                <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
                  {locale === "ar" ? "طلبات الفحوصات" : "Investigation Orders"}
                </h3>
              </div>

              <div className="space-y-8">
                {/* Lab Tests */}
                <div className="space-y-4">
                  <h4 className="text-[12px] font-bold text-slate-400">
                    {locale === "ar" ? "الفحوصات المخبرية" : "Laboratory tests"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {investigationCatalog.slice(0, 6).map((test) => (
                      <button
                        key={test}
                        onClick={() => setSelectedInvestigations(prev => ({ ...prev, [test]: !prev[test] }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                          selectedInvestigations[test]
                            ? "bg-blue-50 border-blue-200"
                            : "bg-[#F8FAFC] border-transparent hover:border-slate-200"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                          selectedInvestigations[test] ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200"
                        }`}>
                          {selectedInvestigations[test] && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-[12px] font-bold text-slate-700">{test}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radiology */}
                <div className="space-y-4">
                  <h4 className="text-[12px] font-bold text-slate-400">
                    {locale === "ar" ? "الأشعة والتصوير" : "Radiology & Imaging"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {investigationCatalog.slice(6).map((test) => (
                      <button
                        key={test}
                        onClick={() => setSelectedInvestigations(prev => ({ ...prev, [test]: !prev[test] }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                          selectedInvestigations[test]
                            ? "bg-blue-50 border-blue-200"
                            : "bg-[#F8FAFC] border-transparent hover:border-slate-200"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                          selectedInvestigations[test] ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200"
                        }`}>
                          {selectedInvestigations[test] && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-[12px] font-bold text-slate-700">{test}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Footer Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-blue-100 text-blue-700 hover:bg-blue-50 rounded-2xl text-[14px] font-black gap-3"
                onClick={() => void sendDiagnosticReportToPatient()}
                disabled={isSendingDiagnosticReport}
              >
                <FileText className="h-5 w-5" />
                {isSendingDiagnosticReport ? "..." : (locale === "ar" ? "تقرير PDF" : "SEND PDF REPORT")}
              </Button>

              <Button
                size="lg"
                className="h-14 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl text-[14px] font-black shadow-lg shadow-blue-600/10 gap-3"
                onClick={() => void savePrescriptionAndInvestigations()}
                disabled={isSavingPrescription}
              >
                <Save className="h-5 w-5" />
                {locale === "ar" ? "حفظ وإرسال للاستقبال" : "SAVE & SEND TO RECEPTION"}
              </Button>

              <Button
                size="lg"
                className="h-14 bg-[#5850EC] text-white hover:bg-[#4F46E5] rounded-2xl text-[14px] font-black shadow-lg shadow-indigo-600/10 gap-3"
                onClick={() => void sendWhatsAppToPatient()}
              >
                <Send className="h-5 w-5" />
                {locale === "ar" ? "إرسال لواتساب المريض" : "SEND TO WHATSAPP"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-xl bg-background p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{previewFile.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
              >
                {locale === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>

            {previewFile.fileType?.startsWith("image/") ? (
              <Image
                src={previewFile.fileUrl}
                alt={previewFile.name}
                width={1200}
                height={900}
                className="w-full rounded-lg"
                unoptimized
              />
            ) : (
              <iframe
                src={previewFile.fileUrl}
                className="h-[60vh] w-full rounded-lg border"
                title={previewFile.name}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

