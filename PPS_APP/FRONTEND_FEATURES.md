# Frontend features — `frontend/` (React)

Legend: **Real** = works on real input today · **Demo** = clearly labelled sample data until an API
exists · **Live-ready** = works as soon as `VITE_SCANNER_API_URL` points at a conforming scanner.

## Technology

Vite 8, React 19, TypeScript (strict), Tailwind CSS 4 with CSS-variable design tokens, Radix UI
primitives in shadcn-style components, Motion (reduced-motion aware), Lucide icons, Recharts,
react-pdf / PDF.js, docx-preview, Sonner, React Router 7, Vitest + Testing Library, ESLint.
Vite was chosen over Next.js: the backend is Python and nothing needs server rendering, so a static
SPA is simpler to host next to it.

## Design system

- Brand: PPS mark (ink square, indigo→violet "P", emerald status dot), Geist + Geist Mono.
- Light: warm paper surfaces. Dark: midnight ink. One indigo accent with a restrained violet gradient.
- Muted green / amber / red reserved for evaluation states.
- Tokens in `src/styles/index.css`; theme toggle (light / dark / system) with no flash on load.

## Pages

| Route | Page |
|---|---|
| `/` | Student dashboard — hero + CTA, latest analysis ring, ATS trend, quick actions, recent activity, prep progress, guidance |
| `/scan` | Upload: dropzone, file card (replace/remove), real file checks, optional JD, demo-response picker, consent, analyzing state with cancel |
| `/scan/:id` | Results: ATS ring /100 + CA1 ring /30 (separate), severity summary, tabs for Overview / Feedback / Resume preview / Next steps / Reports; invalid-document state |
| `/history` | Search, filter, delete with confirmation, select two to compare, add labelled sample scans |
| `/compare` | Before/after pickers, ATS + CA1 deltas, category changes, resolved / new / still-open findings |
| `/methodology` | Context-aware vs keyword approach, earlier-prototype gaps, pipeline, ATS vs CA1, severities |
| `/settings` | Theme, demo identity, scanner connection status, export / delete local data |
| `/faculty` | Faculty overview — metrics, submissions, scanner review flags |
| `/faculty/review/:id` | Review desk — searchable queue, full evaluation, CA1 rubric override with delta, comments, decision, approve confirmation |
| `/batch` | Batch scanner — multi-file drop, per-file checks and states, results table, drill-down drawer, CSV export |
| `*` | Not found |

## Real vs demo

| Feature | Status |
|---|---|
| File checks (type, size, empty, fake PDF, truncated/encrypted PDF, corrupt DOCX) | Real |
| PDF preview (PDF.js) with page navigation, zoom, fit, download | Real |
| DOCX preview (docx-preview, labelled approximate) | Real |
| Scan history, done-checklist, compare | Real (stored in this browser) |
| Theme, sidebar collapse, role preference | Real (stored in this browser) |
| Feedback summary (.md) and detailed (.json) export | Real — built only from returned data; demo exports stamped |
| Scan results (scores, categories, findings, flags) | Live-ready · Demo until API |
| Annotated PDF download / in-page highlights | Live-ready — only when the scanner returns them |
| Batch analysis | Live-ready (real per-file progress); demo mode offers a labelled sample batch |
| Faculty queue, reviews, approvals | Demo — reviews held in memory, labelled "this session only" |
| Course progress / calendar on dashboard | Demo (labelled "Sample") |
| ATS trend chart | Real from history; "Preview with sample data" is opt-in and labelled |

## Verification performed

- `npm run build`, `tsc -b`, `eslint .` — pass.
- `npm test` — 26 Vitest tests pass (file checks, contract parsing incl. CA1 range guard, HTTP error
  mapping, compare, exports, ResultView valid vs invalid rendering).
- Browser (built-in pane): dashboard, scanner upload → analyzing → results, PDF preview, compare,
  invalid-document flow, faculty override → approve dialog → saved state; light and dark;
  375 px mobile with no horizontal overflow on all 11 routes; mobile drawer.

## Outstanding

1. Scanner API (`POST /api/v1/scans`).
2. Submissions / review API for faculty pages.
3. Server-side history, real authentication.
4. Finding coordinates (`location.region`) or annotated PDFs for on-page highlights.
5. Real CA1 rubric criteria (demo rubric is a placeholder).
