import { motion, useReducedMotion } from "motion/react";
import { Badge, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { CategoryResult } from "@/types/scan";
import { CATEGORY_STATUS } from "./meta";

export function CategoryGrid({ categories }: { categories: CategoryResult[] }) {
  const reduce = useReducedMotion();
  if (!categories.length) return <p className="text-sm text-fg-muted">The scanner did not return a category breakdown.</p>;
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
      {categories.map((c, i) => {
        const meta = CATEGORY_STATUS[c.status];
        return (
          <motion.div
            key={c.key}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.03 * i }}
            className="group bg-surface p-4 transition hover:bg-surface-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className={cn("size-2 rounded-full", meta.dot)} />
                {c.label}
              </span>
              <Badge tone={meta.tone} className="hidden sm:inline-flex lg:hidden xl:inline-flex">{meta.label}</Badge>
            </div>
            {c.score != null && c.max_score ? <Progress value={c.score} max={c.max_score} className="mt-3" label={c.label} /> : null}
            {c.summary && <p className="mt-2 text-xs leading-5 text-fg-muted">{c.summary}</p>}
          </motion.div>
        );
      })}
    </div>
  );
}
