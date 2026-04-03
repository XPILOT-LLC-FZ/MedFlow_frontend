/**
 * File Service — wraps useFilesStore.
 * Swap internals to fetch() + FormData when backend is ready.
 */
import { useFilesStore, fileToMedicalFile, type MedicalFile } from "@/stores/useFilesStore";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export interface UploadResult { success: boolean; file?: MedicalFile; error?: string }

export const fileService = {
  getByPatient(patientId: string): MedicalFile[] {
    return useFilesStore.getState().getFilesByPatient(patientId);
  },

  getAll(): MedicalFile[] {
    return useFilesStore.getState().files;
  },

  validate(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "unsupportedFileType";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "fileTooLarge";
    }
    return null;
  },

  async upload(file: File, patientId: string): Promise<UploadResult> {
    const validationError = this.validate(file);
    if (validationError) return { success: false, error: validationError };

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const medFile = fileToMedicalFile(file, dataUrl, patientId);
        useFilesStore.getState().addFile(medFile);
        // Return the newly added file
        const files = useFilesStore.getState().files;
        resolve({ success: true, file: files[files.length - 1] });
      };
      reader.onerror = () => {
        resolve({ success: false, error: "readFailed" });
      };
      reader.readAsDataURL(file);
    });
  },

  remove(fileId: string): void {
    useFilesStore.getState().deleteFile(fileId);
  },
};
