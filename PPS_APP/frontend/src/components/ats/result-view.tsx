import { CircleCheck, Eye, FileText, Flag, FlaskConical, ListChecks, MessageSquareText, Radar, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/layout/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { Badge, Card } from "@/components/ui/primitives";
import { formatBytes, formatDate } from "@/lib/utils";
import { hasScores, isDemo, sortBySeverity, type ScanResult } from "@/types/scan";
import { CategoryGrid } from "./categories";
import { FindingsExplorer } from "./findings";
import { InvalidDocument } from "./invalid-document";
import { SEVERITY } from "./meta";
import { NextSteps } from "./next-steps";
import { PreviewPanel } from "./preview-panel";
import { Reports } from "./reports";
import { AtsCard, Ca1Card, SeparationNote } from "./score-cards";

export function ResultMeta({ result }: { result: ScanResult }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Badge><FileText /> {result.file.name}</Badge>
      {result.file.size_bytes > 0 && <Badge>{formatBytes(result.file.size_bytes)}</Badge>}
      {result.file.pages ? <Badge>{result.file.pages} page{result.file.pages > 1 ? "s" : ""}</Badge> : null}
      {result.analysed_at && <Badge>{formatDate(result.analysed_at)}</Badge>}
      {isDemo(result) ? (
        <Badge tone="demo"><FlaskConical /> Demo data</Badge>
      ) : (
        <Badge tone="success"><span className="size-1.5 rounded-full bg-success" /> Live result</Badge>
      )}
    </div>
  );
}

export function DemoResultNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3.5 text-[13px] leading-5">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
      <div>
        <span className="font-semibold">Demo result — sample data.</span> This is a sample scanner response used to preview the interface.
        It is not an analysis of any file you uploaded, and its scores are not real.
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={`flex size-8 items-center justify-center rounded-lg ${tone} [&_svg]:size-4`}>{icon}</span>
      <div>
        <div className="tabular text-lg font-semibold leading-none">{value}</div>
        <div className="mt-1 text-xs text-fg-muted">{label}</div>
      </div>
    </div>
  );
}

function Overview({ result }: { result: ScanResult }) {
  const strengths = result.findings.filter((f) => f.severity === "info");
  const top = sortBySeverity(result.findings.filter((f) => f.severity === "critical" || f.severity === "warning")).slice(0, 4);
  return (
    <div className="grid gap-8">
      {result.review_flags.map((flag) => (
        <div key={flag.code} className="flex items-start gap-3 rounded-lg border border-info/25 bg-info-soft px-4 py-3 text-[13px]">
          <Flag className="mt-0.5 size-4 shrink-0 text-info" />
          <div><span className="font-semibold">Faculty review flag.</span> {flag.message}</div>
        </div>
      ))}

      <section>
        <h3 className="mb-3 text-sm font-semibold">Category analysis</h3>
        <CategoryGrid categories={result.categories} />
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Top issues</h3>
          <Card className="divide-y divide-border">
            {top.length === 0 && <p className="p-4 text-sm text-fg-muted">No critical issues or warnings.</p>}
            {top.map((f) => {
              const m = SEVERITY[f.severity];
              return (
                <div key={f.id} className="flex gap-3 p-4">
                  <m.icon className={`mt-0.5 size-4 shrink-0 ${m.text}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{f.title}</div>
                    <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">{f.suggestion || f.explanation}</p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">What’s working</h3>
          <Card className="divide-y divide-border">
            {strengths.length === 0 && <p className="p-4 text-sm text-fg-muted">The scanner didn’t report specific strengths.</p>}
            {strengths.map((f) => (
              <div key={f.id} className="flex gap-3 p-4">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{f.title}</div>
                  <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">{f.explanation}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {result.sections_detected.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Sections detected</h3>
          <div className="flex flex-wrap gap-2">
            {result.sections_detected.map((s) => (
              <Badge key={s} className="px-2.5 py-1 text-[13px]">{s}</Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function ResultView({
  result,
  file,
  done = [],
  onToggleDone,
  retryTo = "/scan",
}: {
  result: ScanResult;
  file?: File;
  done?: string[];
  onToggleDone?: (findingId: string) => void;
  retryTo?: string | null;
}) {
  const demo = isDemo(result);

  if (result.status === "failed") {
    return (
      <Card className="p-6 text-sm">
        <div className="font-semibold text-danger">The scan failed</div>
        <p className="mt-1 text-fg-muted">{result.error ?? "The scanner could not process this file."}</p>
      </Card>
    );
  }

  if (!hasScores(result)) {
    return (
      <div className="grid gap-4">
        {demo && <DemoResultNotice />}
        <InvalidDocument result={result} retryTo={retryTo} />
      </div>
    );
  }

  const count = (s: keyof typeof SEVERITY) => result.findings.filter((f) => f.severity === s).length;

  return (
    // grid-cols-1 = minmax(0,1fr): lets the scrollable tab bar shrink instead of widening the page on phones.
    <div className="grid grid-cols-1 gap-6">
      {demo && <Reveal><DemoResultNotice /></Reveal>}

      <Reveal delay={0.05} className="grid gap-5 lg:grid-cols-2">
        {result.ats && <AtsCard ats={result.ats} />}
        {result.ca1 && <Ca1Card ca1={result.ca1} />}
      </Reveal>
      <SeparationNote />

      <Reveal delay={0.1}>
        <Card className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-border sm:[&>*:nth-child(-n+2)]:border-b-0">
          <Stat icon={<SEVERITY.critical.icon />} label="Critical" value={count("critical")} tone="bg-danger-soft text-danger" />
          <Stat icon={<SEVERITY.warning.icon />} label="Warnings" value={count("warning")} tone="bg-warning-soft text-warning" />
          <Stat icon={<SEVERITY.suggestion.icon />} label="Suggestions" value={count("suggestion")} tone="bg-info-soft text-info" />
          <Stat icon={<SEVERITY.info.icon />} label="Strengths" value={count("info")} tone="bg-success-soft text-success" />
        </Card>
      </Reveal>

      <Reveal delay={0.15} className="min-w-0">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview"><Radar /> Overview</TabsTrigger>
            <TabsTrigger value="feedback"><MessageSquareText /> Feedback <span className="text-fg-subtle">{result.findings.length}</span></TabsTrigger>
            <TabsTrigger value="preview"><Eye /> Resume preview</TabsTrigger>
            <TabsTrigger value="steps"><ListChecks /> Next steps</TabsTrigger>
            <TabsTrigger value="reports"><ScrollText /> Reports</TabsTrigger>
          </TabsList>
          <div className="pt-6">
            <TabsContent value="overview"><Overview result={result} /></TabsContent>
            <TabsContent value="feedback"><FindingsExplorer findings={result.findings} /></TabsContent>
            <TabsContent value="preview"><PreviewPanel result={result} file={file} /></TabsContent>
            <TabsContent value="steps">
              <NextSteps findings={result.findings} done={done} onToggle={onToggleDone} />
            </TabsContent>
            <TabsContent value="reports"><Reports result={result} /></TabsContent>
          </div>
        </Tabs>
      </Reveal>
    </div>
  );
}
