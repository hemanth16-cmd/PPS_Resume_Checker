import { ArrowDownRight, ArrowLeftRight, ArrowRight, ArrowUpRight, CircleCheck, CirclePlus, FlaskConical, GitCompareArrows, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CATEGORY_STATUS, SEVERITY } from "@/components/ats/meta";
import { EmptyState, Page, PageHeader, Reveal } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { compareScans, type ScoreDelta } from "@/lib/compare";
import { useStore } from "@/lib/store";
import { sampleScans } from "@/lib/seed";
import { cn, formatDate } from "@/lib/utils";
import { hasScores, isDemo, type Finding, type ScanRecord } from "@/types/scan";

function ScanPicker({ label, value, options, onChange }: { label: string; value?: string; options: ScanRecord[]; onChange: (id: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm shadow-xs outline-none hover:border-border-strong focus-visible:border-primary"
      >
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.result.file.name} · {formatDate(s.createdAt)}{isDemo(s.result) ? " · demo" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function DeltaCard({ title, d, max }: { title: string; d: ScoreDelta; max: number }) {
  const up = (d.delta ?? 0) > 0;
  const down = (d.delta ?? 0) < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <Card className="p-6">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">{title}</div>
      <div className="mt-4 flex items-end gap-4">
        <div className="tabular text-fg-subtle">
          <div className="text-xs">Before</div>
          <div className="text-2xl font-semibold">{d.before ?? "—"}</div>
        </div>
        <ArrowRight className="mb-2 size-4 text-fg-subtle" />
        <div className="tabular">
          <div className="text-xs text-fg-subtle">After</div>
          <div className="text-4xl font-semibold">
            {d.after ?? "—"}
            <span className="text-base font-normal text-fg-subtle">/{max}</span>
          </div>
        </div>
        {d.delta !== null && (
          <span
            className={cn(
              "mb-1.5 ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular",
              up ? "bg-success-soft text-success" : down ? "bg-danger-soft text-danger" : "bg-bg-subtle text-fg-muted",
            )}
          >
            <Icon className="size-4" />
            {up ? "+" : ""}
            {d.delta}
          </span>
        )}
      </div>
    </Card>
  );
}

function FindingList({ title, icon, items, tone, empty }: { title: string; icon: ReactNode; items: Finding[]; tone: string; empty: string }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className={cn("[&_svg]:size-4", tone)}>{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs text-fg-subtle">{items.length}</span>
      </div>
      <ul className="divide-y divide-border">
        {items.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-fg-subtle">{empty}</li>}
        {items.map((f) => {
          const m = SEVERITY[f.severity];
          return (
            <li key={f.id} className="flex items-start gap-2.5 px-4 py-3">
              <m.icon className={cn("mt-0.5 size-3.5 shrink-0", m.text)} />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium">{f.title}</span>
                <span className="block text-xs text-fg-subtle">{f.category}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function Compare() {
  const { scans, addScan } = useStore();
  const [params, setParams] = useSearchParams();
  const scored = scans.filter((s) => hasScores(s.result));

  if (scored.length < 2) {
    return (
      <Page>
        <PageHeader eyebrow="Workspace" title="Compare analyses" description="See what improved and what regressed between two versions of your resume." />
        <EmptyState
          icon={<GitCompareArrows />}
          title="You need two scored scans to compare"
          description={`You have ${scored.length}. Scan another version of your resume, or add two labelled sample scans.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild><Link to="/scan">Scan a resume</Link></Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const [later, earlier] = sampleScans();
                  addScan(earlier);
                  addScan(later);
                  setParams({ a: earlier.id, b: later.id });
                  toast.success("Sample scans added", { description: "Labelled as demo data." });
                }}
              >
                <FlaskConical /> Add sample scans
              </Button>
            </div>
          }
        />
      </Page>
    );
  }

  const byDate = [...scored].sort((x, y) => +new Date(x.createdAt) - +new Date(y.createdAt));
  const a = scored.find((s) => s.id === params.get("a")) ?? byDate[byDate.length - 2];
  const b = scored.find((s) => s.id === params.get("b")) ?? byDate[byDate.length - 1];
  const cmp = compareScans(a.result, b.result);
  const anyDemo = isDemo(a.result) || isDemo(b.result);

  return (
    <Page>
      <PageHeader eyebrow="Workspace" title="Compare analyses" description="Scores and findings between two scans. Findings are matched by title." />

      <Card className="mb-6 grid items-end gap-4 p-5 md:grid-cols-[1fr_auto_1fr]">
        <ScanPicker label="Before" value={a.id} options={scored} onChange={(id) => setParams({ a: id, b: b.id })} />
        <Button variant="ghost" size="icon" aria-label="Swap before and after" onClick={() => setParams({ a: b.id, b: a.id })} className="justify-self-center">
          <ArrowLeftRight />
        </Button>
        <ScanPicker label="After" value={b.id} options={scored} onChange={(id) => setParams({ a: a.id, b: id })} />
      </Card>

      {anyDemo && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-warning/25 bg-warning-soft px-4 py-2.5 text-[13px]">
          <FlaskConical className="size-4 text-warning" /> At least one of these scans is demo data.
        </div>
      )}
      {a.id === b.id && <p className="mb-6 text-sm text-fg-muted">You’ve selected the same scan twice — pick two different scans.</p>}

      <Reveal className="mb-6 grid gap-5 md:grid-cols-2">
        <DeltaCard title="ATS compatibility" d={cmp.ats} max={100} />
        <DeltaCard title="Faculty CA1" d={cmp.ca1} max={30} />
      </Reveal>

      <Reveal delay={0.05} className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Categories</h2>
        <Card className="divide-y divide-border">
          {cmp.categories.map((c) => (
            <div key={c.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-28 text-sm font-medium">{c.label}</span>
              <span className="flex items-center gap-2 text-[13px]">
                {c.before ? <Badge tone={CATEGORY_STATUS[c.before as keyof typeof CATEGORY_STATUS].tone}>{CATEGORY_STATUS[c.before as keyof typeof CATEGORY_STATUS].label}</Badge> : <Badge>—</Badge>}
                <ArrowRight className="size-3.5 text-fg-subtle" />
                {c.after ? <Badge tone={CATEGORY_STATUS[c.after as keyof typeof CATEGORY_STATUS].tone}>{CATEGORY_STATUS[c.after as keyof typeof CATEGORY_STATUS].label}</Badge> : <Badge>—</Badge>}
              </span>
              <span
                className={cn(
                  "ml-auto text-xs font-medium",
                  c.change === "improved" ? "text-success" : c.change === "regressed" ? "text-danger" : "text-fg-subtle",
                )}
              >
                {c.change === "same" ? "No change" : c.change[0].toUpperCase() + c.change.slice(1)}
              </span>
            </div>
          ))}
        </Card>
      </Reveal>

      <Reveal delay={0.1} className="grid gap-5 lg:grid-cols-3">
        <FindingList title="Resolved" icon={<CircleCheck />} tone="text-success" items={cmp.resolved} empty="Nothing resolved between these scans." />
        <FindingList title="New issues" icon={<CirclePlus />} tone="text-danger" items={cmp.introduced} empty="No new issues." />
        <FindingList title="Still open" icon={<Minus />} tone="text-fg-muted" items={cmp.persisting} empty="Nothing carried over." />
      </Reveal>
    </Page>
  );
}
