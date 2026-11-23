import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleCheck,
  Circle,
  FileX2,
  FlaskConical,
  GitCompareArrows,
  History,
  LineChart,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { atsBand, SEVERITY } from "@/components/ats/meta";
import { ScoreRing } from "@/components/ats/score-ring";
import type { TrendPoint } from "@/components/dashboard/trend-chart";
import { Page, Reveal } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardHeader, Progress, Skeleton } from "@/components/ui/primitives";
import { DEMO_COURSE } from "@/data/demo";
import { useStore } from "@/lib/store";
import { cn, formatDate, greeting, relativeTime } from "@/lib/utils";
import { hasScores, isDemo } from "@/types/scan";

const TrendChart = lazy(() => import("@/components/dashboard/trend-chart"));

const SAMPLE_TREND: TrendPoint[] = [
  { label: "Draft 1", ats: 48 },
  { label: "Draft 2", ats: 54 },
  { label: "Draft 3", ats: 63 },
  { label: "Draft 4", ats: 72 },
];

export default function Dashboard() {
  const { user, scans } = useStore();
  const [showSample, setShowSample] = useState(false);
  const latestScored = scans.find((s) => hasScores(s.result));
  const trend: TrendPoint[] = scans
    .filter((s) => hasScores(s.result) && s.result.ats)
    .slice(0, 8)
    .reverse()
    .map((s) => ({ label: formatDate(s.createdAt, { day: "numeric", month: "short" }), ats: s.result.ats!.score }));
  const trendData = trend.length >= 2 ? trend : showSample ? SAMPLE_TREND : null;

  return (
    <Page>
      {/* Hero */}
      <Reveal>
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(110deg,black_30%,transparent_75%)]" />
          <div className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-3xl" />
          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-fg-muted backdrop-blur">
                <span className="size-1.5 rounded-full bg-success" /> {DEMO_COURSE.module}
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-[1.1] sm:text-[42px]">
                {greeting()}, {user.name.split(" ")[0]}.
                <span className="mt-1 block text-fg-muted">Let’s get your resume placement-ready.</span>
              </h1>
              <p className="mt-4 max-w-lg text-[15px] leading-6 text-fg-muted">
                Scan your resume for ATS compatibility, a provisional faculty CA1 mark and a clear list of what to fix — before your CA1 review.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/scan"><ScanSearch /> Scan your resume</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/methodology">How it works</Link>
                </Button>
              </div>
            </div>

            {/* Latest result */}
            <div className="rounded-xl border border-border bg-surface/80 p-5 shadow-sm backdrop-blur">
              {latestScored?.result.ats ? (
                <Link to={`/scan/${latestScored.id}`} className="group block">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">Latest analysis</span>
                    <ArrowUpRight className="size-4 text-fg-subtle transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                  </div>
                  <div className="mt-4 flex items-center gap-5">
                    <ScoreRing value={latestScored.result.ats.score} max={100} size={104} stroke={9} color={atsBand(latestScored.result.ats.score).color} label="Latest ATS score" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">ATS compatibility</div>
                      <Badge tone={atsBand(latestScored.result.ats.score).tone} className="mt-1.5">{atsBand(latestScored.result.ats.score).label}</Badge>
                      {latestScored.result.ca1 && (
                        <div className="mt-3 text-[13px] text-fg-muted">
                          CA1 <span className="tabular font-medium text-fg">{latestScored.result.ca1.total}/{latestScored.result.ca1.max_score}</span>{" "}
                          · {latestScored.result.ca1.status === "provisional" ? "provisional" : "reviewed"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-fg-subtle">
                    <span className="truncate">{latestScored.result.file.name}</span>
                    {isDemo(latestScored.result) && <Badge tone="demo"><FlaskConical /> Demo</Badge>}
                  </div>
                </Link>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="mb-4 flex size-[104px] items-center justify-center rounded-full border-[9px] border-dashed border-bg-subtle" aria-hidden>
                    <ScanSearch className="size-7 text-fg-subtle" strokeWidth={1.5} />
                  </div>
                  <div className="text-sm font-medium">No analysis yet</div>
                  <p className="mt-1 text-[13px] text-fg-muted">Your ATS and CA1 results will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Trend */}
        <Reveal delay={0.05} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader
              icon={<LineChart />}
              title="ATS score over time"
              description={trend.length >= 2 ? "Your scans saved in this browser." : "Run two or more scans to see your progress."}
              action={trendData === SAMPLE_TREND ? <Badge tone="demo"><FlaskConical /> Sample data</Badge> : undefined}
            />
            <div className="h-[220px] px-3 pb-4 pt-4">
              {trendData ? (
                <Suspense fallback={<Skeleton className="h-full" />}>
                  <TrendChart data={trendData} />
                </Suspense>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <p className="text-sm text-fg-muted">{trend.length === 1 ? "One scan so far — one more to draw a trend." : "No scored scans yet."}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" asChild><Link to="/scan">Scan a resume</Link></Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowSample(true)}>Preview with sample data</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Reveal>

        {/* Quick actions */}
        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader icon={<Sparkles />} title="Quick actions" />
            <div className="grid gap-1 p-3">
              {[
                { to: "/scan", icon: ScanSearch, label: "Scan a resume", hint: "PDF or DOCX" },
                { to: "/history", icon: History, label: "Scan history", hint: `${scans.length} saved` },
                { to: "/compare", icon: GitCompareArrows, label: "Compare two scans", hint: "Track improvements" },
                { to: "/methodology", icon: BookOpen, label: "How evaluation works", hint: "ATS vs CA1" },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="group flex items-center gap-3 rounded-lg p-2.5 transition hover:bg-surface-2">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted transition group-hover:border-primary/30 group-hover:text-primary">
                    <a.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{a.label}</span>
                    <span className="block text-xs text-fg-subtle">{a.hint}</span>
                  </span>
                  <ArrowRight className="size-4 text-fg-subtle opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Recent activity */}
        <Reveal delay={0.12} className="lg:col-span-2">
          <Card>
            <CardHeader
              icon={<History />}
              title="Recent activity"
              action={scans.length > 0 ? <Button variant="ghost" size="sm" asChild><Link to="/history">View all</Link></Button> : undefined}
            />
            <div className="p-3">
              {scans.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-fg-muted">Nothing yet. Your scans will appear here.</p>
              ) : (
                <ul>
                  {scans.slice(0, 4).map((s) => {
                    const r = s.result;
                    const crit = r.findings.filter((f) => f.severity === "critical").length;
                    return (
                      <li key={s.id}>
                        <Link to={`/scan/${s.id}`} className="flex items-center gap-3 rounded-lg p-2.5 transition hover:bg-surface-2">
                          <span className={cn("flex size-9 items-center justify-center rounded-lg", hasScores(r) ? "bg-primary-soft text-primary-soft-fg" : "bg-danger-soft text-danger")}>
                            {hasScores(r) ? <ScanSearch className="size-4" /> : <FileX2 className="size-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{r.file.name}</span>
                            <span className="block text-xs text-fg-subtle">{relativeTime(s.createdAt)}</span>
                          </span>
                          {hasScores(r) && r.ats ? (
                            <span className="flex items-center gap-2">
                              {crit > 0 && <Badge tone="danger"><SEVERITY.critical.icon /> {crit}</Badge>}
                              <span className="tabular text-sm font-semibold">{r.ats.score}</span>
                            </span>
                          ) : (
                            <Badge tone="danger">Not a resume</Badge>
                          )}
                          {isDemo(r) && <Badge tone="demo" className="hidden sm:inline-flex">Demo</Badge>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </Reveal>

        {/* Prep progress */}
        <Reveal delay={0.15}>
          <Card className="h-full">
            <CardHeader icon={<CalendarDays />} title="Preparation" action={<Badge tone="demo">Sample</Badge>} />
            <div className="p-5 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-fg-muted">Module progress</span>
                <span className="tabular text-sm font-semibold">{DEMO_COURSE.completion}%</span>
              </div>
              <Progress value={DEMO_COURSE.completion} className="mt-2" label="Module progress" />
              <ul className="mt-4 grid gap-2.5">
                {DEMO_COURSE.weeks.map((w) => (
                  <li key={w.week} className="flex items-center gap-2.5 text-[13px]">
                    {w.done ? <CircleCheck className="size-4 text-success" /> : <Circle className="size-4 text-fg-subtle" />}
                    <span className="tabular w-6 text-fg-subtle">{w.week}</span>
                    <span className={w.done ? "text-fg-muted line-through decoration-fg-subtle/50" : "text-fg"}>{w.label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border pt-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-fg-subtle">This week</div>
                <ul className="grid gap-2">
                  {DEMO_COURSE.upcoming.map((u) => (
                    <li key={u.title} className="flex items-center gap-3 text-[13px]">
                      <span className="w-9 rounded-md bg-bg-subtle py-1 text-center text-[11px] font-medium text-fg-muted">{u.date}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{u.title}</span>
                        <span className="block text-xs text-fg-subtle">{u.where}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Guidance */}
        <Reveal delay={0.18} className="lg:col-span-3">
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Lead with action", d: "Start each bullet with a strong verb — built, led, reduced." },
              { t: "Show the outcome", d: "Quantify impact where you honestly can: users, accuracy, time saved." },
              { t: "One page, one column", d: "Simple layouts are read reliably by both people and ATS software." },
              { t: "Links that work", d: "Every GitHub and LinkedIn URL should open the right page." },
            ].map((g, i) => (
              <div key={g.t} className="bg-surface p-5">
                <div className="tabular text-xs text-fg-subtle">0{i + 1}</div>
                <div className="mt-2 text-sm font-medium">{g.t}</div>
                <p className="mt-1 text-[13px] leading-5 text-fg-muted">{g.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-fg-subtle">General guidance — not scanner output.</p>
        </Reveal>
      </div>
    </Page>
  );
}
