"""Client-side exports built strictly from a ScanResult.

These contain only what the scanner returned — no extra observations are
generated here. Demo results are stamped as demo data.
"""

from __future__ import annotations

import json

from services.models import ScanResult

_DEMO_STAMP = "DEMO DATA — sample result, not an analysis of a real submission."


def feedback_summary_markdown(result: ScanResult) -> str:
    lines = ["# PPS resume feedback summary", ""]
    if result.is_demo:
        lines += [f"> **{_DEMO_STAMP}**", ""]
    lines += [
        f"- File: {result.file.name}",
        f"- Scan ID: {result.scan_id}",
        f"- Analysed: {result.analysed_at}",
        "",
    ]

    if not result.has_scores:
        lines += ["## Document validation", "", result.validation.message, ""]
        lines += [f"- {r}" for r in result.validation.reasons]
        return "\n".join(lines) + "\n"

    if result.ats:
        lines += ["## ATS compatibility", "", f"**{result.ats.score:g} / 100** — {result.ats.summary}", ""]
    if result.ca1:
        status = "Faculty reviewed" if result.ca1.status == "faculty_reviewed" else "Provisional — pending faculty review"
        lines += ["## Faculty CA1 score", "", f"**{result.ca1.total:g} / {result.ca1.max_score:g}** ({status})", ""]
        lines += [f"- {r.criterion}: {r.score:g} / {r.max_score:g} — {r.comment}" for r in result.ca1.rubric]
        lines += ["", "_ATS and CA1 are independent scores and are never combined._", ""]

    lines += ["## Findings", ""]
    for f in result.findings_by_severity():
        if f.severity == "info":
            continue
        where = ", ".join(
            x for x in [
                f"page {f.location.page}" if f.location and f.location.page else None,
                f.location.section if f.location else None,
            ] if x
        )
        lines.append(f"### [{f.severity.upper()}] {f.title}" + (f" ({where})" if where else ""))
        lines.append("")
        lines.append(f.explanation)
        if f.evidence:
            lines.append(f"\n> Detected: {f.evidence}")
        if f.suggestion:
            lines.append(f"\n**Suggestion:** {f.suggestion}")
        lines.append("")
    return "\n".join(lines)


def detailed_report_json(result: ScanResult) -> str:
    payload = result.to_dict()
    if result.is_demo:
        payload = {"_notice": _DEMO_STAMP, **payload}
    return json.dumps(payload, indent=2, ensure_ascii=False)
