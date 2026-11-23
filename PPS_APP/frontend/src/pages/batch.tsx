import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CircleAlert, CircleCheck, Clock, Download, FileX2, FlaskConical, Loader2, Play, Search, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Dropzone } from "@/components/ats/dropzone";
import { atsBand } from "@/components/ats/meta";
import { ResultMeta, ResultView } from "@/components/ats/result-view";
import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/overlays";
import { Badge, Card, Input, Progress } from "@/components/ui/primitives";
import type { DemoScenario } from "@/data/demo";
import { checkFile, type FileCheck } from "@/lib/file-checks";
import { download } from "@/lib/report";
import { cn, formatBytes, uid } from "@/lib/utils";
import { demoResult, scanner, ScannerError } from "@/services/scanner";
import { hasScores, type ScanResult } from "@/types/scan";

type ItemState = "checking" | "rejected" | "ready" | "queued" | "analyzing" | "done" | "failed";

interface Item {
  id: string;
  name: string;
  size: number;
  file?: File;
  check?: FileCheck;
  state: ItemState;
  result?: ScanResult;
  error?: string;
  demo?: boolean;
}

const STATE_META: Record<ItemState, { label: string; tone: "neutral" | "danger" | "success" | "primary" | "warning" }> = {
  checking: { label: "Checking", tone: "neutral" },
  rejected: { label: "Rejected", tone: "danger" },
  ready: { label: "Ready", tone: "neutral" },
  queued: { label: "Queued", tone: "neutral" },
  analyzing: { label: "Analyzing", tone: "primary" },
  done: { label: "Done", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

function StateIcon({ s }: { s: ItemState }) {
  if (s === "checking" || s === "analyzing") return <Loader2 className="size-4 animate-spin text-primary" />;
  if (s === "done") return <CircleCheck className="size-4 text-success" />;
  if (s === "rejected" || s === "failed") return <CircleAlert className="size-4 text-danger" />;
  if (s === "queued") return <Clock className="size-4 text-fg-subtle" />;
  return <CircleCheck className="size-4 text-fg-subtle" />;
}

export default function Batch() {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Item | null>(null);
  const cancel = useRef(false);
  const live = scanner.mode === "live";

  const update = (id: string, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addFiles = async (files: File[]) => {
    const fresh: Item[] = files.map((f) => ({ id: uid("b"), name: f.name, size: f.size, file: f, state: "checking" }));
    setItems((xs) => [...xs.filter((x) => !x.demo), ...fresh]);
    for (const it of fresh) {
      const check = await checkFile(it.name, await it.file!.arrayBuffer());
      update(it.id, { check, state: check.ok ? "ready" : "rejected" });
    }
  };

  const run = async () => {
    const ready = items.filter((i) => i.state === "ready" || i.state === "failed");
    if (!ready.length) return;
    cancel.current = false;
    setRunning(true);
    ready.forEach((i) => update(i.id, { state: "queued", error: undefined }));
    let ok = 0;
    for (const it of ready) {
      if (cancel.current) {
        update(it.id, { state: "ready" });
        continue;
      }
      update(it.id, { state: "analyzing" });
      try {
        const result = await scanner.scan({ file: it.file! });
        update(it.id, { state: "done", result });
        ok++;
      } catch (e) {
        update(it.id, { state: "failed", error: e instanceof ScannerError ? e.message : "Unexpected error" });
      }
    }
    setRunning(false);
    toast.success(`Batch finished: ${ok} of ${ready.length} analyzed`);
  };

  const loadSample = () => {
    const plan: [string, DemoScenario | "fail"][] = [
      ["student_A_resume_DEMO.pdf", "valid_resume"],
      ["student_B_resume_DEMO.pdf", "earlier_draft"],
      ["student_C_marksheet_DEMO.pdf", "grade_card"],
      ["student_D_scan_DEMO.pdf", "empty_document"],
      ["student_E_resume_DEMO.docx", "fail"],
    ];
    setItems(
      plan.map(([name, sc]) => ({
        id: uid("b"),
        name,
        size: 120000 + name.length * 997,
        demo: true,
        state: sc === "fail" ? "failed" : "done",
        error: sc === "fail" ? "The scanner took too long to respond. (sample error)" : undefined,
        result: sc === "fail" ? undefined : demoResult(sc, { fileName: name }),
      })),
    );
    toast("Sample batch loaded", { description: "Demo data — not real analyses." });
  };

  const done = items.filter((i) => i.state === "done" || i.state === "failed").length;
  const queuedCount = items.filter((i) => ["queued", "analyzing", "done", "failed"].includes(i.state)).length;
  const readyCount = items.filter((i) => i.state === "ready" || (i.state === "failed" && !i.demo)).length;
  const rows = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const anyDemo = items.some((i) => i.demo);

  const exportCsv = () => {
    const header = ["file", "status", "document_type", "ats", "ca1", "critical", "error"];
    const lines = items.map((i) => {
      const r = i.result;
      return [
        i.name,
        i.state,
        r?.validation.document_type ?? "",
        r && hasScores(r) ? r.ats?.score ?? "" : "",
        r && hasScores(r) ? r.ca1?.total ?? "" : "",
        r ? r.findings.filter((f) => f.severity === "critical").length : "",
        i.error ?? i.check?.errors.join("; ") ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    download(`batch_results${anyDemo ? "_DEMO" : ""}.csv`, [header.join(","), ...lines].join("\n"), "text/csv");
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Faculty"
        title="Batch scanner"
        description="Check and analyze many resumes at once, then review results in one table."
        actions={items.length > 0 && (
          <>
            <Button variant="secondary" onClick={exportCsv}><Download /> Export CSV</Button>
            <Button variant="ghost" onClick={() => setItems([])} disabled={running}><Trash2 /> Clear</Button>
          </>
        )}
      />

      {!live && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-[13px] leading-5 sm:flex-row sm:items-center">
          <FlaskConical className="size-4 shrink-0 text-warning" />
          <div className="flex-1">
            <span className="font-semibold">Batch analysis needs the scanner API.</span> File checks below are real; analysis is disabled in demo mode.
            You can load a labelled sample batch to preview the results table.
          </div>
          <Button size="sm" variant="secondary" onClick={loadSample} disabled={running}>Load sample batch</Button>
        </div>
      )}

      <div className="grid gap-6">
        <Dropzone onFiles={addFiles} multiple compact disabled={running} />

        {items.length > 0 && (
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files" className="pl-9" aria-label="Search files" />
              </div>
              <div className="flex flex-1 items-center gap-3 sm:justify-end">
                {running && (
                  <div className="flex flex-1 items-center gap-3 sm:max-w-xs">
                    <Progress value={done} max={Math.max(1, queuedCount)} label="Batch progress" />
                    <span className="tabular shrink-0 text-xs text-fg-muted">{done}/{queuedCount}</span>
                  </div>
                )}
                {running ? (
                  <Button variant="secondary" onClick={() => (cancel.current = true)}><X /> Stop after current</Button>
                ) : (
                  <Tooltip content={live ? "Analyze every ready file" : "Requires VITE_SCANNER_API_URL"}>
                    <span>
                      <Button onClick={run} disabled={!live || readyCount === 0}>
                        <Play /> Analyze {readyCount > 0 ? readyCount : ""} file{readyCount === 1 ? "" : "s"}
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(0,1fr)_120px_90px_90px_80px_120px] gap-4 border-b border-border bg-surface-2 px-4 py-2.5 text-xs font-medium text-fg-subtle md:grid">
              <span>File</span><span>Document</span><span>ATS</span><span>CA1</span><span>Critical</span><span>Status</span>
            </div>
            <ul className="divide-y divide-border">
              {rows.map((it) => {
                const r = it.result;
                const scored = r && hasScores(r);
                const clickable = !!r;
                return (
                  <li key={it.id}>
                    <button
                      disabled={!clickable}
                      onClick={() => clickable && setOpen(it)}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left md:grid-cols-[minmax(0,1fr)_120px_90px_90px_80px_120px]",
                        clickable ? "transition hover:bg-surface-2" : "cursor-default",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <StateIcon s={it.state} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{it.name}</span>
                            {it.demo && <Badge tone="demo" className="shrink-0">Demo</Badge>}
                          </span>
                          <span className="block truncate text-xs text-fg-subtle">
                            {formatBytes(it.size)}
                            {(it.error || it.check?.errors[0]) && <span className="text-danger"> · {it.error ?? it.check?.errors[0]}</span>}
                          </span>
                        </span>
                      </span>
                      <span className="hidden text-[13px] md:block">
                        {r ? (scored ? "Resume" : <span className="inline-flex items-center gap-1 text-danger"><FileX2 className="size-3.5" /> {r.validation.document_type.replace("_", " ")}</span>) : <span className="text-fg-subtle">—</span>}
                      </span>
                      <span className="hidden md:block">
                        {scored && r!.ats ? (
                          <span className="inline-flex items-center gap-1.5 text-sm"><span className="size-2 rounded-full" style={{ background: atsBand(r!.ats.score).color }} /><span className="tabular font-semibold">{r!.ats.score}</span></span>
                        ) : <span className="text-fg-subtle">—</span>}
                      </span>
                      <span className="tabular hidden text-sm md:block">{scored && r!.ca1 ? `${r!.ca1.total}/30` : <span className="text-fg-subtle">—</span>}</span>
                      <span className="tabular hidden text-sm md:block">{r ? r.findings.filter((f) => f.severity === "critical").length : <span className="text-fg-subtle">—</span>}</span>
                      <span><Badge tone={STATE_META[it.state].tone}>{STATE_META[it.state].label}</Badge></span>
                    </button>
                  </li>
                );
              })}
              {rows.length === 0 && <li className="p-6 text-center text-sm text-fg-muted">No files match.</li>}
            </ul>
          </Card>
        )}
      </div>

      {/* Result drawer */}
      <DialogPrimitive.Root open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-[880px] overflow-y-auto border-l border-border bg-bg shadow-lg outline-none" aria-describedby={undefined}>
            {open?.result && (
              <div className="p-5 sm:p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DialogPrimitive.Title className="truncate text-xl font-semibold">{open.name}</DialogPrimitive.Title>
                    <div className="mt-2"><ResultMeta result={open.result} /></div>
                  </div>
                  <DialogPrimitive.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></DialogPrimitive.Close>
                </div>
                <ResultView result={open.result} file={open.file} retryTo={null} />
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </Page>
  );
}
