"use client";

import React from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Gift,
  Pencil,
  Check,
  HandCoins,
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
  onBack?: () => void;
  doctor: ApiPublicDoctor | null;
  bookingData: {
    date: string;
    time: string;
    mode: "ONSITE" | "ONLINE";
    branchId?: string;
    redeemPoints?: boolean;
  } | null;
  loyaltyPoints: number;
  specialDiscount?: number;
  insuranceDiscount?: number;
  onBookNow: (data: { redeemPoints: boolean; notes?: string; paymentMethodType?: "ONSITE_CASH" | "ONSITE_CARD" | "ONLINE_CARD" | "ONLINE_WALLET" }) => void;
}

export function CheckoutDialog({
  isOpen,
  onOpenChange,
  onBack,
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
  const [paymentMethod, setPaymentMethod] = React.useState<"ONSITE_CASH" | "ONSITE_CARD" | "ONLINE_CARD" | "ONLINE_WALLET">("ONLINE_WALLET");
  const [selectedCheckoutMethod, setSelectedCheckoutMethod] = React.useState<string>("apple");
  const [cards, setCards] = React.useState<{ id: string; number: string; expiry: string; holder: string }[]>([]);
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [cardForm, setCardForm] = React.useState({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });

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
    setCardForm({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });

    // Set default payment method based on mode
    if (bookingData?.mode === "ONSITE") {
      setPaymentMethod("ONSITE_CASH");
      setSelectedCheckoutMethod("cash");
    } else {
      setPaymentMethod("ONLINE_WALLET");
      setSelectedCheckoutMethod("apple");
    }

    // Auto import cards from profile
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('saved_cards');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCards(parsed);
          // If there's a card, we can auto-select the first card or leave it as apple
        } catch {
        }
      }
    }
  }, [isOpen, bookingData?.redeemPoints, bookingData?.mode]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && cards.length > 0) {
      localStorage.setItem('saved_cards', JSON.stringify(cards));
    }
  }, [cards]);

  const handleBook = () => {
    onBookNow({ redeemPoints, notes, paymentMethodType: paymentMethod });
  };

  if (!doctor || !bookingData) return null;

  const selectedBranch =
    doctor.branches?.find((branch) => branch.id === bookingData.branchId) ||
    (doctor.branch?.id === bookingData.branchId ? doctor.branch : null) ||
    doctor.branch ||
    doctor.branches?.[0] ||
    null;

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
            onClick={() => onBack ? onBack() : onOpenChange(false)}
            className="h-10 w-10 -ml-2 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
          >
            {isRTL ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
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
                    : (selectedBranch?.address || selectedBranch?.name || doctor.clinicId || t("onClinic") || "On-Clinic Visit")}
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

          {/* Payment Method Section (Mockup Matching) */}
          <div className="bg-[#F8F9FA] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-6 py-4 rounded-2xl select-none">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-md font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                {t("paymentMode" as never) || "Payment method"}
              </h5>
              {bookingData.mode === "ONLINE" && (
                <button
                  type="button"
                  onClick={() => setSelectedCheckoutMethod("apple")}
                  className="text-blue-600 hover:text-blue-700 transition-all"
                >
                  <Pencil className="h-4 w-4 stroke-[2]" />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {/* Apple Pay */}
              <div
                onClick={() => {
                  setSelectedCheckoutMethod("apple");
                  setPaymentMethod("ONLINE_WALLET");
                  setIsAddingCard(false);
                }}
                className="flex items-center justify-between py-4 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 bg-black dark:bg-white rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Pay</span>
                    </div>
                  </div>
                  <span className="text-base font-medium text-slate-800 dark:text-slate-200">Apple Pay</span>
                </div>
                {selectedCheckoutMethod === "apple" ? (
                  <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border border-blue-500" />
                )}
              </div>

              {/* Google Pay */}
              <div
                onClick={() => {
                  setSelectedCheckoutMethod("google");
                  setPaymentMethod("ONLINE_WALLET");
                  setIsAddingCard(false);
                }}
                className="flex items-center justify-between py-4 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100"><span className="text-[#4285F4]">G</span> Pay</span>
                  </div>
                  <span className="text-base font-medium text-slate-800 dark:text-slate-200">Google Pay</span>
                </div>
                {selectedCheckoutMethod === "google" ? (
                  <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border border-blue-500" />
                )}
              </div>

              {/* Saved Cards */}
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedCheckoutMethod(card.id);
                    setPaymentMethod("ONLINE_CARD");
                    setIsAddingCard(false);
                  }}
                  className="flex items-center justify-between py-3 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-7 px-2 rounded flex items-center justify-center bg-[#E5F1FB] dark:bg-blue-900/30 shrink-0">
                      <span className="text-[13px] font-black italic tracking-tight text-[#1434CB] dark:text-blue-300">VISA</span>
                    </div>
                    <span className="text-base font-medium text-slate-800 dark:text-slate-200">
                      ****{card.number.slice(-4) || "8975"}
                    </span>
                  </div>
                  {selectedCheckoutMethod === card.id ? (
                    <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-blue-500" />
                  )}
                </div>
              ))}

              {/* add new Credit card trigger */}
              <div
                onClick={() => {
                  setSelectedCheckoutMethod("add_card");
                  setIsAddingCard(true);
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
                  <span className="text-base font-medium text-slate-800 dark:text-slate-200">add new Credit card</span>
                </div>
                {selectedCheckoutMethod === "add_card" ? (
                  <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border border-blue-500" />
                )}
              </div>

              {/* Onsite Payment (Cash/Card at Reception) - ONLY FOR ONSITE */}
              {bookingData?.mode === "ONSITE" && (
                <div
                  onClick={() => {
                    setSelectedCheckoutMethod("cash");
                    setPaymentMethod("ONSITE_CASH");
                    setIsAddingCard(false);
                  }}
                  className="flex items-center justify-between py-4 border-t border-slate-200/60 dark:border-slate-800 mt-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <HandCoins className="h-7 w-7 text-slate-700 dark:text-slate-300 stroke-[1.5]" />
                    <div className="flex flex-col">
                      <span className="text-base font-black text-slate-800 dark:text-slate-200">{t("onsitePay") || "Pay at Reception"}</span>
                      <span className="text-[11px] font-bold text-slate-400">{t("onsitePayDesc") || "Payment will be handled at the clinic"}</span>
                    </div>
                  </div>
                  {selectedCheckoutMethod === "cash" ? (
                    <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-blue-500" />
                  )}
                </div>
              )}
            </div>

            {/* Inline Card creation form */}
            {isAddingCard && (
              <div className="mt-3 p-3 border rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Card details</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCard(false);
                      setSelectedCheckoutMethod("apple");
                      setPaymentMethod("ONLINE_WALLET");
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500">Cardholder Name</label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={cardForm.cardholderName}
                      onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                      className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mt-0.5"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500">Card Number</label>
                    <Input
                      placeholder="0000 0000 0000 0000"
                      value={cardForm.cardNumber}
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Expiration Date</label>
                    <Input
                      placeholder="MM/YY"
                      value={cardForm.expiryDate}
                      onChange={(e) => setCardForm({ ...cardForm, expiryDate: e.target.value })}
                      className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">CVV</label>
                    <Input
                      placeholder="***"
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mt-0.5"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!cardForm.cardholderName || !cardForm.cardNumber) {
                      alert("Please enter cardholder name and card number");
                      return;
                    }
                    const newCardId = `card-${Date.now()}`;
                    setCards([
                      ...cards,
                      {
                        id: newCardId,
                        number: cardForm.cardNumber,
                        expiry: cardForm.expiryDate || "12/28",
                        holder: cardForm.cardholderName,
                      },
                    ]);
                    setSelectedCheckoutMethod(newCardId);
                    setPaymentMethod("ONLINE_CARD");
                    setIsAddingCard(false);
                    setCardForm({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });
                  }}
                  className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white mt-1"
                >
                  Save Card
                </Button>
              </div>
            )}
          </div>

          {/* Loyalty points toggle */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/60 dark:border-emerald-800/30">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {t("redeemLoyaltyPoints") || "Redeem Your Loyalty Points"}
                </h5>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {loyaltyPoints || 0} {t("pts") || "pts"} {t("available") || "available"} ({Math.round((loyaltyPoints || 0) * 0.1)} L.E discount)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!(loyaltyPoints > 0)}
              checked={redeemPoints}
              onChange={() => setRedeemPoints(!redeemPoints)}
              className="h-4 w-4 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

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
              <div className="flex items-center gap-2">
                {(specialDiscount > 0 || insuranceDiscount > 0 || (redeemPoints && pointsDiscount > 0)) && (
                  <span className="text-[10px] line-through opacity-50 font-medium">
                    {basePrice} L.E
                  </span>
                )}
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {basePrice} L.E
                </span>
              </div>
            </div>
            {specialDiscount > 0 && (
              <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                <span className="flex items-center gap-1">
                  {t("specialDiscount") || "Special Discount"} ({specialDiscount}%)
                </span>
                <span className="font-black">-{specialDiscountAmount} L.E</span>
              </div>
            )}
            {insuranceDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {t("insuranceDiscount") || "Insurance Discount"} ({insuranceDiscount}%)
                </span>
                <span className="font-black">-{insuranceDiscountAmount} L.E</span>
              </div>
            )}
            {redeemPoints && pointsDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  {t("pointsDiscount") || "Points Discount"}
                </span>
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
