/**
 * Faculty review queue. No submissions/review API exists yet, so this serves
 * the DEMO queue. Replace with HTTP calls to the endpoints documented in
 * API_INTEGRATION.md §4. Reviews are kept in memory only (see store.tsx).
 */
import { DEMO_SUBMISSIONS, type DemoSubmission } from "@/data/demo";
import type { FacultyReview } from "@/lib/store";
import type { ScanResult } from "@/types/scan";
import { demoResult } from "./scanner";

export const FACULTY_IS_DEMO = true;

export interface Submission extends DemoSubmission {
  result: ScanResult | null;
}

let cache: Submission[] | null = null;

export function listSubmissions(): Submission[] {
  cache ??= DEMO_SUBMISSIONS.map((s) => ({
    ...s,
    result: s.scenario
      ? demoResult(s.scenario, {
          scanId: `${s.id}-scan`,
          fileName: `${s.student.replace(/\s+/g, "_")}_resume_DEMO.pdf`,
          analysedAt: new Date(Date.now() - (s.submittedDaysAgo ?? 0) * 86400000).toISOString(),
        })
      : null,
  }));
  return cache;
}

export type ReviewStatus = "Pending review" | "Approved" | "Changes requested" | "Needs resubmission" | "Not submitted";

export const DECISION_LABEL: Record<FacultyReview["decision"], ReviewStatus> = {
  approve: "Approved",
  request_changes: "Changes requested",
  needs_resubmission: "Needs resubmission",
};

export function statusOf(s: Submission, reviews: Record<string, FacultyReview>): ReviewStatus {
  const r = reviews[s.id];
  return r ? DECISION_LABEL[r.decision] : s.review;
}

export const STATUS_TONE: Record<ReviewStatus, "warning" | "success" | "info" | "danger" | "neutral"> = {
  "Pending review": "warning",
  Approved: "success",
  "Changes requested": "info",
  "Needs resubmission": "danger",
  "Not submitted": "neutral",
};
