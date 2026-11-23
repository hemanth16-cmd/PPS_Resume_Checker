import { CircleCheckBig, Flame, LayoutTemplate, PenLine, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Checkbox } from "@/components/ui/overlays";
import { Card, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { sortBySeverity, type Finding } from "@/types/scan";

const FORMATTING = ["format", "align", "layout", "ats"];

export function groupNextSteps(findings: Finding[]) {
  const actionable = sortBySeverity(findings.filter((f) => f.severity !== "info" && !f.resolved));
  const first = actionable.filter((f) => f.severity === "critical");
  const formatting = actionable.filter((f) => f.severity !== "critical" && FORMATTING.some((w) => f.category.toLowerCase().includes(w)));
  const used = new Set([...first, ...formatting].map((f) => f.id));
  const content = actionable.filter((f) => !used.has(f.id));
  return { actionable, groups: [
    { key: "first", title: "Fix these first", icon: Flame, items: first, accent: "text-danger" },
    { key: "formatting", title: "Formatting and layout", icon: LayoutTemplate, items: formatting, accent: "text-warning" },
    { key: "content", title: "Content and language", icon: PenLine, items: content, accent: "text-info" },
  ] as { key: string; title: string; icon: LucideIcon; items: Finding[]; accent: string }[] };
}

/** Without `onToggle` the list is read-only (e.g. faculty viewing a student's scan). */
export function NextSteps({ findings, done, onToggle }: { findings: Finding[]; done: string[]; onToggle?: (id: string) => void }) {
  const reduce = useReducedMotion();
  const { actionable, groups } = groupNextSteps(findings);
  if (!actionable.length) {
    return (
      <Card className="flex items-center gap-3 p-5 text-sm">
        <CircleCheckBig className="size-5 text-success" /> The scanner returned no outstanding issues.
      </Card>
    );
  }
  const completed = actionable.filter((f) => done.includes(f.id)).length;
  const readOnly = !onToggle;

  return (
    <div className="grid gap-5">
      {!readOnly && <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="shrink-0">
          <div className="tabular text-2xl font-semibold">
            {completed}
            <span className="text-fg-subtle">/{actionable.length}</span>
          </div>
          <div className="text-xs text-fg-muted">improvements checked off</div>
        </div>
        <div className="flex-1">
          <Progress value={completed} max={actionable.length} tone="success" label="Improvements completed" />
          <p className="mt-2 text-xs text-fg-subtle">Tick items as you fix them in your resume. Saved in this browser.</p>
        </div>
      </Card>}

      {groups.filter((g) => g.items.length).map((g, gi) => (
        <motion.div key={g.key} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.06 }}>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <g.icon className={cn("size-4", g.accent)} /> {g.title}
            <span className="font-normal text-fg-subtle">{g.items.length}</span>
          </div>
          <Card className="divide-y divide-border">
            {g.items.map((f) => {
              const checked = done.includes(f.id);
              if (readOnly) {
                return (
                  <div key={f.id} className="flex items-start gap-3 px-4 py-3.5">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-fg-subtle" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{f.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-5 text-fg-muted">{f.suggestion || f.explanation}</span>
                    </span>
                  </div>
                );
              }
              return (
                <label key={f.id} className="flex cursor-pointer items-start gap-3 px-4 py-3.5 transition hover:bg-surface-2">
                  <Checkbox checked={checked} onCheckedChange={() => onToggle?.(f.id)} className="mt-0.5" aria-label={f.title} />
                  <span className="min-w-0">
                    <span className={cn("block text-sm font-medium transition", checked && "text-fg-subtle line-through")}>{f.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-5 text-fg-muted">{f.suggestion || f.explanation}</span>
                  </span>
                </label>
              );
            })}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
