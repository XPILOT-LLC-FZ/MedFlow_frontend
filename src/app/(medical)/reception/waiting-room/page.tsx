"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, User, Stethoscope, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";

const waitingPatients = [
  { id: 1, name: "John Smith", doctor: "Dr. Sarah Mitchell", specialty: "Cardiology", arrivalTime: "8:45 AM", appointmentTime: "9:00 AM", waitTime: "5 min", status: "next", priority: "normal" },
  { id: 2, name: "Maria Garcia", doctor: "Dr. Emily Chen", specialty: "Pediatrics", arrivalTime: "9:10 AM", appointmentTime: "9:30 AM", waitTime: "15 min", status: "waiting", priority: "normal" },
  { id: 3, name: "Ali Mohammed", doctor: "Dr. Ahmed Hassan", specialty: "Dermatology", arrivalTime: "9:25 AM", appointmentTime: "10:00 AM", waitTime: "30 min", status: "waiting", priority: "normal" },
  { id: 4, name: "Lisa Anderson", doctor: "Dr. Michael Roberts", specialty: "Orthopedics", arrivalTime: "9:40 AM", appointmentTime: "10:30 AM", waitTime: "45 min", status: "waiting", priority: "urgent" },
  { id: 5, name: "Omar Khalil", doctor: "Dr. Sarah Mitchell", specialty: "Cardiology", arrivalTime: "9:50 AM", appointmentTime: "11:00 AM", waitTime: "1 hr", status: "waiting", priority: "normal" },
];

export default function WaitingRoomPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={t("waitingRoom")}
        description={locale === "ar" ? "إدارة قائمة الانتظار في الوقت الفعلي" : "Real-time waiting room management"}
      />

      {/* Summary */}
      <div className="flex gap-4 flex-wrap">
        <Badge variant="info" className="text-sm px-3 py-1">
          {locale === "ar" ? "في الانتظار" : "Waiting"}: {waitingPatients.length}
        </Badge>
        <Badge variant="success" className="text-sm px-3 py-1">
          {locale === "ar" ? "التالي" : "Next"}: {waitingPatients.find((p) => p.status === "next")?.name}
        </Badge>
        <Badge variant="warning" className="text-sm px-3 py-1">
          {locale === "ar" ? "متوسط الانتظار" : "Avg. Wait"}: 20 min
        </Badge>
      </div>

      {/* Patient list */}
      <div className="space-y-3">
        {waitingPatients.map((patient, i) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={patient.status === "next" ? "ring-2 ring-emerald-500/50 shadow-md" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${patient.status === "next" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{patient.name}</p>
                        {patient.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {patient.doctor}</span>
                        <span>{patient.specialty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{locale === "ar" ? "وقت الموعد" : "Appt"}: {patient.appointmentTime}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" /> {locale === "ar" ? "انتظار" : "Wait"}: {patient.waitTime}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="text-xs h-8 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {t("checkIn")}
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-destructive">
                        <XCircle className="h-3 w-3" /> {t("cancel")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
