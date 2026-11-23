/** Client-side exports built strictly from a ScanResult — no extra observations. */
import { hasScores, isDemo, sortBySeverity, type ScanResult } from "@/types/scan";

const DEMO_STAMP = "DEMO DATA — sample result, not an analysis of a real submission.";

export function feedbackMarkdown(r: ScanResult): string {
  const out: string[] = ["# PPS resume feedback", ""];
  if (isDemo(r)) out.push(`> **${DEMO_STAMP}**`, "");
  out.push(`- File: ${r.file.name}`, `- Scan ID: ${r.scan_id}`, `- Analysed: ${r.analysed_at}`, "");

  if (!hasScores(r)) {
    out.push("## Document validation", "", r.validation.message, "", ...r.validation.reasons.map((x) => `- ${x}`));
    return out.join("\n") + "\n";
  }
  if (r.ats) out.push("## ATS compatibility", "", `**${r.ats.score} / 100** — ${r.ats.summary ?? ""}`, "");
  if (r.ca1) {
    const status = r.ca1.status === "faculty_reviewed" ? "Faculty reviewed" : "Provisional — pending faculty review";
    out.push("## Faculty CA1", "", `**${r.ca1.total} / ${r.ca1.max_score}** (${status})`, "");
    r.ca1.rubric.forEach((i) => out.push(`- ${i.criterion}: ${i.score} / ${i.max_score}${i.comment ? ` — ${i.comment}` : ""}`));
    out.push("", "_ATS and CA1 are independent scores and are never combined._", "");
  }
  out.push("## Findings", "");
  for (const f of sortBySeverity(r.findings)) {
    if (f.severity === "info") continue;
    const where = [f.location?.page ? `page ${f.location.page}` : null, f.location?.section].filter(Boolean).join(", ");
    out.push(`### [${f.severity.toUpperCase()}] ${f.title}${where ? ` (${where})` : ""}`, "", f.explanation);
    if (f.evidence) out.push("", `> Detected: ${f.evidence}`);
    if (f.suggestion) out.push("", `**Suggestion:** ${f.suggestion}`);
    out.push("");
  }
  return out.join("\n");
}

export function detailedJson(r: ScanResult): string {
  return JSON.stringify(isDemo(r) ? { _notice: DEMO_STAMP, ...r } : r, null, 2);
}

export function download(filename: string, content: string | Blob, mime = "text/plain") {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
