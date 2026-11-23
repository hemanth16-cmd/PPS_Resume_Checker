# PPS frontend

React single-page app for the PPS Placement Preparation System.

**Stack:** Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS 4 · Radix UI primitives (shadcn-style
components in `src/components/ui`) · Motion · Lucide · Recharts · react-pdf (PDF.js) · docx-preview ·
Sonner toasts · Vitest + Testing Library.

## Run

```powershell
npm install
```

```powershell
npm run dev
```

Open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm test` | Vitest (26 tests) |

## Connect the scanner

The app runs in **Demo mode** until a scanner URL is set. Copy `.env.example` to `.env.local`:

```
VITE_SCANNER_API_URL=https://scanner.example.edu
```

Restart `npm run dev`. The contract is in [../API_INTEGRATION.md](../API_INTEGRATION.md). The backend
must allow CORS from the frontend origin (or serve `dist/` from the same origin).

> Anything prefixed `VITE_` is embedded in the browser bundle. Don't put server secrets there.

## Structure

```
src/
  App.tsx                 routes (lazy-loaded pages), providers
  pages/                  dashboard, scan, scan-result, history, compare, methodology, settings,
                          faculty/overview, faculty/review, batch, not-found
  components/
    ui/                   design-system primitives (button, card, badge, tabs, dialog, dropdown…)
    layout/               app shell (sidebar, mobile drawer, top bar), page scaffolding
    ats/                  score ring, score cards, categories, findings, document viewer,
                          preview panel, next steps, reports, invalid-document state, dropzone
    dashboard/            trend chart
  services/scanner.ts     ONLY place that talks to the scanner (live HTTP or demo)
  services/faculty.ts     faculty queue (demo until the review API exists)
  types/scan.ts           data contracts (mirrors API_INTEGRATION.md)
  lib/                    parsing/validation, file checks, compare, report export, store, utils
  data/demo.ts            clearly labelled DEMO payloads
  styles/index.css        design tokens (light + dark), Tailwind theme
```

## Data honesty rules baked into the code

- Every result carries `source: "live" | "demo"`; demo results always render a "Demo result" notice.
- Demo mode never reuses the uploaded file name for a result.
- ATS (/100) and CA1 (/30) are separate objects; the parser rejects out-of-range scores.
- Invalid documents render a rejection state with no scores.
- No fake progress: the analyzing screen is generic.
- Issue highlights on the PDF render only when the scanner returns coordinates for a live result.
- Faculty reviews are kept in memory and labelled "this session only".
