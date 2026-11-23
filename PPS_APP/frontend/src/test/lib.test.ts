import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { DEMO_PAYLOADS, type DemoScenario } from "@/data/demo";
import { compareScans } from "@/lib/compare";
import { checkFile } from "@/lib/file-checks";
import { ContractError, parseScanResult } from "@/lib/parse";
import { detailedJson, feedbackMarkdown } from "@/lib/report";
import { createDemoScanner, createHttpScanner, demoResult, ScannerError } from "@/services/scanner";
import { hasScores } from "@/types/scan";

const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;
const PDF = enc("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

async function docx(withBody = true) {
  const zip = new JSZip();
  zip.file(withBody ? "word/document.xml" : "other.xml", "<w:document/>");
  return zip.generateAsync({ type: "arraybuffer" });
}

describe("file checks", () => {
  it("accepts a valid PDF and DOCX", async () => {
    expect((await checkFile("cv.pdf", PDF)).ok).toBe(true);
    expect((await checkFile("cv.docx", await docx())).ok).toBe(true);
  });

  it.each([
    ["cv.pdf", enc(""), "empty"],
    ["cv.pdf", enc("hello"), "not a valid PDF"],
    ["cv.txt", enc("hello"), "Unsupported"],
    ["cv.docx", enc("not a zip"), "not a valid Word"],
  ])("rejects %s with %s", async (name, data, fragment) => {
    const c = await checkFile(name, data);
    expect(c.ok).toBe(false);
    expect(c.errors.join(" ")).toContain(fragment);
  });

  it("rejects oversized files and DOCX without a body", async () => {
    expect((await checkFile("cv.pdf", new ArrayBuffer(6 * 1024 * 1024))).errors.join()).toContain("limit is 5 MB");
    expect((await checkFile("cv.docx", await docx(false))).ok).toBe(false);
  });

  it("warns on a truncated PDF", async () => {
    const c = await checkFile("cv.pdf", enc("%PDF-1.4 no end marker"));
    expect(c.ok).toBe(true);
    expect(c.warnings.join()).toContain("truncated");
  });
});

describe("contract parsing", () => {
  it.each(Object.keys(DEMO_PAYLOADS) as DemoScenario[])("demo payload %s matches the contract", (s) => {
    const r = parseScanResult(DEMO_PAYLOADS[s], "demo");
    expect(r.source).toBe("demo");
    if (r.validation.is_resume) {
      expect(hasScores(r)).toBe(true);
      expect(r.ats!.score).toBeLessThanOrEqual(100);
      expect(r.ca1!.total).toBeLessThanOrEqual(30);
      expect(r.ca1!.rubric.reduce((a, i) => a + i.score, 0)).toBe(r.ca1!.total);
    } else {
      expect(hasScores(r)).toBe(false);
    }
  });

  it("rejects an ATS-sized number in the CA1 slot", () => {
    const bad = structuredClone(DEMO_PAYLOADS.valid_resume) as { ca1: { total: number } };
    bad.ca1.total = 76;
    expect(() => parseScanResult(bad, "live")).toThrow(ContractError);
  });

  it("rejects unknown status and severity", () => {
    expect(() => parseScanResult({ ...DEMO_PAYLOADS.valid_resume, status: "done" }, "live")).toThrow(ContractError);
    const bad = structuredClone(DEMO_PAYLOADS.valid_resume) as { findings: { severity: string }[] };
    bad.findings[0].severity = "major";
    expect(() => parseScanResult(bad, "live")).toThrow(ContractError);
  });
});

describe("scanner clients", () => {
  it("demo client labels results and never uses the uploaded file name", async () => {
    const r = await createDemoScanner(0).scan({ file: new File(["x"], "my_cv.pdf"), demoScenario: "grade_card" });
    expect(r.source).toBe("demo");
    expect(r.file.name).not.toBe("my_cv.pdf");
    expect(hasScores(r)).toBe(false);
  });

  it("http client posts multipart and parses a live result", async () => {
    let url = "";
    let body: FormData | undefined;
    globalThis.fetch = (async (u: string, init: RequestInit) => {
      url = u;
      body = init.body as FormData;
      return new Response(JSON.stringify(DEMO_PAYLOADS.valid_resume), { status: 200 });
    }) as typeof fetch;
    const r = await createHttpScanner("http://scanner.test/").scan({ file: new File(["%PDF-"], "cv.pdf"), targetJd: "JD" });
    expect(url).toBe("http://scanner.test/api/v1/scans");
    expect(body?.get("target_jd")).toBe("JD");
    expect(r.source).toBe("live");
  });

  it.each([
    [413, {}, "larger"],
    [415, {}, "file type"],
    [422, { detail: "Bad resume" }, "Bad resume"],
    [500, null, "HTTP 500"],
    [200, { nope: true }, "could not read"],
  ])("http %s maps to a friendly error", async (status, payload, fragment) => {
    globalThis.fetch = (async () =>
      new Response(payload === null ? "oops" : JSON.stringify(payload), { status })) as unknown as typeof fetch;
    await expect(createHttpScanner("http://scanner.test").scan({ file: new File(["x"], "cv.pdf") })).rejects.toThrow(fragment);
  });

  it("network failure becomes a ScannerError", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
    await expect(createHttpScanner("http://scanner.test").scan({ file: new File(["x"], "cv.pdf") })).rejects.toBeInstanceOf(ScannerError);
  });
});

describe("compare", () => {
  it("reports score deltas and resolved / new findings", () => {
    const before = demoResult("earlier_draft");
    const after = demoResult("valid_resume");
    const c = compareScans(before, after);
    expect(c.ats).toEqual({ before: 54, after: 72, delta: 18 });
    expect(c.ca1.delta).toBe(5.5);
    expect(c.resolved.map((f) => f.id)).toEqual(expect.arrayContaining(["two-pages", "table-layout"]));
    expect(c.introduced.map((f) => f.id)).toEqual(["cert-heading"]);
    expect(c.categories.find((x) => x.key === "formatting")?.change).toBe("improved");
  });

  it("gives no score delta when a side has no scores", () => {
    const c = compareScans(demoResult("grade_card"), demoResult("valid_resume"));
    expect(c.ats.delta).toBeNull();
  });
});

describe("report exports", () => {
  it("stamps demo data and never prints scores for invalid documents", () => {
    const md = feedbackMarkdown(demoResult("valid_resume"));
    expect(md).toContain("DEMO DATA");
    expect(md).toContain("72 / 100");
    expect(md).toContain("19.5 / 30");
    expect(JSON.parse(detailedJson(demoResult("valid_resume")))._notice).toMatch(/^DEMO DATA/);

    const invalid = parseScanResult(DEMO_PAYLOADS.grade_card, "live");
    const md2 = feedbackMarkdown(invalid);
    expect(md2).not.toMatch(/\/ (100|30)/);
    expect(md2).not.toContain("DEMO DATA");
  });
});
