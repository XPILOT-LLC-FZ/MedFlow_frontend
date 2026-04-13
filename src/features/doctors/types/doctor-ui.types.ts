export type DoctorUiStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE";

export type DoctorListItem = {
  id: string;
  fullName: string;
  specialty: string;
  status: DoctorUiStatus;
  avatarUrl?: string | null;
};
