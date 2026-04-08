"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, User, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Appointment } from "@/types";

const statusVariant: Record<string, "success" | "info" | "warning" | "destructive" | "secondary"> = {
  scheduled: "info",
  confirmed: "success",
  completed: "secondary",
  cancelled: "destructive",
  "in-progress": "warning",
  "no-show": "destructive",
  rescheduled: "warning",
};

export function AppointmentCard({
  appointment,
  delay = 0,
}: {
  appointment: Appointment;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">{appointment.doctorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{appointment.patientName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{appointment.date} at {appointment.time}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{appointment.specialty}</Badge>
              <Badge variant="outline" className="text-xs">{appointment.type}</Badge>
            </div>
          </div>
          <Badge variant={statusVariant[appointment.status]}>
            {appointment.status.replace("-", " ")}
          </Badge>
        </div>
        {appointment.notes && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{appointment.notes}</p>
        )}
      </Card>
    </motion.div>
  );
}
