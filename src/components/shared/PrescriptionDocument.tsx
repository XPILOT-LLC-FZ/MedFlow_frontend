"use client";

import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { BrandLogo } from "./BrandLogo";
import type { ApiPrescription } from "@/types";
import { format } from "date-fns";

interface PrescriptionDocumentProps {
  prescription: ApiPrescription;
  clinicName?: string;
  doctorName?: string;
}

export function PrescriptionDocument({
  prescription,
  clinicName,
  doctorName,
}: PrescriptionDocumentProps) {
  const { locale } = useTranslation();
  const isRtl = locale === "ar";
  
  const displayClinicName = clinicName || prescription.patient?.clinic?.name || (isRtl ? "مركز MedFlow الطبي" : "MedFlow Medical Center");
  const displayLogoUrl = prescription.patient?.clinic?.logoUrl;

  return (
    <div className={`bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm border-t-[12px] border-primary min-h-[700px] flex flex-col font-serif ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8">
        <div>
          <div className="mb-2 scale-75 origin-left">
            <BrandLogo logoUrl={displayLogoUrl} />
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">
            {isRtl ? "وصفة طبية معتمدة" : "Official Medical Prescription"}
          </p>
        </div>
        <div className={`${isRtl ? "text-left" : "text-right"} font-sans`}>
          <h2 className="text-lg font-bold text-primary">{displayClinicName}</h2>
          <p className="text-xs text-slate-500 opacity-70">{isRtl ? "سجل صحي رسمي" : "Official Health Record"}</p>
          <p className="text-[9px] text-slate-400 mt-1 font-mono uppercase">REF: {prescription.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Doctor & Patient Info */}
      <div className="grid grid-cols-2 gap-8 mb-10 font-sans">
        <div>
          <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1 tracking-tighter">
            {isRtl ? "الطبيب المعالج" : "Prescribing Physician"}
          </p>
          <p className="text-sm font-bold text-slate-800">
             {isRtl ? "د." : "Dr."} {doctorName || (isRtl ? "أخصائي باطني" : "Specialist Physician")}
          </p>
        </div>
        <div className={isRtl ? "text-left" : "text-right"}>
          <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1 tracking-tighter">
            {isRtl ? "تاريخ الإصدار" : "Date of Issue"}
          </p>
          <p className="text-sm font-medium text-slate-800">
            {prescription.issuedAt ? format(new Date(prescription.issuedAt), "PPP") : format(new Date(prescription.createdAt), "PPP")}
          </p>
        </div>
      </div>

      {/* Main Rx Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
           <span className="text-6xl font-bold text-slate-100/80 select-none font-serif leading-none">Rx</span>
           <div className="h-px flex-1 bg-slate-100" />
        </div>

        {prescription.diagnosis && (
          <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-2 tracking-tighter">
                {isRtl ? "الانطباع السريري / التشخيص" : "Clinical Impression / Diagnosis"}
            </p>
            <p className="text-sm italic text-slate-700 leading-relaxed">{prescription.diagnosis}</p>
          </div>
        )}

        <div className="space-y-8">
          <p className="text-[10px] font-extrabold text-primary uppercase mb-4 py-1 border-b tracking-wider inline-block">
            {isRtl ? "التوصيات الدوائية" : "Medication & Recommendations"}
          </p>
          <div className="space-y-6">
            {prescription.medications.map((med, idx) => (
              <div key={idx} className={`relative ${isRtl ? "pr-6" : "pl-6"} py-1`}>
                <div className={`absolute ${isRtl ? "right-0" : "left-0"} top-0 bottom-0 w-1 bg-primary/20 rounded-full`} />
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-base font-bold text-slate-900 tracking-tight">{med.name}</p>
                  <div className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase ring-1 ring-primary/10">
                    {med.dosage}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600 font-sans mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span><span className="font-bold opacity-60 uppercase text-[9px]">{isRtl ? "التكرار:" : "Freq:"}</span> {med.frequency}</span>
                  </div>
                  {med.duration && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span><span className="font-bold opacity-60 uppercase text-[9px]">{isRtl ? "المدة:" : "Dur:"}</span> {med.duration}</span>
                    </div>
                  )}
                </div>
                {med.instructions && (
                  <div className="mt-3 bg-amber-50/50 p-2 rounded border border-amber-100/50">
                    <p className="text-[10px] text-amber-700 leading-relaxed italic">
                      <span className="font-bold border-b border-amber-200 mr-1">{isRtl ? "ملاحظة:" : "SIG:"}</span>
                      {med.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {prescription.notes && (
          <div className="mt-12 pt-6 border-t border-dashed border-slate-200">
             <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-2 tracking-tighter">
                {isRtl ? "ملاحظات الطبيب" : "Physician Remarks"}
             </p>
             <p className="text-xs text-slate-600 leading-relaxed font-sans">{prescription.notes}</p>
          </div>
        )}
      </div>

      {/* Footer / Signature Area */}
      <div className="mt-auto pt-10 flex justify-between items-end">
        <div className="text-[9px] text-slate-400 max-w-[240px] font-sans leading-normal">
          {isRtl 
            ? "هذه الوصفة صالحة لمدة 30 يوماً من تاريخ الإصدار. يرجى إبراز هذا المستند عند أي صيدلية معتمدة. قد يتطلب بعض الأدوية تأكيد الهوية."
            : "This prescription is valid for 30 days from issue. Present this at any certified pharmacy. Identity verification may be required for specific medications."}
        </div>
        <div className={`${isRtl ? "text-right pl-4" : "text-right pr-4"} border-t-2 border-slate-900 pt-3 min-w-[180px]`}>
          <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-900">
             {isRtl ? "التوقيع الرقمي المعتمد" : "Authorized Digital Signature"}
          </p>
          <p className="text-[11px] italic font-serif mt-2 text-slate-700">
             {doctorName || (isRtl ? "طبيب MedFlow المعتمد" : "Authorized MedFlow Physician")}
          </p>
          <div className="mt-2 h-8 w-24 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-center grayscale opacity-30 mx-auto">
             <span className="text-[8px] font-mono uppercase tracking-widest">VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
