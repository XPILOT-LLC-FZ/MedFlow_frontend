'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patientService';
import { useToastStore } from '@/stores/useToastStore';

interface InsurancePanelProps {
  patient?: ApiPatient;
  onBack?: () => void;
  onRefresh?: () => void;
}

export default function InsurancePanel({ patient, onBack, onRefresh }: InsurancePanelProps) {
  const { locale } = useTranslation();
  const toast = useToastStore();
  
  const medicalHistory = (patient?.medicalHistory as Record<string, unknown>) || {};
  const currentInsurance = (medicalHistory["insuranceDetails"] as Record<string, unknown>) || {};

  const [formData, setFormData] = useState({
    provider: (currentInsurance["provider"] as string) || (medicalHistory["insuranceProvider"] as string) || '',
    policyNumber: (currentInsurance["policyNumber"] as string) || (medicalHistory["insurancePolicyNumber"] as string) || '',
    expiryDate: (currentInsurance["expiryDate"] as string) || (medicalHistory["insuranceExpiry"] ? new Date(medicalHistory["insuranceExpiry"] as string).toISOString().split('T')[0] : ''),
    providerContact: (currentInsurance["providerContact"] as string) || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!patient?.id) return;
    
    setIsSaving(true);
    try {
      const updatedHistory = {
        ...medicalHistory,
        insuranceDetails: formData,
        insuranceProvider: formData.provider,
        insurancePolicyNumber: formData.policyNumber,
        insuranceExpiry: formData.expiryDate,
      };

      await patientService.update(patient.id, {
        medicalHistory: updatedHistory,
      });

      toast.success(locale === 'ar' ? 'تم حفظ بيانات التأمين' : 'Insurance data saved successfully');
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
    <div className="flex flex-col min-h-screen pb-14">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {locale === 'ar' ? 'معلومات التأمين' : 'Insurance Information'}
          </h2>
          <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
            {locale === 'ar' 
              ? 'يساعد تقديم تفاصيل التأمين في تبسيط عملية الفوترة وعملية الرعاية الخاصة بك.' 
              : 'Providing insurance details helps streamline billing and your care process.'}
          </p>
        </div>

        {/* Insurance Provider */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'مزود التأمين' : 'Insurance provider'}
          </label>
          <Input 
            value={formData.provider}
            onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
            placeholder={locale === 'ar' ? 'أدخل اسم شركة التأمين' : 'Enter name of the insurance company'}
            className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
          />
        </div>

        {/* Policy Number */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'رقم البوليصة' : 'Policy number'}
          </label>
          <Input 
            value={formData.policyNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
            placeholder="000000000"
            className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
          />
        </div>

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
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm w-full"
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
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="p-6 fixed bottom-0 left-0 right-0 max-w-[800px] mx-auto w-full">
        <Button 
          disabled={isSaving}
          onClick={handleSave}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
            </div>
          ) : (
            locale === 'ar' ? 'حفظ البيانات' : 'Save data'
          )}
        </Button>
      </div>
    </div>
  );
}
