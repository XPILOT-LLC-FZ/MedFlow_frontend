'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient, ApiPatientPaymentHistoryItem } from '@/types';
import { patientService } from '@/services/patientService';

interface PaymentsPanelProps {
  patient?: ApiPatient;
  onBack?: () => void;
  onRefresh?: () => void;
}

export default function PaymentsPanel({ patient }: PaymentsPanelProps) {
  const { locale } = useTranslation();
  const [payments, setPayments] = useState<ApiPatientPaymentHistoryItem[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (patient?.id) {
      const loadPayments = async () => {
        setIsLoadingPayments(true);
        try {
          const data = await patientService.getPaymentHistory();
          setPayments(data);
        } catch (error) {
          console.error("Failed to load payment history", error);
        } finally {
          setIsLoadingPayments(false);
        }
      };
      void loadPayments();
    }
  }, [patient?.id]);

  const [activeTab, setActiveTab] = useState<'history' | 'wallets'>('history');

  const formatPaymentMethod = (method?: ApiPatientPaymentHistoryItem["paymentMethodType"]) => {
    switch (method) {
      case 'ONSITE_CASH':
        return locale === 'ar' ? 'نقدًا في العيادة' : 'Onsite Cash';
      case 'ONSITE_CARD':
        return locale === 'ar' ? 'بطاقة في العيادة' : 'Onsite Card';
      case 'ONLINE_CARD':
        return locale === 'ar' ? 'بطاقة إلكترونية' : 'Online Card';
      case 'ONLINE_WALLET':
        return locale === 'ar' ? 'محفظة إلكترونية' : 'Online Wallet';
      default:
        return locale === 'ar' ? 'غير محدد' : 'Not specified';
    }
  };

  const formatPaymentStatus = (status: ApiPatientPaymentHistoryItem['paymentStatus']) => {
    switch (status) {
      case 'PAID':
        return locale === 'ar' ? 'ناجحة' : 'Successful';
      case 'PENDING':
        return locale === 'ar' ? 'قيد الانتظار' : 'Pending';
      case 'PARTIAL':
        return locale === 'ar' ? 'جزئية' : 'Partial';
      case 'REFUNDED':
        return locale === 'ar' ? 'مستردة' : 'Refunded';
      case 'OVERDUE':
        return locale === 'ar' ? 'متأخرة' : 'Overdue';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* Tabs Switcher */}
      <div className="p-1 bg-slate-50 dark:bg-slate-800/60 rounded-[18px] flex gap-1 mb-2 shadow-sm border border-slate-100/80 dark:border-slate-800/80 mx-1">
        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex-1 py-3 text-[14px] font-extrabold rounded-2xl transition-all ${
            activeTab === 'wallets' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
          }`}
        >
          {locale === 'ar' ? 'المحافظ' : 'Wallets'}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-[14px] font-extrabold rounded-2xl transition-all ${
            activeTab === 'history' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
          }`}
        >
          {locale === 'ar' ? 'سجل المدفوعات' : 'Payment History'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-2">
        {activeTab === 'wallets' ? (
          <div className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100">
                  {locale === 'ar' ? 'طرق الدفع غير محفوظة بعد' : 'Saved payment methods are not available yet'}
                </p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {locale === 'ar'
                    ? 'نحفظ سجل الفواتير الحقيقي فقط في الوقت الحالي. يتم اختيار طريقة الدفع أثناء الحجز أو الدفع في العيادة.'
                    : 'Only real invoice history is stored right now. Payment methods are selected during booking or at the clinic.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Real Payments History Section */
          <div className="px-1 pb-20">
            <div className="space-y-3">
              {isLoadingPayments ? (
                <div className="flex justify-center p-8">
                  <span className="h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : payments.length > 0 ? (
                payments.map((tx) => (
                  <div 
                    key={tx.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all rounded-[24px] flex justify-between items-center"
                  >
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-200">
                        {tx.appointment?.type === "CONSULTATION" ? (locale === 'ar' ? 'استشارة' : 'Consultation') : (tx.appointment?.serviceName || tx.appointment?.type || 'Service')}
                      </h4>
                      <p className="text-[12px] font-bold text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                        {formatPaymentMethod(tx.paymentMethodType)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[16px] font-black text-slate-800 dark:text-slate-100">
                        AED {tx.totalAmount?.toFixed(2)}
                      </span>
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full tracking-wider uppercase ${
                        tx.paymentStatus === 'PAID' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : tx.paymentStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {formatPaymentStatus(tx.paymentStatus)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 mt-4">
                  <p className="text-sm font-bold text-slate-500">
                    {locale === 'ar' ? 'لا يوجد سجل مدفوعات' : 'No payment history found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
