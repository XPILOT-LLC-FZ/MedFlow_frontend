'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
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
    email: (currentContact["email"] as string) || '',
    address: (currentContact["address"] as string) || '',
  });

  let currentPhone = (currentContact["phone"] as string) || '';
  let initialCountryCode = '+20';
  
  const commonCountryCodes = [
    "+20", "+966", "+971", "+965", "+974", "+968", "+973", "+962", "+961", "+212",
    "+213", "+216", "+1", "+44"
  ];

  if (currentPhone.startsWith("+")) {
    const matchedCode = commonCountryCodes.find(code => currentPhone.startsWith(code));
    if (matchedCode) {
      initialCountryCode = matchedCode;
      currentPhone = currentPhone.substring(matchedCode.length);
    }
  }

  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [typedPhone, setTypedPhone] = useState(currentPhone);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!patient?.id) return;
    
    let finalPhone = typedPhone.trim();
    if (finalPhone.startsWith("+")) {
      finalPhone = finalPhone.replace(/^\+\d+/, "");
    }
    if (finalPhone.startsWith("0")) {
      finalPhone = finalPhone.substring(1);
    }
    finalPhone = `${countryCode}${finalPhone}`;

    setIsSaving(true);
    try {
      const updatedFormData = {
        ...formData,
        phone: finalPhone,
      };

      const updatedHistory = {
        ...medicalHistory,
        emergencyContactDetails: updatedFormData,
        emergencyContact: `${formData.firstName} ${formData.lastName} (${formData.relationship}) - ${finalPhone}`,
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
    { value: 'father', label: locale === 'ar' ? 'أب' : 'Father' },
    { value: 'mother', label: locale === 'ar' ? 'أم' : 'Mother' },
    { value: 'husband', label: locale === 'ar' ? 'زوج' : 'Husband' },
    { value: 'wife', label: locale === 'ar' ? 'زوجة' : 'Wife' },
    { value: 'brother', label: locale === 'ar' ? 'أخ' : 'Brother' },
    { value: 'sister', label: locale === 'ar' ? 'أخت' : 'Sister' },
    { value: 'son', label: locale === 'ar' ? 'ابن' : 'Son' },
    { value: 'daughter', label: locale === 'ar' ? 'ابنة' : 'Daughter' },
    { value: 'relative', label: locale === 'ar' ? 'قريب' : 'Relative' },
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
            {locale === 'ar' ? 'اسم العائلة' : 'اسم العائلة'}
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
          <div className="relative">
            <select 
              value={formData.relationship}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
              className="w-full h-14 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-6 pr-12 text-base shadow-sm focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-slate-300 outline-none cursor-pointer appearance-none"
            >
              <option value="" disabled>{locale === 'ar' ? 'اختر العلاقة' : 'Select your relationship'}</option>
              {RELATIONSHIPS.map((rel) => (
                <option key={rel.value} value={rel.value}>{rel.label}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {locale === 'ar' ? 'رقم الهاتف' : 'Phone number'}
          </label>
          <div className="flex gap-2">
            <div className="relative h-14 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2 min-w-[85px]">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              >
                <option value="+20">+20</option>
                <option value="+966">+966</option>
                <option value="+971">+971</option>
                <option value="+965">+965</option>
                <option value="+974">+974</option>
                <option value="+968">+968</option>
                <option value="+973">+973</option>
                <option value="+962">+962</option>
                <option value="+961">+961</option>
                <option value="+212">+212</option>
                <option value="+213">+213</option>
                <option value="+216">+216</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
              <span className="font-bold text-slate-700 dark:text-slate-200">{countryCode}</span>
              <ChevronRight className="h-4 w-4 text-slate-400 rotate-90 shrink-0" />
            </div>
            <Input 
              value={typedPhone}
              onChange={(e) => setTypedPhone(e.target.value)}
              placeholder="000 000 0000"
              className="h-14 rounded-[20px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base shadow-sm flex-1"
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
            placeholder={locale === 'ar' ? 'مثال: mail@example.com' : 'e.g. mail@example.com'}
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
