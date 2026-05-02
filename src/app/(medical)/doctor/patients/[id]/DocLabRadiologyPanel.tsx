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
  Share2
} from 'lucide-react';
import {
  Dialog as DialogRoot,
  DialogContent as DialogContentRoot,
  DialogTitle as DialogTitleRoot
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { patientDocumentService } from '@/services/patientDocumentService';
import { useToastStore } from '@/stores/useToastStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ApiPatientDocument } from '@/types';

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

interface DocLabRadiologyPanelProps {
  fileType: 'lab' | 'radiology';
  patientId: string;
  patientUserId?: string;
  documents: ApiPatientDocument[];
  doctorName: string;
  onRefresh: () => Promise<void>;
}

export default function DocLabRadiologyPanel({
  fileType,
  patientId,
  patientUserId,
  documents,
  doctorName,
  onRefresh
}: DocLabRadiologyPanelProps) {
  const { locale } = useTranslation();
  const toast = useToastStore();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOpeningFile, setIsOpeningFile] = useState(false);

  // Form State
  const [uploadType, setUploadType] = useState<'lab' | 'radiology'>(fileType);
  const [fileName, setFileName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUploadType(fileType);
  }, [fileType, isUploadOpen]);

  const loadData = useCallback(() => {
    if (!documents) return;

    const mapped: MedicalReport[] = documents.map((doc: ApiPatientDocument) => {
      const realDoctorName = doc.appointment?.doctor?.fullName || doc.appointment?.doctorName || (doc.name.split('|')[3]) || (locale === 'ar' ? 'طبيب' : 'Doctor');
      const parts = doc.name.split('|');

      if (parts.length >= 4) {
        return {
          id: doc.id,
          type: parts[0].toLowerCase() === 'radiology' ? 'radiology' : 'lab',
          name: parts[1],
          specialization: parts[2],
          doctorName: parts[3] || realDoctorName,
          date: new Date(doc.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          }),
          status: 'completed',
          fileUrl: doc.fileUrl,
          uploadedByPatient: doc.uploadedByPatient === true || 
            (patientUserId && doc.uploadedBy === patientUserId) ||
            (!doc.appointmentId && parts.length < 4)
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
        uploadedByPatient: doc.uploadedByPatient === true || 
          (patientUserId && doc.uploadedBy === patientUserId) ||
          (!doc.appointmentId && parts.length < 4)
      };
    });

    setReports(mapped);
  }, [documents, locale, patientUserId]);

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
      const response = await patientDocumentService.getDocumentDownloadUrlForPatient(patientId, documentId);
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
    if (!selectedFile || !fileName || !specialization) {
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

      await patientDocumentService.create(patientId, payload);

      toast.success(locale === 'ar' ? 'تم حفظ البيانات بنجاح' : 'Data saved successfully');
      setIsUploadOpen(false);
      await onRefresh();

      setFileName(''); setSpecialization(''); setSelectedFile(null);
      setUploadType(fileType);
    } catch {
      toast.error(locale === 'ar' ? 'خطأ في الحفظ' : 'Error saving data');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = async (report: MedicalReport) => {
    try {
      const response = await patientDocumentService.getDocumentDownloadUrlForPatient(patientId, report.id);
      if (!response.downloadUrl) throw new Error("No download URL");

      if (navigator.share) {
        await navigator.share({
          title: report.name,
          text: `${report.type === 'lab' ? 'Lab Result' : 'Radiology Report'} — ${report.date}`,
          url: response.downloadUrl,
        });
      } else {
        await navigator.clipboard.writeText(response.downloadUrl);
        toast.success(locale === 'ar' ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard');
      }
    } catch {
      toast.error(locale === 'ar' ? 'فشل مشاركة الملف' : 'Failed to share file');
    }
  };

  const handleCardClick = (report: MedicalReport) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const filteredReports = reports.filter(r => r.type === fileType);

  return (
    <div className="w-full max-w-2xl mx-auto relative min-h-[400px] pb-4">
      {/* List */}
      <div className="flex flex-col space-y-4">
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleCardClick(report)}
                className="bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all relative group cursor-pointer flex flex-col justify-between gap-4"
              >
                {/* Top row: Title and sender */}
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-[15px] md:text-[16px] text-emerald-600 dark:text-emerald-400 uppercase leading-snug break-words flex-1">
                    {report.name}
                  </h3>
                  <p className="text-[12px] md:text-[13px] text-slate-500 font-medium">
                    {report.uploadedByPatient
                      ? (locale === 'ar' ? 'تم الرفع بواسطة المريض' : 'Uploaded by patient')
                      : (locale === 'ar' ? `تم الرفع بواسطتك: د. ${report.doctorName}` : `Uploaded by you: Dr. ${report.doctorName}`)}
                  </p>
                </div>

                {/* Bottom row: Date and View report button */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {locale === 'ar' ? 'التاريخ : ' : 'Date : '}
                    {report.date}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(report);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 text-[14px] font-bold h-10 w-10 flex items-center justify-center rounded-full transition-all shadow-sm"
                      title={locale === 'ar' ? 'مشاركة' : 'Share'}
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDocument(report.id);
                      }}
                      className="bg-[#008AE6] hover:bg-blue-600 active:scale-95 text-white text-[13px] font-bold px-5 h-10 rounded-full transition-all shadow-sm flex items-center gap-1"
                    >
                      {locale === 'ar' ? 'عرض التقرير' : 'View report'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-100 dark:border-slate-800">
              <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Beaker className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">
                {locale === 'ar' ? 'لا توجد ملفات' : 'No files yet'}
              </h3>
              <p className="text-slate-400 text-sm">
                {locale === 'ar' ? 'ابدأ بإضافة التقارير الطبية للمريض' : 'Start adding patient medical reports'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setUploadType(fileType);
            setIsUploadOpen(true);
          }}
          className="fixed bottom-40 md:bottom-40 right-10 h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 active:scale-90 transition-all z-40"
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Upload Dialog Modal */}
      <DialogRoot open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContentRoot className="w-[90vw] max-w-[420px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[1000]">
          <div className="p-6 bg-white dark:bg-slate-950 max-h-[85vh] overflow-y-auto">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="h-14 w-14 rounded-[20px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 border border-blue-100 dark:border-blue-800">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitleRoot className="text-[18px] font-black text-slate-900 dark:text-white leading-tight">
                {locale === 'ar' ? 'رفع ملف جديد' : 'Upload New File'}
              </DialogTitleRoot>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'النوع' : 'Type'}
                </label>
                <div className="relative group">
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as 'lab' | 'radiology')}
                    className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium text-sm"
                  >
                    <option value="lab">{locale === 'ar' ? 'نتائج المختبر' : 'Lab Result'}</option>
                    <option value="radiology">{locale === 'ar' ? 'تقرير الأشعة' : 'Radiology Report'}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'اسم الملف' : 'File name'}
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل الاسم' : 'Enter the name'}
                  className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium text-sm placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'التخصص' : 'Specialization'}
                </label>
                <div className="relative group">
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-sm font-medium text-sm"
                  >
                    <option value="">{locale === 'ar' ? 'اختر التخصص' : 'Select specialization'}</option>
                    <option value="Internal Medicine">{locale === 'ar' ? 'باطنة' : 'Internal Medicine'}</option>
                    <option value="Cardiology">{locale === 'ar' ? 'قلب' : 'Cardiology'}</option>
                    <option value="Neurology">{locale === 'ar' ? 'أعصاب' : 'Neurology'}</option>
                    <option value="Orthopedics">{locale === 'ar' ? 'عظام' : 'Orthopedics'}</option>
                    <option value="Radiology">{locale === 'ar' ? 'أشعة' : 'Radiology'}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'رفع الملف' : 'Upload file'}
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group",
                    selectedFile
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "border-slate-200 hover:border-blue-400 bg-slate-50/50 dark:border-slate-800 dark:hover:border-blue-500"
                  )}
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="application/pdf,image/*" />

                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                    selectedFile ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-900 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 shadow-sm"
                  )}>
                    {selectedFile ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  </div>

                  <div className="text-center px-2">
                    <p className="font-bold text-[12px] text-slate-700 dark:text-slate-300 line-clamp-1">
                      {selectedFile ? selectedFile.name : (locale === 'ar' ? 'اضغط للرفع أو سحب الملف' : 'Click to upload')}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[14px] rounded-xl transition-all"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[14px] rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    locale === 'ar' ? 'حفظ' : 'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </DialogContentRoot>
      </DialogRoot>

      {/* Detail Modal */}
      <DialogRoot open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContentRoot className="w-[90vw] max-w-[360px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[1000]">
          <div className="p-8 bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-16 w-16 rounded-[20px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                <FileText className="h-8 w-8 text-rose-500" />
              </div>
              <DialogTitleRoot className="text-[18px] font-black text-slate-900 dark:text-white leading-tight">
                {selectedReport?.name}
              </DialogTitleRoot>
              <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-wider">
                {selectedReport?.type === 'lab'
                  ? (locale === 'ar' ? 'نتائج المختبر' : 'Lab Result')
                  : (locale === 'ar' ? 'تقرير الأشعة' : 'Radiology Report')
                }
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[16px] border border-slate-100 dark:border-slate-800/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">{locale === 'ar' ? 'الطبيب' : 'Doctor'}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedReport?.uploadedByPatient ? (locale === 'ar' ? 'المريض' : 'Patient') : selectedReport?.doctorName}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">{locale === 'ar' ? 'التخصص' : 'Specialization'}</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{selectedReport?.specialization || '-'}</span>
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
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[14px] rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isOpeningFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                {locale === 'ar' ? 'عرض المستند' : 'View Document'}
              </button>

              <button
                onClick={() => selectedReport && handleShare(selectedReport)}
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                {locale === 'ar' ? 'مشاركة الملف' : 'Share file'}
              </button>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-full h-12 bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-[14px] rounded-xl transition-all"
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
