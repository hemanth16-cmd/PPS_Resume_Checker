# Frontend audit — PPS Automated Placement Preparation System

_Audit date: 23 Nov 2026. Scope: everything outside `.venv/`._

## 1. What exists

| Area | Finding |
|---|---|
| Stack | **Streamlit 1.64** (Python 3.14 venv in `.venv/`), pandas. No JS build, no TypeScript, no tests, no linter. |
| Entry point | `streamlit_app.py` — `st.navigation` multipage app, pages in `app_pages/`. |
| Roles | Demo-account selector in the sidebar: **student**, **trainer** (faculty), **admin**. Role-based page sets + `utils/security.require_permission` guards. |
| Pages | Student: Dashboard, Resume review, Analysis history, Privacy and data. Trainer: Trainer dashboard, Resume reviews. Admin: Administration (users, config, audit). |
| Data layer | `utils/mock_api.py` — hard-coded users, course data, one static `REPORT`, trainer submissions, audit events. **No backend, no HTTP calls, no scanner engine in this repo.** |
| Styling | `.streamlit/config.toml` with a light-only theme (`#2563EB` primary). No custom CSS. Upload cap 5 MB. |
| Design references | `stitch_export/` — Stitch mockups (desktop + mobile) and `DESIGN.md` tokens (mist-blue / sage / amber palette, Manrope + Inter). Not wired into the app. |

## 2. What works

- Navigation, role switching and permission guards.
- PDF/DOCX `st.file_uploader` with a 5 MB limit, optional target JD, consent checkbox.
- Trainer review form (session-only save, honestly labelled).
- Admin tables.

## 3. What is broken, misleading or incomplete

1. **Fake scan.** "Analyse resume" ignores the uploaded file and always shows the same static `REPORT` (76/100) as "Complete" — a real-looking result that was never computed. Highest-priority fix.
2. **ATS and CA1 conflated.** `assignments()` lists CA1 score as `76 / 100` — the ATS score. CA1 is a faculty mark out of 30.
3. **No document validation.** A grade card or empty file would still "receive" 76/100.
4. **No real file checks** beyond the extension filter (no signature / corrupt / empty detection).
5. **No resume preview, no findings with severity/evidence/location, no filters, no report download.**
6. **Privacy page buttons do nothing** (decorative buttons).
7. **Analysis history** shows one hard-coded row regardless of what the user did.
8. **Faculty review** only works on the one static report; no submission list, search, CA1 rubric or override.
9. No batch analysis, no "how the evaluation works" explanation, no demo-mode indicator anywhere.
10. Light theme only; generic blue; no logo.

## 4. What can be reused

- `st.navigation` structure, role selector, `require_permission` guards.
- Course data in `mock_api.py` (content library, calendar, reminders) — kept, but labelled as sample data.
- Upload + JD + consent flow — kept and extended.
- Admin console — kept as-is (restyled by the theme).
- Stitch `DESIGN.md` palette and type scale — used as the basis for the new theme.

## 5. Decisions

- **Stay on Streamlit.** No framework migration (as required). Native Streamlit components + `config.toml` theming; no fragile CSS hacks.
- **Introduce a service layer** (`services/`): typed dataclass contracts for scan results, a `ScannerClient` interface, a `DemoScannerClient` (clearly labelled sample results) and an `HttpScannerClient` that activates only when `SCANNER_API_URL` is configured.
- **Real client-side file validation** (extension, size, empty file, PDF signature, DOCX package structure, corrupt archive) — this is upload validation, not scoring, so it is honest to run locally.
- **Demo results never pretend to describe the uploaded file.** A persistent "Demo mode" badge and banner are shown, and demo results say "sample result — not an analysis of your file".
- **No fake progress.** Without a progress API the scan shows a generic status indicator, not invented percentages.

## 6. Prioritised implementation plan

1. Theme (light + dark), logo, app shell, demo-mode indicator. ✅
2. `services/` contracts, demo fixtures (valid resume, grade card, empty document), HTTP client, local file validation. ✅
3. ATS scanner page: upload → validation → analysis → results (ATS ring, separate CA1 /30 with provisional status, categories, filtered findings, preview, next steps, downloads), invalid-document state. ✅
4. Student dashboard rework, session-based history, functional privacy controls. ✅
5. Faculty: dashboard, review desk with search/filter, CA1 rubric override + comments (session-only, labelled). ✅
6. Batch analysis page (real per-file validation; analysis only with live API, otherwise labelled sample batch). ✅
7. "How evaluation works" page explaining the context-aware, faculty-aligned approach. ✅
8. Tests (pytest + `AppTest`), ruff lint, browser check at desktop and mobile widths. ✅
9. Docs: `FRONTEND_FEATURES.md`, `API_INTEGRATION.md`, README. ✅

## 7. Found during verification

- **Copied venv launcher.** `.venv\Scripts\streamlit.exe` in this copy still runs the *original*
  folder's venv (`...\PPS APP\.venv`). Always start with `.venv\Scripts\python.exe -m streamlit run`.
- **Hang after an interrupted first import.** If a rerun interrupts the first (slow) `import pandas`,
  later imports block and pages render blank. This also affected the original app, which imports
  pandas on every page. Mitigation: the entry script now imports pandas/altair before any widget
  exists; README documents the restart.
- **ATS/CA1 conflation fixed** in `mock_api.assignments()`; the old static `REPORT` and its helper
  functions were removed so no fake scan can reappear.

## 8. Phase 2 — React rebuild (`frontend/`)

The Streamlit UI was judged too limited for a product-quality experience, so the frontend was rebuilt
as a separate React + TypeScript app in `frontend/`. The Streamlit prototype is kept, unmodified in
behaviour, for reference. Contracts (`API_INTEGRATION.md`) and demo fixtures were ported 1:1 so both
UIs speak the same API. Issues found and fixed while verifying in a browser:

- An empty dashboard ring showed "0 of 100", which reads as a real score → replaced with a neutral placeholder.
- The results page overflowed to 558 px on phones (tab bar widening an implicit grid column) → fixed.
- Duplicate SVG gradient ids blanked the logo on mobile → per-instance ids.
- `<div>` inside `<p>` in page headers (console error) → fixed.
- Consent checkbox had no accessible name → fixed.

See `FRONTEND_FEATURES.md` for what was delivered and what remains.
