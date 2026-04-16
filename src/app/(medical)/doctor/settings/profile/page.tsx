"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Save, Upload, User, MapPin, Mail, Phone, Briefcase, FileBadge2, Stethoscope, Clock3, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UpdateDoctorPayload } from "@/types";
import { CldUploadWidget } from "next-cloudinary";

export default function DoctorProfileSettingsPage() {
  const { locale } = useTranslation();
  const { user, updateProfile } = useAuthStore();
  const { doctors, fetchDoctors, updateDoctor } = useStaffStore();
  const { success, error } = useToastStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [ministryOfHealthId, setMinistryOfHealthId] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experienceStartDate, setExperienceStartDate] = useState("");
  const [qualification, setQualification] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const doctorRecord = useMemo(
    () =>
      doctors.find(
        (entry) =>
          entry.userId === user?.id ||
          entry.id === user?.id ||
          entry.email?.toLowerCase() === user?.email?.toLowerCase(),
      ),
    [doctors, user?.email, user?.id],
  );

  useEffect(() => {
    void fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    const defaultFullName = user?.name ?? doctorRecord?.fullName ?? "";
    const nameParts = defaultFullName.split(" ");
    const defaultFirstName = nameParts[0] || "";
    const defaultLastName = nameParts.slice(1).join(" ") || "";

    setFirstName(defaultFirstName);
    setLastName(defaultLastName);
    setPhone(doctorRecord?.phone ?? "");
    setMinistryOfHealthId(doctorRecord?.ministryOfHealthId ?? "");
    setSpecialization(doctorRecord?.specialization ?? "");
    setQualification(doctorRecord?.qualification ?? "");
    setExperienceStartDate(
      doctorRecord?.experienceStartDate 
        ? doctorRecord.experienceStartDate.split("T")[0] // Assuming ISO string from backend
        : ""
    );
  }, [
    doctorRecord?.fullName, 
    doctorRecord?.phone, 
    doctorRecord?.ministryOfHealthId, 
    doctorRecord?.specialization,
    doctorRecord?.experienceStartDate,
    user?.name
  ]);

  const computedYearsOfExperience = useMemo(() => {
    if (!experienceStartDate) return "";
    const startObj = new Date(experienceStartDate);
    if (isNaN(startObj.getTime())) return "";
    const now = new Date();
    
    let diff = now.getFullYear() - startObj.getFullYear();
    if (
      now.getMonth() < startObj.getMonth() || 
      (now.getMonth() === startObj.getMonth() && now.getDate() < startObj.getDate())
    ) {
      diff--;
    }
    
    return diff >= 0 ? diff.toString() : "0";
  }, [experienceStartDate]);

  const handleSaveProfile = async () => {
    if (!firstName || firstName.trim().length < 2) {
      error(locale === "ar" ? "الاسم الأول يجب أن يكون حرفين على الأقل" : "First name must be at least 2 characters");
      return;
    }

    setIsSavingProfile(true);
    try {
      const combinedFullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const authUpdateResult = await updateProfile({
        name: combinedFullName,
        ...(avatarPreview && avatarPreview !== user?.avatarUrl ? { avatarUrl: avatarPreview } : {}),
      });

      if (!authUpdateResult.success) {
        error(
          authUpdateResult.error ||
            (locale === "ar" ? "فشل تحديث البيانات" : "Failed to update profile"),
        );
        return;
      }

      if (doctorRecord?.id) {
        let formattedExperienceDate = null;
        if (experienceStartDate) {
          formattedExperienceDate = experienceStartDate;
        }
        
        // Add proper ISO formatting
        const doctorPayload: UpdateDoctorPayload = {
          fullName: combinedFullName,
          phone: phone.trim() || undefined,
          ministryOfHealthId: ministryOfHealthId.trim() || null,
          specialization: specialization.trim() || undefined,
          qualification: qualification.trim() || undefined,
        };

        if (user?.role !== "DOCTOR") {
           doctorPayload.experienceStartDate = formattedExperienceDate;
        }

        await updateDoctor(doctorRecord.id, doctorPayload);
      }

      success(locale === "ar" ? "تم تحديث البيانات" : "Profile updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="doctor-dashboard space-y-6 max-w-4xl pb-10">
      
      {/* Profile Picture Card */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm border-none shadow-none bg-transparent">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <h2 className="text-sm font-semibold text-slate-900 absolute opacity-0 select-none -z-10">Profile Picture</h2>
            <div className="flex flex-col w-full gap-4">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">Profile Picture</span>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 bg-blue-100 text-blue-600">
                  <AvatarImage src={avatarPreview || user?.avatarUrl || undefined} alt="Avatar" />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-4 border-white dark:border-slate-900 shadow-sm">
                    <User className="h-10 w-10 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                   <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset"}
                      onSuccess={(result: any) => {
                         if (result.info?.secure_url) {
                            setAvatarPreview(result.info.secure_url);
                         }
                      }}
                   >
                     {({ open }) => (
                       <Button type="button" variant="outline" size="sm" className="w-fit flex items-center gap-2 border-slate-200" onClick={() => open()}>
                         <Upload className="h-4 w-4 text-slate-500" />
                         {locale === "ar" ? "رفع صورة" : "Upload Photo"}
                       </Button>
                     )}
                   </CldUploadWidget>
                   <p className="text-xs text-slate-500">JPG, PNG or GIF • Max 5MB</p>
                </div>
              </div>
            </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            {locale === "ar" ? "المعلومات الشخصية" : "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{locale === "ar" ? "الاسم الأول" : "First Name"}</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={locale === "ar" ? "سارة" : "Sarah"}
                className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{locale === "ar" ? "اسم العائلة" : "Last Name"}</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={locale === "ar" ? "ميتشل" : "Mitchell"}
                className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{locale === "ar" ? "البريد الإلكتروني" : "Email Address"}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input value={user?.email ?? ""} className="pl-9 bg-slate-50/30 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800" disabled />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{locale === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            {locale === "ar" ? "التفاصيل المهنية" : "Professional Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Row 1: Specialization and (Start Date + YOE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {locale === "ar" ? "التخصص" : "Specialization"}
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="pl-9 bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  placeholder="General Medicine & Cardiology"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px] gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {locale === "ar" ? "تاريخ بدء الخبرة" : "Start Date"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 z-10 pointer-events-none" />
                  <Input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={experienceStartDate}
                    onChange={(e) => setExperienceStartDate(e.target.value)}
                    disabled={user?.role === "DOCTOR"}
                    className="pl-9 bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {user?.role === "DOCTOR" && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    * Admin only
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center block">
                  {locale === "ar" ? "الخبرة" : "YOE"}
                </label>
                <div className="h-10 px-2 flex items-center justify-center bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-900/40 rounded-md text-blue-700 dark:text-blue-400 font-bold text-sm transition-colors duration-200">
                  {computedYearsOfExperience || "0"}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Medical License Number and Qualification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {locale === "ar" ? "رقم الترخيص الطبي" : "Medical License Number"}
              </label>
              <div className="relative">
                <FileBadge2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  value={ministryOfHealthId}
                  onChange={(e) => setMinistryOfHealthId(e.target.value)}
                  className="pl-9 bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  placeholder="MED-2014-789456"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {locale === "ar" ? "المؤهلات" : "Qualification"}
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="pl-9 bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  placeholder="MBBS, MD (Internal Medicine)"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button 
          onClick={() => void handleSaveProfile()} 
          disabled={isSavingProfile}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSavingProfile
            ? locale === "ar"
              ? "جارٍ الحفظ..."
              : "Saving..."
            : locale === "ar"
              ? "حفظ التغييرات"
              : "Save Changes"}
        </Button>
      </div>

    </div>
  );
}
