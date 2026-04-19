"use client";

import React from "react";
export default function DoctorSectionLayout({ children }: { children: React.ReactNode }) {


  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 lg:space-y-6">
      {children}
    </div>
  );
}
