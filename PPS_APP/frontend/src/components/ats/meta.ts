import { CircleAlert, CircleCheck, Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import type { CategoryStatus, DocumentType, Severity } from "@/types/scan";

type Tone = "success" | "warning" | "danger" | "info" | "primary" | "neutral";

export const SEVERITY: Record<Severity, { label: string; plural: string; icon: LucideIcon; tone: Tone; text: string; soft: string; ring: string }> = {
  critical: { label: "Critical", plural: "Critical", icon: CircleAlert, tone: "danger", text: "text-danger", soft: "bg-danger-soft", ring: "ring-danger/30" },
  warning: { label: "Warning", plural: "Warnings", icon: TriangleAlert, tone: "warning", text: "text-warning", soft: "bg-warning-soft", ring: "ring-warning/30" },
  suggestion: { label: "Suggestion", plural: "Suggestions", icon: Lightbulb, tone: "info", text: "text-info", soft: "bg-info-soft", ring: "ring-info/30" },
  info: { label: "Strength", plural: "Strengths", icon: CircleCheck, tone: "success", text: "text-success", soft: "bg-success-soft", ring: "ring-success/30" },
};

export const CATEGORY_STATUS: Record<CategoryStatus, { label: string; tone: Tone; dot: string }> = {
  pass: { label: "Good", tone: "success", dot: "bg-success" },
  warn: { label: "Needs work", tone: "warning", dot: "bg-warning" },
  fail: { label: "Issue", tone: "danger", dot: "bg-danger" },
  info: { label: "Info", tone: "neutral", dot: "bg-fg-subtle" },
};

export const DOC_TYPE: Record<DocumentType, { label: string; guidance: string }> = {
  resume: { label: "Resume", guidance: "" },
  grade_card: {
    label: "Grade card / marksheet",
    guidance: "Upload your resume rather than a grade card. Academic results belong in the Education section of your resume.",
  },
  unrelated: { label: "Unrelated document", guidance: "Upload your resume. The file you submitted does not appear to be one." },
  empty: {
    label: "No readable text",
    guidance: "Export your resume from Word or Google Docs as a PDF with selectable text, rather than scanning or photographing it.",
  },
  unreadable: { label: "Unreadable or corrupted", guidance: "Re-export the file and try again. If it keeps failing, save it as a fresh PDF." },
  unsupported: { label: "Unsupported file", guidance: "Upload a PDF or DOCX file." },
};

export const ATS_BANDS = [
  { min: 80, label: "Strong", tone: "success" as Tone, color: "var(--success)", meaning: "Most applicant-tracking systems should read this resume reliably." },
  { min: 60, label: "Fair", tone: "warning" as Tone, color: "var(--warning)", meaning: "Readable, but the flagged issues may cause parts to be skipped or misread." },
  { min: 0, label: "Needs work", tone: "danger" as Tone, color: "var(--danger)", meaning: "Significant parts of this resume may not be read correctly by an ATS." },
];

export const atsBand = (score: number) => ATS_BANDS.find((b) => score >= b.min) ?? ATS_BANDS[2];

export { Info };
