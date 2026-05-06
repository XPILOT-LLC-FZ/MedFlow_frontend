"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  CreditCard,
  LayoutGrid,
  Bell,
  Heart,
  Shield as ShieldIcon,
  Camera,
  Upload,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle2,
  Key,
  Lock,
  ChevronDown,
  Info,
  FileText,
  Repeat2,
  Printer,
  Banknote,
  Wallet,
  ArrowUpDown,
  Clock,
  GripVertical,
  Sparkles,
  AlertTriangle,
  Check,
  Zap,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationKey } from "@/lib/i18n";

export default function ReceptionProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { success, error } = useToastStore();
  const { t, isRTL } = useTranslation();

  const TABS = [
    { id: "profile", label: t("profile") || (isRTL ? "الملف الشخصي" : "Profile"), icon: User },
    { id: "billing", label: t("billing") || (isRTL ? "الفواتير" : "Billing"), icon: CreditCard },
    { id: "queue", label: t("queueManagement") || (isRTL ? "إدارة الطابور" : "Queue Management"), icon: LayoutGrid },
    { id: "notifications", label: t("notifications") || (isRTL ? "التنبيهات" : "Notifications"), icon: Bell },
    { id: "patient-prefs", label: t("patientPreferences") || (isRTL ? "تفضيلات المريض" : "Patient Preferences"), icon: Heart },
    { id: "permissions", label: t("permissions") || (isRTL ? "الصلاحيات" : "Permissions"), icon: ShieldIcon },
  ];

  const [activeTab, setActiveTab] = useState("profile");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState(isRTL ? "رئيس موظفي الاستقبال" : "Head Receptionist");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+1 (555) 222-3397");
  const [isSaving, setIsSaving] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);

  useEffect(() => {
    setFullName(user?.name ?? (isRTL ? "سارة جينكينز" : "Sarah Jenkins"));
    setEmail(user?.email ?? "sjenkins@cityhealth.com");
  }, [user, isRTL]);

  const saveProfile = async () => {
    if (fullName.trim().length < 2) {
      error(isRTL ? "يجب أن يكون الاسم حرفين على الأقل" : "Name must be at least 2 characters");
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateProfile({ name: fullName.trim() });
      if (!result.success) { error(result.error || (isRTL ? "فشل تحديث الملف الشخصي" : "Failed to update profile")); return; }
      success(isRTL ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
    } catch (err) {
      error(err instanceof Error ? err.message : (isRTL ? "فشل تحديث الملف الشخصي" : "Failed to update profile"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20 font-sans relative -m-4 md:-m-8">
      {/* Page Header */}
      <div className={cn("mb-8 space-y-1", isRTL ? "text-right" : "text-left")}>
        <h1 className="text-2xl font-bold text-slate-900">{t("profileSettings") || (isRTL ? "إعدادات الملف الشخصي" : "Profile Settings")}</h1>
        <p className="text-slate-400 text-sm font-medium">{isRTL ? "إدارة معلوماتك الشخصية وتفاصيل الاتصال وأمان حسابك." : "Manage your personal information, contact details, and account security."}</p>
      </div>

      <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-7")}>
        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-5 py-4 text-[13px] font-bold transition-all",
                    isRTL ? "text-right border-l-0 border-r-[3px] flex-row-reverse" : "text-left border-l-[3px] flex-row",
                    active
                      ? "bg-blue-50 text-[#3B82F6] " + (isRTL ? "border-r-[3px] border-r-[#3B82F6]" : "border-l-[3px] border-l-[#3B82F6]")
                      : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-[#3B82F6]" : "text-slate-400")} size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Content ── */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === "profile" && (
            <>
              {/* Profile Information */}
              <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-8 space-y-8">
                {/* Section Header */}
                <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-[16px] font-bold text-slate-900">{t("profileInformation") || (isRTL ? "معلومات الملف الشخصي" : "Profile Information")}</h2>
                </div>

                {/* Avatar Upload */}
                <div className={cn("flex items-center gap-6", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <div className="relative shrink-0">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah" />
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-2xl">SJ</AvatarFallback>
                    </Avatar>
                    <button className={cn("absolute bottom-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md border-2 border-white hover:bg-blue-700 transition-colors", isRTL ? "left-0" : "right-0")}>
                      <Camera className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className={cn("space-y-2", isRTL ? "text-right" : "text-left")}>
                    <button className={cn("flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors", isRTL ? "flex-row-reverse" : "flex-row")}>
                      <Upload className="h-4 w-4 text-slate-400" />
                      {isRTL ? "تحميل الصورة" : "Upload Photo"}
                    </button>
                    <p className="text-[11px] font-bold text-slate-400">{isRTL ? "JPG, PNG أو GIF – الحجم الأقصى 1 ميجابايت" : "JPG, PNG or GIF – Max 1MB"}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label={t("fullName") || (isRTL ? "الاسم الكامل" : "Full Name")}
                    value={fullName}
                    onChange={setFullName}
                    placeholder={isRTL ? "سارة جينكينز" : "Sarah Jenkins"}
                    isRTL={isRTL}
                  />
                  <FormField
                    label={t("jobTitle") || (isRTL ? "المسمى الوظيفي" : "Job Title")}
                    value={jobTitle}
                    onChange={setJobTitle}
                    placeholder={isRTL ? "رئيس موظفي الاستقبال" : "Head Receptionist"}
                    isRTL={isRTL}
                  />
                  <FormField
                    label={t("emailAddress") || (isRTL ? "عنوان البريد الإلكتروني" : "Email Address")}
                    value={email}
                    onChange={setEmail}
                    icon={<Mail className="h-4 w-4 text-blue-400" />}
                    placeholder="sjenkins@cityhealth.com"
                    isRTL={isRTL}
                  />
                  <FormField
                    label={t("phoneNumber") || (isRTL ? "رقم الهاتف" : "Phone Number")}
                    value={phone}
                    onChange={setPhone}
                    icon={<Phone className="h-4 w-4 text-slate-400" />}
                    placeholder="+1 (555) 222-3397"
                    isRTL={isRTL}
                  />
                </div>

                {/* Action Buttons */}
                <div className={cn("flex items-center gap-3 pt-2 border-t border-slate-50", isRTL ? "justify-start flex-row-reverse" : "justify-end flex-row")}>
                  <Button
                    variant="outline"
                    className="h-11 px-8 rounded-2xl border-slate-200 font-bold text-slate-500 hover:bg-slate-50 bg-white text-[13px]"
                    onClick={() => { setFullName(user?.name ?? (isRTL ? "سارة جينكينز" : "Sarah Jenkins")); setJobTitle(isRTL ? "رئيس موظفي الاستقبال" : "Head Receptionist"); setPhone("+1 (555) 222-3397"); }}
                  >
                    {t("discard") || (isRTL ? "تجاهل" : "Discard")}
                  </Button>
                  <Button
                    onClick={() => void saveProfile()}
                    disabled={isSaving}
                    className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]"
                  >
                    {isSaving ? (isRTL ? "جاري الحفظ..." : "Saving...") : (t("saveChanges") || (isRTL ? "حفظ التغييرات" : "Save Changes"))}
                  </Button>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-8 space-y-6">
                {/* Section Header */}
                <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-[16px] font-bold text-slate-900">{t("security") || (isRTL ? "الأمان" : "Security")}</h2>
                </div>

                {/* Password Status */}
                <div className="space-y-3">
                  <p className={cn("text-[11px] font-black text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>{t("passwordStatus") || (isRTL ? "حالة كلمة المرور" : "Password Status")}</p>
                  <div className={cn("flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                      <Key className="h-4.5 w-4.5 text-slate-400" size={18} />
                      <span className="text-[13px] font-bold text-slate-600">{isRTL ? "تم تغييرها منذ 4 أشهر" : "Last changed 4 months ago"}</span>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  </div>
                  <button className={cn("w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-[13px] font-bold text-slate-700">{t("changePassword") || (isRTL ? "تغيير كلمة المرور" : "Change Password")}</span>
                    <ChevronRight className={cn("h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors", isRTL && "rotate-180")} />
                  </button>
                </div>

                {/* 2FA */}
                <div className="space-y-3 pt-2 border-t border-slate-50">
                  <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
                      <p className="text-[14px] font-bold text-slate-900">{t("twoFactorAuthentication") || (isRTL ? "المصادقة الثنائية" : "Two-Factor Authentication")}</p>
                      <p className="text-[12px] font-medium text-slate-400">
                        {isRTL ? "أضف طبقة إضافية من الأمان لحسابك عن طريق تمكين 2FA." : "Add an extra layer of security to your account by enabling 2FA."}
                      </p>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                      className={cn(
                        "relative h-7 w-14 rounded-full transition-all duration-300 shrink-0",
                        isRTL ? "mr-4" : "ml-4",
                        twoFAEnabled ? "bg-blue-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300",
                          twoFAEnabled ? (isRTL ? "-translate-x-8" : "translate-x-8") : "translate-x-0"
                        )}
                        style={{ [isRTL ? 'right' : 'left']: '4px' }}
                      />
                    </button>
                  </div>
                  {twoFAEnabled && (
                    <div className={cn("flex items-center gap-2 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl", isRTL ? "flex-row-reverse" : "flex-row")}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {isRTL ? "مفعل" : "Enabled"}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && <BillingTab isRTL={isRTL}/>}

          {/* Queue Management Tab */}
          {activeTab === "queue" && <QueueManagementTab isRTL={isRTL}/>}

          {/* Notifications Tab */}
          {activeTab === "notifications" && <NotificationsTab isRTL={isRTL} t={t}/>}

          {/* Patient Preferences Tab */}
          {activeTab === "patient-prefs" && <PatientPreferencesTab isRTL={isRTL}/>}

          {/* Permissions Tab */}
          {activeTab === "permissions" && <PermissionsTab isRTL={isRTL}/>}

          {/* Placeholder for remaining tabs */}
          {activeTab !== "profile" && activeTab !== "billing" && activeTab !== "queue" && activeTab !== "notifications" && activeTab !== "patient-prefs" && activeTab !== "permissions" && (
            <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-12 flex flex-col items-center justify-center space-y-4">
              {(() => {
                const tab = TABS.find((t) => t.id === activeTab);
                const Icon = tab?.icon ?? User;
                return (
                  <>
                    <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-blue-400" />
                    </div>
                    <p className="text-[18px] font-bold text-slate-700">{tab?.label}</p>
                    <p className="text-[13px] font-medium text-slate-400">{isRTL ? "هذا القسم قادم قريباً." : "This section is coming soon."}</p>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Form Field ─────────────────────────────────────────────────── */
function FormField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  isRTL
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  isRTL?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className={cn("block text-[12px] font-black text-slate-500 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>{label}</label>
      <div className={cn("relative flex items-center h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all", isRTL ? "flex-row-reverse" : "flex-row")}>
        {icon && <span className={cn("shrink-0", isRTL ? "ml-2.5" : "mr-2.5")}>{icon}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("flex-1 bg-transparent text-[14px] font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-300", isRTL ? "text-right" : "text-left")}
        />
      </div>
    </div>
  );
}

/* ── Billing Tab ────────────────────────────────────────────────── */
function BillingTab({ isRTL }: { isRTL: boolean}) {
  const [consultFee, setConsultFee] = useState("150");
  const [cashEnabled, setCashEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(true);
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [supplement, setSupplement] = useState("");
  const [hoursVisit, setHoursVisit] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6">
          <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">{isRTL ? "الفواتير العامة" : "General Billing"}</h3>
          </div>

          <div className="space-y-2">
            <label className={cn("block text-[11px] font-black text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>{isRTL ? "رسوم الاستشارة الافتراضية" : "Default consultation fee"}</label>
            <div className={cn("flex items-center h-14 bg-slate-50 border border-slate-100 rounded-2xl px-4 gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
              <span className="text-[18px] font-bold text-slate-400">$</span>
              <input
                value={consultFee}
                onChange={(e) => setConsultFee(e.target.value)}
                className={cn("flex-1 bg-transparent text-[22px] font-black text-slate-800 outline-none w-full", isRTL ? "text-right" : "text-left")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={cn("block text-[11px] font-black text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>{isRTL ? "العملة المختارة" : "Currency selected"}</label>
            <div className={cn("flex items-center justify-between h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 cursor-pointer hover:border-slate-200 transition-all", isRTL ? "flex-row-reverse" : "flex-row")}>
              <span className="text-[13px] font-bold text-slate-700">{isRTL ? "USD – دولار أمريكي" : "USD – United States Dollar"}</span>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6">
          <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">{isRTL ? "طرق الدفع" : "Payment Methods"}</h3>
          </div>

          <div className="space-y-5">
            <ToggleRow
              icon={<Banknote className="h-4 w-4 text-slate-400" />}
              title={isRTL ? "الدفع النقدي" : "Cash Payments"}
              subtitle={isRTL ? "السماح لموظفي الاستقبال بقبول النقود" : "Allow reception to accept cash on desk"}
              enabled={cashEnabled}
              onToggle={() => setCashEnabled(!cashEnabled)}
              isRTL={isRTL}
            />
            <ToggleRow
              icon={<CreditCard className="h-4 w-4 text-slate-400" />}
              title={isRTL ? "الدفع بالبطاقة" : "Card Payments"}
              subtitle={isRTL ? "تمكين محطة POS" : "Enable POS terminal"}
              enabled={cardEnabled}
              onToggle={() => setCardEnabled(!cardEnabled)}
              isRTL={isRTL}
            />
            <ToggleRow
              icon={<Wallet className="h-4 w-4 text-slate-400" />}
              title={isRTL ? "المحافظ الرقمية" : "Digital Wallets"}
              subtitle={isRTL ? "Apple Pay، Google Pay، QR code" : "Apple Pay, Google Pay, local QR code"}
              enabled={walletEnabled}
              onToggle={() => setWalletEnabled(!walletEnabled)}
              isRTL={isRTL}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6 h-full">
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <Repeat2 className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-900">{isRTL ? "الأتمتة" : "Automation"}</h3>
        </div>

        <div className="space-y-3">
          <p className={cn("text-[12px] font-bold text-slate-700", isRTL ? "text-right" : "text-left")}>{isRTL ? "خدمات إضافية" : "Additional Services"}</p>
          <p className={cn("text-[11px] font-medium text-slate-400 leading-relaxed", isRTL ? "text-right" : "text-left")}>
            {isRTL ? "إنشاء صياغة مضبوطة لجميع محركات العيادات" : "Create controlled wording for all clinics drive (maximum)"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className={cn("h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 flex items-center", isRTL ? "flex-row-reverse" : "flex-row")}>
                <input
                  value={supplement}
                  onChange={(e) => setSupplement(e.target.value)}
                  placeholder={isRTL ? "تكملة..." : "Supplement..."}
                  className={cn("w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none placeholder:text-slate-300", isRTL ? "text-right" : "text-left")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className={cn("h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 flex items-center", isRTL ? "flex-row-reverse" : "flex-row")}>
                <input
                  value={hoursVisit}
                  onChange={(e) => setHoursVisit(e.target.value)}
                  placeholder={isRTL ? "ساعات الزيارة" : "Hours visits"}
                  className={cn("w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none placeholder:text-slate-300", isRTL ? "text-right" : "text-left")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleRow
            icon={<FileText className="h-4 w-4 text-slate-400" />}
            title={isRTL ? "إنشاء فاتورة تلقائياً" : "Auto-generate invoice"}
            enabled={autoInvoice}
            onToggle={() => setAutoInvoice(!autoInvoice)}
            isRTL={isRTL}
          />
          <ToggleRow
            icon={<Printer className="h-4 w-4 text-slate-400" />}
            title={isRTL ? "طباعة فاتورة تلقائياً" : "Auto-print invoice"}
            enabled={autoPrint}
            onToggle={() => setAutoPrint(!autoPrint)}
            isRTL={isRTL}
          />
        </div>

        <div className={cn("flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4", isRTL ? "flex-row-reverse" : "flex-row")}>
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className={cn("text-[11px] font-bold text-blue-600 leading-relaxed", isRTL ? "text-right" : "text-left")}>
            {isRTL ? "ستنطبق إعدادات الأتمتة على جميع عياداتك الثلاث عبر رمز منطقة المنشأة." : "Automation settings will apply to all 3 of your clinics across the facility area code."}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: () => void;
  isRTL?: boolean;
}

function ToggleRow({ icon, title, subtitle, enabled, onToggle, isRTL }: ToggleRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("flex items-start gap-2.5", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
        {icon && <span className="mt-0.5">{icon}</span>}
        <div>
          <p className="text-[13px] font-bold text-slate-800">{title}</p>
          {subtitle && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative h-6 w-12 rounded-full transition-all duration-300 shrink-0",
          enabled ? "bg-blue-600" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
            enabled ? (isRTL ? "-translate-x-7" : "translate-x-7") : "translate-x-0"
          )}
          style={{ [isRTL ? 'right' : 'left']: '4px' }}
        />
      </button>
    </div>
  );
}

/* ── Notifications Tab ───────────────────────────────── */
function NotificationsTab({ isRTL, t }: { isRTL: boolean; t: (key: TranslationKey) => string }) {
  const [checkInAlert, setCheckInAlert] = useState(true);
  const [lateAlert, setLateAlert] = useState(true);
  const [doctorReady, setDoctorReady] = useState(false);
  const [paymentReminder, setPaymentReminder] = useState(true);
  const [soundNotify, setSoundNotify] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className={cn("p-7 border-b border-slate-50 flex items-center gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div className={isRTL ? "text-right" : "text-left"}>
            <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "مركز التنبيهات" : "Alert Center"}</h3>
            <p className="text-[12px] font-medium text-slate-400">{isRTL ? "تكوين كيفية ووقت تلقي تحديثات البوابة." : "Configure how and when you receive portal updates."}</p>
          </div>
        </div>

        <div className="p-7 space-y-8">
          <ToggleRow
            icon={null}
            title={isRTL ? "تنبيه تسجيل وصول المريض" : "Patient check-in alert"}
            subtitle={isRTL ? "تمكين التنبيهات في الوقت الفعلي عند وصول المريض" : "Enable real-time alerts when a patient arrives"}
            enabled={checkInAlert}
            onToggle={() => setCheckInAlert(!checkInAlert)}
            isRTL={isRTL}
          />
          
          <ToggleRow
            icon={null}
            title={isRTL ? "تنبيه تأخر المريض" : "Late patient alert"}
            subtitle={isRTL ? "إشعار إذا تأخر المريض أكثر من 15 دقيقة" : "Notify if a patient is more than 15 minutes late"}
            enabled={lateAlert}
            onToggle={() => setLateAlert(!lateAlert)}
            isRTL={isRTL}
          />

          <ToggleRow
            icon={null}
            title={isRTL ? "إشعار جاهزية الطبيب" : "Doctor ready notification"}
            subtitle={isRTL ? "تنبيه عندما يكون الطبيب جاهزاً للمريض التالي" : "Alert when a provider is ready for the next patient"}
            enabled={doctorReady}
            onToggle={() => setDoctorReady(!doctorReady)}
            isRTL={isRTL}
          />

          <ToggleRow
            icon={null}
            title={isRTL ? "تذكير الدفع المعلق" : "Payment pending reminder"}
            subtitle={isRTL ? "تذكير بالأرصدة المستحقة أثناء عملية الخروج" : "Reminder for outstanding balances during checkout"}
            enabled={paymentReminder}
            onToggle={() => setPaymentReminder(!paymentReminder)}
            isRTL={isRTL}
          />

          <div className="pt-6 border-t border-slate-50">
            <div className={cn("flex items-center justify-between gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("flex items-start gap-2.5", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
                <div>
                  <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <p className="text-[13px] font-bold text-slate-800">{isRTL ? "تنبيهات صوتية" : "Sound notifications"}</p>
                    <span className="bg-blue-100 text-blue-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest">
                      {isRTL ? "عام" : "GLOBAL"}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {isRTL ? "تبديل عام للتنبيهات الصوتية. عند تعطيله، ستظهر التنبيهات بصرياً فقط." : "Global toggle for audible alerts. When disabled, notifications will only appear visually."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSoundNotify(!soundNotify)}
                className={cn(
                  "relative h-6 w-12 rounded-full transition-all duration-300 shrink-0",
                  soundNotify ? "bg-blue-600" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
                    soundNotify ? (isRTL ? "-translate-x-7" : "translate-x-7") : "translate-x-0"
                  )}
                  style={{ [isRTL ? 'right' : 'left']: '4px' }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("flex pt-2", isRTL ? "justify-start" : "justify-end")}>
        <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]">
          {t("saveChanges") || (isRTL ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>
    </div>
  );
}

/* ── Queue Management Tab ───────────────────────────────── */
function QueueManagementTab({ isRTL }: { isRTL: boolean}) {
  const [sortMethod, setSortMethod] = useState<"appointment" | "manual">("appointment");
  const [autoMove, setAutoMove] = useState(true);
  const [highlightNext, setHighlightNext] = useState(true);
  const [waitIndicator, setWaitIndicator] = useState(false);
  const [priorityEnabled, setPriorityEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-5">
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <ArrowUpDown className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "طريقة فرز الطابور" : "Queue Sorting Method"}</h3>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setSortMethod("appointment")}
            className={cn(
              "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all",
              isRTL ? "flex-row-reverse text-right" : "flex-row text-left",
              sortMethod === "appointment"
                ? "border-blue-400 bg-blue-50/50"
                : "border-slate-100 bg-white hover:border-slate-200"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              sortMethod === "appointment" ? "bg-blue-100" : "bg-slate-50"
            )}>
              <Clock className={cn("h-5 w-5", sortMethod === "appointment" ? "text-blue-600" : "text-slate-400")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-[14px] font-bold", sortMethod === "appointment" ? "text-blue-700" : "text-slate-800")}>
                {isRTL ? "حسب وقت الموعد" : "By Appointment Time"}
              </p>
              <p className="text-[12px] font-medium text-slate-400 mt-0.5 leading-relaxed">
                {isRTL ? "يتم تصنيف المرضى تلقائياً بناءً على فترتهم المجدولة." : "Patients are automatically ranked based on their scheduled slot."}
              </p>
            </div>
            <div className={cn(
              "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              sortMethod === "appointment" ? "border-blue-500 bg-blue-500" : "border-slate-200"
            )}>
              {sortMethod === "appointment" && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </div>
          </button>

          <button
            onClick={() => setSortMethod("manual")}
            className={cn(
              "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all",
              isRTL ? "flex-row-reverse text-right" : "flex-row text-left",
              sortMethod === "manual"
                ? "border-blue-400 bg-blue-50/50"
                : "border-slate-100 bg-white hover:border-slate-200"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              sortMethod === "manual" ? "bg-blue-100" : "bg-slate-50"
            )}>
              <GripVertical className={cn("h-5 w-5", sortMethod === "manual" ? "text-blue-600" : "text-slate-400")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-[14px] font-bold", sortMethod === "manual" ? "text-blue-700" : "text-slate-800")}>
                {isRTL ? "يدوي (سحب وإفلات)" : "Manual (Drag & Drop)"}
              </p>
              <p className="text-[12px] font-medium text-slate-400 mt-0.5 leading-relaxed">
                {isRTL ? "السماح للموظفين بإعادة ترتيب الطابور يدوياً في أي وقت." : "Allow staff to manually reorder the queue at any time."}
              </p>
            </div>
            <div className={cn(
              "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              sortMethod === "manual" ? "border-blue-500 bg-blue-500" : "border-slate-200"
            )}>
              {sortMethod === "manual" && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-5">
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "الأتمتة والرؤية" : "Automation & Visibility"}</h3>
        </div>

        <div className="space-y-5">
          <div className="pb-5 border-b border-slate-50">
            <ToggleRow
              icon={null}
              title={isRTL ? "الانتقال التلقائي للمريض التالي" : "Auto-move to next patient"}
              subtitle={isRTL ? "تقديم الطابور تلقائياً عند انتهاء الجلسة" : "Automatically advance the queue when a session ends"}
              enabled={autoMove}
              onToggle={() => setAutoMove(!autoMove)}
              isRTL={isRTL}
            />
          </div>
          <div className="pb-5 border-b border-slate-50">
            <ToggleRow
              icon={null}
              title={isRTL ? "تمييز المريض التالي" : "Highlight next patient"}
              subtitle={isRTL ? "تمييز المريض التالي في الطابور بصرياً" : "Visually distinguish the next patient in line"}
              enabled={highlightNext}
              onToggle={() => setHighlightNext(!highlightNext)}
              isRTL={isRTL}
            />
          </div>
          <ToggleRow
            icon={null}
            title={isRTL ? "مؤشر وقت الانتظار" : "Waiting time indicator"}
            subtitle={isRTL ? "إظهار أوقات الانتظار المقدرة للمرضى في الوقت الفعلي" : "Show real-time estimated wait times for patients"}
            enabled={waitIndicator}
            onToggle={() => setWaitIndicator(!waitIndicator)}
            isRTL={isRTL}
          />
        </div>
      </div>

      <div className="rounded-[28px] p-7 space-y-5" style={{ background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)" }}>
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
          </div>
          <h3 className="text-[16px] font-bold text-white">{isRTL ? "التعامل مع الأولويات" : "Priority Handling"}</h3>
        </div>
        <p className={cn("text-[13px] font-medium text-indigo-100 leading-relaxed", isRTL ? "text-right" : "text-left")}>
          {isRTL ? "إدارة كيفية تعامل عيادتك مع حالات الطوارئ أو المرضى ذوي الأولوية العالية خارج الترتيب القياسي." : "Manage how your clinic handles emergency arrivals or high-priority patients outside the standard order."}
        </p>
        <div className={cn("flex items-center justify-between bg-white/10 rounded-2xl px-5 py-4", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className={isRTL ? "text-right" : "text-left"}>
            <p className="text-[13px] font-bold text-white">{isRTL ? "تمكين حالات الأولوية" : "Enable priority cases"}</p>
            <p className="text-[11px] font-medium text-indigo-200 mt-0.5">{isRTL ? "تجاوز يدوي للاحتياجات الطبية العاجلة" : "Manual override for urgent medical needs"}</p>
          </div>
          <button
            onClick={() => setPriorityEnabled(!priorityEnabled)}
            className={cn(
              "relative h-7 w-14 rounded-full transition-all duration-300 shrink-0",
              priorityEnabled ? "bg-blue-500" : "bg-white/30"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300",
                priorityEnabled ? (isRTL ? "-translate-x-8" : "translate-x-8") : "translate-x-0"
              )}
              style={{ [isRTL ? 'right' : 'left']: '4px' }}
            />
          </button>
        </div>
      </div>

      <div className={cn("flex pt-2", isRTL ? "justify-start" : "justify-end")}>
        <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]">
          {isRTL ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

/* ── Patient Preferences Tab ─────────────────────────── */
function PatientPreferencesTab({ isRTL }: { isRTL: boolean}) {
  const [ageRequired, setAgeRequired] = useState(true);
  const [notesRequired, setNotesRequired] = useState(true);
  const [quickAdd, setQuickAdd] = useState(true);
  const [autoFill, setAutoFill] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-6">
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Heart className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "تكوين الحقول المطلوبة" : "Required Fields Configuration"}</h3>
        </div>

        <div className="space-y-5">
          <ToggleRow
            icon={null}
            title={isRTL ? "تاريخ الميلاد / العمر مطلوب" : "Date of birth / Age required"}
            enabled={ageRequired}
            onToggle={() => setAgeRequired(!ageRequired)}
            isRTL={isRTL}
          />
          <ToggleRow
            icon={null}
            title={isRTL ? "الملاحظات السريرية الأولية مطلوبة" : "Initial clinical notes required"}
            enabled={notesRequired}
            onToggle={() => setNotesRequired(!notesRequired)}
            isRTL={isRTL}
          />
        </div>
      </div>

      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-6">
        <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "تجربة التسجيل" : "Registration Experience"}</h3>
        </div>

        <div className="space-y-5">
          <ToggleRow
            icon={null}
            title={isRTL ? "تمكين الإضافة السريعة" : "Enable Quick Add"}
            subtitle={isRTL ? "تجاوز التفاصيل غير الأساسية أثناء وقت الذروة" : "Skip non-essential details during peak hours"}
            enabled={quickAdd}
            onToggle={() => setQuickAdd(!quickAdd)}
            isRTL={isRTL}
          />
          <ToggleRow
            icon={null}
            title={isRTL ? "التعبئة التلقائية من السجلات السابقة" : "Auto-fill from previous records"}
            enabled={autoFill}
            onToggle={() => setAutoFill(!autoFill)}
            isRTL={isRTL}
          />
        </div>
      </div>

      <div className={cn("flex pt-2", isRTL ? "justify-start" : "justify-end")}>
        <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]">
          {isRTL ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

/* ── Permissions Tab ───────────────────────────────── */
function PermissionsTab({ isRTL }: { isRTL: boolean }) {
  const permissions = [
    { id: "p1", title: isRTL ? "عرض السجلات المالية" : "View Financial Records", enabled: true },
    { id: "p2", title: isRTL ? "تعديل المواعيد" : "Edit Appointments", enabled: true },
    { id: "p3", title: isRTL ? "حذف المرضى" : "Delete Patients", enabled: false },
    { id: "p4", title: isRTL ? "تصدير البيانات" : "Export Data", enabled: false },
    { id: "p5", title: isRTL ? "إدارة موظفي الاستقبال الآخرين" : "Manage Other Receptionists", enabled: true },
  ];

  return (
    <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-8 space-y-6">
      <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <ShieldIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-[16px] font-bold text-slate-900">{isRTL ? "الصلاحيات والأدوار" : "Permissions & Roles"}</h2>
      </div>

      <div className={cn("bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className={cn("text-[11px] font-bold text-blue-600 leading-relaxed", isRTL ? "text-right" : "text-left")}>
          {isRTL ? "يتم تعيين هذه الصلاحيات من قبل مدير النظام ولا يمكن تغييرها يدوياً." : "These permissions are set by the administrator and cannot be manually changed."}
        </p>
      </div>

      <div className="space-y-4">
        {permissions.map((p) => (
          <div key={p.id} className={cn("flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl", isRTL ? "flex-row-reverse" : "flex-row")}>
            <span className={cn("text-[13px] font-bold", p.enabled ? "text-slate-900" : "text-slate-400")}>{p.title}</span>
            {p.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-slate-300 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
