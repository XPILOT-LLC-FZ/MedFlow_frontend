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
  ClipboardCheck,
  Zap,
  UserPlus,
  History,
  UserCircle2,
  Lock as LockIcon,
  CalendarDays,
  Eye,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "queue", label: "Queue Management", icon: LayoutGrid },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "patient-prefs", label: "Patient Preferences", icon: Heart },
  { id: "permissions", label: "Permissions", icon: ShieldIcon },
];

export default function ReceptionProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { success, error } = useToastStore();

  const [activeTab, setActiveTab] = useState("profile");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("Head Receptionist");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+1 (555) 222-3397");
  const [isSaving, setIsSaving] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);

  useEffect(() => {
    setFullName(user?.name ?? "Sarah Jenkins");
    setEmail(user?.email ?? "sjenkins@cityhealth.com");
  }, [user]);

  const saveProfile = async () => {
    if (fullName.trim().length < 2) {
      error("Name must be at least 2 characters");
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateProfile({ name: fullName.trim() });
      if (!result.success) { error(result.error || "Failed to update profile"); return; }
      success("Profile updated successfully");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20 font-sans">
      {/* Page Header */}
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-400 text-sm font-medium">Manage your personal information, contact details, and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
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
                    "w-full flex items-center gap-3 px-5 py-4 text-[13px] font-bold transition-all text-left border-l-[3px]",
                    active
                      ? "bg-blue-50 text-[#3B82F6] border-l-[#3B82F6]"
                      : "text-slate-500 border-l-transparent hover:bg-slate-50 hover:text-slate-700"
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
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-[16px] font-bold text-slate-900">Profile Information</h2>
                </div>

                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah" />
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-2xl">SJ</AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md border-2 border-white hover:bg-blue-700 transition-colors">
                      <Camera className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                      <Upload className="h-4 w-4 text-slate-400" />
                      Upload Photo
                    </button>
                    <p className="text-[11px] font-bold text-slate-400">JPG, PNG or GIF – Max 1MB</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label="Full Name"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Sarah Jenkins"
                  />
                  <FormField
                    label="Job Title"
                    value={jobTitle}
                    onChange={setJobTitle}
                    placeholder="Head Receptionist"
                  />
                  <FormField
                    label="Email Address"
                    value={email}
                    onChange={setEmail}
                    icon={<Mail className="h-4 w-4 text-blue-400" />}
                    placeholder="sjenkins@cityhealth.com"
                  />
                  <FormField
                    label="Phone Number"
                    value={phone}
                    onChange={setPhone}
                    icon={<Phone className="h-4 w-4 text-slate-400" />}
                    placeholder="+1 (555) 222-3397"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-50">
                  <Button
                    variant="outline"
                    className="h-11 px-8 rounded-2xl border-slate-200 font-bold text-slate-500 hover:bg-slate-50 bg-white text-[13px]"
                    onClick={() => { setFullName(user?.name ?? "Sarah Jenkins"); setJobTitle("Head Receptionist"); setPhone("+1 (555) 222-3397"); }}
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={() => void saveProfile()}
                    disabled={isSaving}
                    className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-8 space-y-6">
                {/* Section Header */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-[16px] font-bold text-slate-900">Security</h2>
                </div>

                {/* Password Status */}
                <div className="space-y-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password Status</p>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Key className="h-4.5 w-4.5 text-slate-400" size={18} />
                      <span className="text-[13px] font-bold text-slate-600">Last changed 4 months ago</span>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  </div>
                  <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <span className="text-[13px] font-bold text-slate-700">Change Password</span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                </div>

                {/* 2FA */}
                <div className="space-y-3 pt-2 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[14px] font-bold text-slate-900">Two-Factor Authentication</p>
                      <p className="text-[12px] font-medium text-slate-400">
                        Add an extra layer of security to your account by enabling 2FA.
                      </p>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                      className={cn(
                        "relative h-7 w-14 rounded-full transition-all duration-300 shrink-0 ml-4",
                        twoFAEnabled ? "bg-blue-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300",
                          twoFAEnabled ? "left-8" : "left-1"
                        )}
                      />
                    </button>
                  </div>
                  {twoFAEnabled && (
                    <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Enabled
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && <BillingTab />}

          {/* Queue Management Tab */}
          {activeTab === "queue" && <QueueManagementTab />}

          {/* Notifications Tab */}
          {activeTab === "notifications" && <NotificationsTab />}

          {/* Patient Preferences Tab */}
          {activeTab === "patient-prefs" && <PatientPreferencesTab />}

          {/* Permissions Tab */}
          {activeTab === "permissions" && <PermissionsTab />}

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
                    <p className="text-[13px] font-medium text-slate-400">This section is coming soon.</p>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative flex items-center h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
        {icon && <span className="mr-2.5 shrink-0">{icon}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}

/* ── Billing Tab ────────────────────────────────────────────────── */
function BillingTab() {
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
      {/* Left column — stacked */}
      <div className="space-y-6">
        {/* General Billing */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">General Billing</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Default consultation fee</label>
            <div className="flex items-center h-14 bg-slate-50 border border-slate-100 rounded-2xl px-4 gap-2">
              <span className="text-[18px] font-bold text-slate-400">$</span>
              <input
                value={consultFee}
                onChange={(e) => setConsultFee(e.target.value)}
                className="flex-1 bg-transparent text-[22px] font-black text-slate-800 outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Currency selected</label>
            <div className="flex items-center justify-between h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 cursor-pointer hover:border-slate-200 transition-all">
              <span className="text-[13px] font-bold text-slate-700">USD – United States Dollar</span>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">Payment Methods</h3>
          </div>

          <div className="space-y-5">
            <ToggleRow
              icon={<Banknote className="h-4 w-4 text-slate-400" />}
              title="Cash Payments"
              subtitle="Allow reception to accept cash on desk"
              enabled={cashEnabled}
              onToggle={() => setCashEnabled(!cashEnabled)}
            />
            <ToggleRow
              icon={<CreditCard className="h-4 w-4 text-slate-400" />}
              title="Card Payments"
              subtitle="Enable POS terminal in Bay Street"
              enabled={cardEnabled}
              onToggle={() => setCardEnabled(!cardEnabled)}
            />
            <ToggleRow
              icon={<Wallet className="h-4 w-4 text-slate-400" />}
              title="Digital Wallets"
              subtitle="Apple Pay, Google Pay, local QR code"
              enabled={walletEnabled}
              onToggle={() => setWalletEnabled(!walletEnabled)}
            />
          </div>
        </div>
      </div>

      {/* Right column — Automation (full height) */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 space-y-6 h-full">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <Repeat2 className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-900">Automation</h3>
        </div>

        {/* Additional Services */}
        <div className="space-y-3">
          <p className="text-[12px] font-bold text-slate-700">Additional Services</p>
          <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
            Create controlled wording for all clinics drive (maximum) (ex: specialties name title)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 flex items-center">
                <input
                  value={supplement}
                  onChange={(e) => setSupplement(e.target.value)}
                  placeholder="Supplement..."
                  className="w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 flex items-center">
                <input
                  value={hoursVisit}
                  onChange={(e) => setHoursVisit(e.target.value)}
                  placeholder="Hours visits"
                  className="w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleRow
            icon={<FileText className="h-4 w-4 text-slate-400" />}
            title="Auto-generate invoice"
            subtitle=""
            enabled={autoInvoice}
            onToggle={() => setAutoInvoice(!autoInvoice)}
          />
          <ToggleRow
            icon={<Printer className="h-4 w-4 text-slate-400" />}
            title="Auto-print invoice"
            subtitle=""
            enabled={autoPrint}
            onToggle={() => setAutoPrint(!autoPrint)}
          />
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-blue-600 leading-relaxed">
            Automation settings will apply to all 3 of your clinics across the facility area code.
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
}

function ToggleRow({ icon, title, subtitle, enabled, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{icon}</span>
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
            enabled ? "left-7" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

/* ── Notifications Tab ───────────────────────────────── */
function NotificationsTab() {
  const [checkInAlert, setCheckInAlert] = useState(true);
  const [lateAlert, setLateAlert] = useState(true);
  const [doctorReady, setDoctorReady] = useState(false);
  const [paymentReminder, setPaymentReminder] = useState(true);
  const [soundNotify, setSoundNotify] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Section Header */}
        <div className="p-7 border-b border-slate-50 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">Alert Center</h3>
            <p className="text-[12px] font-medium text-slate-400">Configure how and when you receive portal updates.</p>
          </div>
        </div>

        <div className="p-7 space-y-8">
          <ToggleRow
            icon={null}
            title="Patient check-in alert"
            subtitle="Enable real-time alerts when a patient arrives at the clinic and completes registration."
            enabled={checkInAlert}
            onToggle={() => setCheckInAlert(!checkInAlert)}
          />
          
          <ToggleRow
            icon={null}
            title="Late patient alert"
            subtitle="Notify if a patient is more than 15 minutes late for their scheduled appointment time."
            enabled={lateAlert}
            onToggle={() => setLateAlert(!lateAlert)}
          />

          <ToggleRow
            icon={null}
            title="Doctor ready notification"
            subtitle="Alert when a provider is ready for the next patient to be moved to the examination room."
            enabled={doctorReady}
            onToggle={() => setDoctorReady(!doctorReady)}
          />

          <ToggleRow
            icon={null}
            title="Payment pending reminder"
            subtitle="Reminder for outstanding balances during the checkout process to ensure billing accuracy."
            enabled={paymentReminder}
            onToggle={() => setPaymentReminder(!paymentReminder)}
          />

          <div className="pt-6 border-t border-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-slate-800">Sound notifications</p>
                    <span className="bg-blue-100 text-blue-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest">
                      GLOBAL
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    Global toggle for audible alerts. When disabled, notifications will only appear visually.
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
                    soundNotify ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

/* ── Queue Management Tab ───────────────────────────────── */
function QueueManagementTab() {
  const [sortMethod, setSortMethod] = useState<"appointment" | "manual">("appointment");
  const [autoMove, setAutoMove] = useState(true);
  const [highlightNext, setHighlightNext] = useState(true);
  const [waitIndicator, setWaitIndicator] = useState(false);
  const [priorityEnabled, setPriorityEnabled] = useState(true);

  return (
    <div className="space-y-6">
      {/* Queue Sorting Method */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <ArrowUpDown className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">Queue Sorting Method</h3>
        </div>

        <div className="space-y-3">
          {/* By Appointment Time */}
          <button
            onClick={() => setSortMethod("appointment")}
            className={cn(
              "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
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
                By Appointment Time
              </p>
              <p className="text-[12px] font-medium text-slate-400 mt-0.5 leading-relaxed">
                Patients are automatically ranked based on their scheduled slot.
              </p>
            </div>
            <div className={cn(
              "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              sortMethod === "appointment" ? "border-blue-500 bg-blue-500" : "border-slate-200"
            )}>
              {sortMethod === "appointment" && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </div>
          </button>

          {/* Manual */}
          <button
            onClick={() => setSortMethod("manual")}
            className={cn(
              "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
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
                Manual (Drag &amp; Drop)
              </p>
              <p className="text-[12px] font-medium text-slate-400 mt-0.5 leading-relaxed">
                Allow staff to manually reorder the queue at any time.
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

      {/* Automation & Visibility */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">Automation &amp; Visibility</h3>
        </div>

        <div className="space-y-5">
          <div className="pb-5 border-b border-slate-50">
            <ToggleRow
              icon={null}
              title="Auto-move to next patient"
              subtitle="Automatically advance the queue when a session ends"
              enabled={autoMove}
              onToggle={() => setAutoMove(!autoMove)}
            />
          </div>
          <div className="pb-5 border-b border-slate-50">
            <ToggleRow
              icon={null}
              title="Highlight next patient"
              subtitle="Visually distinguish the next patient in line"
              enabled={highlightNext}
              onToggle={() => setHighlightNext(!highlightNext)}
            />
          </div>
          <ToggleRow
            icon={null}
            title="Waiting time indicator"
            subtitle="Show real-time estimated wait times for patients"
            enabled={waitIndicator}
            onToggle={() => setWaitIndicator(!waitIndicator)}
          />
        </div>
      </div>

      {/* Priority Handling */}
      <div className="rounded-[28px] p-7 space-y-5" style={{ background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
          </div>
          <h3 className="text-[16px] font-bold text-white">Priority Handling</h3>
        </div>
        <p className="text-[13px] font-medium text-indigo-100 leading-relaxed">
          Manage how your clinic handles emergency arrivals or high-priority patients outside the standard order.
        </p>
        <div className="flex items-center justify-between bg-white/10 rounded-2xl px-5 py-4">
          <div>
            <p className="text-[13px] font-bold text-white">Enable priority cases</p>
            <p className="text-[11px] font-medium text-indigo-200 mt-0.5">Manual override for urgent medical needs</p>
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
                priorityEnabled ? "left-8" : "left-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Save Changes */}
      <div className="flex justify-end pt-2">
        <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

/* ── Patient Preferences Tab ─────────────────────────── */
function PatientPreferencesTab() {
  const [ageRequired, setAgeRequired] = useState(true);
  const [notesRequired, setNotesRequired] = useState(true);
  const [quickAdd, setQuickAdd] = useState(true);
  const [autoFill, setAutoFill] = useState(true);

  return (
    <div className="space-y-6">
      {/* Required Fields Configuration */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-7 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">Required Fields Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name - LOCKED */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
              <UserCircle2 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-slate-800">Full Name</p>
              <p className="text-[11px] font-medium text-slate-400">System Mandatory Field</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
              <LockIcon className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Required</span>
            </div>
          </div>

          {/* Phone Number - LOCKED */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-slate-800">Phone Number</p>
              <p className="text-[11px] font-medium text-slate-400">Essential for Notifications</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
              <LockIcon className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Required</span>
            </div>
          </div>

          {/* Patient Age - TOGGLE */}
          <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-slate-800">Patient Age</p>
              <p className="text-[11px] font-medium text-slate-400">Toggle field requirement</p>
            </div>
            <button
              onClick={() => setAgeRequired(!ageRequired)}
              className={cn(
                "relative h-6 w-12 rounded-full transition-all duration-300 shrink-0",
                ageRequired ? "bg-blue-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
                  ageRequired ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>

          {/* Notes Field - TOGGLE */}
          <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-slate-800">Notes Field</p>
              <p className="text-[11px] font-medium text-slate-400">Additional intake comments</p>
            </div>
            <button
              onClick={() => setNotesRequired(!notesRequired)}
              className={cn(
                "relative h-6 w-12 rounded-full transition-all duration-300 shrink-0",
                notesRequired ? "bg-blue-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
                  notesRequired ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Efficiency */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-7 border-b border-slate-50 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">Workflow Efficiency</h3>
        </div>

        <div className="p-7 space-y-8">
          <ToggleRow
            icon={<UserPlus className="h-5 w-5 text-slate-400" />}
            title="Enable Quick Add Patient"
            subtitle="Shows a condensed intake form for fast check-ins during peak hours."
            enabled={quickAdd}
            onToggle={() => setQuickAdd(!quickAdd)}
          />

          <ToggleRow
            icon={<History className="h-5 w-5 text-slate-400" />}
            title="Enable Auto-fill for Returning Patients"
            subtitle="Automatically populate form data based on historical records when a name is matched."
            enabled={autoFill}
            onToggle={() => setAutoFill(!autoFill)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

/* ── Permissions Tab ───────────────────────────────── */
function PermissionsTab() {
  const [editInvoices, setEditInvoices] = useState(true);
  const [issueRefunds, setIssueRefunds] = useState(false);
  const [deleteAppts, setDeleteAppts] = useState(false);

  const visibilityItems = [
    { label: "Dashboard Access", enabled: true },
    { label: "Patients & Records", enabled: true },
    { label: "Queue Management", enabled: true },
    { label: "Billing View", enabled: true },
    { label: "Clinic Financial Insights", enabled: false },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Action Permissions */}
        <div className="lg:col-span-7 bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-8 space-y-8 min-h-[440px]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <LockIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900">Action Permissions</h3>
          </div>

          <div className="space-y-8">
            <ToggleRow
              icon={null}
              title="Allow editing invoices"
              subtitle="Allow staff to modify existing billing records."
              enabled={editInvoices}
              onToggle={() => setEditInvoices(!editInvoices)}
            />
            <ToggleRow
              icon={null}
              title="Allow issuing refunds"
              subtitle="Enable processing of payment reversals."
              enabled={issueRefunds}
              onToggle={() => setIssueRefunds(!issueRefunds)}
            />
            <ToggleRow
              icon={null}
              title="Allow deleting appointments"
              subtitle="Grant authority to remove scheduled slots from the calendar."
              enabled={deleteAppts}
              onToggle={() => setDeleteAppts(!deleteAppts)}
            />
          </div>
        </div>

        {/* Visibility Matrix Column */}
        <div className="lg:col-span-5 h-full">
          <div className="bg-blue-50 border border-blue-200 rounded-[28px] p-7 flex flex-col gap-6 h-full min-h-[440px]">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-600" />
              <h3 className="text-[16px] font-bold text-slate-900">Visibility Matrix</h3>
            </div>

            <div className="bg-white rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-1">
                <p className="text-[14px] font-bold text-blue-700">Current role</p>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider">
                  Receptionist
                </span>
              </div>

              <div className="space-y-3">
                {visibilityItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-[13px] font-bold transition-all",
                      item.enabled 
                        ? "bg-white border-slate-100 text-slate-700" 
                        : "bg-slate-50 text-slate-300 italic border-transparent"
                    )}
                  >
                    {item.enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Administrative Note */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4 mt-auto">
              <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Info className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Administrative Note</p>
                <p className="text-[11px] font-medium text-amber-800/70 mt-1 leading-relaxed">
                  Admin role has full access to all modules including system logs, financial reporting, and database management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Access Changes */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-8 space-y-8">
        <h3 className="text-[16px] font-bold text-slate-900">Recent Access Changes</h3>
        
        <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 ml-1">
          <TimelineItem 
            title="Invoice editing permission enabled"
            subtitle="Changed by Dr. Harrison (Admin) • 2 hours ago"
            active
          />
          <TimelineItem 
            title="Refund issuance requested"
            subtitle="Initiated by Sarah Jenkins • Yesterday, 4:45 PM"
          />
          <TimelineItem 
            title="System security audit completed"
            subtitle="Automated Report • Oct 24, 2023"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px]">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function TimelineItem({ title, subtitle, active }: { title: string; subtitle: string; active?: boolean }) {
  return (
    <div className="relative pl-10">
      <div className={cn(
        "absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white shadow-sm transition-all z-10",
        active ? "bg-blue-500 scale-110 shadow-blue-200" : "bg-slate-300"
      )} />
      <div className="space-y-1">
        <p className={cn("text-[14px] font-bold", active ? "text-slate-900" : "text-slate-500")}>
          {title}
        </p>
        <p className="text-[12px] font-medium text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}


