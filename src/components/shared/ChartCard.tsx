"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface ChartCardProps {
  title: string;
  type: "area" | "bar" | "pie";
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  nameKey?: string;
  className?: string;
  delay?: number;
}

export function ChartCard({ title, type, data, dataKey, xKey = "name", nameKey, className, delay = 0 }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {type === "area" ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey={xKey} className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey={dataKey} stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} />
                </AreaChart>
              ) : type === "bar" ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey={xKey} className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey={dataKey}
                    nameKey={nameKey || xKey}
                  >
                    {data.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
