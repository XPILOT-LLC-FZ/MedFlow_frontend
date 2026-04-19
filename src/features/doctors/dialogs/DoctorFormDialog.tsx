"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApiDoctor, CreateDoctorPayload, UpdateDoctorPayload } from "@/types";

type DoctorFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  doctor: ApiDoctor | null;
  clinicId: string | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateDoctorPayload) => Promise<void>;
  onUpdate: (doctorId: string, payload: UpdateDoctorPayload) => Promise<void>;
};

type DoctorStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  status: DoctorStatus;
  password: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  specialization: "",
  status: "ACTIVE",
  password: "",
};

export function DoctorFormDialog({
  open,
  mode,
  doctor,
  clinicId,
  isSubmitting,
  onOpenChange,
  onCreate,
  onUpdate,
}: DoctorFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update doctor profile details and status."
              : "Create a new doctor profile with login access."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <DoctorFormInner
            key={doctor?.id || "new"}
            mode={mode}
            doctor={doctor}
            clinicId={clinicId}
            isSubmitting={isSubmitting}
            onOpenChange={onOpenChange}
            onCreate={onCreate}
            onUpdate={onUpdate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DoctorFormInner({
  mode,
  doctor,
  clinicId,
  isSubmitting,
  onOpenChange,
  onCreate,
  onUpdate,
}: Omit<DoctorFormDialogProps, "open">) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<FormState>(() => {
    if (isEdit && doctor) {
      return {
        fullName: doctor.fullName,
        email: doctor.email,
        phone: doctor.phone || "",
        specialization: doctor.specialization || "",
        status: doctor.status,
        password: "",
      };
    }
    return initialForm;
  });

  const canSubmit = useMemo(() => {
    if (!form.fullName.trim()) return false;
    if (!isEdit && (!form.email.trim() || form.password.length < 8)) return false;
    return true;
  }, [form, isEdit]);

  const submit = async () => {
    if (!canSubmit) return;
    if (!clinicId && !isEdit) return;

    if (isEdit && doctor) {
      await onUpdate(doctor.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        status: form.status,
      });
      onOpenChange(false);
      return;
    }

    await onCreate({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      specialization: form.specialization.trim() || undefined,
      status: form.status,
      password: form.password,
      clinicId: clinicId as string,
      consultationFee: 0,
      services: [],
    });
    onOpenChange(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 py-2">
        <div className="grid grid-cols-1 gap-1.5">
          <label className="text-sm font-medium">Full Name</label>
          <Input
            value={form.fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
            placeholder="Dr. John Doe"
          />
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={form.email}
            disabled={isEdit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="doctor@clinic.com"
          />
        </div>

        {!isEdit && (
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-sm font-medium">Temporary Password</label>
            <Input
              type="password"
              value={form.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Minimum 8 characters"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={form.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+1 555 1234"
            />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-sm font-medium">Specialization</label>
            <Input
              value={form.specialization}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, specialization: e.target.value }))
              }
              placeholder="Dermatology"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          <label className="text-sm font-medium">Status</label>
          <select
            value={form.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({ ...prev, status: e.target.value as DoctorStatus }))
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => void submit()} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Doctor"}
        </Button>
      </DialogFooter>
    </>
  );
}
