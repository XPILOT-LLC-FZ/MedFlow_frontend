'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Beaker,
  FileText,
  ChevronLeft,
  Plus,
  Upload,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  Dialog as DialogRoot,
  DialogContent as DialogContentRoot,
  DialogTitle as DialogTitleRoot
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { patientDocumentService } from '@/services/patientDocumentService';
import { useToastStore } from '@/stores/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ViewState = 'list' | 'upload';
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
}

export default function LabRadiologyPanel() {
  const { locale } = useTranslation();
  const toast = useToastStore();

  const [view, setView] = useState<ViewState>('list');
  const [activeTab, setActiveTab] = useState<TabState>('lab');
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOpeningFile, setIsOpeningFile] = useState(false);

  // Form State
  const [uploadType, setUploadType] = useState<'lab' | 'radiology'>('lab');
  const [fileName, setFileName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await patientDocumentService.getCurrentPatientDocuments();

      const mapped: MedicalReport[] = docs.map(doc => {
        const parts = doc.name.split('|');
        if (parts.length >= 4) {
          return {
            id: doc.id,
            type: parts[0].toLowerCase() === 'radiology' ? 'radiology' : 'lab',
            name: parts[1],
            specialization: parts[2],
            doctorName: parts[3],
            date: new Date(doc.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            status: 'completed',
            fileUrl: doc.fileUrl
          };
        }

        return {
          id: doc.id,
          name: doc.name.replace('diagnostic-report-', ''),
          doctorName: 'DR. name',
          specialization: 'specialization',
          date: new Date(doc.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
          type: doc.name.toLowerCase().includes('radiology') ? 'radiology' : 'lab',
          status: 'completed',
          fileUrl: doc.fileUrl
        };
      });

      setReports(mapped);
    } catch {
      toast.error(locale === "ar" ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [locale, toast]);

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

  const handleSave = async () => {
    if (!selectedFile || !fileName || !doctorName || !specialization) {
      toast.error(locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    setIsUploading(true);
    try {
      const encodedName = `${uploadType === 'radiology' ? 'Radiology' : 'Lab'}|${fileName}|${specialization}|${doctorName}`;

      const payload = {
        name: encodedName,
        fileUrl: "https://placeholder-url.com/file.pdf",
        fileType: selectedFile.type,
      };

      await patientDocumentService.createForCurrentPatient(payload);

      toast.success(locale === 'ar' ? 'تم حفظ البيانات بنجاح' : 'Data saved successfully');
      setView('list');
      loadData();

      setFileName(''); setDoctorName(''); setSpecialization(''); setSelectedFile(null);
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
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col space-y-3"
          >

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
                    className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] group cursor-pointer"
                  >
                    {/* PDF Icon Container */}
                    <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 relative">
                      <div className="relative">
                        <FileText className="h-8 w-8 text-rose-500" />
                        <span className="absolute -top-1 left-1 bg-white dark:bg-slate-900 text-[8px] font-black text-rose-500 px-1 border border-rose-100 dark:border-rose-900 rounded-sm leading-none py-0.5">PDF</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[16px] text-slate-800 dark:text-white truncate pr-2">
                          {report.name}
                        </h3>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                          {report.doctorName}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-400 font-medium mt-0.5">
                        {report.specialization}
                      </p>
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

            {/* FAB */}
            <button
              onClick={() => setView('upload')}
              className="fixed bottom-24 right-6 h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 active:scale-90 transition-all z-40"
            >
              <Plus className="h-8 w-8" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex flex-col space-y-6"
          >
            {/* Header with Back */}
            <div className="flex items-center justify-center relative py-2 mb-4">
              <button onClick={() => setView('list')} className="absolute left-0 p-2 text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="text-[20px] font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'رفع الملفات' : 'Upload files'}
              </h1>
            </div>

            <div className="space-y-6">
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
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
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
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                  {locale === 'ar' ? 'اسم الدكتور' : 'DR. name'}
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل الاسم' : 'Enter the name'}
                  className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium placeholder:text-slate-300"
                />
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

              <div className="pt-6 pb-10">
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
