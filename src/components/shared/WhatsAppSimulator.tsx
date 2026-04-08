"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, MessageCircle, Send, Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface Message {
  id: string;
  type: "confirmation" | "reminder" | "feedback";
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
}

const messages: Message[] = [
  {
    id: "wa-1",
    type: "confirmation",
    text: "Your appointment with Dr. Sarah Mitchell has been confirmed for April 7, 2026 at 9:00 AM. Reply YES to confirm or NO to cancel.",
    time: "10:30 AM",
    status: "read",
  },
  {
    id: "wa-2",
    type: "reminder",
    text: "Reminder: You have an appointment tomorrow at 9:00 AM with Dr. Sarah Mitchell (Cardiology). Please arrive 15 minutes early.",
    time: "3:00 PM",
    status: "delivered",
  },
  {
    id: "wa-3",
    type: "feedback",
    text: "Thank you for visiting MedFlow! How was your experience with Dr. Ahmed Hassan? Rate 1-5 stars by replying with a number.",
    time: "5:00 PM",
    status: "sent",
  },
];

const statusIcon = {
  sent: <Check className="h-3 w-3 text-muted-foreground" />,
  delivered: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
  read: <CheckCheck className="h-3 w-3 text-blue-500" />,
};

const typeLabels = {
  confirmation: { en: "Appointment Confirmation", ar: "تأكيد الموعد" },
  reminder: { en: "Appointment Reminder", ar: "تذكير الموعد" },
  feedback: { en: "Feedback Request", ar: "طلب تقييم" },
};

function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export function WhatsAppSimulator() {
  const { locale } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-emerald-600 text-white pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-white text-base">MedFlow Notifications</CardTitle>
            <p className="text-emerald-100 text-xs">WhatsApp Business</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-4 space-y-3 min-h-[250px]"
          style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}
        >
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex justify-end"
            >
              <div className="max-w-[85%] bg-[#dcf8c6] dark:bg-emerald-900/50 rounded-lg p-3 shadow-sm">
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-wide">
                  {typeLabels[msg.type][locale]}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  {statusIcon[msg.status]}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* WhatsApp Action Buttons */}
        <div className="p-3 border-t flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            onClick={() => openWhatsApp("Please confirm your upcoming appointment at MedFlow. Reply YES to confirm.")}
          >
            <Send className="h-3 w-3" />
            {locale === "ar" ? "تأكيد الموعد" : "Confirm Appt"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            onClick={() => openWhatsApp("Reminder: You have an appointment tomorrow at MedFlow. Please arrive 15 minutes early.")}
          >
            <Bell className="h-3 w-3" />
            {locale === "ar" ? "إرسال تذكير" : "Send Reminder"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
