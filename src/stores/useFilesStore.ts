"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MedicalFile {
  id: string;
  name: string;
  type: "image" | "pdf" | "other";
  /** Data URL for preview (images) or placeholder */
  dataUrl: string;
  size: number;
  uploadDate: string;
  patientId: string;
}

interface FilesState {
  files: MedicalFile[];
  addFile: (file: Omit<MedicalFile, "id" | "uploadDate">) => void;
  deleteFile: (id: string) => void;
  getFilesByPatient: (patientId: string) => MedicalFile[];
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      files: [],

      addFile: (file) => {
        const newFile: MedicalFile = {
          ...file,
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          uploadDate: new Date().toISOString(),
        };
        set((state) => ({ files: [...state.files, newFile] }));
      },

      deleteFile: (id) => {
        set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
      },

      getFilesByPatient: (patientId) => {
        return get().files.filter((f) => f.patientId === patientId);
      },
    }),
    { name: "clinic-os-files" }
  )
);

/** Convert a File object to a storable MedicalFile (without id/date) */
export function fileToMedicalFile(
  file: File,
  dataUrl: string,
  patientId: string
): Omit<MedicalFile, "id" | "uploadDate"> {
  let type: MedicalFile["type"] = "other";
  if (file.type.startsWith("image/")) type = "image";
  else if (file.type === "application/pdf") type = "pdf";

  return {
    name: file.name,
    type,
    dataUrl,
    size: file.size,
    patientId,
  };
}
