"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  FileText, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  Save, 
  Loader2,
  Droplet,
  Heart,
  AlertCircle,
  Activity,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import {
  patientDocumentService,
  PATIENT_DOCUMENTS_ACCESS_BLOCKED,
} from "@/services/patientDocumentService";
import { patientService } from "@/services/patientService";
import type { ApiPatient, ApiPatientDocument } from "@/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const CHRONIC_DISEASES = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "Arthritis",
];

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const toast = useToastStore();

  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [documents, setDocuments] = useState<ApiPatientDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    bloodType: "",
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    emergencyContact: "",
    address: "",
  });

  const loadPatientData = useCallback(async () => {
    setIsLoadingPatient(true);
    try {
      const data = await patientService.getMe();
      setPatient(data);
      const history = (data.medicalHistory as Record<string, unknown>) || {};
      setEditForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        email: data.email || "",
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split("T")[0] : "",
        bloodType: data.bloodType || "",
        allergies: data.allergies || [],
        chronicDiseases: (history.chronicDiseases as string[]) || [],
        emergencyContact: (history.emergencyContact as string) || "",
        address: data.address || (data.medicalHistory as Record<string, unknown>)?.address as string || "",
      });
    } catch (error) {
      console.error("Failed to load patient data", error);
      toast.error(locale === "ar" ? "فشل تحميل بيانات المريض" : "Failed to load patient data");
    } finally {
      setIsLoadingPatient(false);
    }
  }, [locale, toast]);

  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingDocuments(true);
    try {
      const docs = await patientDocumentService.getCurrentPatientDocuments();
      setDocuments(docs || []);
    } catch (error) {
      const blocked = error instanceof Error && error.message === PATIENT_DOCUMENTS_ACCESS_BLOCKED;
      if (!blocked) {
        toast.error(locale === "ar" ? "تعذر تحميل ملفات المريض" : "Failed to load patient files");
      }
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [locale, toast, user?.id]);

  useEffect(() => {
    loadPatientData();
    loadDocuments();
  }, [loadPatientData, loadDocuments]);

  const handleUpdateProfile = async () => {
    if (!patient?.id) return;
    
    setIsSaving(true);
    try {
      const updatedMedicalHistory = {
        ...(patient.medicalHistory as object || {}),
        chronicDiseases: editForm.chronicDiseases,
        emergencyContact: editForm.emergencyContact,
        address: editForm.address,
      };

      await patientService.update(patient.id, {
        fullName: editForm.fullName,
        phone: editForm.phone,
        email: editForm.email,
        dateOfBirth: editForm.dateOfBirth || undefined,
        bloodType: editForm.bloodType,
        address: editForm.address,
        allergies: editForm.allergies,
        medicalHistory: updatedMedicalHistory,
      });

      toast.success(locale === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
      setIsEditModalOpen(false);
      await loadPatientData();
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error(locale === "ar" ? "فشل تحديث الملف الشخصي" : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChronicDisease = (disease: string) => {
    setEditForm(prev => ({
      ...prev,
      chronicDiseases: prev.chronicDiseases.includes(disease)
        ? prev.chronicDiseases.filter(d => d !== disease)
        : [...prev.chronicDiseases, disease]
    }));
  };

  const files = useMemo(() => 
    documents.filter(doc => !doc.name.startsWith("diagnostic-report-") && (!doc.uploadedBy || doc.uploadedBy === user?.id)),
    [documents, user?.id]
  );

  const handleDeleteDocument = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      await patientDocumentService.removeForCurrentPatient(documentId);
      toast.success(locale === "ar" ? "تم حذف الملف بنجاح" : "File deleted successfully");
      await loadDocuments();
    } catch {
      toast.error(locale === "ar" ? "فشل حذف الملف" : "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDocument = async (documentId: string) => {
    setDownloadingId(documentId);
    try {
      const response = await patientDocumentService.getDocumentDownloadUrl(documentId);
      window.open(response.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(locale === "ar" ? "تعذر فتح الملف حالياً" : "Unable to open file right now");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const patientName = patient?.fullName || (locale === "ar" ? user?.nameAr : user?.name) || "John Smith";
  const chronicDiseases = (patient?.medicalHistory as Record<string, unknown>)?.chronicDiseases as string[] || [];

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <PageHeader
        title={t("profile")}
        description={locale === "ar" ? "إدارة معلوماتك الشخصية وتاريخك الطبي" : "Manage your personal and medical information"}
        action={
          <Button onClick={() => setIsEditModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 transition-all shadow-md">
            <Edit3 className="h-4 w-4" /> {t("edit")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 text-center border-none shadow-xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <div className="relative inline-block">
              <Avatar className="h-28 w-28 mx-auto mb-4 ring-4 ring-primary/10 shadow-lg transition-transform hover:scale-105">
                <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${patient?.email || user?.email || "User"}`} />
                <AvatarFallback>{patientName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-4 right-0 h-6 w-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full shadow-sm" />
            </div>
            
            <h2 className="font-black text-2xl text-slate-900 dark:text-white leading-tight">{patientName}</h2>
            <p className="text-muted-foreground text-sm font-medium mb-3">{patient?.email || user?.email}</p>
            
            <div className="flex justify-center gap-2 mb-6">
              <Badge variant="secondary" className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                {locale === "ar" ? "مريض" : "Patient"}
              </Badge>
              {patient?.bloodType && (
                <Badge variant="outline" className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider border-rose-100 bg-rose-50/30 text-rose-600 dark:border-rose-900/30 dark:text-rose-400">
                  <Droplet className="h-3 w-3 mr-1 inline" /> {patient.bloodType}
                </Badge>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 text-[13px]">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="font-bold">{patient?.phone || "+1 (555) 123-4567"}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="font-bold">{patient?.address || (patient?.medicalHistory as Record<string, unknown>)?.address as string || "No address provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="font-bold">
                  {locale === "ar" ? "عضو منذ " : "Member since "} 
                  {new Date(patient?.createdAt || Date.now()).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detailed Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
          {/* Medical History Card */}
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">{t("medicalHistory")}</CardTitle>
                  <CardDescription className="text-blue-100 text-xs font-medium">Your health profile at a glance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Chronic Diseases Section */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  {locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {chronicDiseases.length > 0 ? (
                    chronicDiseases.map((disease: string) => (
                      <Badge key={disease} className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 font-bold text-[12px] hover:bg-rose-100 transition-all rounded-lg">
                        {disease}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">No chronic diseases recorded</p>
                  )}
                </div>
              </div>

              {/* Allergies Section */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  {t("allergies")}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {patient?.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy) => (
                      <Badge key={allergy} variant="warning" className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 font-bold text-[12px] rounded-lg">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">No allergies recorded</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-4">
                  {t("emergencyContact")}
                </label>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="font-black text-slate-700 dark:text-slate-200">
                    {(patient?.medicalHistory as Record<string, unknown>)?.emergencyContact as string || "No contact info available"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Files Gallery */}
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800/60 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">
                  {locale === "ar" ? "الملفات الطبية" : "Medical Files"}
                </CardTitle>
              </div>
              <Badge variant="secondary" className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-none">
                {files.length} {locale === "ar" ? "ملف" : "files"}
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingDocuments ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">
                    {locale === "ar" ? "جاري تحميل الملفات..." : "Loading documents..."}
                  </p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-400 mb-1">
                    {locale === "ar" ? "لا توجد ملفات بعد" : "No medical files yet"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {locale === "ar" ? "سوف تظهر ملفاتك الطبية هنا" : "Your medical documents will appear here"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-300"
                    >
                      <div className="h-14 w-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                        <FileText className="h-7 w-7 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-black text-slate-800 dark:text-slate-100 truncate mb-1">{file.name}</p>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                          <span className="uppercase">{file.fileType || "doc"}</span>
                          <span className="h-1 w-1 bg-slate-300 rounded-full" />
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => void handleOpenDocument(file.id)}
                          disabled={downloadingId === file.id}
                          className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                        >
                          {downloadingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                        <button
                          onClick={() => void handleDeleteDocument(file.id)}
                          disabled={deletingId === file.id}
                          className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                        >
                          {deletingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl rounded-[32px] border-none shadow-2xl overflow-hidden p-0 bg-white dark:bg-slate-950">
          <DialogHeader className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Edit3 className="h-6 w-6" />
              {locale === "ar" ? "تعديل الملف الشخصي" : "Edit Health Profile"}
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium">Update your medical information securely</DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("fullName")}</label>
                <Input 
                  value={editForm.fullName} 
                  onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("phone")}</label>
                <Input 
                  value={editForm.phone} 
                  onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("dateOfBirth")}</label>
                <Input 
                  type="date"
                  value={editForm.dateOfBirth} 
                  onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{locale === "ar" ? "فصيلة الدم" : "Blood Type"}</label>
                <Input 
                  value={editForm.bloodType} 
                  onChange={e => setEditForm(prev => ({ ...prev, bloodType: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold placeholder:font-normal"
                  placeholder="e.g. O+"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("allergies")}</label>
                <Input 
                  value={editForm.allergies.join(", ")} 
                  onChange={e => setEditForm(prev => ({ ...prev, allergies: e.target.value.split(",").map(a => a.trim()).filter(Boolean) }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold"
                  placeholder={locale === "ar" ? "افصل بين الحساسية بفاصلة" : "Separate allergies with commas"}
                />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                {locale === "ar" ? "الأمراض المزمنة" : "Chronic Conditions"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CHRONIC_DISEASES.map(disease => {
                  const isSelected = editForm.chronicDiseases.includes(disease);
                  return (
                    <button
                      key={disease}
                      type="button"
                      onClick={() => toggleChronicDisease(disease)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-[12px] font-black transition-all",
                        isSelected 
                          ? "bg-rose-50 border-rose-500 text-rose-600 dark:bg-rose-950/20 shadow-sm" 
                          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {disease}
                      {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 opacity-30" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("emergencyContact")}</label>
              <Input 
                value={editForm.emergencyContact} 
                onChange={e => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 font-bold"
                placeholder={locale === "ar" ? "اسم وتليفون شخص للطوارئ" : "Emergency contact name and phone"}
              />
            </div>
            
            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("address")}</label>
              <Input 
                value={editForm.address} 
                onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 font-bold"
                placeholder={locale === "ar" ? "عنوان السكن الحالي" : "Current residential address"}
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 h-14 rounded-2xl font-black text-[15px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
            >
              <X className="h-4 w-4 mr-2" /> {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={isSaving}
              className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[15px] shadow-xl shadow-blue-500/20 transition-all"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {locale === "ar" ? "حفظ التغييرات" : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
