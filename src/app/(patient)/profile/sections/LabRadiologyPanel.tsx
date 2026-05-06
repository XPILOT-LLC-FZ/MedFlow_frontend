'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Beaker,
  FileText,
  Plus,
  Upload,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Eye,
  X,
} from 'lucide-react';
import {
  Dialog as DialogRoot,
  DialogContent as DialogContentRoot,
  DialogTitle as DialogTitleRoot
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { patientDocumentService } from '@/services/patientDocumentService';
import { useToastStore } from '@/stores/useToastStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { patientService } from '@/services/patientService';
import type { ApiPublicDoctor } from '@/types';

type TabState = 'lab' | 'radiology';

interface MedicalReport {
  id: string;
  name: string;
  doctorName: string;
  specialization: string;
  date: string;
  type: 'lab' | 'radiology';
  status: 'completed' | 'pending' | 'critical';
  fileUrl?: string;
  uploadedByPatient?: boolean;
}

export default function LabRadiologyPanel() {
  const { locale, isRTL } = useTranslation();
  const toast = useToastStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabState>('lab');
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOpeningFile, setIsOpeningFile] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Form State
  const [uploadType, setUploadType] = useState<'lab' | 'radiology'>('lab');
  const [fileName, setFileName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [doctors, setDoctors] = useState<ApiPublicDoctor[]>([]);

  useEffect(() => {
    patientService.getDoctors().then(setDoctors).catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await patientDocumentService.getCurrentPatientDocuments();

      const mapped: MedicalReport[] = docs.map(doc => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyDoc = doc as unknown as any;
        const realDoctorName = anyDoc.appointment?.doctor?.fullName || anyDoc.appointment?.doctorName || (doc.name.split('|')[3]) || (locale === 'ar' ? 'طبيب' : 'Doctor');
        const parts = doc.name.split('|');
        const isSelfUploaded = doc.uploadedByPatient === true ||
          (anyDoc.uploadedBy ? anyDoc.uploadedBy === user?.id : !doc.appointmentId);

        if (parts.length >= 4) {
          return {
            id: doc.id,
            type: parts[0].toLowerCase() === 'radiology' ? 'radiology' : 'lab',
            name: parts[1],
            specialization: parts[2],
            doctorName: realDoctorName,
            date: new Date(doc.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'numeric',
              year: 'numeric'
            }),
            status: 'completed',
            fileUrl: doc.fileUrl,
            uploadedByPatient: isSelfUploaded
          };
        }

        return {
          id: doc.id,
          name: doc.name.replace('diagnostic-report-', ''),
          doctorName: realDoctorName,
          specialization: 'specialization',
          date: new Date(doc.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          }),
          type: doc.name.toLowerCase().includes('radiology') ? 'radiology' : 'lab',
          status: 'completed',
          fileUrl: doc.fileUrl,
          uploadedByPatient: isSelfUploaded
        };
      });

      setReports(mapped);
    } catch {
      toast.error(locale === "ar" ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [locale, toast, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      if (!fileName) setFileName(e.target.files[0].name.split('.')[0]);
    }
  };

  const handleOpenDocument = async (documentId: string) => {
    setIsOpeningFile(true);
    try {
      const response = await patientDocumentService.getDocumentDownloadUrl(documentId);
      if (!response.downloadUrl) throw new Error("No download URL");
      window.open(response.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(locale === "ar" ? "تعذر فتح الملف حالياً" : "Unable to open file right now");
    } finally {
      setIsOpeningFile(false);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!selectedFile || !fileName || !doctorName || !specialization) {
      toast.error(locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    setIsUploading(true);
    try {
      const encodedName = `${uploadType === 'radiology' ? 'Radiology' : 'Lab'}|${fileName}|${specialization}|${doctorName}`;

      // Convert file to data URL for backend processing
      const fileDataUrl = await fileToDataUrl(selectedFile);

      const payload = {
        name: encodedName,
        fileUrl: fileDataUrl,
        fileType: selectedFile.type,
      };

      await patientDocumentService.createForCurrentPatient(payload);

      toast.success(locale === 'ar' ? 'تم حفظ البيانات بنجاح' : 'Data saved successfully');
      setIsUploadOpen(false);
      loadData();

      setFileName(''); setDoctorName(''); setSpecialization(''); setSelectedFile(null);
      setUploadType('lab');
    } catch {
      toast.error(locale === 'ar' ? 'خطأ في الحفظ' : 'Error saving data');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCardClick = (report: MedicalReport) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const filteredReports = reports.filter(r => r.type === activeTab);

  return (
    <div className="w-full max-w-md mx-auto relative min-h-[600px] pb-4">
      <div className="flex flex-col space-y-3">
        {/* Tabs Control */}
        <div className="bg-white dark:bg-slate-900 p-1 rounded-md border border-slate-100 dark:border-slate-800 flex gap-8">
          <button
            onClick={() => setActiveTab('lab')}
            className={cn(
              "flex-1 py-4 px-3 rounded-md text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1",
              activeTab === 'lab'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            {locale === 'ar' ? 'نتائج المختبر' : 'Lab results'}
          </button>
          <button
            onClick={() => setActiveTab('radiology')}
            className={cn(
              "flex-1 py-4 px-3 rounded-md text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1",
              activeTab === 'radiology'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            {locale === 'ar' ? 'تقرير الأشعة' : 'Radiology report'}
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-[28px] animate-pulse border border-slate-100 dark:border-slate-800" />
              ))}
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleCardClick(report)}
                className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all relative group cursor-pointer flex flex-col justify-between gap-4"
              >
                {/* Top row: Title and sender */}
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-[15px] md:text-[16px] text-emerald-600 dark:text-emerald-400 uppercase leading-snug break-words flex-1">
                    {report.name}
                  </h3>
                  <p className="text-[12px] md:text-[13px] text-slate-500 font-medium">
                    {report.uploadedByPatient
                      ? (locale === 'ar' ? 'تم الرفع بواسطتك' : 'Uploaded by you')
                      : (locale === 'ar' ? `تم الإرسال بواسطة: ${report.doctorName}` : `Sent by: ${report.doctorName}`)}
                  </p>
                </div>

                {/* Bottom row: Date and View report button */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {locale === 'ar' ? 'التاريخ : ' : 'Date : '}
                    {report.date}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDocument(report.id);
                    }}
                    className="bg-[#008AE6] hover:bg-blue-600 active:scale-95 text-white text-[14px] font-bold px-5 py-2 rounded-full transition-all shadow-sm flex items-center gap-1"
                  >
                    {locale === 'ar' ? 'عرض التقرير' : 'View report'}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-100 dark:border-slate-800">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Beaker className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">
                {locale === 'ar' ? 'لا توجد تقارير' : 'No reports yet'}
              </h3>
              <p className="text-slate-400 text-sm">
                {locale === 'ar' ? 'ابدأ بإضافة تقاريرك الطبية' : 'Start adding your medical reports'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setUploadType(activeTab);
            setIsUploadOpen(true);
          }}
          className="fixed bottom-40 md:bottom-40 right-6 h-15 w-15 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 active:scale-90 transition-all z-40"
        >
          <Plus className="h-8 w-8" />
        </button>
      </div>

      {/* Upload files Bottom Sheet */}
      <AnimatePresence>
        {isUploadOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsUploadOpen(false);
                setFileName('');
                setDoctorName('');
                setSpecialization('');
                setSelectedFile(null);
              }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex flex-col justify-end"
            />

            {/* Bottom Sheet / Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-slate-950 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-2xl z-[101] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-800" />
              </div>

              {/* Title Header with close button */}
              <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-900/50">
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {locale === 'ar' ? 'رفع الملفات' : 'Upload files'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setIsUploadOpen(false);
                    setFileName('');
                    setDoctorName('');
                    setSpecialization('');
                    setSelectedFile(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full bg-slate-50 dark:bg-slate-900 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content with scrolling */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'النوع' : 'Type'}
                  </label>
                  <div className="relative group">
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as 'lab' | 'radiology')}
                      className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium"
                    >
                      <option value="lab">{locale === 'ar' ? 'مختبر' : 'Laboratory'}</option>
                      <option value="radiology">{locale === 'ar' ? 'أشعة' : 'Radiology'}</option>
                    </select>
                    <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors", isRTL ? "left-6" : "right-6")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'اسم الملف' : 'File name'}
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder={locale === 'ar' ? 'أدخل الاسم' : 'Enter the name'}
                    className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'التخصص' : 'Specialization'}
                  </label>
                  <div className="relative group">
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium"
                    >
                      <option value="">{locale === 'ar' ? 'اختر التخصص' : 'Select specialization'}</option>
                      <option value="Internal Medicine">{locale === 'ar' ? 'باطنة' : 'Internal Medicine'}</option>
                      <option value="Cardiology">{locale === 'ar' ? 'قلب' : 'Cardiology'}</option>
                      <option value="Neurology">{locale === 'ar' ? 'أعصاب' : 'Neurology'}</option>
                      <option value="Orthopedics">{locale === 'ar' ? 'عظام' : 'Orthopedics'}</option>
                      <option value="Radiology">{locale === 'ar' ? 'أشعة' : 'Radiology'}</option>
                    </select>
                    <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors", isRTL ? "left-6" : "right-6")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'اسم الدكتور' : 'DR. name'}
                  </label>
                  <div className="relative group">
                    <select
                      value={doctorName}
                      onChange={(e) => {
                        const docName = e.target.value;
                        setDoctorName(docName);
                        const selectedDoc = doctors.find(d => d.fullName === docName);
                        if (selectedDoc && selectedDoc.specialization) {
                          setSpecialization(selectedDoc.specialization);
                        }
                      }}
                      className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium"
                    >
                      <option value="">{locale === 'ar' ? 'اختر الطبيب' : 'Select doctor'}</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.fullName}>
                          {locale === 'ar' && doc.fullNameAr ? doc.fullNameAr : doc.fullName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors", isRTL ? "left-6" : "right-6")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'رفع الملف' : 'Upload file'}
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full h-40 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group",
                      selectedFile
                        ? "border-emerald-500 bg-emerald-50/30"
                        : "border-slate-200 hover:border-blue-400 bg-slate-50/50 dark:border-slate-800 dark:hover:border-blue-500"
                    )}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="application/pdf,image/*" />

                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                      selectedFile ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-900 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 shadow-sm"
                    )}>
                      {selectedFile ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                    </div>

                    <div className="text-center">
                      <p className="font-bold text-[15px] text-slate-700 dark:text-slate-300">
                        {selectedFile ? selectedFile.name : (locale === 'ar' ? 'اضغط للرفع أو سحب الملف' : 'Click to upload or drag and drop')}
                      </p>
                      <p className="text-[12px] text-slate-400 font-medium">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 pb-6">
                  <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[18px] rounded-[28px] shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      locale === 'ar' ? 'حفظ البيانات' : 'Save data'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <DialogRoot open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContentRoot className="w-[90vw] max-w-[360px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[1000]">
          <div className="p-8 bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-20 w-20 rounded-[24px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                <FileText className="h-10 w-10 text-rose-500" />
              </div>
              <DialogTitleRoot className="text-[20px] font-black text-slate-900 dark:text-white leading-tight">
                {selectedReport?.name}
              </DialogTitleRoot>
              <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                {selectedReport?.type === 'lab'
                  ? (locale === 'ar' ? 'نتائج المختبر' : 'Lab Result')
                  : (locale === 'ar' ? 'تقرير الأشعة' : 'Radiology Report')
                }
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[20px] border border-slate-100 dark:border-slate-800/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">{locale === 'ar' ? 'الطبيب' : 'Doctor'}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{selectedReport?.doctorName}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">{locale === 'ar' ? 'التخصص' : 'Specialization'}</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{selectedReport?.specialization}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">{locale === 'ar' ? 'التاريخ' : 'Date'}</span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{selectedReport?.date}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => selectedReport && handleOpenDocument(selectedReport.id)}
                disabled={isOpeningFile}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[16px] rounded-[24px] shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isOpeningFile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eye className="h-5 w-5" />}
                {locale === 'ar' ? 'عرض المستند' : 'View Document'}
              </button>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-full h-14 bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold text-[16px] rounded-[24px] transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </DialogContentRoot>
      </DialogRoot>
    </div>
  );
}
