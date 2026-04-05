"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, Clock, User, Plus, ArrowRight, Activity,
  Upload, FileText, Trash2, Eye, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/shared/StatsCard";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { WhatsAppSimulator } from "@/components/shared/WhatsAppSimulator";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFilesStore, fileToMedicalFile, type MedicalFile } from "@/stores/useFilesStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { EmptyState } from "@/components/shared/EmptyState";

export default function PatientDashboard() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { addFile, deleteFile, getFilesByPatient } = useFilesStore();
  const { appointments } = useBookingStore();
  const toast = useToastStore();

  const patientId = user?.id ?? "guest";
  const files = getFilesByPatient(patientId);

  const patientAppointments = appointments.filter((a) => a.patientId === patientId);
  const upcoming = patientAppointments
    .filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .slice(0, 3);
  const highlightDates = patientAppointments.map((a) => a.date);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<MedicalFile | null>(null);
  const [uploadError, setUploadError] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

  const displayName = user
    ? locale === "ar" ? user.nameAr : user.name
    : "John";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setUploadError("");

    const validFiles: File[] = [];
    for (const file of Array.from(selected)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(
          locale === "ar"
            ? `نوع الملف غير مدعوم: ${file.name}. يرجى رفع PDF أو صور فقط.`
            : `Unsupported file type: ${file.name}. Please upload PDF or images only.`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          locale === "ar"
            ? `الملف كبير جداً: ${file.name}. الحد الأقصى 10 ميجابايت.`
            : `File too large: ${file.name}. Maximum size is 10 MB.`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    setUploading(true);

    let remaining = validFiles.length;
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const medFile = fileToMedicalFile(file, dataUrl, patientId);
        addFile(medFile);
        remaining--;
        if (remaining === 0) {
          setUploading(false);
          toast.success(locale === "ar" ? "تم رفع الملفات بنجاح" : "Files uploaded successfully");
        }
      };
      reader.onerror = () => {
        remaining--;
        if (remaining === 0) setUploading(false);
        setUploadError(
          locale === "ar"
            ? `فشل في قراءة الملف: ${file.name}`
            : `Failed to read file: ${file.name}`
        );
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <StatsCard title={t("upcomingAppointments")} value={upcoming.length} change={12} icon={<Calendar className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("completed")} value={patientAppointments.filter((a) => a.status === "completed").length} change={8} icon={<Clock className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={locale === "ar" ? "الأطباء" : "My Doctors"} value={new Set(patientAppointments.map((a) => a.doctorId)).size} icon={<User className="h-5 w-5" />} delay={0.2} />
        <StatsCard title={locale === "ar" ? "النتائج الصحية" : "Health Score"} value="92%" change={5} icon={<Activity className="h-5 w-5" />} delay={0.3} />
      </div>

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
          <WhatsAppSimulator />
        </div>
      </div>

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
                {files.length} {locale === "ar" ? "ملف" : "files"}
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

            {files.length === 0 ? (
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
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Preview */}
                    <div
                      className="h-32 bg-muted/50 flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewFile(file)}
                    >
                      {file.type === "image" ? (
                        <img src={file.dataUrl} alt={file.name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions overlay */}
                    <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="h-7 w-7 rounded-md bg-background/90 border flex items-center justify-center hover:bg-background"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { deleteFile(file.id); toast.success(locale === "ar" ? "تم حذف الملف" : "File deleted"); }}
                        className="h-7 w-7 rounded-md bg-background/90 border flex items-center justify-center hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
            {previewFile.type === "image" ? (
              <img src={previewFile.dataUrl} alt={previewFile.name} className="w-full rounded-lg" />
            ) : (
              <iframe src={previewFile.dataUrl} className="w-full h-[60vh] rounded-lg border" title={previewFile.name} />
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
