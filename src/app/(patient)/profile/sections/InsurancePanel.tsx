'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patientService';
import { useToastStore } from '@/stores/useToastStore';
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Camera, Image as ImageIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface InsurancePanelProps {
  patient?: ApiPatient;
  onBack?: () => void;
  onRefresh?: () => void;
}

export default function InsurancePanel({ patient, onBack, onRefresh }: InsurancePanelProps) {
  const { locale } = useTranslation();
  const toast = useToastStore();
  
  const medicalHistory = React.useMemo(() => (patient?.medicalHistory as Record<string, unknown>) || {}, [patient?.medicalHistory]);
  const currentInsurance = React.useMemo(() => (medicalHistory["insuranceDetails"] as Record<string, unknown>) || {}, [medicalHistory]);

  const getFormData = React.useCallback(() => ({
    provider: (currentInsurance["provider"] as string) || (medicalHistory["insuranceProvider"] as string) || '',
    policyNumber: (currentInsurance["policyNumber"] as string) || (medicalHistory["insurancePolicyNumber"] as string) || '',
    expiryDate: (currentInsurance["expiryDate"] as string) || (medicalHistory["insuranceExpiry"] ? new Date(medicalHistory["insuranceExpiry"] as string).toISOString().split('T')[0] : ''),
    providerContact: (currentInsurance["providerContact"] as string) || '',
    category: (currentInsurance["category"] as string) || 'Individual',
    memberId: (currentInsurance["memberId"] as string) || '',
    cardImageUrl: (currentInsurance["cardImageUrl"] as string) || '',
  }), [currentInsurance, medicalHistory]);

  const [formData, setFormData] = useState(getFormData);

  const [verificationStatus, setVerificationStatus] = useState<string>(
    (currentInsurance["verificationStatus"] as string) || 'unverified'
  );
  
  const discountPercent = (currentInsurance["discountPercent"] as number) || 0;
  const discountNote = (currentInsurance["discountNote"] as string) || '';

  useEffect(() => {
    setFormData(getFormData());
    setVerificationStatus((currentInsurance["verificationStatus"] as string) || 'unverified');
  }, [getFormData, currentInsurance]);

  const [isSaving, setIsSaving] = useState(false);

  const handleCloudinarySuccess = (results: CloudinaryUploadWidgetResults) => {
    if (results.info && typeof results.info === 'object' && 'secure_url' in results.info) {
      const info = results.info as Record<string, unknown>;
      setFormData((prev) => ({
        ...prev,
        cardImageUrl: info.secure_url as string,
      }));
      setVerificationStatus('pending');
      toast.success(locale === 'ar' ? 'تم رفع صورة البطاقة بنجاح' : 'Insurance card photo uploaded successfully');
    }
  };

  const handleSave = async () => {
    if (!patient?.id) return;
    
    setIsSaving(true);
    try {
      const updatedHistory = {
        ...medicalHistory,
        insuranceDetails: {
          ...formData,
          verificationStatus: verificationStatus,
          discountPercent,
          discountNote,
        },
        insuranceProvider: formData.provider,
        insurancePolicyNumber: formData.policyNumber,
        insuranceExpiry: formData.expiryDate,
      };

      await patientService.update(patient.id, {
        medicalHistory: updatedHistory,
      });

      toast.success(locale === 'ar' ? 'تم حفظ بيانات التأمين بنجاح' : 'Insurance data saved successfully');
      if (onRefresh) onRefresh();
      if (onBack) onBack();
    } catch (error) {
      console.error('Failed to save insurance info', error);
      toast.error(locale === 'ar' ? 'فشل حفظ البيانات' : 'Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-18 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 max-w-2xl mx-auto w-full">

        {/* Verification Status Banner */}
        <div className="w-full">
          {verificationStatus === 'unverified' && (
            <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <Clock className="w-5 h-5 shrink-0 text-slate-500 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {locale === 'ar' ? 'غير موثق بعد' : 'Not Verified Yet'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {locale === 'ar' 
                    ? 'الرجاء ملء البيانات ورفع صورة البطاقة حتى يتسنى لفريق الاستقبال مراجعتها.' 
                    : 'Please fill in the fields and upload your card image for receptionist verification.'}
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="flex items-start gap-4 p-4 rounded-[20px] border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
              <Clock className="w-5 h-5 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-200">
                  {locale === 'ar' ? 'قيد المراجعة والتحقق' : 'Verification Pending'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {locale === 'ar' 
                    ? 'تم إرسال مستنداتك لفريق الاستقبال للمراجعة. سيتم تطبيق الخصومات فور الموافقة.' 
                    : 'Your documents have been submitted to reception. Once approved, discounts will apply.'}
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'verified' && (
            <div className="flex items-start gap-4 p-4 rounded-[20px] border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-800 dark:text-emerald-200">
                  {locale === 'ar' ? 'تم التحقق بنجاح' : 'Successfully Verified'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {locale === 'ar' 
                    ? 'بطاقة التأمين الخاصة بك صالحة ومعتمدة بالكامل.' 
                    : 'Your insurance coverage has been fully approved.'}
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="flex items-start gap-4 p-4 rounded-[20px] border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <XCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-red-800 dark:text-red-200">
                  {locale === 'ar' ? 'تم الرفض' : 'Verification Rejected'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {locale === 'ar' 
                    ? 'لم يتم قبول بطاقة التأمين. يرجى تعديل البيانات ورفع صورة واضحة ومحدثة.' 
                    : 'Your submission was rejected. Please review your details and upload a valid card.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hero Card Image Display / Upload Zone */}
        <div className="space-y-3">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'صورة بطاقة التأمين' : 'Insurance card photo'}
          </label>
          <div className="relative group w-full h-48 rounded-[24px] bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-2 text-center overflow-hidden transition-all duration-300 hover:border-blue-400/50 hover:bg-slate-50/50">
            {formData.cardImageUrl ? (
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={formData.cardImageUrl} 
                  alt="Insurance Card" 
                  className="w-full h-full object-cover rounded-[22px]" 
                />
                <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[22px]">
                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset"}
                    onSuccess={handleCloudinarySuccess}
                  >
                    {({ open }) => (
                      <button
                        onClick={() => open()}
                        className="px-4 py-2 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold rounded-full shadow-lg transition active:scale-[0.98] flex items-center gap-2 border border-slate-100 dark:border-slate-800"
                      >
                        <Camera className="w-4 h-4 text-blue-600" />
                        {locale === 'ar' ? 'تعديل الصورة' : 'Change photo'}
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {locale === 'ar' ? 'ارفع صورة واضحة لبطاقة التأمين' : 'Upload clear insurance card photo'}
                  </p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {locale === 'ar' ? 'صيغ PNG, JPG حتى 5 ميجابايت' : 'Supports PNG, JPG up to 5MB'}
                  </p>
                </div>
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset"}
                  onSuccess={handleCloudinarySuccess}
                >
                  {({ open }) => (
                    <Button 
                      variant="outline"
                      onClick={() => open()}
                      className="mt-1 h-9 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition active:scale-[0.98]"
                    >
                      {locale === 'ar' ? 'اختيار ملف' : 'Choose file'}
                    </Button>
                  )}
                </CldUploadWidget>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Insurance Provider */}
          <div className="space-y-2">
            <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
              {locale === 'ar' ? 'مزود التأمين' : 'Insurance provider'}
            </label>
            <Input 
              value={formData.provider}
              onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
              placeholder={locale === 'ar' ? 'أدخل اسم شركة التأمين' : 'Enter name of company'}
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
              {locale === 'ar' ? 'الفئة' : 'Category'}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500 w-full outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="Individual">{locale === 'ar' ? 'فردي' : 'Individual'}</option>
              <option value="Family">{locale === 'ar' ? 'عائلي' : 'Family'}</option>
              <option value="Corporate">{locale === 'ar' ? 'شركات' : 'Corporate'}</option>
              <option value="Government">{locale === 'ar' ? 'حكومي' : 'Government'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Policy Number */}
          <div className="space-y-2">
            <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
              {locale === 'ar' ? 'رقم البوليصة' : 'Policy number'}
            </label>
            <Input 
              value={formData.policyNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
              placeholder="000000000"
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500"
            />
          </div>

          {/* Member ID */}
          <div className="space-y-2">
            <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
              {locale === 'ar' ? 'رقم العضوية' : 'Member ID'}
            </label>
            <Input 
              value={formData.memberId}
              onChange={(e) => setFormData(prev => ({ ...prev, memberId: e.target.value }))}
              placeholder="MEM-12345"
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
              {locale === 'ar' ? 'تاريخ انتهاء البوليصة' : 'Policy expiry date'}
            </label>
            <div className="relative group">
              <Input 
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500 w-full"
              />
            </div>
          </div>

          {/* Provider Contact */}
          <div className="space-y-2">
            <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
              {locale === 'ar' ? 'اتصال المزود' : 'Provider contact'}
            </label>
            <div className="relative group">
              <Input 
                value={formData.providerContact}
                onChange={(e) => setFormData(prev => ({ ...prev, providerContact: e.target.value }))}
                placeholder="+20 102 333 4444"
                className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Verified Status Banner & Discount Highlight */}
        {verificationStatus === 'verified' && discountPercent > 0 && (
          <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent border border-emerald-500/20 flex items-center justify-between shadow-sm dark:border-emerald-800/40">
            <div className="space-y-1">
              <span className="text-[13px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                {locale === 'ar' ? 'ميزة الخصم النشطة' : 'Active Discount Benefit'}
              </span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-tight">
                {locale === 'ar' 
                  ? 'تمت الموافقة على تغطية خصم على جميع الفواتير القادمة.' 
                  : 'Discount approved and active for your visits.'}
              </p>
              {discountNote && (
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                  {discountNote}
                </p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center shrink-0 h-10 w-10 rounded-full bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/20">
              <span className="text-md leading-none">{discountPercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Button - Fixed on Mobile, Premium Feel */}
      <div className="p-4 fixed bottom-0 left-0 right-0 max-w-2xl mx-auto w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4 z-50">
        <Button 
          variant="outline"
          onClick={onBack}
          className="h-12 rounded-full border-slate-200 px-6 font-bold text-slate-700 dark:text-slate-300 transition active:scale-[0.98]"
        >
          {locale === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button 
          disabled={isSaving}
          onClick={handleSave}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-full shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <div className="flex items-center gap-2 justify-center">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
            </div>
          ) : (
            locale === 'ar' ? 'حفظ وتحديث البيانات' : 'Save and Update data'
          )}
        </Button>
      </div>
    </div>
  );
}
