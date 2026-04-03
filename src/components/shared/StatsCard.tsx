"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
  delay?: number;
}

export function StatsCard({ title, value, change, icon, description, className, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={cn("p-6 hover:shadow-md transition-shadow", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    change >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {change}%
                </span>
                {description && (
                  <span className="text-xs text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">{icon}</div>
        </div>
      </Card>
    </motion.div>
  );
}
