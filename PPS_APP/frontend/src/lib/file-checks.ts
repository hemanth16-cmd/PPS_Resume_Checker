/**
 * Client-side upload checks. They confirm a file is a readable PDF/DOCX of an
 * acceptable size — they do NOT decide whether it is a resume. That verdict
 * comes from the scanner in `ScanResult.validation`.
 */
import JSZip from "jszip";

export const MAX_MB = 5;
export const ACCEPT = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export interface FileCheck {
  ok: boolean;
  extension: string;
  mimeType: string;
  size: number;
  errors: string[];
  warnings: string[];
}

const ascii = (bytes: Uint8Array) => Array.from(bytes, (b) => String.fromCharCode(b)).join("");

export async function checkFile(name: string, data: ArrayBuffer, maxMb = MAX_MB): Promise<FileCheck> {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const mimeType = ACCEPT[ext as keyof typeof ACCEPT] ?? "application/octet-stream";
  const size = data.byteLength;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!(ext in ACCEPT)) errors.push("Unsupported file type. Upload a PDF or DOCX file.");
  if (size === 0) errors.push("The file is empty (0 bytes).");
  else if (size > maxMb * 1024 * 1024) errors.push(`The file is ${(size / 1048576).toFixed(1)} MB; the limit is ${maxMb} MB.`);

  if (!errors.length) {
    const bytes = new Uint8Array(data);
    if (ext === "pdf") {
      const head = ascii(bytes.subarray(0, 1024)).trimStart();
      if (!head.startsWith("%PDF-")) {
        errors.push("This file has a .pdf extension but is not a valid PDF.");
      } else {
        if (!ascii(bytes.subarray(Math.max(0, size - 2048))).includes("%%EOF")) warnings.push("The PDF may be truncated or incomplete.");
        if (ascii(bytes).includes("/Encrypt")) warnings.push("The PDF appears to be password-protected; text extraction may fail.");
      }
    } else if (ext === "docx") {
      try {
        const zip = await JSZip.loadAsync(data);
        if (!zip.file("word/document.xml")) errors.push("This .docx file is missing its document body and cannot be read.");
      } catch {
        errors.push("This file has a .docx extension but is not a valid Word document.");
      }
    }
  }

  return { ok: errors.length === 0, extension: ext, mimeType, size, errors, warnings };
}
