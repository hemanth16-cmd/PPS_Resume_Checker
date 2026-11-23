/**
 * Data contracts between the frontend and the resume scanner API.
 * Mirrors API_INTEGRATION.md (and services/models.py in the Python app).
 *
 * ATS (0–100) and CA1 (0–30) are separate objects. The UI never adds,
 * averages or converts one into the other.
 */

export type Severity = "critical" | "warning" | "suggestion" | "info";
export type CategoryStatus = "pass" | "warn" | "fail" | "info";
export type ScanStatus = "completed" | "invalid_document" | "failed";
export type DataSource = "live" | "demo";
export type Ca1Status = "provisional" | "faculty_reviewed";
export type DocumentType = "resume" | "grade_card" | "unrelated" | "empty" | "unreadable" | "unsupported";

export const ATS_MAX = 100;
export const CA1_MAX = 30;
export const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, suggestion: 2, info: 3 };

export interface FileInfo {
  name: string;
  mime_type: string;
  size_bytes: number;
  pages?: number | null;
}

export interface DocumentValidation {
  is_resume: boolean;
  document_type: DocumentType;
  message: string;
  reasons: string[];
  confidence?: number | null;
}

export interface ScoreComponent {
  name: string;
  score: number;
  max_score: number;
  summary?: string;
}

export interface AtsScore {
  score: number;
  summary?: string;
  components: ScoreComponent[];
}

export interface RubricItem {
  criterion: string;
  score: number;
  max_score: number;
  comment?: string;
}

export interface Ca1Score {
  total: number;
  max_score: number;
  status: Ca1Status;
  rubric: RubricItem[];
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface CategoryResult {
  key: string;
  label: string;
  status: CategoryStatus;
  summary?: string;
  score?: number | null;
  max_score?: number | null;
}

/** Optional normalised box (0–1) on a page. Only rendered when the scanner returns it. */
export interface FindingRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FindingLocation {
  page?: number | null;
  section?: string | null;
  region?: FindingRegion | null;
}

export interface Finding {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  explanation: string;
  why_it_matters?: string;
  suggestion?: string;
  evidence?: string | null;
  location?: FindingLocation | null;
  resolved?: boolean;
}

export interface ReviewFlag {
  code: string;
  message: string;
}

export interface ReportArtifact {
  kind: "detailed_report" | "annotated_pdf" | "feedback_summary" | string;
  label: string;
  url?: string | null;
  available: boolean;
}

export interface ScanResult {
  scan_id: string;
  status: ScanStatus;
  source: DataSource;
  analysed_at: string;
  file: FileInfo;
  validation: DocumentValidation;
  ats?: AtsScore | null;
  ca1?: Ca1Score | null;
  categories: CategoryResult[];
  findings: Finding[];
  sections_detected: string[];
  review_flags: ReviewFlag[];
  reports: ReportArtifact[];
  error?: string | null;
}

/** A scan as kept in this browser's history. */
export interface ScanRecord {
  id: string;
  createdAt: string;
  result: ScanResult;
  uploadedName?: string;
  targetJd?: string;
  doneItems: string[];
}

export const hasScores = (r: ScanResult) => r.status === "completed" && r.validation.is_resume;
export const isDemo = (r: ScanResult) => r.source === "demo";
export const sortBySeverity = (f: Finding[]) =>
  [...f].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
