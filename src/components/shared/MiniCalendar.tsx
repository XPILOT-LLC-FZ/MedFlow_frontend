"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

interface MiniCalendarProps {
  locale?: "en" | "ar";
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  highlightDates?: string[];
}

export function MiniCalendar({
  locale = "en",
  selectedDate,
  onDateSelect,
  highlightDates = [],
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentMonth.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const isHighlighted = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return highlightDates.includes(dateStr);
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (day: number) =>
    selectedDate &&
    day === selectedDate.getDate() &&
    month === selectedDate.getMonth() &&
    year === selectedDate.getFullYear();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{monthName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {(locale === "ar" ? DAYS_AR : DAYS).map((d) => (
          <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {days.map((day, i) => (
          <button
            key={i}
            disabled={!day}
            onClick={() => day && onDateSelect?.(new Date(year, month, day))}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-medium transition-all duration-150 mx-auto flex items-center justify-center",
              !day && "invisible",
              day && "hover:bg-muted cursor-pointer",
              day && isToday(day) && "ring-1 ring-primary",
              day && isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary/90",
              day && isHighlighted(day) && !isSelected(day) && "bg-primary/10 text-primary font-semibold"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </Card>
  );
}
