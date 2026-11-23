import { ATS_MAX, CA1_MAX, type DataSource, type ScanResult } from "@/types/scan";

export class ContractError extends Error {}

const STATUSES = new Set(["completed", "invalid_document", "failed"]);
const SEVERITIES = new Set(["critical", "warning", "suggestion", "info"]);

function req<T>(value: T | undefined | null, path: string): T {
  if (value === undefined || value === null) throw new ContractError(`Missing field: ${path}`);
  return value;
}

/**
 * Validate API JSON into a ScanResult. Rejects responses that would make the
 * UI show something misleading (unknown status, out-of-range scores).
 */
export function parseScanResult(raw: unknown, source: DataSource): ScanResult {
  if (!raw || typeof raw !== "object") throw new ContractError("Response is not an object");
  const d = raw as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  const status = req(d.status, "status");
  if (!STATUSES.has(status)) throw new ContractError(`Unknown status: ${status}`);
  const file = req(d.file, "file");
  const validation = req(d.validation, "validation");

  const ats = d.ats ? { score: Number(req(d.ats.score, "ats.score")), summary: d.ats.summary ?? "", components: d.ats.components ?? [] } : null;
  if (ats && !(ats.score >= 0 && ats.score <= ATS_MAX)) throw new ContractError(`ATS score out of range: ${ats.score}`);

  const ca1 = d.ca1
    ? {
        total: Number(req(d.ca1.total, "ca1.total")),
        max_score: Number(d.ca1.max_score ?? CA1_MAX),
        status: req(d.ca1.status, "ca1.status"),
        rubric: d.ca1.rubric ?? [],
        reviewed_by: d.ca1.reviewed_by ?? null,
        reviewed_at: d.ca1.reviewed_at ?? null,
      }
    : null;
  if (ca1 && !(ca1.total >= 0 && ca1.total <= ca1.max_score)) throw new ContractError(`CA1 score out of range: ${ca1.total}`);

  const findings = (d.findings ?? []).map((f: any, i: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!SEVERITIES.has(f.severity)) throw new ContractError(`findings[${i}].severity invalid`);
    return { ...f, id: String(f.id ?? i) };
  });

  return {
    scan_id: String(req(d.scan_id, "scan_id")),
    status,
    source,
    analysed_at: d.analysed_at ?? "",
    file: { name: req(file.name, "file.name"), mime_type: file.mime_type ?? "", size_bytes: Number(file.size_bytes ?? 0), pages: file.pages ?? null },
    validation: {
      is_resume: Boolean(validation.is_resume),
      document_type: validation.document_type ?? "unrelated",
      message: validation.message ?? "",
      reasons: validation.reasons ?? [],
      confidence: validation.confidence ?? null,
    },
    ats,
    ca1,
    categories: d.categories ?? [],
    findings,
    sections_detected: d.sections_detected ?? [],
    review_flags: d.review_flags ?? [],
    reports: d.reports ?? [],
    error: d.error ?? null,
  };
}
