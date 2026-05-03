'use client';

import { useState, useEffect } from 'react';
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
          <div className="space-y-4 max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-[24px] shadow-sm animate-in fade-in duration-200">
            {!showAddCard ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {locale === 'ar' ? 'إعدادات الدفع' : 'Payment settings'}
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Apple Pay */}
                  <div
                    onClick={() => setSelectedWallet('apple')}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all select-none ${
                      selectedWallet === 'apple'
                        ? 'bg-blue-50/60 border-blue-600 dark:bg-blue-900/20 ring-1 ring-blue-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl flex items-center justify-center text-slate-800 dark:text-slate-200">
                        <span className="text-xl">🍎</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200">Apple Pay</span>
                    </div>
                    <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center">
                      {selectedWallet === 'apple' && <div className="h-3 w-3 bg-blue-600 rounded-full" />}
                    </div>
                  </div>

                  {/* Google Pay */}
                  <div
                    onClick={() => setSelectedWallet('google')}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all select-none ${
                      selectedWallet === 'google'
                        ? 'bg-blue-50/60 border-blue-600 dark:bg-blue-900/20 ring-1 ring-blue-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl flex items-center justify-center text-slate-800 dark:text-slate-200">
                        <span className="text-xl">📱</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200">Google Pay</span>
                    </div>
                    <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center">
                      {selectedWallet === 'google' && <div className="h-3 w-3 bg-blue-600 rounded-full" />}
                    </div>
                  </div>

                  {/* Cash */}
                  <div
                    onClick={() => setSelectedWallet('cash')}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all select-none ${
                      selectedWallet === 'cash'
                        ? 'bg-blue-50/60 border-blue-600 dark:bg-blue-900/20 ring-1 ring-blue-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl flex items-center justify-center text-slate-800 dark:text-slate-200">
                        <span className="text-xl">💵</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200">{locale === 'ar' ? 'كاش' : 'Cash'}</span>
                    </div>
                    <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center">
                      {selectedWallet === 'cash' && <div className="h-3 w-3 bg-blue-600 rounded-full" />}
                    </div>
                  </div>

                  {/* Dynamic Cards */}
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => setSelectedWallet(card.id)}
                      className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all select-none ${
                        selectedWallet === card.id
                          ? 'bg-blue-50/60 border-blue-600 dark:bg-blue-900/20 ring-1 ring-blue-600'
                          : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl flex items-center justify-center text-slate-800 dark:text-slate-200">
                          <span className="text-xl">💳</span>
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                            Visa **** {card.number.slice(-4) || '8975'}
                          </span>
                          <p className="text-[10px] font-medium text-slate-500">Expires {card.expiry}</p>
                        </div>
                      </div>
                      <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center">
                        {selectedWallet === card.id && <div className="h-3 w-3 bg-blue-600 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCard(true)}
                  className="w-full flex items-center gap-2 py-3 px-1 mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 select-none hover:underline"
                >
                  <span className="text-lg">+</span> {locale === 'ar' ? 'إضافة بطاقة ائتمان' : 'Add credit card'}
                </button>

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
                      placeholder="e.g. John Doe"
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
                      placeholder="0000 0000 0000 0000"
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
                        placeholder="MM/YY"
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
                        placeholder="***"
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
