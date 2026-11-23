import * as Accordion from "@radix-ui/react-accordion";
import { FileSearch, FlaskConical } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { EmptyState } from "@/components/layout/page";
import { Skeleton } from "@/components/ui/primitives";
import { isDemo, sortBySeverity, type ScanResult } from "@/types/scan";
import type { Highlight } from "./document-viewer";
import { FindingItem } from "./findings";

const DocumentViewer = lazy(() => import("./document-viewer").then((m) => ({ default: m.DocumentViewer })));

export function PreviewPanel({ result, file }: { result: ScanResult; file?: File }) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string[]>([]);
  const demo = isDemo(result);
  const findings = sortBySeverity(result.findings.filter((f) => f.severity !== "info"));

  // Highlights only when the scanner returned real coordinates for *this* document.
  const highlights: Highlight[] = demo
    ? []
    : findings
        .filter((f) => f.location?.region && f.location.page)
        .map((f) => ({
          id: f.id,
          page: f.location!.page!,
          region: f.location!.region!,
          tone: f.severity === "critical" ? "danger" : f.severity === "warning" ? "warning" : "info",
          label: f.title,
        }));
  const active = open[open.length - 1] ?? null;

  const onOpenChange = (ids: string[]) => {
    setOpen(ids);
    const newest = ids.find((id) => !open.includes(id));
    const f = findings.find((x) => x.id === newest);
    if (f?.location?.page && !demo) setPage(f.location.page);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-20 lg:h-[calc(100dvh-7rem)]">
        {file ? (
          <Suspense fallback={<Skeleton className="h-full min-h-[560px] rounded-xl" />}>
            <DocumentViewer file={file} page={page} onPageChange={setPage} highlights={highlights} activeHighlight={active} />
          </Suspense>
        ) : (
          <EmptyState
            className="h-full min-h-[420px]"
            icon={<FileSearch />}
            title="No document to preview"
            description={
              demo
                ? "Sample results aren’t attached to a document. Upload a resume on the scanner page to preview your own file."
                : "The original file is only kept in this browser tab. Re-open the scan from the scanner to preview it."
            }
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Findings</h3>
          <span className="text-xs text-fg-subtle">{findings.length} to review</span>
        </div>
        {demo && file && (
          <div className="mb-3 flex gap-2.5 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2.5 text-[13px] leading-5">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
            These are sample findings and do not describe the document on the left.
          </div>
        )}
        {!demo && highlights.length === 0 && file && (
          <p className="mb-3 text-xs text-fg-subtle">The scanner didn’t return coordinates, so findings are listed by section rather than highlighted on the page.</p>
        )}
        <Accordion.Root type="multiple" value={open} onValueChange={onOpenChange} className="flex flex-col gap-2">
          {findings.map((f) => (
            <FindingItem key={f.id} f={f} />
          ))}
        </Accordion.Root>
      </div>
    </div>
  );
}
