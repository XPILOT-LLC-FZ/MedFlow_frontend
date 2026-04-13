"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

type Props = { status: "ACTIVE" | "ON_LEAVE" | "INACTIVE" };

export function DoctorStatusBadge({ status }: Props) {
  const variant = status === "ACTIVE" ? "success" : status === "ON_LEAVE" ? "warning" : "secondary";
  const label = status === "ACTIVE" ? "Active" : status === "ON_LEAVE" ? "On Leave" : "Inactive";
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}
