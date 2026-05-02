'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiPatient, ApiLoyaltyTransaction } from '@/types';
import { patientService } from '@/services/patientService';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface PointsPanelProps {
  patient?: ApiPatient;
  onBack?: () => void;
}

export default function PointsPanel({ patient }: PointsPanelProps) {
  const { locale } = useTranslation();
  const router = useRouter();
  const loyaltyPoints = patient?.loyaltyPoints ?? 0;
  
  const [history, setHistory] = useState<ApiLoyaltyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await patientService.getLoyaltyHistory();
        setHistory(data);
      } catch (error) {
        console.error('Failed to load loyalty history', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 pb-10">

      {/* Main Card */}
      <div>
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#6297FF] to-[#8C6AFF] p-6 shadow-sm shadow-blue-500/20">
          {/* Content */}
          <div className="relative z-10 flex flex-col items-start gap-1">
            <span className="text-white/90 text-lg font-medium">
              {locale === 'ar' ? 'نقاطك الذكية' : 'Your wise points'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[42px] font-black text-orange-400 drop-shadow-sm leading-tight">
                {loyaltyPoints}
              </span>
              <span className="text-2xl font-black text-orange-400 uppercase tracking-tight">
                {locale === 'ar' ? 'نقطة' : 'pts'}
              </span>
            </div>
            
            <button 
              onClick={() => router.push('/appointments')}
              className="mt-6 px-8 py-3 bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold rounded-full transition-all shadow-lg shadow-blue-900/30 transform active:scale-95"
            >
              {locale === 'ar' ? 'استبدال' : 'Redeem'}
            </button>
          </div>

          {/* Illustration */}
          <div className="absolute top-4 right-[-10px] w-[140px] h-[140px] pointer-events-none drop-shadow-2xl">
            <GiftBoxSVG />
          </div>
          
          {/* Decorative small stars/blobs */}
          <div className="absolute top-10 right-4 w-2 h-2 bg-yellow-300 rounded-full blur-[1px] opacity-70 animate-pulse" />
          <div className="absolute bottom-10 right-32 w-1.5 h-1.5 bg-white rounded-full blur-[1px] opacity-50" />
        </div>
      </div>

      {/* History Activity Section */}
      <div className="px-2 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {locale === 'ar' ? 'سجل النشاط' : 'History Activity'}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-sm text-slate-400 font-medium">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading history...'}
            </span>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-6 mt-4">
            {(() => {
              const isToday = (date: string) => {
                const d = new Date(date);
                const now = new Date();
                return d.getDate() === now.getDate() &&
                       d.getMonth() === now.getMonth() &&
                       d.getFullYear() === now.getFullYear();
              };

              const hasToday = history.some(item => isToday(item.createdAt));

              return (
                <>
                  {hasToday && (
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {locale === 'ar' ? 'اليوم' : 'TODAY'}
                    </div>
                  )}
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-slate-50 dark:border-slate-900 shadow-sm ${item.type === 'EARN' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                          <span className="text-xl font-bold">
                            {item.type === 'EARN' ? '✨' : '🎁'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            {locale === 'ar' ? item.descriptionAr || item.description : item.description}
                          </h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {format(new Date(item.createdAt), 'PPp', { locale: locale === 'ar' ? arSA : undefined })}
                          </span>
                        </div>
                      </div>
                      <div className={`text-[19px] font-black ${item.type === 'EARN' ? 'text-blue-500' : 'text-red-500'}`}>
                        {item.type === 'EARN' ? '+' : '-'}{Math.abs(item.amount)}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400 font-medium">
              {locale === 'ar' ? 'لا يوجد سجل نشاط بعد' : 'No activity history yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GiftBoxSVG() {
  return (
    <svg width="140" height="140" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background Glow */}
      <circle cx="100" cy="110" r="60" fill="url(#paint0_radial)" fillOpacity="0.4" />
      
      {/* Box Body */}
      <path d="M40 90L100 120L160 90V140L100 170L40 140V90Z" fill="#7B61FF" stroke="#5D45DB" strokeWidth="2" />
      <path d="M100 120V170" stroke="#5D45DB" strokeWidth="2" />
      
      {/* Box Lid (Floating/Open) */}
      <g filter="url(#filter0_d)">
        <path d="M45 75L100 100L155 75L100 50L45 75Z" fill="#917AFF" />
        <path d="M45 75L100 100L155 75" stroke="#5D45DB" strokeWidth="2" />
      </g>
      
      {/* Vouchers (Floating) */}
      <rect x="70" y="40" width="40" height="25" rx="4" transform="rotate(-15 70 40)" fill="#FFA500" stroke="#CC8400" strokeWidth="1.5" />
      <rect x="110" y="55" width="45" height="28" rx="4" transform="rotate(10 110 55)" fill="#FFD700" stroke="#CC8400" strokeWidth="1.5" />
      
      {/* Voucher Text details (Lines) */}
      <line x1="75" y1="48" x2="95" y2="43" stroke="#CC8400" strokeWidth="2" strokeLinecap="round" transform="rotate(-15 70 40)" />
      <line x1="118" y1="65" x2="142" y2="70" stroke="#CC8400" strokeWidth="2" strokeLinecap="round" transform="rotate(10 110 55)" />
      
      {/* Stars */}
      <path d="M160 40L162 45L167 46L162 47L160 52L158 47L153 46L158 45L160 40Z" fill="#FFD700" />
      <path d="M30 60L32 65L37 66L32 67L30 72L28 67L23 66L28 65L30 60Z" fill="#FFD700" />
      
      <defs>
        <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 110) rotate(90) scale(60)">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id="filter0_d" x="35" y="45" width="130" height="70" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}
