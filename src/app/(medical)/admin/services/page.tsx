"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, SlidersHorizontal, Activity, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import type { ApiService, CreateServicePayload, UpdateServicePayload } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";

const SERVICE_CATEGORIES: ApiService["category"][] = [
  "CONSULTATION",
  "DENTAL",
  "DERMATOLOGY",
  "LASER",
  "AESTHETIC",
  "SURGICAL",
  "DIAGNOSTIC",
  "WELLNESS",
  "OTHER",
];

const emptyForm = {
  name: "",
  description: "",
  category: "CONSULTATION" as ApiService["category"],
  price: "",
  durationMinutes: "30",
  isActive: true,
  requiresSessions: false,
  totalSessions: "",
};

export default function ServicesManagementPage() {
  const { locale } = useTranslation();
  const { success, error } = useToastStore();
  const [services, setServices] = useState<ApiService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await servicesCatalogService.getAll();
      setServices(data);
    } catch {
      error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await servicesCatalogService.remove(id);
      success("Service deleted");
      await loadServices();
    } catch {
      error("Failed to delete service");
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (service: ApiService) => {
    setEditId(service.id);
    setForm({
      name: service.name,
      description: service.description || "",
      category: service.category,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
      isActive: service.isActive,
      requiresSessions: service.requiresSessions,
      totalSessions: service.totalSessions ? String(service.totalSessions) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      error("Service name is required");
      return;
    }

    const payloadBase = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      price: parseFloat(form.price) || 0,
      durationMinutes: Math.max(5, parseInt(form.durationMinutes) || 30),
      isActive: form.isActive,
      requiresSessions: form.requiresSessions,
      totalSessions: form.requiresSessions
        ? Math.max(1, parseInt(form.totalSessions) || 1)
        : null,
    };

    setIsSaving(true);
    try {
      if (editId) {
        const updatePayload: UpdateServicePayload = payloadBase;
        await servicesCatalogService.update(editId, updatePayload);
        success("Service updated");
      } else {
        const createPayload: CreateServicePayload = payloadBase;
        await servicesCatalogService.create(createPayload);
        success("Service created");
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      await loadServices();
    } catch {
      error("Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title={locale === "ar" ? "كتالوج الخدمات" : "Services Catalog"}
          description={locale === "ar" ? "إدارة التخصصات الطبية والخدمات والأسعار" : "Manage medical specialties, services, and pricing."}
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              {locale === "ar" ? "إضافة خدمة جديدة" : "Add New Service"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Service" : "Create Service"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Service name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background min-h-20"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as ApiService["category"] }))}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
              >
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={0}
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />
                <Input
                  type="number"
                  min={5}
                  placeholder="Duration (minutes)"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.requiresSessions}
                  onChange={(e) => setForm((prev) => ({ ...prev, requiresSessions: e.target.checked }))}
                />
                Requires multiple sessions
              </label>
              {form.requiresSessions && (
                <Input
                  type="number"
                  min={1}
                  placeholder="Total sessions"
                  value={form.totalSessions}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalSessions: e.target.value }))}
                />
              )}
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search services..." 
                className="pl-10 h-11 bg-background/50 border-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 h-11 border-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </div>

          <div className="rounded-2xl border-2 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><div className="h-6 w-full animate-pulse bg-muted rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <TableRow key={service.id} className="group hover:bg-primary/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                            <Activity className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-sm">{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-md font-medium">
                          {service.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {service.durationMinutes} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-bold text-primary">
                          <DollarSign className="h-4 w-4" />
                          {service.price}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "success" : "secondary"} className="rounded-full">
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => openEdit(service)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(service.id, service.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No services matched your query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
