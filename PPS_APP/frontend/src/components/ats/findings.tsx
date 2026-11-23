import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, MapPin, Quote, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { SEVERITY_ORDER, type Finding, type Severity } from "@/types/scan";
import { SEVERITY } from "./meta";

export function locationLabel(f: Finding): string | null {
  const parts = [f.location?.page ? `Page ${f.location.page}` : null, f.location?.section ?? null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function FindingItem({ f, compact = false }: { f: Finding; compact?: boolean }) {
  const meta = SEVERITY[f.severity];
  const loc = locationLabel(f);
  return (
    <Accordion.Item value={f.id} className="group/item overflow-hidden rounded-lg border border-border bg-surface transition-shadow data-[state=open]:shadow-sm">
      <Accordion.Header>
        <Accordion.Trigger className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2">
          <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md", meta.soft, meta.text)}>
            <meta.icon className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-6">{f.title}</span>
            {!compact && (
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                <span>{f.category}</span>
                {loc && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {loc}
                  </span>
                )}
              </span>
            )}
          </span>
          <Badge tone={meta.tone} className="mt-0.5 hidden sm:inline-flex">{meta.label}</Badge>
          <ChevronDown className="mt-1 size-4 shrink-0 text-fg-subtle transition-transform duration-200 group-data-[state=open]/item:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden data-[state=closed]:animate-none">
        <div className="space-y-4 border-t border-border px-4 pb-4 pl-[52px] pt-3.5 text-sm">
          <p className="leading-6 text-fg">{f.explanation}</p>
          {f.evidence && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
                <Quote className="size-3" /> Detected text
              </div>
              <code className="block rounded-md border border-border bg-bg-subtle px-3 py-2 font-mono text-[12.5px] text-fg">{f.evidence}</code>
            </div>
          )}
          {f.why_it_matters && (
            <div>
              <div className="mb-1 text-xs font-medium text-fg-subtle">Why it matters</div>
              <p className="leading-6 text-fg-muted">{f.why_it_matters}</p>
            </div>
          )}
          {f.suggestion && (
            <div className="flex gap-2.5 rounded-lg border border-success/20 bg-success-soft px-3 py-2.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-success" />
              <p className="leading-6 text-fg">{f.suggestion}</p>
            </div>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

type Filter = "all" | Severity;

export function FindingsExplorer({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string>("all");
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    findings.forEach((f) => (c[f.severity] = (c[f.severity] ?? 0) + 1));
    return c;
  }, [findings]);
  const categories = useMemo(() => [...new Set(findings.map((f) => f.category))].sort(), [findings]);

  if (!findings.length) {
    return <p className="text-sm text-fg-muted">The scanner returned no detailed findings for this resume.</p>;
  }

  const shown = findings
    .filter((f) => (filter === "all" || f.severity === filter) && (category === "all" || f.category === category))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const filters: Filter[] = ["all", ...(["critical", "warning", "suggestion", "info"] as Severity[]).filter((s) => counts[s])];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="radiogroup" aria-label="Filter by severity" className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const active = filter === f;
            const meta = f === "all" ? null : SEVERITY[f];
            return (
              <button
                key={f}
                role="radio"
                aria-checked={active}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition",
                  active ? "border-fg bg-fg text-bg" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {meta && <meta.icon className={cn("size-3.5", !active && meta.text)} />}
                {f === "all" ? "All" : meta!.plural}
                <span className={cn("tabular text-xs", active ? "text-bg/70" : "text-fg-subtle")}>{f === "all" ? findings.length : counts[f]}</span>
              </button>
            );
          })}
        </div>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 rounded-md border border-border bg-surface px-2.5 text-[13px] text-fg shadow-xs outline-none hover:border-border-strong focus-visible:border-primary"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-fg-muted">No findings match these filters.</p>
      ) : (
        <Accordion.Root type="multiple" className="flex flex-col gap-2">
          {shown.map((f) => (
            <FindingItem key={f.id} f={f} />
          ))}
        </Accordion.Root>
      )}
    </div>
  );
}
