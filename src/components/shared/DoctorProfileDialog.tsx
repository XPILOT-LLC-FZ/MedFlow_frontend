"use client";

import React from "react";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronDown,
  Heart, 
  Share2, 
  MessageCircle, 
  Phone, 
  Star, 
  Briefcase, 
  Users,
  MapPin,
  GraduationCap,
  ShieldCheck,
  Send
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import type { ApiPublicDoctor, DoctorShift, DoctorReviewsResponse } from "@/types";
import { usePatientStore } from "@/stores/usePatientStore";
import { staffService } from "@/services/staffService";
import { surveyService } from "@/services/surveyService";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface DoctorProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: ApiPublicDoctor | null;
}

export function DoctorProfileDialog({
  isOpen,
  onOpenChange,
  doctor,
}: DoctorProfileDialogProps) {
  const { t, locale, isRTL } = useTranslation();
  const router = useRouter();
  const { favoriteDoctorIds, toggleFavorite } = usePatientStore();

  const [shifts, setShifts] = React.useState<DoctorShift[]>([]);
  const [reviewData, setReviewData] = React.useState<DoctorReviewsResponse | null>(null);
  
  // Review state
  const [rating, setRating] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchReviews = React.useCallback(() => {
    if (doctor) {
      surveyService.getPublicDoctorReviews(doctor.id).then(setReviewData).catch(() => null);
    }
  }, [doctor]);

  const handleSubmitReview = async () => {
    if (!doctor || rating === 0) return;
    setIsSubmitting(true);
    try {
      await surveyService.submitDirectReview({
        doctorId: doctor.id,
        rating,
        feedback
      });
      setRating(0);
      setFeedback("");
      fetchReviews();
    } catch (error) {
      console.error("Failed to submit review", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && doctor) {
      Promise.all([
        staffService.getDoctorShifts(doctor.id).catch(() => []),
        surveyService.getPublicDoctorReviews(doctor.id).catch(() => null)
      ]).then(([fetchedShifts, fetchedReviews]) => {
        setShifts(fetchedShifts);
        setReviewData(fetchedReviews);
      });
    }
  }, [isOpen, doctor]);

  if (!doctor) return null;

  const isFavorite = favoriteDoctorIds.includes(doctor.id);
  const specialization = doctor.specialization || "Generalist";
  
  // Real data mappings from doctor credentials and stats
  const degree = doctor.qualification || specialization;
  const patientCount = doctor.patientCount ?? (reviewData?.stats.totalReviews || 0);
  const locations = [
    doctor.branch?.address || doctor.branch?.name || "Main Clinic",
  ];
  const education = doctor.qualification || "Doctor of Medicine (MD), Specialist Training.";
  const licenseNumber = doctor.credentialSummary?.ministryOfHealthId?.name || "ID-" + doctor.id.slice(0, 8).toUpperCase();

  const workingDays = Array.from(new Set(shifts.filter(s => s.isAvailable).map(s => s.dayOfWeek)))
    .sort((a, b) => a - b)
    .map(dayNum => {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return days[dayNum];
    });

  const mainShift = shifts.find(s => s.isAvailable);
  const shiftStartTime = mainShift?.shiftStart || "09:00";
  const shiftEndTime = mainShift?.shiftEnd || "17:00";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-y-auto no-scrollbar border-none flex flex-col",
          "w-full h-full md:h-[90vh] md:max-w-md md:rounded-[40px]"
        )}
      >
        {/* Header Section with Image */}
        <div className="relative bg-[#DDE6FF] dark:bg-blue-950/30 overflow-hidden shrink-0">
          {/* Top Actions */}
          <div className="px-6 pt-6 pb-2 flex justify-between items-center">
            <button 
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 flex items-center justify-center text-slate-700 dark:text-white"
            >
              <ChevronLeft className={cn("h-6 w-6", isRTL && "rotate-180")} />
            </button>
            <DialogTitle className="text-slate-800 dark:text-white font-black text-sm uppercase tracking-wider">
              {t("doctorProfile") || "Doctor's Profile"}
            </DialogTitle>

            <div className="flex gap-2">
              <button 
                onClick={() => toggleFavorite(doctor.id)}
                className={cn(
                  "h-10 w-10 flex items-center justify-center transition-all",
                  isFavorite ? "text-rose-500" : "text-slate-700 dark:text-white"
                )}
              >
                <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
              </button>
              <button className="h-10 w-10 flex items-center justify-center text-slate-700 dark:text-white">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Large Doctor Image */}
          <div className="flex items-end justify-center px-6 h-64 md:h-72">
            <Image
              src={doctor.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.fullName}`}
              alt={doctor.fullName}
              width={400}
              height={400}
              className="h-full w-auto object-contain"
              priority
            />
          </div>

          {/* ID Badge */}
          <div className="absolute bottom-10 right-2 bg-white px-3 py-1 rounded-full shadow-sm">
            <span className="text-[12px] font-black text-slate-500 uppercase">ID: {doctor.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative bg-white dark:bg-slate-900 rounded-t-[40px] -mt-10 py-5 px-3 flex flex-col gap-4 shadow-sm">
          {/* Doctor Info Row */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-50 dark:border-slate-800 shadow-sm">
              <Image
                src={doctor.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.fullName}`}
                alt={doctor.fullName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                {locale === "ar" ? (doctor.fullNameAr || doctor.fullName) : `Dr. ${doctor.fullName}`}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{specialization}</span>
              </div>
              <span className="text-slate-400 font-medium text-xs uppercase tracking-widest">{degree}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => router.push(`/chat?doctorId=${doctor.id}`)}
                className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <button className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:scale-110 transition-transform">
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-base font-black text-slate-900 dark:text-slate-50">{doctor.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase text-center">{t("ratingReview") || "Rating & Review"}</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-slate-50 dark:border-slate-800/50 px-2">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Briefcase className="h-4 w-4" />
                <span className="text-base font-black text-slate-900 dark:text-slate-50">{doctor.experienceYears}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase text-center">{t("yearsOfWork") || "Years of work"}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Users className="h-4 w-4" />
                <span className="text-base font-black text-slate-900 dark:text-slate-50">{patientCount}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase text-center">{t("noOfPatients") || "No. of patients"}</span>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full bg-slate-50/50 dark:bg-slate-800/50 p-1 rounded-2xl h-12">
              <TabsTrigger value="info" className="flex-1 rounded-md font-bold text-xs uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                {t("info") || "Info"}
              </TabsTrigger>
              <TabsTrigger value="available" className="flex-1 rounded-md font-bold text-xs uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                {t("available") || "Available"}
              </TabsTrigger>
              <TabsTrigger value="review" className="flex-1 rounded-md font-bold text-xs uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                {t("review") || "Review"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-5">
              {/* Bio */}
              <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed font-medium">
                {doctor.bio || `Dr. ${doctor.fullName} is an experienced professional in their field, specialized in providing high-quality care to patients with a focus on personalized treatment plans and modern medical approaches.`}
              </p>

              {/* Working Places */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-50">{t("currentWorkingPlace") || "Current working place"}</h3>
                <div className="space-y-2">
                  {locations.map((loc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{loc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-50">{t("education") || "Education"}</h3>
                <div className="flex items-center gap-3 p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">{education}</span>
                </div>
              </div>

              {/* License */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-50">{t("medicalLicenseNumber") || "Medical License Number"}</h3>
                <div className="flex items-center gap-3 p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{licenseNumber}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="available" className="mt-4 space-y-5">
              {/* Location Selector */}
              <div className="p-3 rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <span className="text-[15px] font-bold text-slate-500 dark:text-slate-400">
                    {doctor.branch?.address || doctor.branch?.name || "N/A"}
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </div>

              {/* Working Days */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-black text-slate-800 dark:text-slate-100">{t("workingDays") || "Working Days"}</h3>
                <div className="flex flex-wrap gap-3">
                  {workingDays.length > 0 ? workingDays.map((day) => (
                    <div 
                      key={day}
                      className="px-5 py-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold shadow-sm"
                    >
                      {t(day.toLowerCase() as never) || day}
                    </div>
                  )) : (
                    <span className="text-sm font-medium text-slate-400 italic">{t("noAvailableShifts") || "No available shifts"}</span>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              <div className="space-y-6">
                <h3 className="text-[15px] font-black text-slate-800 dark:text-slate-100">{t("workingHours") || "Working Hours"}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative p-4 rounded-lg border border-slate-300 bg-white dark:bg-slate-950 flex flex-col items-center">
                    <span className="absolute -top-3 left-6 px-2 bg-white dark:bg-slate-950 text-[12px] font-bold text-slate-900 dark:text-slate-50">
                      {t("from") || "From"}
                    </span>
                    <span className="text-base font-medium text-slate-700 dark:text-slate-200">{shiftStartTime}</span>
                  </div>
                  <div className="relative px-4 py-3 rounded-lg border border-slate-300 bg-white dark:bg-slate-950 flex flex-col items-center">
                    <span className="absolute -top-3 left-6 px-2 bg-white dark:bg-slate-950 text-[12px] font-medium text-slate-900 dark:text-slate-50">
                      {t("to") || "To"}
                    </span>
                    <span className="text-base font-medium text-slate-700 dark:text-slate-200">{shiftEndTime}</span>
                  </div>
                </div>
              </div>
            </TabsContent>



            <TabsContent value="review" className="mt-4 space-y-4">
              {/* Leave Comment Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-black text-slate-800 dark:text-slate-100">{t("leaveComment") || "Leave comment"}</h3>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRating(s)} disabled={isSubmitting}>
                        <Star className={cn("h-4 w-4 transition-colors", s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={isSubmitting}
                    placeholder={t("tellUsAboutVisit") || "Tell us about your visit..."}
                    className="w-full h-32 p-4 rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none shadow-sm"
                  />
                  <button 
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || rating === 0}
                    className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                  >
                    <Send className={cn("h-5 w-5", isSubmitting && "animate-pulse")} />
                  </button>
                </div>
              </div>

              {/* Rating Summary */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-50">{doctor.rating?.toFixed(1) || "4.5"}</span>
                    <span className="text-xl font-bold text-slate-400">/5.0</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-4 w-4", s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                  <span className="text-[13px] font-bold text-slate-400">{patientCount}+ {t("reviews") || "Reviews"}</span>
                </div>
              </div>

              {/* Reviews List */}
              <div>
                {reviewData?.reviews.length ? reviewData.reviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                          <Image 
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${rev.patientName}`}
                            alt={rev.patientName}
                            width={48}
                            height={48}
                          />
                        </div>
                        <div>
                          <h4 className="text-[15px] font-black text-slate-800 dark:text-slate-100 leading-tight">{rev.patientName}</h4>
                          <span className="text-xs font-bold text-slate-400">
                            {format(new Date(rev.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-[13px] font-black">{(rev.doctorRating || rev.overallSatisfaction || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                      {rev.feedback}
                    </p>
                    {idx < reviewData.reviews.length - 1 && <div className="h-px bg-slate-50 dark:bg-slate-800/50 pt-4" />}
                  </div>
                )) : (
                  <div className="py-10 text-center text-slate-400 italic text-sm">
                    {t("noReviewsYet") || "No reviews yet for this doctor."}
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>

          {/* Book Button */}
          <div className="pt-4 pb-5 mt-auto">
            <Button 
              onClick={() => router.push(`/appointments?doctorId=${doctor.id}`)}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-sm shadow-blue-500/30 transition-all active:scale-95"
            >
              {t("bookAppointment") || "Book appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
