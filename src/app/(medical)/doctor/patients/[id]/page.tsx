"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Plus,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [diagnosisDraft, setDiagnosisDraft] = useState("");
  const [prescriptionNotesDraft, setPrescriptionNotesDraft] = useState("");
  const [medications, setMedications] = useState<PrescriptionMedicationItem[]>([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [selectedInvestigations, setSelectedInvestigations] = useState<Record<string, boolean>>({});
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [isSendingDiagnosticReport, setIsSendingDiagnosticReport] = useState(false);

  const [lastPrescriptionId, setLastPrescriptionId] = useState<string | null>(null);

  const [favoriteMedications, setFavoriteMedications] = useState<PrescriptionMedicationItem[]>([]);

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


  const saveClinicalNotes = async () => {
    const latestAppointmentId = appointments[0]?.id;
    if (!latestAppointmentId) {
      toastError(
        locale === "ar"
          ? "لا يوجد موعد مرتبط لحفظ الملاحظات"
          : "No appointment available to save notes",
      );
      return;
    }

    if (notesDraft.trim().length < 4) {
      toastError(locale === "ar" ? "أدخل ملاحظات صالحة" : "Please enter valid notes");
      return;
    }

    setIsSavingNotes(true);
    try {
      await bookingService.saveManualSummary(latestAppointmentId, {
        mode: "NORMAL",
        content: notesDraft.trim(),
        sendToPatient: false,
      });
      toastSuccess(locale === "ar" ? "تم حفظ الملاحظات" : "Notes saved");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

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

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/doctor/patients" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {locale === "ar" ? "المرضى" : "Patients"}
        </Link>
        <span>/</span>
        <span className="text-foreground">{patient.fullName}</span>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold">{patient.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {age !== null ? `${age} years` : locale === "ar" ? "العمر غير متاح" : "Age N/A"}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px]">{patient.bloodType || "A+"}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700 inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {locale === "ar" ? "الحساسية" : "ALLERGIES"}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-red-600">
                {allergies.length === 0 && <li>{locale === "ar" ? "لا توجد حساسية مسجلة" : "No known allergies"}</li>}
                {allergies.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-xs font-semibold inline-flex items-center gap-1">
                <HeartPulse className="h-3.5 w-3.5 text-blue-600" />
                {locale === "ar" ? "الأمراض المزمنة" : "Chronic Conditions"}
              </p>
              <div className="mt-2 space-y-1.5">
                {chronicConditions.length === 0 && (
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "لا يوجد" : "None"}</p>
                )}
                {chronicConditions.map((condition) => (
                  <div key={condition} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                    {condition}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 rounded-xl bg-muted/40 p-3 text-xs">
            <div className="rounded-lg bg-background p-2">
              <p className="text-muted-foreground">{locale === "ar" ? "معرف المريض" : "Patient ID"}</p>
              <p className="font-medium">PAT-{patient.id.slice(0, 8)}</p>
            </div>
            <div className="rounded-lg bg-background p-2">
              <p className="text-muted-foreground">{locale === "ar" ? "الهاتف" : "Phone"}</p>
              <p className="font-medium">{patient.phone || "-"}</p>
            </div>
            <div className="rounded-lg bg-background p-2">
              <p className="text-muted-foreground">{locale === "ar" ? "آخر زيارة" : "Last Visit"}</p>
              <p className="font-medium">{formatDate(latestVisit?.date, locale)}</p>
            </div>
            <div className="rounded-lg bg-background p-2">
              <p className="text-muted-foreground">{locale === "ar" ? "إجمالي الزيارات" : "Total Visits"}</p>
              <p className="font-medium">{patient.totalVisits || 0}</p>
            </div>
            <div className="rounded-lg bg-background p-2">
              <p className="text-muted-foreground">{locale === "ar" ? "الوصفات" : "Prescriptions"}</p>
              <p className="font-medium">{prescriptions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex items-center gap-1.5 w-full bg-muted/30 p-1.5 rounded-xl h-auto border">
          <TabsTrigger 
            value="history" 
            className="flex-1 py-2.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            {locale === "ar" ? "سجل الزيارات" : "Visit history"}
          </TabsTrigger>
          <TabsTrigger 
            value="labs" 
            className="flex-1 py-2.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            {locale === "ar" ? "نتائج التحاليل" : "Lab results"}
          </TabsTrigger>
          <TabsTrigger 
            value="prescription" 
            className="flex-1 py-2.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            {locale === "ar" ? "الملاحظات والوصفة" : "Clinical Notes & Prescription"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === "ar" ? "سجل الزيارات" : "Visit history"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد زيارات مسجلة" : "No recorded visits"}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {appointments.map((visit) => (
                    <article key={visit.id} className="rounded-lg border p-4 bg-muted/5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{visit.serviceName || (locale === "ar" ? "متابعة طبية" : "Clinical follow-up")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{visit.doctorName || "-"}</p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground bg-background px-3 py-1.5 rounded-md border w-fit">
                          <span className="font-medium">{formatDate(visit.date, locale)}</span>
                          <span className="opacity-30">|</span>
                          <span>{visit.startTime}</span>
                          <Badge variant="outline" className="ml-2 text-[10px] uppercase">{visit.status}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground leading-relaxed border-t pt-3">
                        {visit.consultationSession?.notes || visit.notes || (locale === "ar" ? "بدون ملاحظات" : "No clinical notes preserved")}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === "ar" ? "نتائج التحاليل" : "Lab results"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {labResults.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد نتائج تحاليل" : "No lab results found"}
                </p>
              )}

              <div className="flex flex-col gap-3">
                {labResults.map((result) => {
                  const linkedDocument =
                    result.document ||
                    documents.find((doc) => doc.id === result.documentId) ||
                    null;

                  const statusTone =
                    result.status === "NORMAL"
                      ? "bg-emerald-50/50 border-emerald-100"
                      : result.status === "ABNORMAL" || result.status === "CRITICAL"
                        ? "bg-amber-50/50 border-amber-100"
                        : "bg-muted/5 border-border";

                  return (
                    <article key={result.id} className={`rounded-xl border p-4 ${statusTone}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{result.testName}</p>
                            <Badge
                              variant={
                                result.status === "NORMAL"
                                  ? "secondary"
                                  : result.status === "CRITICAL"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="text-[10px] h-4"
                            >
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {result.resultSummary || (locale === "ar" ? "بدون ملخص" : "No summary available for this test")}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground bg-background px-2 py-1 rounded border">
                            {formatDate(result.resultDate, locale)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-4 text-xs font-medium bg-background"
                            disabled={!linkedDocument?.fileUrl}
                            onClick={() => {
                              if (linkedDocument?.fileUrl) {
                                window.open(linkedDocument.fileUrl, "_blank", "noopener,noreferrer");
                              }
                            }}
                          >
                            {locale === "ar" ? "عرض التقرير" : "View Report"}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescription">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === "ar" ? "الملاحظات والوصفة والتحويلات" : "Clinical Notes, Prescription & Investigations"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{locale === "ar" ? "Clinical Notes" : "Clinical Notes"}</label>
                  <textarea
                    className="w-full min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder={
                      locale === "ar"
                        ? "أدخل الأعراض والانطباع الطبي والتشخيص..."
                        : "Enter patient symptoms, examination findings, and diagnosis..."
                    }
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void saveClinicalNotes()} disabled={isSavingNotes}>
                    {isSavingNotes
                      ? locale === "ar"
                        ? "جارٍ الحفظ..."
                        : "Saving..."
                      : locale === "ar"
                        ? "حفظ الملاحظات"
                        : "Save Notes"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toastInfo(locale === "ar" ? "تم إرسال بلاغ للمراجعة" : "Issue reported for review")}
                  >
                    {locale === "ar" ? "Report issue" : "Report issue"}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{locale === "ar" ? "Diagnosis" : "Diagnosis"}</label>
                  <Input
                    value={diagnosisDraft}
                    onChange={(event) => setDiagnosisDraft(event.target.value)}
                    placeholder={locale === "ar" ? "التشخيص" : "Diagnosis"}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{locale === "ar" ? "ملاحظات" : "Notes"}</label>
                  <textarea
                    className="w-full min-h-20 rounded-md border bg-background px-3 py-2 text-sm"
                    value={prescriptionNotesDraft}
                    onChange={(event) => setPrescriptionNotesDraft(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{locale === "ar" ? "الأدوية" : "Prescribed Medications"}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setMedications((prev) => [
                        ...prev,
                        { name: "", dosage: "", frequency: "", duration: "" },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {favoriteMedications.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pb-2">
                    <span className="text-xs text-muted-foreground self-center mr-2">
                       {locale === "ar" ? "إضافة سريعة:" : "Quick Add:"}
                    </span>
                    {favoriteMedications.map((fav, index) => (
                      <Button
                        key={`fav-${index}`}
                        variant="secondary"
                        size="sm"
                        className="text-[10px] h-6 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-none"
                        onClick={() => {
                          setMedications((prev) => {
                            const newMeds = [...prev];
                            // Replace the first empty slot if available, otherwise append
                            const emptyIdx = newMeds.findIndex(m => !m.name && !m.dosage);
                            if (emptyIdx !== -1) {
                              newMeds[emptyIdx] = { ...fav };
                            } else {
                              newMeds.push({ ...fav });
                            }
                            return newMeds;
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {fav.name} {fav.dosage && `(${fav.dosage})`}
                      </Button>
                    ))}
                  </div>
                )}

                {medications.map((item, index) => (
                  <div key={`medication-${index}`} className="rounded-lg border p-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      placeholder={locale === "ar" ? "الاسم" : "Name"}
                      value={item.name}
                      onChange={(event) =>
                        setMedications((prev) =>
                          prev.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, name: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder={locale === "ar" ? "الجرعة" : "Dosage"}
                      value={item.dosage}
                      onChange={(event) =>
                        setMedications((prev) =>
                          prev.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, dosage: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder={locale === "ar" ? "التكرار" : "Frequency"}
                      value={item.frequency}
                      onChange={(event) =>
                        setMedications((prev) =>
                          prev.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, frequency: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder={locale === "ar" ? "المدة" : "Duration"}
                        value={item.duration || ""}
                        onChange={(event) =>
                          setMedications((prev) =>
                            prev.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, duration: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setMedications((prev) =>
                            prev.length === 1
                              ? prev
                              : prev.filter((_, entryIndex) => entryIndex !== index),
                          )
                        }
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{locale === "ar" ? "Investigation Orders" : "Investigation Orders"}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {investigationCatalog.map((name) => (
                    <label key={name} className="rounded-lg border p-2 text-xs flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedInvestigations[name])}
                        onChange={(event) =>
                          setSelectedInvestigations((prev) => ({
                            ...prev,
                            [name]: event.target.checked,
                          }))
                        }
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => void savePrescriptionAndInvestigations()}
                  disabled={isSavingPrescription}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSavingPrescription
                    ? locale === "ar"
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : locale === "ar"
                      ? "Save Consultation & Send to receptionist"
                      : "Save Consultation & Send to receptionist"}
                </Button>

                <Button variant="outline" onClick={() => void sendWhatsAppToPatient()} className="gap-2">
                  <Send className="h-4 w-4" />
                  {locale === "ar" ? "Send to whatsapp of patient" : "Send to whatsapp of patient"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => void sendDiagnosticReportToPatient()}
                  disabled={isSendingDiagnosticReport}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSendingDiagnosticReport
                    ? locale === "ar"
                      ? "جارٍ إنشاء التقرير..."
                      : "Generating report..."
                    : locale === "ar"
                      ? "إنشاء PDF وإرساله للمريض"
                      : "Generate PDF & send to patient"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
