'use client';

import { Heart, Loader2, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFavorites } from '@/hooks/useFavorites';

export default function FavoriteDoctorsPanel() {
  const { locale } = useTranslation();
  const { favorites, isLoading, toggleFavorite } = useFavorites();

  // Removed unused search effects

  // Removed unused handleSearch

  const handleToggleFavorite = async (doctor: { id: string; fullName: string; avatarUrl?: string; specialization?: string; hospital?: string }) => {
    await toggleFavorite(doctor);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      <div className="space-y-4 px-2 pb-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-slate-300 mb-4 shadow-sm">
              <Heart className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              {locale === "ar" ? "القائمة فارغة" : "Your favorite list is empty"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {favorites.map((doctor) => (
              <div key={doctor.id} className="group relative bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
                <div className="flex gap-4 p-3">
                  <div className="shrink-0">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-md overflow-hidden border-none bg-slate-100">
                      <AvatarImage src={doctor.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-slate-200 text-slate-500 font-bold text-2xl">{doctor.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-8">
                        <h3 className="font-bold text-[16px] sm:text-[18px] text-slate-900 dark:text-slate-50 truncate">
                          {doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`}
                        </h3>
                        <p className="text-[13px] text-slate-400 mt-0.5">
                          {doctor.specialization || (locale === 'ar' ? 'عام' : 'Cardiologist')} • {doctor.hospital || (locale === 'ar' ? 'مستشفى طيبة' : 'Medica Hospital')}
                        </p>

                        <div className="flex items-center gap-2 mt-3 text-indigo-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-[13px] font-medium opacity-80">4.30 PM - 7.30 PM</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleFavorite(doctor)}
                        className="absolute right-4 top-4 h-9 w-9 flex items-center justify-center rounded-full text-indigo-600 hover:scale-110 transition-all"
                      >
                        <Heart className="h-6 w-6 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
