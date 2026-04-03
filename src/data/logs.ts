import { SystemLog } from "@/types";

export const systemLogs: SystemLog[] = [
  { id: "log-1", action: "User Login", user: "admin@clinic.com", role: "SUPER_ADMIN", timestamp: "2026-04-03T08:15:00", details: "Successful login from 192.168.1.1", level: "info" },
  { id: "log-2", action: "Appointment Created", user: "reception@clinic.com", role: "RECEPTION", timestamp: "2026-04-03T08:30:00", details: "New appointment created for John Smith with Dr. Mitchell", level: "info" },
  { id: "log-3", action: "Inventory Alert", user: "system", role: "SUPER_ADMIN", timestamp: "2026-04-03T09:00:00", details: "Face Masks N95 stock below minimum threshold", level: "warning" },
  { id: "log-4", action: "Failed Login Attempt", user: "unknown@email.com", role: "PATIENT", timestamp: "2026-04-03T09:15:00", details: "Failed login attempt - invalid credentials from 10.0.0.5", level: "error" },
  { id: "log-5", action: "Doctor Schedule Updated", user: "dr.mitchell@clinic.com", role: "DOCTOR", timestamp: "2026-04-03T09:45:00", details: "Dr. Mitchell updated availability for next week", level: "info" },
  { id: "log-6", action: "Service Price Updated", user: "admin@clinic.com", role: "MEDICAL_ADMIN", timestamp: "2026-04-03T10:00:00", details: "Cardiac Screening price updated from $400 to $450", level: "info" },
  { id: "log-7", action: "Appointment Cancelled", user: "patient@email.com", role: "PATIENT", timestamp: "2026-04-03T10:30:00", details: "Appointment #APT-102 cancelled by patient", level: "warning" },
  { id: "log-8", action: "New User Registration", user: "newpatient@email.com", role: "PATIENT", timestamp: "2026-04-03T11:00:00", details: "New patient registration completed", level: "info" },
  { id: "log-9", action: "Inventory Restocked", user: "admin@clinic.com", role: "MEDICAL_ADMIN", timestamp: "2026-04-02T14:00:00", details: "Surgical Gloves restocked - 250 boxes added", level: "info" },
  { id: "log-10", action: "System Backup", user: "system", role: "SUPER_ADMIN", timestamp: "2026-04-02T02:00:00", details: "Automated daily backup completed successfully", level: "info" },
];
