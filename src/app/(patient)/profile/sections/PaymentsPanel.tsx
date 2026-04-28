'use client';

import { useState } from 'react';
import { Plus, Edit2, Check} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patientService';
import { useToastStore } from '@/stores/useToastStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface PaymentsPanelProps {
  patient?: ApiPatient;
  onBack?: () => void;
  onRefresh?: () => void;
}

interface CardInfo {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  isDefault: boolean;
}

export default function PaymentsPanel({ patient, onBack, onRefresh }: PaymentsPanelProps) {
  const { locale } = useTranslation();
  const toast = useToastStore();
  
  const medicalHistory = (patient?.medicalHistory as Record<string, unknown>) || {};
  const paymentDetails = (medicalHistory["paymentDetails"] as Record<string, unknown>) || {
    selectedMethod: 'apple_pay',
    savedCards: [] as CardInfo[],
  };

  const [selectedMethod, setSelectedMethod] = useState<string>((paymentDetails["selectedMethod"] as string) || 'apple_pay');
  const [savedCards, setSavedCards] = useState<CardInfo[]>((paymentDetails["savedCards"] as CardInfo[]) || [
    { id: '1', type: 'visa', last4: '8975', isDefault: false }
  ]);
  
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add Card Form State
  const [newCard, setNewCard] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    isDefault: true,
  });

  const handleAddCard = () => {
    // Basic validation
    if (!newCard.number || newCard.number.length < 4) {
      toast.error(locale === 'ar' ? 'رقم بطاقة غير صالح' : 'Invalid card number');
      return;
    }

    const last4 = newCard.number.slice(-4);
    const card: CardInfo = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'visa', // Default for now
      last4: last4,
      isDefault: newCard.isDefault,
    };

    setSavedCards(prev => [...prev, card]);
    setIsAddCardOpen(false);
    setNewCard({ name: '', number: '', expiry: '', cvv: '', isDefault: true });
    toast.success(locale === 'ar' ? 'تمت إضافة البطاقة' : 'Card added successfully');
  };

  const handleSave = async () => {
    if (!patient?.id) return;
    
    setIsSaving(true);
    try {
      const updatedHistory = {
        ...medicalHistory,
        paymentDetails: {
          selectedMethod,
          savedCards,
        },
      };

      await patientService.update(patient.id, {
        medicalHistory: updatedHistory,
      });

      toast.success(locale === 'ar' ? 'تم حفظ إعدادات الدفع' : 'Payment settings saved successfully');
      if (onRefresh) onRefresh();
      if (onBack) onBack();
    } catch (error) {
      console.error('Failed to save payment info', error);
      toast.error(locale === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const METHODS = [
    { 
      id: 'apple_pay', 
      label: 'Apple Pay', 
      icon: (
        <div className="h-8 w-12 border border-slate-100 dark:border-slate-800 rounded flex items-center justify-center bg-white">
          <span className="font-bold text-[10px] tracking-tighter">Pay</span>
        </div>
      )
    },
    { 
      id: 'google_pay', 
      label: 'Google Pay', 
      icon: (
        <div className="h-8 w-12 border border-slate-100 dark:border-slate-800 rounded flex items-center justify-center bg-white">
           <span className="font-bold text-[10px] tracking-tighter text-blue-500">G</span>
           <span className="font-bold text-[10px] tracking-tighter ml-0.5">Pay</span>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-14">
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-2">
        {/* Payment Methods List */}
        <div className="space-y-0.5">
          {METHODS.map((method) => (
            <div 
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className="flex items-center justify-between p-2 py-5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer group border-b border-slate-50 dark:border-slate-900"
            >
              <div className="flex items-center gap-4">
                {method.icon}
                <span className="text-[17px] font-bold text-slate-800 dark:text-slate-200">{method.label}</span>
              </div>
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === method.id 
                  ? 'border-blue-600 bg-blue-600' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}>
                {selectedMethod === method.id && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>
          ))}

          {/* Saved Cards */}
          {savedCards.map((card) => (
            <div 
              key={card.id}
              onClick={() => setSelectedMethod(card.id)}
              className="flex items-center justify-between p-4 py-5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer group border-b border-slate-50 dark:border-slate-900"
            >
              <div className="flex items-center gap-4">
                <div className="h-8 w-12 border border-slate-100 dark:border-slate-800 rounded flex items-center justify-center bg-white">
                  <span className="font-black text-[10px] text-blue-900 italic">VISA</span>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[17px] font-bold text-slate-800 dark:text-slate-200">****{card.last4}</span>
                   <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                     <Edit2 className="h-5 w-5 text-blue-500" />
                   </button>
                </div>
              </div>
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === card.id 
                  ? 'border-blue-600 bg-blue-600' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}>
                {selectedMethod === card.id && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>
          ))}

          {/* Add Card Button */}
          <button 
            onClick={() => setIsAddCardOpen(true)}
            className="w-full flex items-center gap-4 p-4 py-6 text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
          >
            <div className="h-8 w-8 rounded-full border-2 border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-[17px] font-bold">
              {locale === 'ar' ? 'إضافة بطاقة ائتمان' : 'Add credit card'}
            </span>
          </button>
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

      {/* Add Card Dialog */}
      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[30px] p-8 gap-8 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
          
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-black text-center text-slate-900 dark:text-white">
              {locale === 'ar' ? 'إضافة بطاقة ائتمان' : 'Add credit card'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cardholder Name */}
            <div className="space-y-2">
              <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                {locale === 'ar' ? 'اسم صاحب البطاقة' : 'Cardholder Name'}
              </label>
              <Input 
                value={newCard.name}
                onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                placeholder="000000000"
                className="h-14 rounded-[20px] bg-slate-50/50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                {locale === 'ar' ? 'رقم البطاقة' : 'Card Number'}
              </label>
              <Input 
                value={newCard.number}
                onChange={(e) => setNewCard(prev => ({ ...prev, number: e.target.value }))}
                placeholder="000000000"
                className="h-14 rounded-[20px] bg-slate-50/50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base"
                maxLength={16}
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiration Date'}
                </label>
                <Input 
                  value={newCard.expiry}
                  onChange={(e) => setNewCard(prev => ({ ...prev, expiry: e.target.value }))}
                  placeholder="MM/YY"
                  className="h-14 rounded-[20px] bg-slate-50/50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                  CVV
                </label>
                <Input 
                  value={newCard.cvv}
                  onChange={(e) => setNewCard(prev => ({ ...prev, cvv: e.target.value }))}
                  placeholder="***"
                  className="h-14 rounded-[20px] bg-slate-50/50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 px-6 text-base text-center"
                  maxLength={3}
                  type="password"
                />
              </div>
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox 
                id="default" 
                checked={newCard.isDefault}
                onCheckedChange={(checked) => setNewCard(prev => ({ ...prev, isDefault: !!checked }))}
                className="h-6 w-6 rounded-md border-slate-200 dark:border-slate-800 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="default" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {locale === 'ar' ? 'ضبط كطريقة دفع افتراضية' : 'Set up as default payment method'}
              </label>
            </div>
          </div>

          <Button 
            onClick={handleAddCard}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full shadow-lg shadow-blue-500/30"
          >
            {locale === 'ar' ? 'إضافة بطاقة' : 'Add card'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
