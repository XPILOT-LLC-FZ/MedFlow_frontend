import { redirect } from "next/navigation";

export default function DoctorProfileRedirectPage() {
  redirect("/doctor/settings/profile");
}
