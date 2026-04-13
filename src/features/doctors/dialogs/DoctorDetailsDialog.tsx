"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DoctorStatusBadge } from "@/features/doctors/components/DoctorStatusBadge";
import type { ApiDoctor } from "@/types";

type DoctorDetailsDialogProps = {
  open: boolean;
  doctor: ApiDoctor | null;
  onOpenChange: (open: boolean) => void;
};

export function DoctorDetailsDialog({ open, doctor, onOpenChange }: DoctorDetailsDialogProps) {
  if (!doctor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Doctor Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src={doctor.user?.avatarUrl || "/default-avatar.png"}
              alt={doctor.fullName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />
            <div>
              <p className="text-base font-semibold text-foreground">{doctor.fullName}</p>
              <p className="text-sm text-muted-foreground">{doctor.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Specialization</p>
              <p className="mt-1 font-medium text-foreground">{doctor.specialization || "General"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="mt-1 font-medium text-foreground">{doctor.phone || "-"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="mt-1 font-medium text-foreground">{doctor.experienceYears} years</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">
                <DoctorStatusBadge status={doctor.status} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
