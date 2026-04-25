"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Building2, MapPin, Globe, Phone, Mail, Plus, Trash2, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { clinicService } from "@/services/clinicService";
import { notificationsService } from "@/services/notificationsService";
import type { ApiClinic, ApiBranch, ApiNotificationTemplate, ClinicSettings } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";

const emptyBranchForm = {
  name: "",
  address: "",
  phone: "",
  isMain: false,
};

export default function ClinicManagementPage() {
  const { locale } = useTranslation();
  const { success, error } = useToastStore();
  const [clinic, setClinic] = useState<ApiClinic | null>(null);
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [isBranchSaving, setIsBranchSaving] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [commTemplates, setCommTemplates] = useState<ApiNotificationTemplate[]>([]);
  const [commSettings, setCommSettings] = useState<ClinicSettings>({
    receptionWhatsAppNumber: "",
    receptionReminderDelayMinutes: 15,
    doctorDailySummaryHour: 8,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clinicData, branchesData, templatesData] = await Promise.all([
        clinicService.getClinic(),
        clinicService.getBranches(),
        notificationsService.getTemplates().catch(() => [])
      ]);
      setClinic(clinicData);
      setBranches(branchesData);
      setCommTemplates(templatesData);
      
      const settings = clinicData.settings || {};
      setCommSettings({
        receptionWhatsAppNumber: settings.receptionWhatsAppNumber || "",
        receptionReminderDelayMinutes: settings.receptionReminderDelayMinutes || 15,
        doctorDailySummaryHour: settings.doctorDailySummaryHour || 8,
      });
    } catch {
      error("Failed to load clinic data");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;
    setIsSaving(true);
    try {
      await clinicService.updateClinic(clinic);
      success("Clinic profile updated");
    } catch {
      error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateBranch = () => {
    setEditingBranchId(null);
    setBranchForm(emptyBranchForm);
    setBranchDialogOpen(true);
  };

  const openEditBranch = (branch: ApiBranch) => {
    setEditingBranchId(branch.id);
    setBranchForm({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      isMain: branch.isMain,
    });
    setBranchDialogOpen(true);
  };

  const handleSaveBranch = async () => {
    if (!branchForm.name.trim()) {
      error("Branch name is required");
      return;
    }

    setIsBranchSaving(true);
    try {
      const payload = {
        name: branchForm.name.trim(),
        address: branchForm.address.trim() || undefined,
        phone: branchForm.phone.trim() || undefined,
        isMain: branchForm.isMain,
      };

      if (editingBranchId) {
        await clinicService.updateBranch(editingBranchId, payload);
        success("Branch updated");
      } else {
        await clinicService.createBranch(payload);
        success("Branch created");
      }

      setBranchDialogOpen(false);
      setEditingBranchId(null);
      setBranchForm(emptyBranchForm);
      await loadData();
    } catch {
      error("Failed to save branch");
    } finally {
      setIsBranchSaving(false);
    }
  };

  const handleDeleteBranch = async (branch: ApiBranch) => {
    if (!window.confirm(`Delete branch \"${branch.name}\"?`)) return;

    try {
      await clinicService.deleteBranch(branch.id);
      success("Branch deleted");
      await loadData();
    } catch {
      error("Failed to delete branch");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      error("Logo file size should be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      error("Please upload an image file");
      return;
    }

    setIsLogoUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        try {
          const updatedClinic = await clinicService.uploadLogo(dataUrl);
          setClinic(updatedClinic);
          success("Clinic logo updated successfully");
        } catch {
          error("Failed to upload logo");
        } finally {
          setIsLogoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      error("Failed to process image");
      setIsLogoUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl animate-pulse">
        <div className="h-20 bg-muted rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] bg-muted rounded-2xl" />
          <div className="h-[300px] bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader 
        title={locale === "ar" ? "إعدادات المستشفى" : "Hospitals Settings"}
        description={locale === "ar" ? "إدارة الملف التعريفي للمستشفى وفروعها" : "Manage hospital profile, branding, and branch network."}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-background/50 border-2 rounded-2xl p-1 mb-8 gap-1">
          <TabsTrigger value="profile" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
            {locale === "ar" ? "ملف المستشفى" : "Hospital Profile"}
          </TabsTrigger>
          <TabsTrigger value="branches" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
             {locale === "ar" ? "الفروع" : "Branches"}
          </TabsTrigger>
          <TabsTrigger value="communication" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
             {locale === "ar" ? "التواصل" : "Communication"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Core Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateClinic} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Hospital Name</label>
                        <Input 
                          value={clinic?.name || ""} 
                          onChange={(e) => setClinic(prev => prev ? {...prev, name: e.target.value} : null)}
                          className="h-12 border-2 bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Website URL</label>
                        <div className="relative">
                          < Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            value={clinic?.website || ""} 
                            onChange={(e) => setClinic(prev => prev ? {...prev, website: e.target.value} : null)}
                            className="h-12 border-2 bg-background/50 pl-10"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Contact Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            value={clinic?.email || ""} 
                            onChange={(e) => setClinic(prev => prev ? {...prev, email: e.target.value} : null)}
                            className="h-12 border-2 bg-background/50 pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Primary Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            value={clinic?.phone || ""} 
                            onChange={(e) => setClinic(prev => prev ? {...prev, phone: e.target.value} : null)}
                            className="h-12 border-2 bg-background/50 pl-10"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                         <label className="text-sm font-semibold ml-1">Description</label>
                         <textarea 
                           className="w-full rounded-xl border-2 bg-background/50 p-4 min-h-[120px] focus:outline-none focus:border-primary transition-colors"
                           value={clinic?.description || ""}
                           onChange={(e) => setClinic(prev => prev ? {...prev, description: e.target.value} : null)}
                         />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving} className="px-10 h-12 shadow-lg shadow-primary/20 gap-2">
                        {isSaving ? "Saving..." : <><Check className="h-4 w-4" /> Save Changes</>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden">
                <CardHeader className="relative">
                   <CardTitle className="flex items-center gap-2">
                     <Building2 className="h-5 w-5" /> Clinic Branding
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                   <div 
                      className={`rounded-3xl bg-white/20 p-8 flex flex-col items-center justify-center border-2 border-dashed border-white/40 group cursor-pointer hover:bg-white/30 transition-all ${isLogoUploading ? "opacity-50 cursor-wait" : ""}`}
                      onClick={() => !isLogoUploading && fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                      />
                      <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center p-3 mb-4 shadow-xl">
                        {clinic?.logoUrl ? (
                            <div className="relative h-20 w-20">
                              <Image src={clinic.logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                            </div>
                        ) : (
                          <Building2 className="h-10 w-10 text-primary" />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                        {isLogoUploading ? "Uploading..." : "Change Logo"}
                      </span>
                   </div>
                   <p className="text-xs opacity-70 italic text-center leading-relaxed">
                     Your logo appears in emails, prescriptions, and on the client-facing booking interface.
                   </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold">Manage Branches</h3>
              <p className="text-sm text-muted-foreground">Add and manage physical clinic locations</p>
            </div>
            <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateBranch} className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> Add Branch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBranchId ? "Edit Branch" : "Create Branch"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Branch name"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Address"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, address: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={branchForm.isMain}
                      onChange={(e) => setBranchForm((prev) => ({ ...prev, isMain: e.target.checked }))}
                    />
                    Main branch
                  </label>
                  <Button onClick={handleSaveBranch} disabled={isBranchSaving} className="w-full">
                    {isBranchSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <Card key={branch.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <div className="aspect-[16/9] bg-muted relative">
                  {branch.imageUrl ? (
                    <Image src={branch.imageUrl} alt={branch.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                     <Badge className="shadow-lg backdrop-blur-md bg-white/90 text-primary hover:bg-white">{branch.isMain ? "Main" : "Secondary"}</Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-lg mb-1">{branch.name}</h4>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span className="line-clamp-2">{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Phone className="h-4 w-4 text-primary" />
                       <span>{branch.phone}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 bg-white shadow-xl hover:text-primary"
                    onClick={() => openEditBranch(branch)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 bg-white shadow-xl hover:text-destructive"
                    onClick={() => handleDeleteBranch(branch)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <Card>
                   <CardHeader>
                      <CardTitle>{locale === "ar" ? "قواعد الإشعارات والواتساب" : "WhatsApp & Notification Rules"}</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-sm font-semibold">{locale === "ar" ? "رقم استقبال واتساب" : "Reception WhatsApp #"}</label>
                            <Input 
                               value={commSettings.receptionWhatsAppNumber}
                               onChange={(e) => setCommSettings(prev => ({...prev, receptionWhatsAppNumber: e.target.value}))}
                               placeholder="+966..."
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-semibold">{locale === "ar" ? "تأخير تذكير الاستقبال (دقائق)" : "Reception Reminder Delay (min)"}</label>
                            <Input 
                               type="number"
                               value={commSettings.receptionReminderDelayMinutes}
                               onChange={(e) => setCommSettings(prev => ({...prev, receptionReminderDelayMinutes: parseInt(e.target.value)}))}
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-semibold">{locale === "ar" ? "ساعة تقرير الأطباء" : "Doctor Daily Summary Hour"}</label>
                            <Input 
                               type="number"
                               min="0"
                               max="23"
                               value={commSettings.doctorDailySummaryHour}
                               onChange={(e) => setCommSettings(prev => ({...prev, doctorDailySummaryHour: parseInt(e.target.value)}))}
                            />
                         </div>
                      </div>
                      <Button 
                        onClick={async () => {
                           try {
                              await notificationsService.updateSettings(commSettings);
                              success("Communication settings updated");
                           } catch {
                              error("Failed to update settings");
                           }
                        }}
                      >
                         {locale === "ar" ? "حفظ الإعدادات" : "Save Settings"}
                      </Button>
                   </CardContent>
                </Card>

                <Card>
                   <CardHeader>
                      <CardTitle>{locale === "ar" ? "نماذج الرسائل" : "System Message Templates"}</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      {["APPOINTMENT_REMINDER_24H", "APPOINTMENT_REMINDER_2H", "PATIENT_FEEDBACK_PROMPT"].map(key => {
                         const template = commTemplates.find(t => t.key === key && t.language === "en");
                         return (
                            <div key={key} className="p-4 border rounded-xl space-y-2">
                               <div className="flex justify-between items-center">
                                  <Badge variant="outline" className="text-[10px] font-mono">{key}</Badge>
                                  <Badge variant={template?.isActive ? "outline" : "secondary"}>{template?.isActive ? "Active" : "New"}</Badge>
                               </div>
                               <div className="flex gap-2">
                                  <textarea 
                                     className="flex-1 text-xs p-2 border rounded bg-slate-50 dark:bg-slate-900"
                                     placeholder="Message content..."
                                     defaultValue={template?.content || ""}
                                     onBlur={async (e) => {
                                        try {
                                           await notificationsService.upsertTemplate({
                                              key,
                                              language: "en",
                                              channel: "WHATSAPP",
                                              audience: key.includes("RECEPTION") ? "RECEPTION" : "PATIENT",
                                              content: e.target.value,
                                              externalId: template?.externalId,
                                              isActive: true
                                           });
                                           success(`Template ${key} saved`);
                                        } catch {
                                           error(`Failed to save ${key}`);
                                        }
                                     }}
                                  />
                                  <div className="w-32 space-y-1">
                                     <label className="text-[9px] uppercase font-bold opacity-60">Content SID</label>
                                     <Input 
                                        className="h-7 text-[10px]"
                                        placeholder="HX..."
                                        defaultValue={template?.externalId || ""}
                                        onBlur={async (e) => {
                                           try {
                                              await notificationsService.upsertTemplate({
                                                 key,
                                                 language: "en",
                                                 channel: "WHATSAPP",
                                                 audience: key.includes("RECEPTION") ? "RECEPTION" : "PATIENT",
                                                 content: template?.content || "",
                                                 externalId: e.target.value,
                                                 isActive: true
                                              });
                                              success(`SID for ${key} updated`);
                                           } catch {
                                              error(`Failed to update SID`);
                                           }
                                        }}
                                     />
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                   </CardContent>
                </Card>
             </div>
             <div className="space-y-6">
                <Card className="bg-blue-600 text-white">
                   <CardHeader>
                      <CardTitle className="text-sm">Quick Help</CardTitle>
                   </CardHeader>
                   <CardContent className="text-xs space-y-2 opacity-90">
                      <p>• {`{patientName}`} maps to the patient full name</p>
                      <p>• {`{doctorName}`} maps to the doctor full name</p>
                      <p>• {`{appointmentDate}`} and {`{appointmentTime}`} are dynamic</p>
                   </CardContent>
                </Card>
             </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
