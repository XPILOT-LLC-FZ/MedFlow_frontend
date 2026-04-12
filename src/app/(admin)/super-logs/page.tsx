"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, AlertTriangle, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { systemLogs } from "@/data/logs";

const levelVariant: Record<string, "info" | "warning" | "destructive"> = {
  info: "info",
  warning: "warning",
  error: "destructive",
};

const levelIcon = {
  info: <Info className="h-3.5 w-3.5" />,
  warning: <AlertTriangle className="h-3.5 w-3.5" />,
  error: <XCircle className="h-3.5 w-3.5" />,
};

export default function LogsPage() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");

  const filtered = systemLogs.filter((log) => {
    const matchSearch = log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "All" || log.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("systemLogs")}
        description={locale === "ar" ? "سجلات النشاط والأحداث" : "Activity and event logs"}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={locale === "ar" ? "ابحث في السجلات..." : "Search logs..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>
        <div className="flex gap-2">
          {["All", "info", "warning", "error"].map((level) => (
            <Button key={level} variant={levelFilter === level ? "default" : "outline"} size="sm" onClick={() => setLevelFilter(level)} className="rounded-full capitalize">
              {level === "All" ? t("all") : level}
            </Button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("level")}</TableHead>
                <TableHead>{t("action")}</TableHead>
                <TableHead>{locale === "ar" ? "المستخدم" : "User"}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("details")}</TableHead>
                <TableHead>{t("timestamp")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={levelVariant[log.level]} className="gap-1 text-xs">
                      {levelIcon[log.level as keyof typeof levelIcon]}
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{log.user}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{log.role}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[300px] truncate">{log.details}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
}
