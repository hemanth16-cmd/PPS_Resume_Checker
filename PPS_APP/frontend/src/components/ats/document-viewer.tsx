import { ChevronLeft, ChevronRight, Download, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/overlays";
import { Skeleton } from "@/components/ui/primitives";
import { download } from "@/lib/report";
import type { FindingRegion } from "@/types/scan";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const ZOOMS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];

export interface Highlight {
  id: string;
  page: number;
  region: FindingRegion;
  tone: "danger" | "warning" | "info";
  label: string;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-1 border-b border-border bg-surface/90 px-2 backdrop-blur">{children}</div>
  );
}

export function DocumentViewer({
  file,
  page,
  onPageChange,
  highlights = [],
  activeHighlight,
}: {
  file: File;
  page: number;
  onPageChange: (p: number) => void;
  highlights?: Highlight[];
  activeHighlight?: string | null;
}) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const [zoomIdx, setZoomIdx] = useState(3);
  const zoom = ZOOMS[zoomIdx];

  const zoomControls = (
    <>
      <Tooltip content="Zoom out">
        <Button variant="ghost" size="icon-sm" aria-label="Zoom out" disabled={zoomIdx === 0} onClick={() => setZoomIdx((z) => z - 1)}>
          <ZoomOut />
        </Button>
      </Tooltip>
      <span className="tabular w-11 text-center text-xs text-fg-muted">{Math.round(zoom * 100)}%</span>
      <Tooltip content="Zoom in">
        <Button variant="ghost" size="icon-sm" aria-label="Zoom in" disabled={zoomIdx === ZOOMS.length - 1} onClick={() => setZoomIdx((z) => z + 1)}>
          <ZoomIn />
        </Button>
      </Tooltip>
      <Tooltip content="Fit width">
        <Button variant="ghost" size="icon-sm" aria-label="Fit width" onClick={() => setZoomIdx(3)}>
          <Maximize2 />
        </Button>
      </Tooltip>
      <div className="mx-1 h-5 w-px bg-border" />
      <Tooltip content="Download original">
        <Button variant="ghost" size="icon-sm" aria-label="Download original" onClick={() => download(file.name, file)}>
          <Download />
        </Button>
      </Tooltip>
    </>
  );

  return ext === "pdf" ? (
    <PdfView file={file} page={page} onPageChange={onPageChange} zoom={zoom} zoomControls={zoomControls} highlights={highlights} activeHighlight={activeHighlight} />
  ) : (
    <DocxView file={file} zoom={zoom} zoomControls={zoomControls} />
  );
}

function PdfView({
  file,
  page,
  onPageChange,
  zoom,
  zoomControls,
  highlights,
  activeHighlight,
}: {
  file: File;
  page: number;
  onPageChange: (p: number) => void;
  zoom: number;
  zoomControls: ReactNode;
  highlights: Highlight[];
  activeHighlight?: string | null;
}) {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hostRef, width] = useWidth<HTMLDivElement>();
  const pageWidth = Math.max(240, (width - 48) * zoom);
  const fileObj = useMemo(() => file, [file]);
  const current = Math.min(Math.max(1, page), Math.max(1, numPages));
  const onPage = highlights.filter((h) => h.page === current);

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-xl border border-border bg-bg-subtle">
      <Toolbar>
        <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={current <= 1} onClick={() => onPageChange(current - 1)}>
          <ChevronLeft />
        </Button>
        <span className="tabular min-w-20 text-center text-xs text-fg-muted">
          Page {numPages ? current : "–"} of {numPages || "–"}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={!numPages || current >= numPages} onClick={() => onPageChange(current + 1)}>
          <ChevronRight />
        </Button>
        <div className="ml-auto flex items-center">{zoomControls}</div>
      </Toolbar>
      <div ref={hostRef} className="relative flex-1 overflow-auto p-6">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-fg-muted">{error}</div>
        ) : (
          <Document
            file={fileObj}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setError("This PDF could not be rendered for preview.")}
            loading={<Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-[600px]" />}
            className="flex justify-center"
          >
            {width > 0 && (
              <div className="relative shadow-lg">
                <Page pageNumber={current} width={pageWidth} renderAnnotationLayer renderTextLayer loading={<Skeleton className="aspect-[1/1.414]" />} />
                {onPage.map((h) => (
                  <div
                    key={h.id}
                    title={h.label}
                    className={
                      "pointer-events-none absolute rounded-sm border-2 transition " +
                      (h.tone === "danger" ? "border-danger bg-danger/10" : h.tone === "warning" ? "border-warning bg-warning/10" : "border-info bg-info/10") +
                      (activeHighlight === h.id ? " ring-4 ring-primary/30" : activeHighlight ? " opacity-40" : "")
                    }
                    style={{
                      left: `${h.region.x * 100}%`,
                      top: `${h.region.y * 100}%`,
                      width: `${h.region.width * 100}%`,
                      height: `${h.region.height * 100}%`,
                    }}
                  />
                ))}
              </div>
            )}
          </Document>
        )}
      </div>
    </div>
  );
}

function DocxView({ file, zoom, zoomControls }: { file: File; zoom: number; zoomControls: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !host.current) return;
        host.current.innerHTML = "";
        await renderAsync(await file.arrayBuffer(), host.current, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
        });
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-xl border border-border bg-bg-subtle">
      <Toolbar>
        <span className="px-2 text-xs text-fg-muted">DOCX · approximate layout</span>
        <div className="ml-auto flex items-center">{zoomControls}</div>
      </Toolbar>
      <div className="relative flex-1 overflow-auto p-6">
        {state === "loading" && <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-[600px]" />}
        {state === "error" && <div className="py-20 text-center text-sm text-fg-muted">This DOCX could not be rendered for preview.</div>}
        <div
          ref={host}
          className="docx-host origin-top text-black"
          style={{ transform: `scale(${zoom})`, display: state === "error" ? "none" : undefined }}
        />
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-fg-subtle">
        DOCX is rendered in the browser and may differ slightly from Word. Export to PDF for an exact preview.
      </p>
    </div>
  );
}
