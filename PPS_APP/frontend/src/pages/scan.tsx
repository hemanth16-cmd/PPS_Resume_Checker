import {
  ArrowRight,
  CircleAlert,
  FileCheck2,
  FileText,
  FileType2,
  FlaskConical,
  GraduationCap,
  LayoutTemplate,
  Link2Off,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  SpellCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Analyzing } from "@/components/ats/analyzing";
import { Dropzone } from "@/components/ats/dropzone";
import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/overlays";
import { Badge, Card, Label, Textarea } from "@/components/ui/primitives";
import { DEMO_SCENARIOS, type DemoScenario } from "@/data/demo";
import { checkFile, type FileCheck } from "@/lib/file-checks";
import { useStore } from "@/lib/store";
import { cn, formatBytes, uid } from "@/lib/utils";
import { scanner, ScannerError } from "@/services/scanner";

const EVALUATES = [
  { icon: ShieldCheck, title: "Document validation", body: "Rejects grade cards, unrelated PDFs and image-only files before anything is scored." },
  { icon: ScanSearch, title: "ATS compatibility", body: "How reliably applicant-tracking software can read your resume, out of 100." },
  { icon: GraduationCap, title: "Faculty CA1 mark", body: "A provisional mark out of 30 on the faculty rubric, confirmed by review." },
  { icon: LayoutTemplate, title: "Layout and formatting", body: "Alignment, spacing, columns and consistency — not just keywords." },
  { icon: Link2Off, title: "Placeholders and links", body: "Template text like “Insert GitHub link here” and broken profile URLs." },
  { icon: SpellCheck, title: "Content and language", body: "Impact of your bullets, grammar and spelling." },
];

type Phase = "idle" | "analyzing" | "error";

export default function Scan() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { addScan } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [check, setCheck] = useState<FileCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [jd, setJd] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [consent, setConsent] = useState(false);
  const [scenario, setScenario] = useState<DemoScenario>("valid_resume");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const demo = scanner.mode === "demo";

  const onFiles = async ([f]: File[]) => {
    setFile(f);
    setCheck(null);
    setChecking(true);
    const result = await checkFile(f.name, await f.arrayBuffer());
    setCheck(result);
    setChecking(false);
    if (!result.ok) toast.error("This file can’t be analyzed", { description: result.errors[0] });
  };

  const clear = () => {
    setFile(null);
    setCheck(null);
  };

  const analyze = async () => {
    if (!file || !check?.ok || !consent) return;
    setPhase("analyzing");
    setError(null);
    abort.current = new AbortController();
    try {
      const result = await scanner.scan({ file, targetJd: jd, demoScenario: scenario, signal: abort.current.signal });
      const id = uid("scan");
      addScan({ id, createdAt: new Date().toISOString(), result, uploadedName: file.name, targetJd: jd, doneItems: [] }, file);
      toast.success(result.source === "demo" ? "Demo result ready" : "Analysis complete", {
        description: result.source === "demo" ? "Sample data — not an analysis of your file." : file.name,
      });
      navigate(`/scan/${id}`);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setPhase("idle");
        toast("Analysis cancelled");
        return;
      }
      setError(e instanceof ScannerError ? e.message : "Something went wrong while analyzing your resume.");
      setPhase("error");
    }
  };

  const blockers = [!check?.ok && "add a valid PDF or DOCX", !consent && "give consent"].filter(Boolean) as string[];

  return (
    <Page>
      <PageHeader
        eyebrow="Resume scanner"
        title={
          <>
            See your resume the way <span className="text-gradient">recruiters and faculty</span> do
          </>
        }
        description="Context-aware, faculty-aligned evaluation. We validate the document, measure ATS compatibility, give a provisional CA1 mark and tell you exactly what to fix."
      />

      {demo && phase !== "analyzing" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-[13px] leading-5">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <span className="font-semibold">Demo mode.</span> No scanner API is connected, so analysis returns a clearly labelled sample result —
            it won’t describe your file. File checks and the document preview are real.
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "analyzing" && file ? (
          <motion.div key="analyzing" initial={reduce ? false : { opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Analyzing fileName={file.name} demo={demo} onCancel={() => abort.current?.abort()} />
          </motion.div>
        ) : (
          <motion.div key="form" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid content-start gap-5">
              {phase === "error" && error && (
                <Card className="flex flex-col gap-3 border-danger/30 p-4 sm:flex-row sm:items-center">
                  <CircleAlert className="size-5 shrink-0 text-danger" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Analysis failed</div>
                    <p className="text-[13px] text-fg-muted">{error}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={analyze}>
                    <RefreshCw /> Retry
                  </Button>
                </Card>
              )}

              <AnimatePresence mode="wait" initial={false}>
                {!file ? (
                  <motion.div key="drop" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <Dropzone onFiles={onFiles} />
                  </motion.div>
                ) : (
                  <motion.div key="file" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <SelectedFile file={file} check={check} checking={checking} onRemove={clear} onReplace={onFiles} />
                  </motion.div>
                )}
              </AnimatePresence>

              <Card className="p-5">
                {!showJd ? (
                  <button className="flex w-full items-center justify-between text-left" onClick={() => setShowJd(true)}>
                    <span>
                      <span className="block text-sm font-medium">Add a target job description</span>
                      <span className="block text-[13px] text-fg-muted">Optional — check alignment with a specific role.</span>
                    </span>
                    <span className="text-sm font-medium text-primary">Add</span>
                  </button>
                ) : (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="jd">Target job description <span className="font-normal text-fg-subtle">· optional</span></Label>
                      <button className="text-xs text-fg-muted hover:text-fg" onClick={() => { setShowJd(false); setJd(""); }}>Remove</button>
                    </div>
                    <Textarea id="jd" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description here…" autoFocus />
                  </div>
                )}
              </Card>

              {demo && (
                <Card className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <FlaskConical className="size-4 text-warning" />
                    <span className="text-sm font-medium">Demo response</span>
                    <span className="text-[13px] text-fg-muted">— choose which sample to preview</span>
                  </div>
                  <div role="radiogroup" aria-label="Demo response" className="grid gap-2 sm:grid-cols-2">
                    {DEMO_SCENARIOS.map((s) => (
                      <button
                        key={s.id}
                        role="radio"
                        aria-checked={scenario === s.id}
                        onClick={() => setScenario(s.id)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left transition",
                          scenario === s.id ? "border-primary bg-primary-soft/60 ring-1 ring-primary" : "border-border hover:border-border-strong hover:bg-surface-2",
                        )}
                      >
                        <span className="block text-sm font-medium">{s.label}</span>
                        <span className="block text-xs text-fg-muted">{s.hint}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-5">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                  aria-label="I consent to processing my resume and job description for placement-training feedback"
                />
                <span className="text-sm leading-6 text-fg">
                  I consent to processing my resume and job description for placement-training feedback.
                  <span className="block text-[13px] text-fg-muted">Used only to generate your feedback. <Link to="/methodology" className="text-primary hover:underline">How it works</Link></span>
                </span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" className="w-full sm:w-auto" disabled={blockers.length > 0 || checking} onClick={analyze}>
                  <ScanSearch /> Analyze resume <ArrowRight />
                </Button>
                {blockers.length > 0 && <p className="text-[13px] text-fg-subtle">To continue, {blockers.join(" and ")}.</p>}
              </div>
            </div>

            <aside className="grid content-start gap-5">
              <Card className="p-5">
                <div className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">What we evaluate</div>
                <ul className="grid gap-4">
                  {EVALUATES.map(({ icon: Icon, title, body }) => (
                    <li key={title} className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg">
                        <Icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{title}</span>
                        <span className="block text-[13px] leading-5 text-fg-muted">{body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="link" className="mt-4 text-[13px]">
                  <Link to="/methodology">How the evaluation works <ArrowRight /></Link>
                </Button>
              </Card>
              <Card className="p-5">
                <div className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">Before you upload</div>
                <ul className="grid gap-2 text-[13px] text-fg-muted">
                  {["Export a PDF with selectable text", "Keep to a single column", "Replace every template placeholder", "Check that every link opens"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><FileCheck2 className="size-3.5 text-success" /> {t}</li>
                  ))}
                </ul>
              </Card>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}

function SelectedFile({
  file,
  check,
  checking,
  onRemove,
  onReplace,
}: {
  file: File;
  check: FileCheck | null;
  checking: boolean;
  onRemove: () => void;
  onReplace: (files: File[]) => void;
}) {
  const replaceInput = useRef<HTMLInputElement>(null);
  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  const Icon = isPdf ? FileText : FileType2;
  return (
    <Card className={cn("overflow-hidden", check && !check.ok && "border-danger/40")}>
      <div className="flex items-center gap-4 p-5">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", isPdf ? "bg-danger-soft text-danger" : "bg-info-soft text-info")}>
          <Icon className="size-6" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{file.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <span className="uppercase">{file.name.split(".").pop()}</span>
            <span className="text-fg-subtle">·</span>
            <span className="tabular">{formatBytes(file.size)}</span>
            {checking && (
              <Badge><Loader2 className="animate-spin" /> Checking file…</Badge>
            )}
            {check?.ok && <Badge tone="success"><FileCheck2 /> Ready to analyze</Badge>}
            {check && !check.ok && <Badge tone="danger"><CircleAlert /> Rejected</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" onClick={() => replaceInput.current?.click()} aria-label="Replace file">
            <RefreshCw /> <span className="hidden sm:inline">Replace</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove file">
            <Trash2 />
          </Button>
          <input
            ref={replaceInput}
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={(e) => {
              if (e.target.files?.[0]) onReplace([e.target.files[0]]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {check && (check.errors.length > 0 || check.warnings.length > 0) && (
        <div className="grid gap-1.5 border-t border-border bg-surface-2 px-5 py-3">
          {check.errors.map((e) => (
            <p key={e} className="flex items-start gap-2 text-[13px] text-danger"><CircleAlert className="mt-0.5 size-3.5 shrink-0" /> {e}</p>
          ))}
          {check.warnings.map((w) => (
            <p key={w} className="flex items-start gap-2 text-[13px] text-warning"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {w}</p>
          ))}
        </div>
      )}
    </Card>
  );
}
