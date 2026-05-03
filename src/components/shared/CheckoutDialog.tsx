"use client";

import React from "react";
import Image from "next/image";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Shield,
  CreditCard,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { ApiPublicDoctor } from "@/types";

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: ApiPublicDoctor | null;
  bookingData: { date: string; time: string; mode: "ONSITE" | "ONLINE"; redeemPoints?: boolean } | null;
  loyaltyPoints: number;
  specialDiscount?: number;
  insuranceDiscount?: number;
  onBookNow: (data: { redeemPoints: boolean; notes?: string }) => void;
}

export function CheckoutDialog({
  isOpen,
  onOpenChange,
  doctor,
  bookingData,
  loyaltyPoints,
  specialDiscount = 0,
  insuranceDiscount = 0,
  onBookNow,
}: CheckoutDialogProps) {
  const { t, isRTL } = useTranslation();
  const [redeemPoints, setRedeemPoints] = React.useState(Boolean(bookingData?.redeemPoints));
  const [notes, setNotes] = React.useState("");

  // Payment method
  const [paymentMethod, setPaymentMethod] = React.useState<"onsite" | "online">("onsite");

  const basePrice = doctor?.consultationFee || 200;
  const specialDiscountAmount = Math.round(((specialDiscount || 0) / 100) * basePrice);
  const insuranceDiscountAmount = Math.round(((insuranceDiscount || 0) / 100) * basePrice);
  const percentDiscountAmount = Math.min(basePrice, specialDiscountAmount + insuranceDiscountAmount);
  const remainingAfterPercentDiscounts = Math.max(0, basePrice - percentDiscountAmount);
  const pointsDiscount = redeemPoints ? Math.min(loyaltyPoints * 0.1, remainingAfterPercentDiscounts) : 0;
  const totalPrice = Math.max(0, basePrice - percentDiscountAmount - pointsDiscount);

  React.useEffect(() => {
    if (!isOpen) return;
    setRedeemPoints(Boolean(bookingData?.redeemPoints));
    setNotes("");
    setPaymentMethod("onsite");
  }, [isOpen, bookingData?.redeemPoints]);

  const handleBook = () => {
    onBookNow({ redeemPoints, notes });
  };

  if (!doctor || !bookingData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-y-auto no-scrollbar border-none flex flex-col transition-all duration-300",
          "w-full h-full md:h-[90vh] md:max-w-md md:rounded-[40px]",
          "bg-white dark:bg-slate-900"
        )}
      >
        <div className="flex items-center px-6 py-5 bg-transparent shrink-0 border-b border-slate-50 dark:border-slate-800/50">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className={cn("h-6 w-6", isRTL && "rotate-180")} />
          </button>
          <DialogTitle className="flex-1 text-center text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t("appointmentCheckout") || "Appointment Checkout"}
          </DialogTitle>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 pt-4 space-y-5">
          {/* Appointment mini-card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden shrink-0">
                <Image
                  src={doctor.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.fullName}`}
                  alt={doctor.fullName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-slate-50 text-sm truncate">
                  Dr. {doctor.fullName}
                </h4>
                <p className="text-xs font-bold text-slate-500">
                  {doctor.specialization}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span>{bookingData.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>{bookingData.time}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  {bookingData.mode === "ONLINE"
                    ? (t("onlineConsultation") || "Online Consultation")
                    : (doctor.clinicId || t("onClinic") || "On-Clinic Visit")}
                </span>
              </div>
            </div>
          </div>

          {/* Special Discount display */}
          {specialDiscount > 0 && (
            <div className="flex items-center gap-2 p-3.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/60 dark:border-indigo-800/30">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {t("specialDiscount") || "Special Discount"}
                </h5>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {t("specialDiscountMsg") || "A custom discount approved by reception has been applied."} ({specialDiscount}%)
                </p>
              </div>
            </div>
          )}

          {insuranceDiscount > 0 && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/60 dark:border-emerald-800/30">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {t("insuranceDiscount") || "Insurance Discount"}
                </h5>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {insuranceDiscount}%
                </p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
              {t("paymentMode") || "Payment Mode"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("onsite")}
                className={cn(
                  "h-11 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                  paymentMethod === "onsite"
                    ? "bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-900/30"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {t("onsitePayment") || "Onsite Payment"}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={cn(
                  "h-11 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                  paymentMethod === "online"
                    ? "bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-900/30"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                )}
              >
                <CreditCard className="h-3.5 w-3.5" />
                {t("onlinePayment") || "Online Payment"}
              </button>
            </div>
          </div>

          {/* Loyalty points toggle */}
          {loyaltyPoints > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                    {t("redeemLoyaltyPoints") || "Redeem Your Loyalty Points"}
                  </h5>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {loyaltyPoints} {t("pts") || "pts"} {t("available") || "available"} ({loyaltyPoints * 0.1} L.E discount)
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={redeemPoints}
                onChange={() => setRedeemPoints(!redeemPoints)}
                className="h-4 w-4 rounded border-emerald-300 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Add custom notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400">
              {t("additionalNotes") || "Additional Notes"}
            </label>
            <Input
              placeholder={t("notesPlaceholder") || "Anything we should know before your visit?"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11 rounded-lg text-xs"
            />
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 space-y-2 text-xs font-bold">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{t("consultationFee") || "Consultation Fee"}</span>
              <span className="font-black text-slate-800 dark:text-slate-200">
                {basePrice} L.E
              </span>
            </div>
            {specialDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>{t("specialDiscount") || "Special Discount"} ({specialDiscount}%)</span>
                <span className="font-black">-{specialDiscountAmount} L.E</span>
              </div>
            )}
            {insuranceDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>{t("insuranceDiscount") || "Insurance Discount"} ({insuranceDiscount}%)</span>
                <span className="font-black">-{insuranceDiscountAmount} L.E</span>
              </div>
            )}
            {redeemPoints && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>{t("pointsDiscount") || "Points Discount"}</span>
                <span className="font-black">-{pointsDiscount} L.E</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 text-sm">
              <span className="font-black text-slate-800 dark:text-slate-100">
                {t("totalPrice") || "Total"}
              </span>
              <span className="font-black text-blue-600">{totalPrice} L.E</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 shrink-0 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 mt-auto">
          <Button
            onClick={handleBook}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base transition-all active:scale-95"
          >
            {t("confirmBookNow") || "Confirm & Book Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
