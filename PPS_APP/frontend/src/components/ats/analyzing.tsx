import { FlaskConical } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";

const CHECKS = [
  "Is this document actually a resume?",
  "Can applicant-tracking software read it?",
  "Formatting, alignment and spacing",
  "Placeholders, links and contact details",
  "Content quality, grammar and spelling",
  "Faculty CA1 rubric",
];

/**
 * Generic processing state. The scanner API does not report staged progress,
 * so nothing here pretends to: no percentages, no ticking steps.
 */
export function Analyzing({ fileName, demo, onCancel }: { fileName: string; demo: boolean; onCancel: () => void }) {
  const reduce = useReducedMotion();
  return (
    <Card className="relative overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative grid items-center gap-10 p-8 sm:p-12 md:grid-cols-[auto_1fr]">
        {/* Document being scanned */}
        <div className="relative mx-auto h-[200px] w-[150px]" aria-hidden>
          <motion.div
            initial={reduce ? false : { y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute inset-0 rounded-xl border border-border bg-surface p-4 shadow-md"
          >
            <div className="mb-3 h-2.5 w-16 rounded bg-fg/80" />
            <div className="mb-4 h-1.5 w-24 rounded bg-fg-subtle/40" />
            {[0.95, 0.8, 0.9, 0.6, 0.85, 0.7, 0.92, 0.5].map((w, i) => (
              <div key={i} className="mb-2 h-1.5 rounded bg-fg-subtle/25" style={{ width: `${w * 100}%` }} />
            ))}
          </motion.div>
          {!reduce && (
            <div
              className="absolute inset-x-[-10px] top-2 h-8 animate-scan rounded-full bg-gradient-to-b from-transparent via-primary/35 to-transparent blur-[2px]"
              style={{ ["--scan-distance" as string]: "150px" }}
            >
              <div className="absolute inset-x-2 top-1/2 h-px bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
            </div>
          )}
        </div>

        <div aria-live="polite">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-primary">Analyzing</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Reading your resume…</h2>
          <p className="mt-1.5 truncate text-sm text-fg-muted">{fileName}</p>

          <div className="mt-6 text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">What the scanner checks</div>
          <ul className="mt-2.5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-2.5 text-sm text-fg-muted">
                <span className="size-1 rounded-full bg-fg-subtle" /> {c}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
            {demo && (
              <span className="inline-flex items-center gap-1.5 text-xs text-warning">
                <FlaskConical className="size-3.5" /> Demo mode: a sample response is returned after a short simulated delay.
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
