'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
} from "@/components/ui/select";
import { patientService } from '@/services/patientService';
import { useToastStore } from '@/stores/useToastStore';

interface EmergencyContactPanelProps {
  patient?: ApiPatient;
  onBack?: () => void;
  onRefresh?: () => void;
}

export default function EmergencyContactPanel({ patient, onBack, onRefresh }: EmergencyContactPanelProps) {
  const { locale } = useTranslation();
  const toast = useToastStore();
  
  const medicalHistory = (patient?.medicalHistory as Record<string, unknown>) || {};
  const currentContact = (medicalHistory["emergencyContactDetails"] as Record<string, unknown>) || {};

  const [formData, setFormData] = useState({
    firstName: (currentContact["firstName"] as string) || '',
    lastName: (currentContact["lastName"] as string) || '',
    relationship: (currentContact["relationship"] as string) || '',
    phone: (currentContact["phone"] as string) || '',
    email: (currentContact["email"] as string) || '',
    address: (currentContact["address"] as string) || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!patient?.id) return;
    
    setIsSaving(true);
    try {
      const updatedHistory = {
        ...medicalHistory,
        emergencyContactDetails: formData,
        // For backwards compatibility with other parts of the system
        emergencyContact: `${formData.firstName} ${formData.lastName} (${formData.relationship}) - ${formData.phone}`,
      };

      await patientService.update(patient.id, {
        medicalHistory: updatedHistory,
      });

      toast.success(locale === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
      if (onRefresh) onRefresh();
      if (onBack) onBack();
    } catch (error) {
      console.error('Failed to save emergency contact', error);
      toast.error(locale === 'ar' ? 'فشل حفظ التغييرات' : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const RELATIONSHIPS = [
    { value: 'parent', label: locale === 'ar' ? 'والد/والدة' : 'Parent' },
    { value: 'spouse', label: locale === 'ar' ? 'زوج/زوجة' : 'Spouse' },
    { value: 'sibling', label: locale === 'ar' ? 'أخ/أخت' : 'Sibling' },
    { value: 'child', label: locale === 'ar' ? 'ابن/ابنة' : 'Child' },
    { value: 'friend', label: locale === 'ar' ? 'صديق' : 'Friend' },
    { value: 'other', label: locale === 'ar' ? 'آخر' : 'Other' },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-14">

      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {/* First Name */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'الاسم الأول' : 'First name'}
          </label>
          <Input 
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder={locale === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
            className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'اسم العائلة' : 'Last name'}
          </label>
          <Input 
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder={locale === 'ar' ? 'أدخل اسم العائلة' : 'Enter your last name'}
            className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
          />
        </div>

        {/* Relationship */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'العلاقة' : 'Relationship'}
          </label>
          <Select 
            value={formData.relationship}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
            options={RELATIONSHIPS}
            placeholder={locale === 'ar' ? 'اختر العلاقة' : 'Select your relationship'}
            className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'رقم الهاتف' : 'Phone number'}
          </label>
          <div className="relative group">
            <Input 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+20 102 333 4444"
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <Input 
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="youremail@example.com"
            className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
          />
        </div>

        {/* Address */}
        <div className="space-y-2 pb-8">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'العنوان' : 'Address'}
          </label>
          <Input 
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder={locale === 'ar' ? 'اسم الشارع، المبنى، الشقة' : 'Street Name, Building, Apartment'}
            className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm"
          />
        </div>
      </div>

      {/* Footer Button */}
      <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-50 dark:border-slate-900 fixed bottom-0 left-0 right-0 max-w-[800px] mx-auto w-full">
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
            locale === 'ar' ? 'حفظ التغييرات' : 'Save changes'
          )}
        </Button>
      </div>
    </div>
  );
}
