import { Braces, FileDown, FileText, Loader2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { detailedJson, download, feedbackMarkdown } from "@/lib/report";
import { scanner, ScannerError } from "@/services/scanner";
import { isDemo, type ScanResult } from "@/types/scan";

function Row({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-fg-muted">
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-[13px] text-fg-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Reports({ result }: { result: ScanResult }) {
  const stem = result.file.name.replace(/\.[^.]+$/, "");
  const annotated = result.reports.find((r) => r.kind === "annotated_pdf");
  const canAnnotated = !!annotated?.available && !!annotated.url && !isDemo(result);
  const [busy, setBusy] = useState(false);

  const getAnnotated = async () => {
    setBusy(true);
    try {
      download(`${stem}_annotated.pdf`, await scanner.fetchReport(annotated!.url!));
      toast.success("Annotated PDF downloaded");
    } catch (e) {
      toast.error(e instanceof ScannerError ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Card className="divide-y divide-border">
        <Row icon={FileText} title="Feedback summary" description="Scores and prioritised findings as a readable Markdown document.">
          <Button
            variant="secondary"
            onClick={() => {
              download(`${stem}_feedback.md`, feedbackMarkdown(result), "text/markdown");
              toast.success("Feedback summary downloaded");
            }}
          >
            <FileDown /> Download
          </Button>
        </Row>
        <Row icon={Braces} title="Detailed analysis" description="The full scan result as JSON, including every finding and rubric line.">
          <Button
            variant="secondary"
            onClick={() => {
              download(`${stem}_analysis.json`, detailedJson(result), "application/json");
              toast.success("Detailed report downloaded");
            }}
          >
            <FileDown /> Download
          </Button>
        </Row>
        <Row
          icon={FileDown}
          title="Annotated PDF"
          description={canAnnotated ? "Your resume with issues marked by the scanner." : "Available when the scanner returns an annotated document."}
        >
          {canAnnotated ? (
            <Button variant="secondary" onClick={getAnnotated} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <FileDown />} Download
            </Button>
          ) : (
            <Badge>Not available</Badge>
          )}
        </Row>
      </Card>
      <p className="mt-3 text-xs text-fg-subtle">
        Exports contain only what the scanner returned.{isDemo(result) && " Demo exports are stamped as sample data."}
      </p>
    </div>
  );
}
