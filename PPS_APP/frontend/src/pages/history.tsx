import { ArrowRight, FileX2, FlaskConical, GitCompareArrows, History as HistoryIcon, Plus, ScanSearch, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { atsBand } from "@/components/ats/meta";
import { EmptyState, Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Checkbox, Dialog, DialogClose, DialogContent, Tooltip } from "@/components/ui/overlays";
import { Badge, Card, Input } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { sampleScans } from "@/lib/seed";
import { cn, formatDate } from "@/lib/utils";
import { hasScores, isDemo, type ScanRecord } from "@/types/scan";

type Filter = "all" | "scored" | "rejected";

export default function HistoryPage() {
  const { scans, addScan, removeScan } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<ScanRecord | null>(null);

  const rows = useMemo(
    () =>
      scans.filter(
        (s) =>
          s.result.file.name.toLowerCase().includes(q.toLowerCase()) &&
          (filter === "all" || (filter === "scored" ? hasScores(s.result) : !hasScores(s.result))),
      ),
    [scans, q, filter],
  );

  const toggle = (id: string) =>
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel.slice(-1), id]));

  const loadSamples = () => {
    sampleScans().reverse().forEach((r) => addScan(r));
    toast.success("Two sample scans added", { description: "Labelled as demo data." });
  };

  if (scans.length === 0) {
    return (
      <Page>
        <PageHeader eyebrow="Workspace" title="Scan history" description="Every resume you analyze is saved in this browser." />
        <EmptyState
          icon={<HistoryIcon />}
          title="No scans yet"
          description="Analyze a resume to start your history. You can also add two labelled sample scans to explore History and Compare."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild><Link to="/scan"><ScanSearch /> Scan a resume</Link></Button>
              <Button variant="secondary" onClick={loadSamples}><FlaskConical /> Add sample scans</Button>
            </div>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Workspace"
        title="Scan history"
        description="Saved in this browser only — clearing site data or switching device removes it."
        actions={
          <>
            <Button
              variant="secondary"
              disabled={selected.length !== 2}
              onClick={() => {
                const [a, b] = [...selected].sort(
                  (x, y) => +new Date(scans.find((s) => s.id === x)!.createdAt) - +new Date(scans.find((s) => s.id === y)!.createdAt),
                );
                navigate(`/compare?a=${a}&b=${b}`);
              }}
            >
              <GitCompareArrows /> Compare {selected.length === 2 ? "selected" : `(${selected.length}/2)`}
            </Button>
            <Button asChild><Link to="/scan"><Plus /> New scan</Link></Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by file name" className="pl-9" aria-label="Search scans" />
        </div>
        <div role="radiogroup" aria-label="Filter scans" className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          {(["all", "scored", "rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 rounded-md px-3 text-[13px] font-medium capitalize transition",
                filter === f ? "bg-bg-subtle text-fg shadow-xs" : "text-fg-muted hover:text-fg",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[32px_minmax(0,1fr)_140px_90px_90px_110px_72px] items-center gap-4 border-b border-border bg-surface-2 px-4 py-2.5 text-xs font-medium text-fg-subtle md:grid">
          <span />
          <span>File</span>
          <span>Date</span>
          <span>ATS</span>
          <span>CA1</span>
          <span>Status</span>
          <span />
        </div>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-fg-muted">No scans match your search.</p>}
        <ul className="divide-y divide-border">
          {rows.map((s) => {
            const r = s.result;
            const scored = hasScores(r);
            const sel = selected.includes(s.id);
            return (
              <li
                key={s.id}
                className={cn(
                  "group grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition hover:bg-surface-2 md:grid-cols-[32px_minmax(0,1fr)_140px_90px_90px_110px_72px]",
                  sel && "bg-primary-soft/40",
                )}
              >
                <Tooltip content={scored ? "Select to compare" : "Only scored scans can be compared"}>
                  <span>
                    <Checkbox checked={sel} disabled={!scored} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${r.file.name} to compare`} />
                  </span>
                </Tooltip>
                <Link to={`/scan/${s.id}`} className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium group-hover:text-primary">{r.file.name}</span>
                    {isDemo(r) && <Badge tone="demo" className="shrink-0">Demo</Badge>}
                  </span>
                  <span className="mt-0.5 block text-xs text-fg-subtle md:hidden">{formatDate(s.createdAt)}</span>
                </Link>
                <span className="hidden text-[13px] text-fg-muted md:block">{formatDate(s.createdAt)}</span>
                <span className="hidden md:block">
                  {scored && r.ats ? (
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: atsBand(r.ats.score).color }} />
                      <span className="tabular text-sm font-semibold">{r.ats.score}</span>
                    </span>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </span>
                <span className="tabular hidden text-sm md:block">{scored && r.ca1 ? `${r.ca1.total}/${r.ca1.max_score}` : <span className="text-fg-subtle">—</span>}</span>
                <span className="col-start-2 md:col-start-auto">
                  {scored ? (
                    <Badge tone="success">Scored</Badge>
                  ) : (
                    <Badge tone="danger"><FileX2 /> Rejected</Badge>
                  )}
                  {scored && r.ats && <span className="tabular ml-2 text-sm font-semibold md:hidden">ATS {r.ats.score}</span>}
                </span>
                <span className="col-start-3 row-span-2 row-start-1 flex justify-end gap-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete ${r.file.name}`} onClick={() => setToDelete(s)}>
                    <Trash2 />
                  </Button>
                  <Button variant="ghost" size="icon-sm" asChild aria-label={`Open ${r.file.name}`}>
                    <Link to={`/scan/${s.id}`}><ArrowRight /></Link>
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent title="Delete this scan?" description={`“${toDelete?.result.file.name}” will be removed from this browser’s history. This can’t be undone.`}>
          <div className="mt-6 flex justify-end gap-2">
            <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
            <Button
              variant="danger"
              onClick={() => {
                if (toDelete) {
                  removeScan(toDelete.id);
                  setSelected((s) => s.filter((x) => x !== toDelete.id));
                }
                setToDelete(null);
                toast("Scan deleted");
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
