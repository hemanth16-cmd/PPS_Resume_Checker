import { FileX2, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import type { ScanResult } from "@/types/scan";
import { DOC_TYPE } from "./meta";

export function InvalidDocument({ result, retryTo = "/scan" }: { result: ScanResult; retryTo?: string | null }) {
  const reduce = useReducedMotion();
  const v = result.validation;
  const type = DOC_TYPE[v.document_type] ?? DOC_TYPE.unrelated;
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-danger/70 via-danger to-danger/70" />
      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        <motion.div
          initial={reduce ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative mx-auto flex size-28 items-center justify-center rounded-2xl border border-danger/20 bg-danger-soft md:mx-0"
        >
          <FileX2 className="size-12 text-danger" strokeWidth={1.5} />
        </motion.div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="danger">Not evaluated</Badge>
            <Badge>Detected: {type.label}</Badge>
            {v.confidence != null && <Badge>Confidence {Math.round(v.confidence * 100)}%</Badge>}
          </div>
          <h2 className="mt-3 text-xl font-semibold">This document can’t be evaluated as a resume</h2>
          <p className="mt-1.5 text-[15px] text-fg-muted">{v.message}</p>

          {v.reasons.length > 0 && (
            <div className="mt-5">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">Why it was rejected</div>
              <ul className="mt-2 space-y-1.5">
                {v.reasons.map((r) => (
                  <li key={r} className="flex gap-2.5 text-sm text-fg">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-sm font-medium">What to do</div>
            <p className="mt-1 text-sm text-fg-muted">{type.guidance}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {retryTo && (
              <Button asChild>
                <Link to={retryTo}>
                  <RotateCcw /> Upload a different file
                </Link>
              </Button>
            )}
            <span className="text-xs text-fg-subtle">No ATS or CA1 score is given for documents that aren’t resumes.</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
