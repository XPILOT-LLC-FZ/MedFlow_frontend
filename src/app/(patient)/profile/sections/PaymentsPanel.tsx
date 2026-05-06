'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient, ApiPatientPaymentHistoryItem } from '@/types';
import { patientService } from '@/services/patientService';
import { Pencil, Check, HandCoins } from 'lucide-react';

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
  const [selectedWallet, setSelectedWallet] = useState<string>('apple');
  const [cards, setCards] = useState<{ id: string; number: string; expiry: string; holder: string }[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '', isDefault: true });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('saved_cards');
      if (stored) {
        try {
          setCards(JSON.parse(stored));
        } catch {
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && cards.length > 0) {
      localStorage.setItem('saved_cards', JSON.stringify(cards));
    }
  }, [cards]);

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

  const formatPaymentStatus = (status: ApiPatientPaymentHistoryItem['paymentStatus'] | 'FAILED') => {
    switch (status) {
      case 'PAID':
        return locale === 'ar' ? 'ناجحة' : 'Successful';
      case 'PENDING':
        return locale === 'ar' ? 'قيد الانتظار' : 'Pending';
      case 'FAILED':
        return locale === 'ar' ? 'فاشلة' : 'Failed';
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
          <div className="space-y-4 max-w-sm mx-auto p-2 sm:p-4">
            {!showAddCard ? (
              <>
                <div className="bg-[#F8F9FA] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-6 rounded-[24px] select-none">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-md font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                      {locale === 'ar' ? 'طريقة الدفع' : 'Payment method'}
                    </h5>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 transition-all"
                    >
                      <Pencil className="h-4 w-4 stroke-[2]" />
                    </button>
                  </div>

                  <div className="flex flex-col">
                    {/* Apple Pay */}
                    <div
                      onClick={() => setSelectedWallet('apple')}
                      className="flex items-center justify-between py-4 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-8 px-2 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center bg-white dark:bg-slate-800 shrink-0 gap-1">
                          <svg viewBox="0 0 384 512" className="h-3.5 w-3.5 fill-current text-slate-800 dark:text-slate-100">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                          </svg>
                          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Pay</span>
                        </div>
                        <span className="text-md font-medium text-slate-800 dark:text-slate-200">Apple Pay</span>
                      </div>
                      {selectedWallet === 'apple' ? (
                        <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-blue-500" />
                      )}
                    </div>

                    {/* Google Pay */}
                    <div
                      onClick={() => setSelectedWallet('google')}
                      className="flex items-center justify-between py-4 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-8 px-2 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center bg-white dark:bg-slate-800 shrink-0">
                          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100"><span className="text-[#4285F4]">G</span> Pay</span>
                        </div>
                        <span className="text-base font-medium text-slate-800 dark:text-slate-200">Google Pay</span>
                      </div>
                      {selectedWallet === 'google' ? (
                        <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-blue-500" />
                      )}
                    </div>

                    {/* Dynamic Cards */}
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedWallet(card.id)}
                        className="flex items-center justify-between py-4 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-8 px-2 rounded flex items-center justify-center bg-[#E5F1FB] dark:bg-blue-900/30 shrink-0">
                            <span className="text-[12px] font-black italic tracking-tight text-[#1434CB] dark:text-blue-300">VISA</span>
                          </div>
                          <span className="text-base font-medium text-slate-800 dark:text-slate-200">
                            ****{card.number.slice(-4) || '8975'}
                          </span>
                        </div>
                        {selectedWallet === card.id ? (
                          <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-blue-500" />
                        )}
                      </div>
                    ))}

                    {/* Cash */}
                    <div
                      onClick={() => setSelectedWallet('cash')}
                      className="flex items-center justify-between py-4 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <HandCoins className="h-4 w-4 text-slate-700 dark:text-slate-300 stroke-[1.5]" />
                        <span className="text-base font-medium text-slate-800 dark:text-slate-200">{locale === 'ar' ? 'كاش' : 'Cash'}</span>
                      </div>
                      {selectedWallet === 'cash' ? (
                        <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-blue-500" />
                      )}
                    </div>

                    {/* Add Card */}
                    <div
                      onClick={() => {
                        setShowAddCard(true);
                      }}
                      className="flex items-center justify-between py-4 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-12 border border-slate-400 dark:border-slate-500 rounded flex flex-col justify-center px-1 shrink-0 bg-transparent">
                          <div className="w-full h-[1px] bg-slate-300 dark:bg-slate-600 mb-1" />
                          <div className="flex justify-end pr-1">
                            <div className="w-2 h-[2px] bg-slate-300 dark:bg-slate-600" />
                          </div>
                        </div>
                        <span className="text-base font-medium text-slate-800 dark:text-slate-200">{locale === 'ar' ? 'إضافة بطاقة ائتمان' : 'add new Credit card'}</span>
                      </div>
                      <div className="h-4 w-4 rounded-full border border-blue-500" />
                    </div>
                  </div>
                </div>



                <button
                  onClick={() => alert(locale === 'ar' ? 'تم الحفظ بنجاح' : 'Payment method saved successfully')}
                  className="w-full py-3.5 bg-blue-600 text-white font-extrabold rounded-2xl shadow-md hover:bg-blue-700 transition-all mt-4 text-[15px]"
                >
                  {locale === 'ar' ? 'حفظ البيانات' : 'Save data'}
                </button>
              </>
            ) : (
              /* Add credit card view */
              <div className="space-y-4 animate-in fade-in duration-200 select-none">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {locale === 'ar' ? 'إضافة بطاقة ائتمان' : 'Add credit card'}
                  </h3>
                  <button
                    onClick={() => setShowAddCard(false)}
                    className="text-sm font-bold text-slate-400 hover:text-slate-600"
                  >
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                <div className="space-y-3 mt-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1 block">
                      {locale === 'ar' ? 'اسم صاحب البطاقة' : 'Cardholder Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={locale === 'ar' ? 'مثال: جون دو' : 'e.g. John Doe'}
                      value={cardForm.cardholderName}
                      onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1 block">
                      {locale === 'ar' ? 'رقم البطاقة' : 'Card Number'}
                    </label>
                    <input
                      type="text"
                      placeholder={locale === 'ar' ? '٠٠٠٠ ٠٠٠٠ ٠٠٠٠ ٠٠٠٠' : '0000 0000 0000 0000'}
                      value={cardForm.cardNumber}
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1 block">
                        {locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiration Date'}
                      </label>
                      <input
                        type="text"
                        placeholder={locale === 'ar' ? 'شهر/سنة' : 'MM/YY'}
                        value={cardForm.expiryDate}
                        onChange={(e) => setCardForm({ ...cardForm, expiryDate: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1 block">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder={locale === 'ar' ? '***' : '***'}
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 select-none">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={cardForm.isDefault}
                      onChange={(e) => setCardForm({ ...cardForm, isDefault: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isDefault" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {locale === 'ar' ? 'تعيين كطريقة دفع افتراضية' : 'Set up as default payment method'}
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!cardForm.cardholderName || !cardForm.cardNumber) {
                      alert(locale === 'ar' ? 'الرجاء إدخال الاسم ورقم البطاقة' : 'Please enter cardholder name and card number');
                      return;
                    }
                    const newCardId = `card-${Date.now()}`;
                    setCards([
                      ...cards,
                      {
                        id: newCardId,
                        number: cardForm.cardNumber,
                        expiry: cardForm.expiryDate || '12/28',
                        holder: cardForm.cardholderName,
                      },
                    ]);
                    setSelectedWallet(newCardId);
                    setCardForm({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '', isDefault: true });
                    setShowAddCard(false);
                  }}
                  className="w-full py-3.5 bg-blue-600 text-white font-extrabold rounded-2xl shadow-md hover:bg-blue-700 transition-all mt-6 text-[15px]"
                >
                  {locale === 'ar' ? 'إضافة البطاقة' : 'Add card'}
                </button>
              </div>
            )}
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
