"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar, Clock, User, Plus, ArrowRight, Activity,
  Upload, FileText, Trash2, Eye, AlertCircle, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/shared/StatsCard";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { staffService } from "@/services/staffService";
import {
  patientDocumentService,
  PATIENT_DOCUMENTS_ACCESS_BLOCKED,
} from "@/services/patientDocumentService";
import type { ApiPublicDoctor, ApiService, ApiPatientDocument, ApiDoctorCredential, PreviewFileInfo } from "@/types";
import { FilePreviewDialog } from "@/components/shared/FilePreviewDialog";

export default function PatientDashboard() {
  const { locale, t } = useTranslation();
  const { user } = useAuthStore();
  const { appointments } = useBookingStore();
  const toast = useToastStore();
  const patientId = user?.id ?? "guest";
  const [discoverDoctors, setDiscoverDoctors] = useState<ApiPublicDoctor[]>([]);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverSpecialization, setDiscoverSpecialization] = useState("All");
  const [discoverServices, setDiscoverServices] = useState<ApiService[]>([]);
  const [discoverServiceId, setDiscoverServiceId] = useState("");
  const [receivedReports, setReceivedReports] = useState<ApiPatientDocument[]>([]);
  const [selfUploadedDocuments, setSelfUploadedDocuments] = useState<ApiPatientDocument[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isReportsAccessBlocked, setIsReportsAccessBlocked] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [credentialDoctor, setCredentialDoctor] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [credentialItems, setCredentialItems] = useState<ApiDoctorCredential[]>([]);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [previewingCredentialId, setPreviewingCredentialId] = useState<string | null>(null);

  const loadDocuments = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingReports(true);

    try {
      const docs = await patientDocumentService.getCurrentPatientDocuments();
      setIsReportsAccessBlocked(false);
      
      // Reports: are always from backend (diagnostic reports or doctor uploads)
      const reports = docs.filter(doc => 
        doc.name.startsWith('diagnostic-report-') || (doc.uploadedBy && doc.uploadedBy !== user.id)
      );
      setReceivedReports(reports);

      const selfUploadedBackend = docs.filter(doc => 
        !doc.name.startsWith('diagnostic-report-') && (!doc.uploadedBy || doc.uploadedBy === user.id)
      );

      setSelfUploadedDocuments(selfUploadedBackend);
    } catch (error) {
      const blocked =
        error instanceof Error &&
        error.message === PATIENT_DOCUMENTS_ACCESS_BLOCKED;

      setIsReportsAccessBlocked(blocked);
      setReceivedReports([]);
      setSelfUploadedDocuments([]);

      if (!blocked) {
        console.error('Error fetching patient documents:', error);
      }
    } finally {
      setIsLoadingReports(false);
    }
  }, [user?.id]);
  

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem("clinic-os-files");
  }, []);

  React.useEffect(() => {
    if (user?.id) {
      useBookingStore.getState().fetchAppointments({ patientId: user.id });

      void servicesCatalogService
        .getAll({ isActive: "true" })
        .then((services) => setDiscoverServices(services))
        .catch(() => setDiscoverServices([]));

      // Load documents
      void loadDocuments();
    }
  }, [user?.id, loadDocuments]);

  React.useEffect(() => {
    if (!user?.id) return;

    const timeout = setTimeout(() => {
      const filters: Record<string, string> = {};

      if (discoverQuery.trim()) filters.search = discoverQuery.trim();
      if (discoverSpecialization !== "All") filters.specialization = discoverSpecialization;
      if (discoverServiceId) filters.serviceId = discoverServiceId;

      void staffService
        .getPublicDoctors(filters)
        .then((data) => setDiscoverDoctors(data))
        .catch(() => setDiscoverDoctors([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [user?.id, discoverQuery, discoverSpecialization, discoverServiceId]);

  const patientAppointments = appointments.filter((a) => a.patientId === patientId);
  const upcoming = patientAppointments
    .filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .slice(0, 3);
  const highlightDates = patientAppointments.map((a) => a.date);

  // Local Summary Logic
  const localSummary = React.useMemo(() => {
    const upcomingCount = patientAppointments.filter(
      (a) => a.status === "scheduled" || a.status === "confirmed"
    ).length;
    
    const completedCount = patientAppointments.filter(
      (a) => a.status === "completed"
    ).length;

    const myDoctorsCount = new Set(patientAppointments.map((a) => a.doctorId)).size;

    // Derived Health Score: Base 70 + activity bonuses
    let healthScore = 70;
    healthScore += Math.min(20, selfUploadedDocuments.length * 5);
    healthScore += Math.min(10, completedCount * 2);

    return {
      upcomingAppointments: upcomingCount,
      completedAppointments: completedCount,
      myDoctors: myDoctorsCount,
      healthScore: Math.min(100, healthScore),
    };
  }, [patientAppointments, selfUploadedDocuments]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFileInfo | null>(null);
  const [uploadError, setUploadError] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

  const displayName = user
    ? locale === "ar" ? user.nameAr : user.name
    : "John";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) return;
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setUploadError("");

    const validFiles: File[] = Array.from(selected).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(
          locale === "ar"
            ? `نوع الملف غير مدعوم: ${file.name}. يرجى رفع PDF أو صور فقط.`
            : `Unsupported file type: ${file.name}. Please upload PDF or images only.`
        );
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          locale === "ar"
            ? `الملف كبير جداً: ${file.name}. الحد الأقصى 10 ميجابايت.`
            : `File too large: ${file.name}. Maximum size is 10 MB.`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    
    setUploading(true);
    let successCount = 0;

    for (const file of validFiles) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await patientDocumentService.createForCurrentPatient({
          name: file.name,
          fileUrl: dataUrl,
          fileType: file.type || null,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadError(
          locale === "ar"
            ? `فشل في رفع الملف: ${file.name}`
            : `Failed to upload file: ${file.name}`
        );
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(
        locale === "ar" 
          ? `تم رفع ${successCount} ملفات بنجاح` 
          : `Successfully uploaded ${successCount} files`
      );
      loadDocuments();
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteFile = async (id: string) => {
    if (!window.confirm(locale === "ar" ? "هل أنت متأكد من حذف هذا الملف؟" : "Are you sure you want to delete this file?")) {
      return;
    }

    setDeletingId(id);
    try {
      await patientDocumentService.removeForCurrentPatient(id);
      
      toast.success(locale === "ar" ? "تم حذف الملف بنجاح" : "File deleted successfully");
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(locale === "ar" ? "فشل في حذف الملف" : "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const openCredentialDialog = (doctor: ApiPublicDoctor) => {
    setCredentialDoctor({ id: doctor.id, name: doctor.fullName });
    
    // Construct items from the summary data which now includes previewUrls
    const items: ApiDoctorCredential[] = [];
    
    if (doctor.credentialSummary.ministryOfHealthId) {
      items.push({
        ...doctor.credentialSummary.ministryOfHealthId,
        doctorId: doctor.id,
        credentialType: "MINISTRY_OF_HEALTH_ID",
      } as ApiDoctorCredential);
    }
    
    if (doctor.credentialSummary.qualifications) {
      doctor.credentialSummary.qualifications.forEach((q) => {
        items.push(q);
      });
    }
    
    setCredentialItems(items);
    setCredentialLoading(false);
  };

  const openCredentialPreview = async (doctorId: string, credential: ApiDoctorCredential) => {
    // Try to use pre-signed URL first
    if (credential.previewUrl) {
      setPreviewFile({
        name: credential.name,
        fileUrl: credential.previewUrl,
        fileType: credential.fileType || "application/pdf",
      });
      return;
    }

    setPreviewingCredentialId(credential.id);

    try {
      const result = await staffService.getPatientDoctorCredentialPreview(doctorId, credential.id);
      setPreviewFile({
        name: credential.name,
        fileUrl: result.previewUrl,
        fileType: credential.fileType || "application/pdf",
      });
    } catch {
      try {
        const fallbackResult = await staffService.getPublicDoctorCredentialPreview(doctorId, credential.id);
        setPreviewFile({
          name: credential.name,
          fileUrl: fallbackResult.previewUrl,
          fileType: credential.fileType || "application/pdf",
        });
      } catch {
        toast.error(
          locale === "ar"
            ? "تعذر فتح ملف الاعتماد حالياً"
            : "Failed to open credential file",
        );
      }
    } finally {
      setPreviewingCredentialId(null);
    }
  };


  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={`${locale === "ar" ? "مرحبًا" : "Welcome back"}, ${displayName}!`}
        description={locale === "ar" ? "إليك ملخص صحتك" : "Here's your health summary"}
        action={
          <Link href="/appointments">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("bookAppointment")}
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("upcomingAppointments")} value={localSummary.upcomingAppointments} change={12} icon={<Calendar className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("completed")} value={localSummary.completedAppointments} change={8} icon={<Clock className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "الأطباء" : "My Doctors"} value={localSummary.myDoctors} icon={<User className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={locale === "ar" ? "النتائج الصحية" : "Health Score"} value={`${localSummary.healthScore}%`} icon={<Activity className="h-5 w-5" />} delay={0.3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "اكتشف الأطباء" : "Discover Doctors"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={discoverQuery}
                onChange={(e) => setDiscoverQuery(e.target.value)}
                className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm"
                placeholder={locale === "ar" ? "ابحث باسم الطبيب أو التخصص" : "Search doctor or specialization"}
              />
            </div>
            <select
              value={discoverSpecialization}
              onChange={(e) => setDiscoverSpecialization(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="All">{locale === "ar" ? "كل التخصصات" : "All specializations"}</option>
              {["Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Ophthalmology", "Neurology"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={discoverServiceId}
              onChange={(e) => setDiscoverServiceId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">{locale === "ar" ? "كل الخدمات" : "All services"}</option>
              {discoverServices.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {discoverDoctors.slice(0, 4).map((doctor) => (
              <div key={doctor.id} className="rounded-lg border p-3">
                <p className="font-medium">{doctor.fullName}</p>
                <p className="text-sm text-muted-foreground">{doctor.specialization || (locale === "ar" ? "تخصص عام" : "General")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {doctor.experienceYears} {t("yearsExp")}
                </p>
                {(doctor.credentialSummary.hasVerifiedMinistryId || doctor.credentialSummary.qualificationCount > 0) && (
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-emerald-700">
                      {locale === "ar"
                        ? `اعتمادات موثقة: ${doctor.credentialSummary.qualificationCount + (doctor.credentialSummary.hasVerifiedMinistryId ? 1 : 0)}`
                        : `Verified credentials: ${doctor.credentialSummary.qualificationCount + (doctor.credentialSummary.hasVerifiedMinistryId ? 1 : 0)}`}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => openCredentialDialog(doctor)}
                    >
                      {locale === "ar" ? "عرض" : "View"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {discoverDoctors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "لا توجد نتائج حالياً" : "No doctors matched your filters"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("upcomingAppointments")}</h2>
            <Link href="/appointments">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                {t("viewAll")} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-8 w-8 text-muted-foreground/50" />}
                title={locale === "ar" ? "لا توجد مواعيد قادمة" : "No upcoming appointments"}
                description={locale === "ar" ? "احجز موعدًا مع أحد أطبائنا" : "Book an appointment with one of our specialists"}
                action={{ label: t("bookAppointment"), onClick: () => window.location.href = "/appointments" }}
              />
            ) : (
              upcoming.map((apt, i) => (
                <AppointmentCard key={apt.id} appointment={apt} delay={i * 0.1} />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MiniCalendar locale={locale} highlightDates={highlightDates} />
        </div>
      </div>

      {/* Medical File Upload Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                {locale === "ar" ? "التقارير المستلمة" : "Received Reports"}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {receivedReports.length} {locale === "ar" ? "تقرير" : "reports"}
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : receivedReports.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8 text-muted-foreground/50" />}
                title={
                  isReportsAccessBlocked
                    ? locale === "ar"
                      ? "التقارير غير متاحة حالياً"
                      : "Reports Are Temporarily Unavailable"
                    : locale === "ar"
                      ? "لا توجد تقارير مستلمة"
                      : "No reports received yet"
                }
                description={
                  isReportsAccessBlocked
                    ? locale === "ar"
                      ? "صلاحيات واجهة البرمجة الحالية لا تسمح بقراءة التقارير. يرجى تحديث الخادم أو التواصل مع الدعم."
                      : "Current API permissions do not allow reading reports. Please update backend deployment or contact support."
                    : locale === "ar"
                      ? "سيظهر التقارير المرسلة من أطبائك هنا"
                      : "Reports sent by your doctors will appear here"
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {receivedReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group rounded-xl border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary/60 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={report.name}>
                          {report.name.replace('diagnostic-report-', '').replace(/\.pdf$/, '')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(report.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                        </p>
                        {report.uploadedBy && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {locale === "ar" ? "من الطبيب" : "From doctor"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {report.fileType === "application/pdf" ? "PDF" : "Document"}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 gap-1 text-xs"
                        onClick={async () => {
                          setDownloadingReportId(report.id);
                          try {
                            const result = await patientDocumentService.getDocumentDownloadUrl(report.id);
                            setPreviewFile({ 
                              name: report.name, 
                              fileUrl: result.downloadUrl,
                              fileType: report.fileType || "application/pdf"
                            });
                            toast.success(locale === "ar" ? "جاري عرض التقرير" : "Opening report preview");
                          } catch (error) {
                            toast.error(locale === "ar" ? "فشل تنزيل التقرير" : "Failed to download report");
                            console.error('Download error:', error);
                          } finally {
                            setDownloadingReportId(null);
                          }
                        }}
                        disabled={downloadingReportId === report.id}
                      >
                        {downloadingReportId === report.id ? (
                          <span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {locale === "ar" ? "عرض" : "View"}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Medical File Upload Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                {locale === "ar" ? "ملفاتي الطبية" : "My Medical Files"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selfUploadedDocuments.length} {locale === "ar" ? "ملف" : "files"}
              </Badge>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
                {locale === "ar" ? "رفع ملف" : "Upload File"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {locale === "ar"
                ? "ارفع صور الأشعة والتقارير الطبية (PDF أو صور، حد أقصى 10 ميجابايت)"
                : "Upload X-rays, medical reports (PDF or images, max 10 MB)"}
            </p>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {selfUploadedDocuments.length === 0 ? (
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "اضغط لرفع ملفاتك الطبية" : "Click to upload your medical files"}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {locale === "ar" ? "PDF، JPG، PNG" : "PDF, JPG, PNG"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {selfUploadedDocuments.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Preview */}
                    <div
                      className="h-32 bg-muted/50 flex items-center justify-center cursor-pointer overflow-hidden"
                      onClick={async () => {
                        setDownloadingReportId(doc.id);
                        try {
                          const result = await patientDocumentService.getDocumentDownloadUrl(doc.id);
                          setPreviewFile({ 
                            name: doc.name, 
                            fileUrl: result.downloadUrl,
                            fileType: doc.fileType || "application/pdf"
                          });
                        } catch {
                          toast.error(locale === "ar" ? "فشل فتح الملف" : "Failed to open file");
                        } finally {
                          setDownloadingReportId(null);
                        }
                      }}
                    >
                      {doc.fileType?.startsWith("image/") ? (
                        <div className="relative h-full w-full group-hover:scale-105 transition-transform duration-500">
                          <Image src={doc.fileUrl} alt={doc.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/40 group-hover:text-primary/40 transition-colors">
                          <FileText className="h-10 w-10" />
                          <span className="text-[10px] font-bold tracking-widest uppercase">PDF Preview</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {doc.fileType === "application/pdf" ? "PDF" : "Image"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions overlay */}
                    <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={async () => {
                          setDownloadingReportId(doc.id);
                          try {
                            const result = await patientDocumentService.getDocumentDownloadUrl(doc.id);
                            setPreviewFile({ 
                              name: doc.name, 
                              fileUrl: result.downloadUrl,
                              fileType: doc.fileType || "application/pdf"
                            });
                          } catch {
                            toast.error(locale === "ar" ? "فشل فتح الملف" : "Failed to open file");
                          } finally {
                            setDownloadingReportId(null);
                          }
                        }}
                        disabled={downloadingReportId === doc.id}
                        className="h-7 w-7 rounded-md bg-background/90 border flex items-center justify-center hover:bg-background"
                      >
                        {downloadingReportId === doc.id ? (
                          <span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteFile(doc.id)}
                        disabled={deletingId === doc.id}
                        className="h-7 w-7 rounded-md bg-background/90 border flex items-center justify-center hover:bg-destructive/10 text-destructive disabled:opacity-50"
                      >
                        {deletingId === doc.id ? (
                          <span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Add more */}
                <div
                  className="rounded-xl border-2 border-dashed h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-6 w-6 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {locale === "ar" ? "إضافة ملف" : "Add File"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Unified File Preview Dialog */}
      <FilePreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFile(null);
          }
        }}
        file={previewFile}
      />

      <Dialog
        open={Boolean(credentialDoctor)}
        onOpenChange={(open) => {
          if (!open) {
            setCredentialDoctor(null);
            setCredentialItems([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {locale === "ar"
                ? `اعتمادات الطبيب ${credentialDoctor?.name || ""}`
                : `Doctor Credentials${credentialDoctor ? `: ${credentialDoctor.name}` : ""}`}
            </DialogTitle>
            <DialogDescription>
              {locale === "ar"
                ? "هذه الملفات معتمدة ومرئية للمرضى."
                : "These files are verified and visible to patients."}
            </DialogDescription>
          </DialogHeader>

          {credentialLoading ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "جاري تحميل الاعتمادات..." : "Loading credentials..."}
            </p>
          ) : credentialItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد ملفات اعتماد متاحة حالياً."
                : "No credential files are currently available."}
            </p>
          ) : (
            <div className="space-y-3">
              {credentialItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.credentialType === "MINISTRY_OF_HEALTH_ID"
                        ? locale === "ar"
                          ? "ترخيص وزارة الصحة"
                          : "Ministry of Health License"
                        : locale === "ar"
                          ? "شهادة تأهيل"
                          : "Qualification"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={previewingCredentialId === item.id}
                    onClick={() => {
                      if (credentialDoctor) {
                        void openCredentialPreview(credentialDoctor.id, item);
                      }
                    }}
                  >
                    {previewingCredentialId === item.id
                      ? locale === "ar"
                        ? "جاري الفتح..."
                        : "Opening..."
                      : locale === "ar"
                        ? "معاينة"
                        : "Preview"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
