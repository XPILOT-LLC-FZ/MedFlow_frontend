'use client';

import { CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useCallback, useEffect } from 'react';
import { notificationsService } from '@/services/notificationsService';
import { toast } from 'sonner';

interface NotificationsPanelProps {
  onSave?: (preferences: Record<string, boolean>) => Promise<void>;
}

export default function NotificationsPanel({ onSave }: NotificationsPanelProps) {
  const { locale } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    appointments: true,
    medications: true,
    test_results: true,
    general: true,
    marketing: false,
  });

  const handleToggle = useCallback((key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await notificationsService.getPreferences() as Record<string, unknown>;
        if (data?.["notificationSettings"]) {
          setNotifications(prev => ({ ...prev, ...(data["notificationSettings"] as Partial<typeof notifications>) }));
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Fallback for legacy format if any
          setNotifications(prev => ({ ...prev, ...data as Partial<typeof notifications> }));
        }
      } catch (e) {
        console.error('Failed to load notification preferences', e);
      }
    }
    load();
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave?.(notifications);
      await notificationsService.updatePreferences({ notificationSettings: notifications });
      toast.success(locale === 'ar' ? 'تم حفظ التفضيلات' : 'Preferences saved');
    } catch {
      toast.error(locale === 'ar' ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [notifications, onSave, locale]);

  return (
      <CardContent className="p-2 space-y-3">
        {[
          { key: 'appointments' as const, label: locale === "ar" ? "تنبيهات المواعيد" : "Appointment Alerts", desc: locale === "ar" ? "تذكيرات بالمواعيد القادمة" : "Reminders for upcoming appointments" },
          { key: 'medications' as const, label: locale === "ar" ? "تنبيهات الأدوية" : "Medication Reminders", desc: locale === "ar" ? "تذكيرات بأوقات الأدوية" : "Reminders to take medications" },
          { key: 'test_results' as const, label: locale === "ar" ? "نتائج الاختبارات" : "Test Results", desc: locale === "ar" ? "إشعارات عند توفر النتائج" : "Notifications when results are ready" },
          { key: 'general' as const, label: locale === "ar" ? "التحديثات العامة" : "General Updates", desc: locale === "ar" ? "أخبار المنصة والمقالات" : "Platform news and health tips" },
          { key: 'marketing' as const, label: locale === "ar" ? "عروض ترويجية" : "Promotional Offers", desc: locale === "ar" ? "عروض خاصة ومزايا متميزة" : "Special offers and exclusive deals" },
        ].map((item) => (
          <div key={item.key} className="flex items-start justify-between p-2">
            <div className="flex-1">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.label}</p>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
            <Switch 
              checked={notifications[item.key]}
              onCheckedChange={() => handleToggle(item.key)}
              className="ml-4"
            />
          </div>
        ))}
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl disabled:opacity-50"
        >
          {isSaving ? `${locale === "ar" ? "جاري الحفظ" : "Saving..."}` : `${locale === "ar" ? "حفظ التفضيلات" : "Save Preferences"}`}
        </Button>
      </CardContent>
  );
}
