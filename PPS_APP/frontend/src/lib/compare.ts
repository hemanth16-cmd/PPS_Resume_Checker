import { hasScores, type Finding, type ScanResult } from "@/types/scan";

export interface ScoreDelta {
  before: number | null;
  after: number | null;
  delta: number | null;
}

export interface Comparison {
  ats: ScoreDelta;
  ca1: ScoreDelta;
  categories: { key: string; label: string; before?: string; after?: string; change: "improved" | "regressed" | "same" | "new" | "removed" }[];
  resolved: Finding[];
  introduced: Finding[];
  persisting: Finding[];
}

const STATUS_RANK: Record<string, number> = { fail: 0, warn: 1, info: 2, pass: 3 };

function delta(a: number | null | undefined, b: number | null | undefined): ScoreDelta {
  const before = a ?? null;
  const after = b ?? null;
  return { before, after, delta: before !== null && after !== null ? Math.round((after - before) * 10) / 10 : null };
}

/** Findings are matched by id first, then by title (scanners may re-number ids). */
const key = (f: Finding) => f.title.trim().toLowerCase();

export function compareScans(before: ScanResult, after: ScanResult): Comparison {
  const open = (r: ScanResult) => r.findings.filter((f) => f.severity !== "info" && !f.resolved);
  const b = open(before);
  const a = open(after);
  const inA = (f: Finding) => a.some((x) => x.id === f.id || key(x) === key(f));
  const inB = (f: Finding) => b.some((x) => x.id === f.id || key(x) === key(f));

  const labels = new Map<string, string>();
  [...before.categories, ...after.categories].forEach((c) => labels.set(c.key, c.label));
  const categories = [...labels.entries()].map(([k, label]) => {
    const bs = before.categories.find((c) => c.key === k)?.status;
    const as = after.categories.find((c) => c.key === k)?.status;
    let change: Comparison["categories"][number]["change"] = "same";
    if (!bs) change = "new";
    else if (!as) change = "removed";
    else if (STATUS_RANK[as] > STATUS_RANK[bs]) change = "improved";
    else if (STATUS_RANK[as] < STATUS_RANK[bs]) change = "regressed";
    return { key: k, label, before: bs, after: as, change };
  });

  return {
    ats: delta(hasScores(before) ? before.ats?.score : null, hasScores(after) ? after.ats?.score : null),
    ca1: delta(hasScores(before) ? before.ca1?.total : null, hasScores(after) ? after.ca1?.total : null),
    categories,
    resolved: b.filter((f) => !inA(f)),
    introduced: a.filter((f) => !inB(f)),
    persisting: a.filter((f) => inB(f)),
  };
}
