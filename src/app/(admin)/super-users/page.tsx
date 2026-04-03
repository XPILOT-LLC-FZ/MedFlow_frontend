"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { userService, type SystemUser } from "@/services/userService";
import type { Role } from "@/types";

const roleBadgeVariant: Record<Role, "default" | "info" | "success" | "warning" | "secondary"> = {
  PATIENT: "info",
  DOCTOR: "success",
  RECEPTION: "warning",
  MEDICAL_ADMIN: "secondary",
  SUPER_ADMIN: "default",
};

export default function UsersPage() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  // Dynamic data from userService
  const allUsers = userService.getAll();

  const filtered = allUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("manageUsers")}
        description={locale === "ar" ? "إدارة جميع مستخدمي النظام" : "Manage all system users"}
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> {locale === "ar" ? "إضافة مستخدم" : "Add User"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{locale === "ar" ? "إضافة مستخدم جديد" : "Add New User"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder={t("fullName")} />
                <Input placeholder={t("email")} />
                <Input placeholder={t("role")} />
                <Button className="w-full">{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={locale === "ar" ? "ابحث عن مستخدم..." : "Search users..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "PATIENT", "DOCTOR", "RECEPTION", "MEDICAL_ADMIN", "SUPER_ADMIN"].map((r) => (
            <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r)} className="rounded-full text-xs">
              {r === "All" ? t("all") : r.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fullName")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell><Badge variant={roleBadgeVariant[user.role]} className="text-xs">{user.role.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "secondary"} className="text-xs">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("noResults")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
}
