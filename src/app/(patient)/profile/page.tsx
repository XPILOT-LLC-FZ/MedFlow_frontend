"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Phone, MapPin, Calendar, Edit3, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFilesStore } from "@/stores/useFilesStore";

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { getFilesByPatient, deleteFile } = useFilesStore();

  const patientId = user?.id ?? "guest";
  const files = getFilesByPatient(patientId);

  const displayName = user ? (locale === "ar" ? user.nameAr : user.name) : "John Smith";

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={t("profile")}
        description={locale === "ar" ? "إدارة معلوماتك الشخصية" : "Manage your personal information"}
        action={<Button className="gap-2"><Edit3 className="h-4 w-4" /> {t("edit")}</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-primary/10">
              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email ?? "User"}`} />
              <AvatarFallback>{user?.name?.charAt(0) ?? "U"}</AvatarFallback>
            </Avatar>
            <h2 className="font-bold text-xl">{displayName}</h2>
            <p className="text-muted-foreground text-sm">{user?.email ?? "patient@test.com"}</p>
            <Badge variant="info" className="mt-2">{locale === "ar" ? "مريض" : "Patient"}</Badge>
            <div className="mt-4 pt-4 border-t space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{user?.phone ?? "+1 (555) 123-4567"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>123 Main St, New York</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{locale === "ar" ? "عضو منذ يناير 2025" : "Member since Jan 2025"}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === "ar" ? "المعلومات الشخصية" : "Personal Information"}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("fullName")}</label>
                <Input defaultValue={user?.name ?? "John Smith"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("email")}</label>
                <Input defaultValue={user?.email ?? "john.smith@email.com"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("phone")}</label>
                <Input defaultValue={user?.phone ?? "+1 (555) 123-4567"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("dateOfBirth")}</label>
                <Input type="date" defaultValue="1990-05-15" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t("address")}</label>
                <Input defaultValue="123 Main St, New York, NY 10001" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("medicalHistory")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("allergies")}</label>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="warning">Penicillin</Badge>
                  <Badge variant="warning">Peanuts</Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{locale === "ar" ? "الأدوية الحالية" : "Current Medications"}</label>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">Lisinopril 10mg</Badge>
                  <Badge variant="outline">Vitamin D 1000IU</Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t("emergencyContact")}</label>
                <Input defaultValue="Jane Smith - +1 (555) 987-6543" />
              </div>
            </CardContent>
          </Card>

          {/* Medical Files Gallery */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                {locale === "ar" ? "الملفات الطبية" : "Medical Files"}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {files.length} {locale === "ar" ? "ملف" : "files"}
              </Badge>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {locale === "ar"
                    ? "لا توجد ملفات بعد. يمكنك رفع الملفات من لوحة التحكم."
                    : "No files yet. You can upload files from the dashboard."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {file.type === "image" ? (
                          <Image
                            src={file.dataUrl}
                            alt={file.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>{t("save")}</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
