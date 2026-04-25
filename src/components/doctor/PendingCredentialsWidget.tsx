"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, X, ShieldCheck, Eye, Clock, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffService } from "@/services/staffService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { FilePreviewDialog } from "@/components/shared/FilePreviewDialog";
import type { ApiDoctorCredential } from "@/types";

type PendingCredential = ApiDoctorCredential & {
  doctor: {
    id: string;
    fullName: string;
    user: {
      clinic: {
        name: string;
      };
    };
  };
};

export function PendingCredentialsWidget() {
  const { locale } = useTranslation();
  const toast = useToastStore();
  const [pending, setPending] = useState<PendingCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; fileUrl: string; fileType: string } | null>(null);

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await staffService.getPendingCredentials();
      setPending(data);
    } catch (err) {
      console.error("Failed to load pending credentials", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const handleModeration = async (credential: PendingCredential, action: "approve" | "reject") => {
    setProcessingId(credential.id);
    try {
      await staffService.updateDoctorCredential(credential.doctor.id, credential.id, {
        isVerified: action === "approve",
        isRejected: action === "reject",
        isVisibleToPatients: action === "approve", // Default to show if approved
        isVisibleToPublic: action === "approve",   // Default to show if approved
      });
      
      toast.success(
        locale === "ar" 
          ? (action === "approve" ? "تم توثيق الملف بنجاح" : "تم رفض التوثيق")
          : (action === "approve" ? "Credential verified successfully" : "Verification rejected")
      );
      
      setPending((prev) => prev.filter((p) => p.id !== credential.id));
    } catch (err) {
      console.error("Moderation failed", err);
      toast.error(locale === "ar" ? "فشلت العملية" : "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isLoading && pending.length === 0) return null;

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {locale === "ar" ? "توثيقات الأطباء المعلقة" : "Pending Doctor Verifications"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" 
              ? "يوجد " + pending.length + " طلبات توثيق بانتظار المراجعة"
              : "There are " + pending.length + " pending verification requests"}
          </p>
        </div>
        <Badge variant="outline" className="animate-pulse">
          {pending.length}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{item.doctor.fullName}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {item.doctor.user.clinic.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </p>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {item.credentialType.replace(/_/g, " ")}
                      </Badge>
                      <span className="ml-2 text-xs font-medium">{item.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setPreviewFile({ 
                      name: item.name, 
                      fileUrl: item.previewUrl || "", 
                      fileType: item.fileType || "application/pdf" 
                    })}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {locale === "ar" ? "معاينة" : "Preview"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="success"
                    className="h-8"
                    disabled={processingId === item.id}
                    onClick={() => void handleModeration(item, "approve")}
                  >
                    {processingId === item.id ? (
                       <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    {locale === "ar" ? "توثيق" : "Approve"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={processingId === item.id}
                    onClick={() => void handleModeration(item, "reject")}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    {locale === "ar" ? "رفض" : "Reject"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <FilePreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
      />
    </Card>
  );
}
