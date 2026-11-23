import { BadgeCheck, Hourglass, Scale } from "lucide-react";
import { Badge, Card, Progress } from "@/components/ui/primitives";
import type { AtsScore, Ca1Score } from "@/types/scan";
import { atsBand } from "./meta";
import { ScoreRing } from "./score-ring";

function Bar({ label, score, max, note, tone = "primary" }: { label: string; score: number; max: number; note?: string; tone?: "primary" | "success" | "warning" | "danger" }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-medium text-fg">{label}</span>
        <span className="tabular text-fg-muted">
          {score}
          <span className="text-fg-subtle">/{max}</span>
        </span>
      </div>
      <Progress value={score} max={max} tone={tone} label={label} />
      {note && <p className="mt-1.5 text-xs leading-5 text-fg-subtle">{note}</p>}
    </div>
  );
}

export function AtsCard({ ats }: { ats: AtsScore }) {
  const band = atsBand(ats.score);
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full opacity-[0.07] blur-2xl" style={{ background: band.color }} />
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">ATS compatibility</div>
          <p className="mt-1 text-[13px] text-fg-muted">How reliably applicant-tracking software reads this resume</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ScoreRing value={ats.score} max={100} color={band.color} label="ATS compatibility" />
        <div className="min-w-0 flex-1">
          <Badge tone={band.tone}>{band.label}</Badge>
          <p className="mt-2.5 text-[15px] font-medium leading-6 text-fg">{band.meaning}</p>
          {ats.summary && <p className="mt-2 text-[13px] leading-5 text-fg-muted">{ats.summary}</p>}
        </div>
      </div>
      {ats.components.length > 0 && (
        <div className="mt-6 grid gap-4 border-t border-border pt-5">
          {ats.components.map((c) => (
            <Bar key={c.name} label={c.name} score={c.score} max={c.max_score} note={c.summary} tone={c.score >= 80 ? "success" : c.score >= 60 ? "warning" : "danger"} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function Ca1Card({ ca1 }: { ca1: Ca1Score }) {
  const reviewed = ca1.status === "faculty_reviewed";
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary opacity-[0.07] blur-2xl" />
      <div className="mb-5">
        <div className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">Faculty CA1</div>
        <p className="mt-1 text-[13px] text-fg-muted">Rubric-aligned mark, independent of ATS</p>
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ScoreRing value={ca1.total} max={ca1.max_score} color={reviewed ? "var(--success)" : "var(--primary)"} decimals={ca1.total % 1 ? 1 : 0} label="Faculty CA1" />
        <div className="min-w-0 flex-1">
          {reviewed ? (
            <Badge tone="success"><BadgeCheck /> Faculty reviewed</Badge>
          ) : (
            <Badge tone="primary"><Hourglass /> Provisional</Badge>
          )}
          <p className="mt-2.5 text-[15px] font-medium leading-6 text-fg">
            {reviewed ? `Confirmed by ${ca1.reviewed_by ?? "faculty"}.` : "Pending faculty review — this mark may change."}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-fg-muted">Out of {ca1.max_score}. Only faculty can finalise it.</p>
        </div>
      </div>
      {ca1.rubric.length > 0 && (
        <div className="mt-6 grid gap-4 border-t border-border pt-5">
          {ca1.rubric.map((i) => (
            <Bar key={i.criterion} label={i.criterion} score={i.score} max={i.max_score} note={i.comment} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function SeparationNote() {
  return (
    <p className="flex items-center gap-2 text-xs text-fg-subtle">
      <Scale className="size-3.5" /> ATS and CA1 are separate evaluations. They are never added together or converted into one mark.
    </p>
  );
}
