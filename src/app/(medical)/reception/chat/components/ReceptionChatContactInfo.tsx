"use client";

import { useState } from "react";
import { X, Phone, Video, Mail, FileText, Activity, MapPin, Calendar, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { patientDocumentService } from "@/services/patientDocumentService";
import type { TranslationKey } from "@/lib/i18n";

interface ReceptionChatContactInfoProps {
  user: {
    id: string;
    name: string;
    fullNameAr?: string;
    avatar?: string;
    role: string;
    email?: string;
    phone?: string;
    address?: string;
    age?: number;
    bloodType?: string;
    lastVisit?: string;
  } | null;
  activity: Array<{ id: string; date: string; title: string }>;
  files: Array<{ id: string; name: string; size: string; date: string; fileUrl?: string }>;
  onClose?: () => void;
}

export function ReceptionChatContactInfo({ user, activity, files, onClose }: ReceptionChatContactInfoProps) {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState("details");
  const [viewingFile, setViewingFile] = useState<{ id: string; name: string; size: string; date: string; fileUrl?: string } | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const tabs = ["details", "history", "files"];

  const handleViewFile = async (file: { id: string; name: string; size: string; date: string; fileUrl?: string }) => {
    if (!user || user.role !== t("patient")) {
      setViewingFile(file);
      return;
    }

    setViewingFile(file);
    setIsFetchingUrl(true);
    try {
      const result = await patientDocumentService.getDocumentDownloadUrlForPatient(user.id, file.id);
      setViewingFile({ ...file, fileUrl: result.downloadUrl });
    } catch (error) {
      console.error("Failed to get document URL", error);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  if (!user) {
    return (
      <div className="hidden lg:flex w-[300px] h-full bg-white dark:bg-slate-950 border-s border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 p-8 text-center">
        <p>{t("noResults")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className={cn(
        "flex h-full flex-col overflow-hidden bg-white dark:bg-slate-950 z-50 transition-all duration-300 ease-in-out",
        "fixed inset-y-0 right-0 w-full max-w-[320px] shadow-2xl lg:relative lg:inset-auto lg:w-[300px] lg:min-w-[300px] lg:shadow-none border-s border-slate-100 dark:border-slate-800"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <h3 className="text-[18px] font-black text-slate-900 dark:text-white">
            {t("contactInfo")}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar">
          <div className="flex flex-col items-center px-6 pb-6">
            <div className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-50 shadow-sm dark:bg-slate-800 dark:ring-slate-900">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-4xl">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="mb-1 text-[20px] font-black text-slate-900 dark:text-white text-center leading-tight">
              {locale === "ar" && user.fullNameAr ? user.fullNameAr : user.name}
            </h2>
            <span className="mb-6 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
              {user.role}
            </span>

            <div className="grid grid-cols-3 gap-3 w-full">
              {[
                { icon: Phone, label: "Call", labelKey: "call" },
                { icon: Video, label: "Video", labelKey: "video" },
                { icon: Mail, label: "Email", labelKey: "email" },
              ].map((btn) => (
                <div key={btn.label} className="flex flex-col items-center gap-2">
                  <button className="h-12 w-full flex items-center justify-center rounded-2xl bg-slate-50 text-blue-600 hover:bg-blue-50 transition-all dark:bg-slate-900 dark:text-blue-400">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                      <btn.icon size={14} />
                    </div>
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t(btn.labelKey as TranslationKey)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-4">
            <div className="flex p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2 text-[12px] font-bold rounded-xl transition-all",
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t(tab as any)}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-2">
            <div key={activeTab} className="space-y-6">
              {activeTab === "details" && (
                <>
                  <section>
                    <h3 className="text-[13px] font-black text-slate-900 dark:text-slate-100 mb-4 px-1">
                      {t("personalInformation")}
                    </h3>
                    <div className="space-y-3">
                      {[
                        { icon: Mail, label: "Email", labelKey: "email", value: user.email || "—" },
                        { icon: Phone, label: "Phone", labelKey: "phone", value: user.phone || "—" },
                        { icon: MapPin, label: "Address", labelKey: "address", value: user.address || "—" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 dark:bg-slate-900/40 dark:border-slate-800/50">
                          <div className="text-slate-400 dark:text-slate-500">
                            <item.icon size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(item.labelKey as any)}</p>
                            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[13px] font-black text-slate-900 dark:text-slate-100 mb-4 px-1">
                      {t("medicalInformation")}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        { label: "Age", labelKey: "age", value: user.age ? `${user.age} ${t("years")}` : `34 ${t("years")}` },
                        { label: "Blood Type", labelKey: "bloodType", value: user.bloodType || "O+" },
                      ].map((item) => (
                        <div key={item.label} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-50 dark:bg-slate-900/40 dark:border-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(item.labelKey as any)}</p>
                          <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 dark:bg-slate-900/40 dark:border-slate-800/50">
                      <div className="text-slate-400 dark:text-slate-500">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t("lastVisit")}</p>
                        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{user.lastVisit || "—"}</p>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === "history" && (
                <div className="space-y-4">
                  <div className="px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">{t("recentActivity")}</p>
                  </div>
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 rounded-[22px] bg-slate-50/50 border border-slate-50 dark:bg-slate-900/40 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-sm hover:shadow-md">
                      <div className="mt-1 h-9 w-9 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Activity size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.date}</p>
                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.title}</p>
                      </div>
                    </div>
                  ))}
                  {activity.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-[12px] font-medium text-slate-400">{t("noRecentActivity")}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "files" && (
                <div className="space-y-4">
                  <div className="px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">{t("sharedFiles")}</p>
                  </div>
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 rounded-[22px] bg-slate-50/50 border border-slate-50 dark:bg-slate-900/40 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm dark:bg-blue-900/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[120px] truncate text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-0.5">{file.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.size}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.date}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleViewFile(file)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:shadow-sm transition-all dark:bg-slate-800"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-[12px] font-medium text-slate-400">{t("noSharedFiles")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 text-center shrink-0 border-t border-slate-50 dark:border-slate-900">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">{t("secureSession")}</p>
        </div>

        <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
          <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl bg-white dark:bg-slate-950">
            <div className="flex flex-col h-[80vh]">
              <DialogHeader className="p-6 border-b border-slate-50 dark:border-slate-900 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <DialogTitle className="text-[16px] font-black text-slate-900 dark:text-white mb-0.5">
                        {viewingFile?.name}
                      </DialogTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{viewingFile?.size}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{viewingFile?.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 overflow-hidden">
                {isFetchingUrl ? (
                  <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                    <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                      {t("loadingViewer")}
                    </p>
                  </div>
                ) : viewingFile?.fileUrl ? (
                  <iframe
                    src={viewingFile.fileUrl}
                    className="h-full w-full rounded-2xl border-none bg-white shadow-sm"
                    title={viewingFile.name}
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center p-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                      <FileText size={32} />
                    </div>
                    <p className="text-[14px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                      {t("unableToDisplayFile")}
                    </p>
                    <p className="text-[12px] font-medium text-slate-400 max-w-xs">
                      {t("tryDownloadingFile")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
