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
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { useStaffStore } from "@/stores/useStaffStore";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { patientDocumentService } from "@/services/patientDocumentService";
import { useFilesStore, fileToMedicalFile } from "@/stores/useFilesStore";
import type { ApiService, ApiPatientDocument } from "@/types";

export default function PatientDashboard() {
  const { locale, t } = useTranslation();
  const { user } = useAuthStore();
  const { appointments } = useBookingStore();
  const { doctors: discoverDoctors, fetchDoctors } = useStaffStore();
  const toast = useToastStore();
  const patientId = user?.id ?? "guest";
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverSpecialization, setDiscoverSpecialization] = useState("All");
  const [discoverServices, setDiscoverServices] = useState<ApiService[]>([]);
  const [discoverServiceId, setDiscoverServiceId] = useState("");
  const [receivedReports, setReceivedReports] = useState<ApiPatientDocument[]>([]);
  const [selfUploadedDocuments, setSelfUploadedDocuments] = useState<ApiPatientDocument[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const localFilesStore = useFilesStore();

  const loadDocuments = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingReports(true);
    try {
      // 1. Fetch remote documents from backend
      const docs = await patientDocumentService.getCurrentPatientDocuments();
      
      // Reports: are always from backend (diagnostic reports or doctor uploads)
      const reports = docs.filter(doc => 
        doc.name.startsWith('diagnostic-report-') || (doc.uploadedBy && doc.uploadedBy !== user.id)
      );
      setReceivedReports(reports);

      // Self-Uploaded (My Medical Files): can be legacy backend files OR new local files
      const selfUploadedBackend = docs.filter(doc => 
        !doc.name.startsWith('diagnostic-report-') && (!doc.uploadedBy || doc.uploadedBy === user.id)
      );

      // 2. Fetch local documents from store
      const localFiles = localFilesStore.getFilesByPatient(user.id);
      const mappedLocalFiles: ApiPatientDocument[] = localFiles.map(file => ({
        id: file.id,
        patientId: user.id,
        name: file.name,
        fileUrl: file.dataUrl,
        fileType: file.type === "pdf" ? "application/pdf" : "image/jpeg",
        createdAt: file.uploadDate,
      }));
      
      // Combine both sources
      setSelfUploadedDocuments([...selfUploadedBackend, ...mappedLocalFiles]);
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      setReceivedReports([]);
      setSelfUploadedDocuments([]);
    } finally {
      setIsLoadingReports(false);
    }
  }, [user?.id, localFilesStore]);

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

      void fetchDoctors(filters);
    }, 250);

    return () => clearTimeout(timeout);
  }, [user?.id, discoverQuery, discoverSpecialization, discoverServiceId, fetchDoctors]);

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
  const [previewFile, setPreviewFile] = useState<ApiPatientDocument | null>(null);
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

        // Save to local storage instead of backend
        const medicalFile = fileToMedicalFile(file, dataUrl, user.id);
        localFilesStore.addFile(medicalFile);
        successCount++;
      } catch (error) {
        console.error(`Failed to handle ${file.name}:`, error);
        setUploadError(
          locale === "ar"
            ? `فشل في حفظ الملف: ${file.name}`
            : `Failed to save file: ${file.name}`
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
      // Local file IDs generated by useFilesStore start with "file-"
      const isLocal = id.startsWith('file-');
      
      if (isLocal) {
        localFilesStore.deleteFile(id);
      } else {
        await patientDocumentService.removeForCurrentPatient(id);
      }
      
      toast.success(locale === "ar" ? "تم حذف الملف بنجاح" : "File deleted successfully");
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(locale === "ar" ? "فشل في حذف الملف" : "Failed to delete file");
    } finally {
      setDeletingId(null);
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
                title={locale === "ar" ? "لا توجد تقارير مستلمة" : "No reports received yet"}
                description={locale === "ar" ? "سيظهر التقارير المرسلة من أطبائك هنا" : "Reports sent by your doctors will appear here"}
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
                            setPreviewFile({ ...report, fileUrl: result.downloadUrl });
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
                      className="h-32 bg-muted/50 flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewFile(doc)}
                    >
                      {doc.fileType?.startsWith("image/") ? (
                        <div className="relative h-full w-full">
                          <Image src={doc.fileUrl} alt={doc.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
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
                        onClick={() => setPreviewFile(doc)}
                        className="h-7 w-7 rounded-md bg-background/90 border flex items-center justify-center hover:bg-background"
                      >
                        <Eye className="h-3.5 w-3.5" />
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

      {/* File preview modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl max-w-3xl max-h-[80vh] overflow-auto w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{previewFile.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                {t("close")}
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
              <iframe src={previewFile.fileUrl} className="w-full h-[60vh] rounded-lg border" title={previewFile.name} />
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
