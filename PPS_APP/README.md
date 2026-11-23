# PPS — Automated Placement Preparation System

A placement-preparation platform whose centrepiece is a **context-aware, faculty-aligned resume
scanner**: it validates that a document really is a resume, measures ATS compatibility (/100), gives a
provisional faculty CA1 mark (/30, kept separate), and returns prioritised, explained feedback.

## Repository layout

| Path | What it is |
|---|---|
| `frontend/` | **The application UI** — React + TypeScript + Tailwind single-page app. Start here. |
| `streamlit_app.py`, `app_pages/`, `ui/`, `services/`, `utils/` | The earlier Streamlit prototype. Kept (not deleted) for reference; superseded by `frontend/`. |
| `API_INTEGRATION.md` | The contract a scanner backend must implement. |
| `FRONTEND_AUDIT.md` · `FRONTEND_FEATURES.md` | Audit, delivered features, real vs demo, outstanding work. |
| `stitch_export/` | Original design explorations. |

No scanner/ATS engine is included in this repository yet — both UIs run in clearly labelled
**Demo mode** until a backend is connected.

## Run the frontend

Requires Node 20+.

```powershell
cd frontend
```

```powershell
npm install
```

```powershell
npm run dev
```

Open http://localhost:5173. Use the account menu (bottom-left) to switch between the **Student** and
**Faculty** views. To connect a scanner, set `VITE_SCANNER_API_URL` in `frontend/.env.local`
(see `frontend/.env.example`).

Production build: `npm run build` (output in `frontend/dist/`, deployable to any static host).
Tests: `npm test`. Lint: `npm run lint`.

## Legacy Streamlit prototype

```powershell
.venv\Scripts\python.exe -m streamlit run streamlit_app.py
```

Use `python -m streamlit`, not `.venv\Scripts\streamlit.exe` — in this copied folder the `.exe`
launcher points at the original folder's venv. Tests: `.venv\Scripts\python.exe -m pytest`.
