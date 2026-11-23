import { BadgeCheck, Check, FileSearch, GraduationCap, Scale, ScanSearch, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { SEVERITY } from "@/components/ats/meta";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";

const STEPS = [
  { icon: ShieldCheck, title: "Validate", body: "Is this a readable resume? Grade cards, unrelated or image-only files are rejected with a reason — and no score." },
  { icon: FileSearch, title: "Extract", body: "Text, structure and sections are read from the PDF or DOCX." },
  { icon: ScanSearch, title: "Evaluate", body: "ATS compatibility, formatting, content, links, language and section coverage." },
  { icon: GraduationCap, title: "Grade", body: "A provisional CA1 mark on the faculty rubric, plus flags for anything a person should check." },
  { icon: BadgeCheck, title: "Review", body: "Faculty confirm or adjust the CA1 mark. Only then is it final." },
];

export default function Methodology() {
  return (
    <Page>
      <PageHeader
        eyebrow="Learn"
        title="Evaluated in context, not by keyword count"
        description="PPS reads a resume the way faculty do. Here’s what that means, and why it matters."
      />

      <Reveal>
        <Card className="mb-10 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-border p-6 md:border-b-0 md:border-r">
              <Badge>Earlier prototype</Badge>
              <p className="mt-3 text-sm text-fg-muted">Faculty rubrics combined with feedback from ~120 student resumes. Rule-based, and it showed:</p>
              <ul className="mt-4 grid gap-3">
                {[
                  "Graded a grade card or unrelated PDF as if it were a resume",
                  "Accepted placeholders like “Insert GitHub link here” as real content",
                  "Only checked criteria it explicitly recognised",
                  "Missed formatting, alignment, spacing and document quality",
                  "Had no real contextual understanding",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm">
                    <X className="mt-0.5 size-4 shrink-0 text-danger" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
              <Badge tone="primary">Context-aware evaluation</Badge>
              <p className="mt-3 text-sm text-fg-muted">Designed to close each of those gaps:</p>
              <ul className="mt-4 grid gap-3">
                {[
                  "Validates the document is a resume before scoring anything",
                  "Detects placeholder text, incomplete links and template leftovers",
                  "Reads the resume as a whole and reports issues outside a fixed list",
                  "Reviews layout, alignment, spacing and consistency",
                  "Explains every finding: what, where, why it matters, how to fix it",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05} className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">The pipeline</h2>
        <ol className="relative grid gap-4 md:grid-cols-5">
          <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent md:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="relative mb-3 flex size-11 items-center justify-center rounded-xl border border-border bg-surface shadow-sm">
                <s.icon className="size-5 text-primary" />
              </div>
              <div className="tabular text-xs text-fg-subtle">0{i + 1}</div>
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-1 text-[13px] leading-5 text-fg-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal delay={0.1} className="mb-6 grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">ATS compatibility · /100</div>
          <p className="mt-3 text-sm leading-6">How reliably applicant-tracking software can read your resume: text extraction, recognisable headings and layout safety (columns, tables, text boxes).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="success">80–100 Strong</Badge>
            <Badge tone="warning">60–79 Fair</Badge>
            <Badge tone="danger">0–59 Needs work</Badge>
          </div>
          <p className="mt-3 text-xs text-fg-subtle">Bands help interpret the number; the score itself comes from the scanner.</p>
        </Card>
        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">Faculty CA1 · /30</div>
          <p className="mt-3 text-sm leading-6">Your Continuous Assessment 1 mark on the faculty rubric. It starts <strong>provisional</strong> and becomes <strong>faculty reviewed</strong> once confirmed or adjusted.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="primary">Provisional</Badge>
            <Badge tone="success">Faculty reviewed</Badge>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.12}>
        <Card className="mb-10 flex gap-4 border-primary/25 bg-primary-soft/40 p-6">
          <Scale className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <div className="font-semibold">ATS and CA1 are independent</div>
            <p className="mt-1 text-sm leading-6 text-fg-muted">
              A resume can be perfectly machine-readable but weak in content, or excellent in content but hard for an ATS to parse.
              The two scores are never added together or converted into each other.
            </p>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.15}>
        <h2 className="mb-4 text-lg font-semibold">Severity levels</h2>
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {(["critical", "warning", "suggestion", "info"] as const).map((s) => {
            const m = SEVERITY[s];
            const text = {
              critical: "Fix before submitting — placeholder text, broken links.",
              warning: "Likely to cost marks or ATS reliability — misaligned dates, columns.",
              suggestion: "Polish — tense consistency, minor spelling.",
              info: "Checks that passed, so you know what’s working.",
            }[s];
            return (
              <div key={s} className="bg-surface p-5">
                <span className={`inline-flex size-8 items-center justify-center rounded-lg ${m.soft} ${m.text}`}><m.icon className="size-4" /></span>
                <div className="mt-3 text-sm font-semibold">{m.label}</div>
                <p className="mt-1 text-[13px] leading-5 text-fg-muted">{text}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg"><Link to="/scan"><ScanSearch /> Try the scanner</Link></Button>
        </div>
      </Reveal>
    </Page>
  );
}
