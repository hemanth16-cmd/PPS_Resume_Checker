# API integration — scanner and review services

Both frontends are backend-ready. **No scanner backend exists in this repository**, so they run in
**Demo mode** until a scanner URL is configured. This document is the contract the backend must
satisfy; both clients parse exactly this JSON.

## Where integration lives

### React app (`frontend/`) — primary UI

| File | Responsibility |
|---|---|
| `src/types/scan.ts` | TypeScript contract for every response. |
| `src/lib/parse.ts` | `parseScanResult()` — validates JSON; rejects unknown status/severity and out-of-range ATS/CA1. |
| `src/services/scanner.ts` | `scanner` → HTTP client (live) or demo client. The only code that calls the scanner. |
| `src/services/faculty.ts` | Faculty queue. **Demo-only today** (`FACULTY_IS_DEMO = true`). |
| `src/data/demo.ts` | Labelled sample payloads — also worked examples of the JSON below. |

Configure in `frontend/.env.local`:

```
VITE_SCANNER_API_URL=https://scanner.example.edu
VITE_SCANNER_API_KEY=            # optional; sent as Authorization: Bearer <key>. Shipped to the browser.
```

The scanner must send CORS headers allowing the frontend origin (or serve `frontend/dist` itself).

### Streamlit prototype (legacy)

`services/models.py`, `services/scanner_client.py`, `services/faculty_queue.py`, `services/demo_data.py`.
Configure `SCANNER_API_URL` / `SCANNER_API_KEY` as environment variables or in
`.streamlit/secrets.toml` (never commit it).

When a URL is present the UI badge switches from **Demo mode** to **Live scanner** and results are
labelled *Live result*.

## 1. `POST /api/v1/scans` — analyse one resume  *(required)*

`multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `file` | file | PDF or DOCX, ≤ 5 MB (frontend enforces the same limit) |
| `target_jd` | string | Optional job description; may be empty |

**Response `200`** — `ScanResult` JSON:

```jsonc
{
  "scan_id": "string",
  "status": "completed" | "invalid_document" | "failed",
  "analysed_at": "display string, e.g. 23 Nov 2026, 11:20",
  "file": { "name": "cv.pdf", "mime_type": "application/pdf", "size_bytes": 184320, "pages": 1 },

  "validation": {
    "is_resume": true,
    "document_type": "resume" | "grade_card" | "unrelated" | "empty" | "unreadable" | "unsupported",
    "message": "Human-readable verdict",
    "reasons": ["…"],
    "confidence": 0.96            // optional, 0–1
  },

  // Omit ats/ca1/categories/findings when status != "completed" or is_resume == false.
  "ats": {
    "score": 72,                  // 0–100
    "summary": "…",
    "components": [ { "name": "Text extraction", "score": 88, "max_score": 100, "summary": "…" } ]
  },
  "ca1": {
    "total": 19.5,                // 0–max_score
    "max_score": 30,
    "status": "provisional" | "faculty_reviewed",
    "rubric": [ { "criterion": "…", "score": 5, "max_score": 6, "comment": "…" } ],
    "reviewed_by": null, "reviewed_at": null
  },
  "categories": [
    { "key": "formatting", "label": "Formatting and alignment",
      "status": "pass" | "warn" | "fail" | "info",
      "summary": "…", "score": null, "max_score": null }   // score optional — omit rather than invent
  ],
  "findings": [
    { "id": "f1", "title": "…", "category": "Links",
      "severity": "critical" | "warning" | "suggestion" | "info",
      "explanation": "…", "why_it_matters": "…", "suggestion": "…",
      "evidence": "detected text or null",
      "location": { "page": 1, "section": "Projects",
                    "region": { "x": 0.08, "y": 0.41, "width": 0.6, "height": 0.03 } },  // region optional: 0–1 fractions of the page; enables on-page highlights
                                                                                          // location may be null
      "resolved": false }
  ],
  "sections_detected": ["Contact", "Education", "…"],
  "review_flags": [ { "code": "placeholder_detected", "message": "…" } ],
  "reports": [ { "kind": "annotated_pdf", "label": "Annotated PDF", "url": "/api/v1/scans/<id>/annotated.pdf", "available": true } ],
  "error": null                   // message when status == "failed"
}
```

Rules the frontend relies on:

- **ATS and CA1 are independent.** Never derive one from the other. The parser rejects an ATS score
  outside 0–100 or a CA1 total outside 0–`max_score` (a test guards against a 76 landing in CA1).
- For `invalid_document` the UI shows the validation verdict and **no scores**.
- Only return categories/scores the scanner actually computes — the UI hides anything missing.

**Errors**: `413` too large, `415` unsupported type, other `4xx/5xx` with `{"detail": "message"}`
(shown to the user). Timeout is 90 s.

## 2. `GET <reports[].url>` — download a report  *(optional)*

Returns the binary (e.g. annotated PDF). Relative URLs are resolved against `SCANNER_API_URL`.
When an `annotated_pdf` is available, the Resume preview tab can load it in place of the raw upload.
Markdown and JSON exports are generated client-side from the scan result, so no endpoint is needed.

## 3. Progress  *(not required, not used)*

The UI shows a generic "Analyzing…" indicator. If staged progress is wanted later, add
`GET /api/v1/scans/{id}` returning `{"stage": "validating" | "extracting" | …}` and poll it — until
then the UI deliberately shows no invented stages or percentages.

## 4. Faculty review endpoints  *(required to leave demo mode on faculty pages)*

| Method | Path | Purpose | Replaces |
|---|---|---|---|
| GET | `/api/v1/submissions?batch=&status=&q=` | Submission list for the faculty's batch | `faculty_queue.list_submissions` |
| GET | `/api/v1/submissions/{id}` | Submission + its latest `ScanResult` | `faculty_queue.get_submission_result` |
| PUT | `/api/v1/submissions/{id}/review` | `{decision, rubric:{criterion: score}, comments}` | `faculty_queue.save_review` |

Decisions: `approve` (finalises CA1 → `ca1.status = "faculty_reviewed"`), `request_changes`,
`needs_resubmission`. The backend owns the CA1 total; the UI only sums the rubric for display.

## 5. Student history  *(required for persistent history)*

`GET /api/v1/me/scans` → `ScanResult[]` (newest first). Today history is held in the browser session.

## 6. Batch  *(optional)*

The batch page calls `POST /api/v1/scans` once per file and shows real per-file progress. A dedicated
`POST /api/v1/batches` + polling endpoint can replace that loop later without UI changes.

## 7. Privacy  *(later)*

`GET /api/v1/me/data-export`, `DELETE /api/v1/me/data` — today the Privacy page exports/clears
session data only and says so.
