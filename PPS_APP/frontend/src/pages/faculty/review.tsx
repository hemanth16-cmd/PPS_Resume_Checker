import { ArrowLeft, BadgeCheck, ClipboardCheck, Hourglass, MessageSquareText, Save, Search, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ResultMeta, ResultView } from "@/components/ats/result-view";
import { DemoBanner, EmptyState, Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { Badge, Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { useStore, type FacultyReview } from "@/lib/store";
import { cn } from "@/lib/utils";
import { listSubmissions, STATUS_TONE, statusOf, type ReviewStatus, type Submission } from "@/services/faculty";
import { hasScores } from "@/types/scan";

const DECISIONS: { id: FacultyReview["decision"]; label: string; needsScore?: boolean }[] = [
  { id: "approve", label: "Approve CA1 mark", needsScore: true },
  { id: "request_changes", label: "Request changes" },
  { id: "needs_resubmission", label: "Needs resubmission" },
];

function Queue({ subs, activeId, onPick }: { subs: Submission[]; activeId?: string; onPick: (id: string) => void }) {
  const { reviews } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const statuses = useMemo(() => [...new Set(subs.map((s) => statusOf(s, reviews)))], [subs, reviews]);
  const rows = subs.filter(
    (s) =>
      (s.student.toLowerCase().includes(q.toLowerCase()) || s.roll.toLowerCase().includes(q.toLowerCase())) &&
      (status === "all" || statusOf(s, reviews) === status),
  );
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-2 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or roll number" className="pl-9" aria-label="Search students" />
        </div>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ReviewStatus | "all")}
          className="h-9 rounded-md border border-border bg-surface px-2.5 text-[13px] shadow-xs outline-none"
        >
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
        {rows.length === 0 && <li className="p-6 text-center text-[13px] text-fg-muted">No students match.</li>}
        {rows.map((s) => {
          const st = statusOf(s, reviews);
          return (
            <li key={s.id}>
              <button
                onClick={() => onPick(s.id)}
                className={cn("flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-surface-2", activeId === s.id && "bg-primary-soft/50")}
                aria-current={activeId === s.id}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.student}</span>
                  <span className="block text-xs text-fg-subtle">{s.roll}</span>
                </span>
                <Badge tone={STATUS_TONE[st]}>{st}</Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ReviewForm({ sub }: { sub: Submission }) {
  const { reviews, saveReview, user } = useStore();
  const saved = reviews[sub.id];
  const r = sub.result!;
  const scored = hasScores(r) && !!r.ca1;
  const [rubric, setRubric] = useState<Record<string, number>>(
    () => saved?.rubric ?? Object.fromEntries((r.ca1?.rubric ?? []).map((i) => [i.criterion, i.score])),
  );
  const [comments, setComments] = useState(saved?.comments ?? "");
  const available = DECISIONS.filter((d) => scored || !d.needsScore);
  const [decision, setDecision] = useState<FacultyReview["decision"]>(saved?.decision ?? available[0].id);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = Math.round(Object.values(rubric).reduce((a, b) => a + b, 0) * 10) / 10;
  const provisional = r.ca1?.total ?? 0;

  const commit = () => {
    saveReview(sub.id, { decision, rubric, total: scored ? total : null, comments, reviewer: user.name, savedAt: new Date().toISOString() });
    toast.success("Review saved for this session", { description: "Not sent to a server — the review API isn’t connected." });
    setConfirm(false);
  };
  const submit = () => {
    if (decision !== "approve" && !comments.trim()) {
      setError("Add a comment so the student knows what to change.");
      return;
    }
    setError(null);
    if (decision === "approve") setConfirm(true);
    else commit();
  };

  return (
    <div className="grid gap-5">
      {saved && (
        <div className="flex items-center gap-2.5 rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-[13px]">
          <BadgeCheck className="size-4 text-success" />
          <span><span className="font-semibold">{statusOf(sub, reviews)}</span> — saved by {saved.reviewer} in this session only.</span>
        </div>
      )}

      {scored ? (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">CA1 rubric</div>
              <p className="text-[13px] text-fg-muted">Adjust any criterion to override the provisional mark.</p>
            </div>
            <div className="text-right">
              <div className="tabular text-2xl font-semibold">{total}<span className="text-sm font-normal text-fg-subtle">/{r.ca1!.max_score}</span></div>
              <div className={cn("text-xs", total === provisional ? "text-fg-subtle" : "text-primary")}>
                {total === provisional ? "Matches provisional" : `${total > provisional ? "+" : ""}${Math.round((total - provisional) * 10) / 10} vs provisional`}
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {r.ca1!.rubric.map((item) => {
              const v = rubric[item.criterion] ?? item.score;
              const changed = v !== item.score;
              return (
                <div key={item.criterion} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <Label htmlFor={`rub-${item.criterion}`}>{item.criterion}</Label>
                    <div className="text-xs text-fg-subtle">
                      Provisional {item.score}/{item.max_score}
                      {changed && <span className="ml-1.5 text-primary">· overridden</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id={`rub-${item.criterion}`}
                      type="number"
                      min={0}
                      max={item.max_score}
                      step={0.5}
                      value={v}
                      onChange={(e) => {
                        const n = Math.max(0, Math.min(item.max_score, Number(e.target.value) || 0));
                        setRubric((x) => ({ ...x, [item.criterion]: n }));
                      }}
                      className="tabular h-8 w-20 text-right"
                    />
                    <span className="text-xs text-fg-subtle">/{item.max_score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-5 text-sm text-fg-muted">
          <span className="font-medium text-fg">No CA1 mark to grade.</span> The scanner rejected this document as not a resume.
        </Card>
      )}

      <Card className="grid gap-4 p-5">
        <div>
          <Label htmlFor="comments">Comments to the student</Label>
          <Textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Constructive feedback the student will see with their results." className="mt-1.5" />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-medium">Decision</div>
          <div role="radiogroup" aria-label="Decision" className="flex flex-wrap gap-2">
            {available.map((d) => (
              <button
                key={d.id}
                role="radio"
                aria-checked={decision === d.id}
                onClick={() => setDecision(d.id)}
                className={cn(
                  "h-9 rounded-md border px-3 text-[13px] font-medium transition",
                  decision === d.id ? "border-primary bg-primary-soft text-primary-soft-fg" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={submit}><Save /> Save review</Button>
          <span className="text-xs text-fg-subtle">Saved in this tab only until the review API is connected.</span>
        </div>
      </Card>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          title="Approve CA1 mark?"
          description={`Approve ${total} / ${r.ca1?.max_score ?? 30} for ${sub.student}. In production this finalises the CA1 mark.`}
        >
          <p className="mt-3 text-xs text-fg-subtle">Prototype: this is stored in this browser tab only.</p>
          <div className="mt-6 flex justify-end gap-2">
            <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
            <Button onClick={commit}><BadgeCheck /> Approve</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FacultyReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const subs = listSubmissions();
  const active = subs.find((s) => s.id === id);

  return (
    <Page className="max-w-[1320px]">
      <PageHeader eyebrow="Faculty" title="Review desk" description="Check each scan, confirm or adjust the provisional CA1 mark, and leave feedback." />
      <DemoBanner>
        <span className="font-semibold">Sample queue.</span> Submissions are demo data, and saved reviews are not sent anywhere — they last for this browser tab.
      </DemoBanner>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className={cn(active && "hidden lg:block")}>
          <Queue subs={subs} activeId={active?.id} onPick={(sid) => navigate(`/faculty/review/${sid}`)} />
        </div>

        <div className={cn("min-w-0", !active && "hidden lg:block")}>
          {!active ? (
            <EmptyState icon={<ClipboardCheck />} title="Select a submission" description="Pick a student from the queue to see their evaluation and review it." />
          ) : (
            <div key={active.id}>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" className="lg:hidden" asChild>
                  <Link to="/faculty/review"><ArrowLeft /> Queue</Link>
                </Button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold">{active.student}</h2>
                  <p className="text-[13px] text-fg-muted">{active.roll} · {active.batch}</p>
                </div>
              </div>

              {!active.result ? (
                <EmptyState icon={<UserX />} title="Not submitted yet" description={`${active.student} hasn’t uploaded a resume, so there’s nothing to review.`} />
              ) : (
                <>
                  <div className="mb-5"><ResultMeta result={active.result} /></div>
                  <Tabs defaultValue="review">
                    <TabsList>
                      <TabsTrigger value="review"><MessageSquareText /> Faculty review</TabsTrigger>
                      <TabsTrigger value="eval"><Hourglass /> Evaluation</TabsTrigger>
                    </TabsList>
                    <div className="pt-6">
                      <TabsContent value="review"><ReviewForm sub={active} /></TabsContent>
                      <TabsContent value="eval"><ResultView result={active.result} retryTo={null} /></TabsContent>
                    </div>
                  </Tabs>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
