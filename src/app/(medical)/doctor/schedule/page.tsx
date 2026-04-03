"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Plus, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const schedule: Record<string, { time: string; patient?: string; type?: string }[]> = {
  Monday: [
    { time: "09:00", patient: "John Smith", type: "Follow-up" },
    { time: "10:00", patient: "Maria Garcia", type: "Consultation" },
    { time: "14:00", patient: "Lisa Anderson", type: "Check-up" },
  ],
  Tuesday: [
    { time: "09:00", patient: "Ali Mohammed", type: "Treatment" },
    { time: "11:00", patient: "David Lee", type: "Follow-up" },
  ],
  Wednesday: [
    { time: "09:00", patient: "Emma Watson", type: "Consultation" },
    { time: "10:00", patient: "Omar Khalil", type: "Check-up" },
    { time: "14:00", patient: "Sarah Johnson", type: "Follow-up" },
    { time: "15:00", patient: "New Patient", type: "Initial" },
  ],
  Thursday: [
    { time: "10:00", patient: "Michael Brown", type: "Treatment" },
    { time: "14:00", patient: "Anna Williams", type: "Consultation" },
  ],
  Friday: [
    { time: "09:00", patient: "James Wilson", type: "Follow-up" },
    { time: "10:00", patient: "Rachel Green", type: "Check-up" },
  ],
};

export default function SchedulePage() {
  const { t, locale } = useTranslation();
  const [selectedDay, setSelectedDay] = useState("Monday");

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("schedule")}
        description={locale === "ar" ? "إدارة جدولك الأسبوعي" : "Manage your weekly schedule"}
        action={<Button className="gap-2"><Plus className="h-4 w-4" /> {locale === "ar" ? "إضافة فترة" : "Add Slot"}</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Week view */}
        <div className="lg:col-span-3">
          {/* Day tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {weekDays.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className="rounded-full shrink-0"
              >
                {day}
                {schedule[day] && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">{schedule[day].length}</Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Time grid */}
          <Card>
            <CardContent className="p-0">
              {timeSlots.map((time) => {
                const appt = schedule[selectedDay]?.find((a) => a.time === time);
                return (
                  <div key={time} className="flex border-b last:border-0">
                    <div className="w-20 shrink-0 p-3 text-sm text-muted-foreground font-medium border-r bg-muted/30 flex items-center">
                      {time}
                    </div>
                    <div className="flex-1 p-3">
                      {appt ? (
                        <motion.div
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3"
                        >
                          <div>
                            <p className="font-medium text-sm">{appt.patient}</p>
                            <Badge variant="outline" className="text-xs mt-1">{appt.type}</Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="h-10 flex items-center">
                          <span className="text-xs text-muted-foreground">{locale === "ar" ? "متاح" : "Available"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <MiniCalendar locale={locale} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{locale === "ar" ? "ملخص الأسبوع" : "Week Summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weekDays.map((day) => (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{day.slice(0, 3)}</span>
                  <Badge variant="outline" className="text-xs">
                    {schedule[day]?.length || 0} {locale === "ar" ? "مواعيد" : "appts"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
