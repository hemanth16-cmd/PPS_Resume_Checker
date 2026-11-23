/**
 * Centralized access to the resume scanner. Components never call fetch or
 * read demo fixtures directly — they use `scanner`.
 *
 * Live mode: set VITE_SCANNER_API_URL (see .env.example / API_INTEGRATION.md).
 * Demo mode: returns clearly labelled sample results; never claims to have
 * analysed the uploaded file.
 */
import { DEMO_PAYLOADS, type DemoScenario } from "@/data/demo";
import { ContractError, parseScanResult } from "@/lib/parse";
import { uid } from "@/lib/utils";
import type { ScanResult } from "@/types/scan";

export class ScannerError extends Error {}

export interface ScanRequest {
  file: File;
  targetJd?: string;
  /** Demo mode only: which sample response to return. */
  demoScenario?: DemoScenario;
  signal?: AbortSignal;
}

export interface ScannerClient {
  mode: "live" | "demo";
  baseUrl?: string;
  scan(req: ScanRequest): Promise<ScanResult>;
  fetchReport(url: string): Promise<Blob>;
}

const TIMEOUT_MS = 90_000;

export function createHttpScanner(baseUrl: string, apiKey?: string): ScannerClient {
  const root = baseUrl.replace(/\/+$/, "");
  const headers: HeadersInit = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  async function request(input: string, init: RequestInit): Promise<Response> {
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    try {
      return await fetch(input, { ...init, headers, signal });
    } catch (e) {
      if ((e as Error).name === "TimeoutError") throw new ScannerError("The scanner took too long to respond. Try again in a moment.");
      if ((e as Error).name === "AbortError") throw e;
      throw new ScannerError("Could not reach the scanner service. Check your connection and try again.");
    }
  }

  return {
    mode: "live",
    baseUrl: root,
    async scan({ file, targetJd = "", signal }) {
      const body = new FormData();
      body.append("file", file, file.name);
      body.append("target_jd", targetJd);
      const res = await request(`${root}/api/v1/scans`, { method: "POST", body, signal });
      if (res.status === 413) throw new ScannerError("The file is larger than the scanner accepts.");
      if (res.status === 415) throw new ScannerError("The scanner does not support this file type.");
      if (!res.ok) {
        let detail = "";
        try {
          detail = (await res.json())?.detail ?? "";
        } catch {
          /* non-JSON error body */
        }
        throw new ScannerError(typeof detail === "string" && detail ? detail : `The scanner returned an error (HTTP ${res.status}).`);
      }
      try {
        return parseScanResult(await res.json(), "live");
      } catch (e) {
        if (e instanceof ContractError) throw new ScannerError("The scanner returned a response the app could not read.");
        throw e;
      }
    },
    async fetchReport(url) {
      const res = await request(url.startsWith("http") ? url : `${root}${url}`, { method: "GET" });
      if (!res.ok) throw new ScannerError("The report could not be downloaded.");
      return res.blob();
    },
  };
}

/** Simulated latency so the processing state is visible. Clearly a demo — see UI labels. */
const DEMO_LATENCY_MS = 2200;

export function createDemoScanner(latency = DEMO_LATENCY_MS): ScannerClient {
  return {
    mode: "demo",
    async scan({ demoScenario = "valid_resume", signal }) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, latency);
        signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
      const payload = DEMO_PAYLOADS[demoScenario];
      if (!payload) throw new ScannerError(`Unknown demo scenario: ${demoScenario}`);
      return parseScanResult({ ...payload, scan_id: uid((payload as { scan_id: string }).scan_id) }, "demo");
    },
    async fetchReport() {
      throw new ScannerError("Reports are not available in demo mode.");
    },
  };
}

/** Build a demo result synchronously (for faculty queue, batch samples, seeding). */
export function demoResult(scenario: DemoScenario, overrides: { scanId?: string; fileName?: string; analysedAt?: string } = {}): ScanResult {
  const payload = DEMO_PAYLOADS[scenario] as { scan_id: string; file: object };
  return parseScanResult(
    {
      ...payload,
      scan_id: overrides.scanId ?? uid(payload.scan_id),
      ...(overrides.analysedAt ? { analysed_at: overrides.analysedAt } : {}),
      file: { ...payload.file, ...(overrides.fileName ? { name: overrides.fileName } : {}) },
    },
    "demo",
  );
}

const apiUrl = import.meta.env.VITE_SCANNER_API_URL as string | undefined;
const apiKey = import.meta.env.VITE_SCANNER_API_KEY as string | undefined;

export const scanner: ScannerClient = apiUrl ? createHttpScanner(apiUrl, apiKey) : createDemoScanner();
