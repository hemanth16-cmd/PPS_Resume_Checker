import { ArrowRight, ClipboardCheck, Flag, Layers, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { atsBand } from "@/components/ats/meta";
import { DemoBanner, Page, PageHeader, Reveal } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { listSubmissions, STATUS_TONE, statusOf } from "@/services/faculty";
import { hasScores } from "@/types/scan";

export default function FacultyOverview() {
  const { user, reviews } = useStore();
  const subs = listSubmissions();
  const statuses = subs.map((s) => statusOf(s, reviews));
  const count = (st: string) => statuses.filter((x) => x === st).length;
  const flags = subs.flatMap((s) => (s.result?.review_flags ?? []).map((f) => ({ student: s.student, id: s.id, message: f.message })));

  const metrics = [
    { label: "Students", value: subs.length, hint: user.batch },
    { label: "Submitted", value: subs.filter((s) => s.result).length, hint: "resumes received" },
    { label: "Awaiting review", value: count("Pending review"), hint: "need a decision", accent: true },
    { label: "Invalid documents", value: subs.filter((s) => s.result && !hasScores(s.result)).length, hint: "rejected by scanner" },
  ];

  return (
    <Page>
      <PageHeader
        eyebrow={`Faculty · ${user.batch}`}
        title={`Welcome back, ${user.name.split(" ").slice(-1)[0]}`}
        description="CA1 resume review for your batch."
        actions={<Button asChild><Link to="/faculty/review"><ClipboardCheck /> Open review desk</Link></Button>}
      />
      <DemoBanner>
        <span className="font-semibold">Sample queue.</span> The submissions API isn’t connected, so these students and results are demo data.
        Reviews you save are kept for this browser tab only.
      </DemoBanner>

      <Reveal className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-surface p-5">
            <div className="text-[13px] text-fg-muted">{m.label}</div>
            <div className={cn("tabular mt-2 text-3xl font-semibold", m.accent && "text-primary")}>{m.value}</div>
            <div className="mt-1 text-xs text-fg-subtle">{m.hint}</div>
          </div>
        ))}
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal delay={0.05} className="lg:col-span-2">
          <Card>
            <CardHeader icon={<Users />} title="Submissions" description="Most recent first" />
            <ul className="mt-3 divide-y divide-border border-t border-border">
              {subs.map((s) => {
                const st = statusOf(s, reviews);
                const r = s.result;
                const rv = reviews[s.id];
                return (
                  <li key={s.id}>
                    <Link to={`/faculty/review/${s.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-xs font-semibold text-fg-muted">
                        {s.student.split(" ").map((p) => p[0]).join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:text-primary">{s.student}</span>
                        <span className="block text-xs text-fg-subtle">{s.roll}</span>
                      </span>
                      <span className="hidden w-20 text-right sm:block">
                        {r && hasScores(r) && r.ats ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <span className="size-2 rounded-full" style={{ background: atsBand(r.ats.score).color }} />
                            <span className="tabular font-semibold">{r.ats.score}</span>
                          </span>
                        ) : (
                          <span className="text-fg-subtle">—</span>
                        )}
                      </span>
                      <span className="tabular hidden w-16 text-right text-sm sm:block">
                        {rv?.total != null ? `${rv.total}/30` : r && hasScores(r) && r.ca1 ? `${r.ca1.total}/30` : <span className="text-fg-subtle">—</span>}
                      </span>
                      <Badge tone={STATUS_TONE[st]} className="w-[132px] justify-center">{st}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Reveal>

        <div className="grid content-start gap-5">
          <Reveal delay={0.1}>
            <Card>
              <CardHeader icon={<Flag />} title="Review flags" description="Raised by the scanner" />
              <ul className="grid gap-2 p-5 pt-4">
                {flags.length === 0 && <li className="text-sm text-fg-muted">No flags.</li>}
                {flags.map((f) => (
                  <li key={f.id + f.message}>
                    <Link to={`/faculty/review/${f.id}`} className="block rounded-lg border border-info/20 bg-info-soft p-3 text-[13px] transition hover:border-info/40">
                      <span className="font-medium">{f.student}</span>
                      <span className="mt-0.5 block text-fg-muted">{f.message}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
          <Reveal delay={0.12}>
            <Link to="/batch" className="group block">
              <Card className="flex items-center gap-4 p-5 transition group-hover:border-border-strong group-hover:shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg"><Layers className="size-5" /></span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">Batch scanner</span>
                  <span className="block text-xs text-fg-muted">Check many resumes at once</span>
                </span>
                <ArrowRight className="size-4 text-fg-subtle transition group-hover:translate-x-0.5" />
              </Card>
            </Link>
          </Reveal>
        </div>
      </div>
    </Page>
  );
}
