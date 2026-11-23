/**
 * App state.
 *  - Scan history: persisted in this browser (localStorage), labelled as such.
 *  - Uploaded files: memory only (for preview during this visit).
 *  - Faculty reviews: memory only — there is no review API yet, so nothing is
 *    pretended to be saved server-side.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEMO_USERS } from "@/data/demo";
import type { ScanRecord } from "@/types/scan";

export type Role = "student" | "faculty";
export type Theme = "light" | "dark" | "system";

export interface FacultyReview {
  decision: "approve" | "request_changes" | "needs_resubmission";
  rubric: Record<string, number>;
  total: number | null;
  comments: string;
  reviewer: string;
  savedAt: string;
}

interface Store {
  role: Role;
  setRole: (r: Role) => void;
  user: (typeof DEMO_USERS)[Role];
  theme: Theme;
  setTheme: (t: Theme) => void;
  scans: ScanRecord[];
  addScan: (r: ScanRecord, file?: File) => void;
  removeScan: (id: string) => void;
  clearScans: () => void;
  toggleDone: (scanId: string, findingId: string) => void;
  fileFor: (scanId: string) => File | undefined;
  reviews: Record<string, FacultyReview>;
  saveReview: (submissionId: string, review: FacultyReview) => void;
}

const StoreContext = createContext<Store | null>(null);
const SCANS_KEY = "pps-scans-v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — app keeps working in memory */
  }
}

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", dark);
  window.setTimeout(() => root.classList.remove("theme-transition"), 250);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => (load<string>("pps-role", "\"student\"") === "faculty" ? "faculty" : "student"));
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("pps-theme") as Theme) || "system";
    } catch {
      return "system";
    }
  });
  const [scans, setScans] = useState<ScanRecord[]>(() => load(SCANS_KEY, []));
  const [reviews, setReviews] = useState<Record<string, FacultyReview>>({});
  const files = useRef(new Map<string, File>());

  useEffect(() => save(SCANS_KEY, scans), [scans]);
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    save("pps-role", JSON.stringify(r));
  }, []);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    save("pps-theme", t);
  }, []);

  const addScan = useCallback((r: ScanRecord, file?: File) => {
    if (file) files.current.set(r.id, file);
    setScans((s) => [r, ...s]);
  }, []);
  const removeScan = useCallback((id: string) => {
    files.current.delete(id);
    setScans((s) => s.filter((r) => r.id !== id));
  }, []);
  const clearScans = useCallback(() => {
    files.current.clear();
    setScans([]);
  }, []);
  const toggleDone = useCallback((scanId: string, findingId: string) => {
    setScans((s) =>
      s.map((r) =>
        r.id !== scanId
          ? r
          : { ...r, doneItems: r.doneItems.includes(findingId) ? r.doneItems.filter((x) => x !== findingId) : [...r.doneItems, findingId] },
      ),
    );
  }, []);
  const fileFor = useCallback((id: string) => files.current.get(id), []);
  const saveReview = useCallback((id: string, review: FacultyReview) => setReviews((r) => ({ ...r, [id]: review })), []);

  const value = useMemo<Store>(
    () => ({
      role, setRole, user: DEMO_USERS[role], theme, setTheme,
      scans, addScan, removeScan, clearScans, toggleDone, fileFor, reviews, saveReview,
    }),
    [role, setRole, theme, setTheme, scans, addScan, removeScan, clearScans, toggleDone, fileFor, reviews, saveReview],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
