'use client';

import { useState, useEffect, useCallback } from 'react';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

export function useFavorites() {
  const { locale } = useTranslation();
  const [favorites, setFavorites] = useState<Array<{ id: string; fullName: string; avatarUrl?: string; specialization?: string; hospital?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientService.getFavoriteDoctors();
      setFavorites(data.map(d => ({
        id: d.id,
        fullName: d.fullName,
        avatarUrl: d.user?.avatarUrl || undefined,
        specialization: d.specialization,
        hospital: (d.preferences as Record<string, unknown>)?.["hospital"] as string || undefined
      })) || []);
    } catch (e) {
      console.error('Failed to load favorites', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (doctor: { id: string; fullName: string; avatarUrl?: string; specialization?: string; hospital?: string }) => {
    const isFav = favorites.some(f => f.id === doctor.id);
    try {
      if (isFav) {
        await patientService.removeFavoriteDoctor(doctor.id);
        setFavorites(prev => prev.filter(f => f.id !== doctor.id));
        toast.success(locale === 'ar' ? 'تمت الإزالة من المفضلات' : 'Removed from favorites');
      } else {
        await patientService.addFavoriteDoctor(doctor.id);
        setFavorites(prev => [...prev, doctor]);
        toast.success(locale === 'ar' ? 'تمت الإضافة إلى المفضلات' : 'Added to favorites');
      }
    } catch {
      toast.error(locale === 'ar' ? 'فشلت العملية' : 'Action failed');
    }
  };

  const isFavorite = (doctorId: string) => favorites.some(f => f.id === doctorId);

  return { favorites, isLoading, toggleFavorite, isFavorite, refreshFavorites: loadFavorites };
}
