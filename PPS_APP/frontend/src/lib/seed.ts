import { demoResult } from "@/services/scanner";
import type { ScanRecord } from "@/types/scan";
import { uid } from "./utils";

/** Two clearly labelled demo scans (an earlier draft and a later one) for trying History and Compare. */
export function sampleScans(): ScanRecord[] {
  const earlier = new Date(Date.now() - 5 * 86400000).toISOString();
  const later = new Date(Date.now() - 3600000).toISOString();
  return [
    { id: uid("scan"), createdAt: later, result: demoResult("valid_resume", { analysedAt: later }), doneItems: [] },
    { id: uid("scan"), createdAt: earlier, result: demoResult("earlier_draft", { analysedAt: earlier }), doneItems: [] },
  ];
}
