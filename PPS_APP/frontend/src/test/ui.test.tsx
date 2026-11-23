import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { ResultView } from "@/components/ats/result-view";
import { TooltipProvider } from "@/components/ui/overlays";
import { demoResult } from "@/services/scanner";

beforeAll(() => {
  // jsdom lacks these browser APIs used by motion / radix.
  window.matchMedia ??= ((q: string) => ({
    matches: false, media: q, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const renderView = (scenario: Parameters<typeof demoResult>[0]) =>
  render(
    <MemoryRouter>
      <TooltipProvider>
        <ResultView result={demoResult(scenario)} />
      </TooltipProvider>
    </MemoryRouter>,
  );

describe("ResultView", () => {
  it("shows separate ATS and CA1 scores with a demo notice", () => {
    renderView("valid_resume");
    expect(screen.getByText(/Demo result — sample data/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /ATS compatibility: 72 out of 100/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Faculty CA1: 19.5 out of 30/ })).toBeInTheDocument();
    expect(screen.getByText(/never added together/)).toBeInTheDocument();
    expect(screen.getByText("Provisional")).toBeInTheDocument();
  });

  it("shows a rejection state and no scores for a grade card", () => {
    renderView("grade_card");
    expect(screen.getByText(/can’t be evaluated as a resume/)).toBeInTheDocument();
    expect(screen.getByText(/Grade card \/ marksheet/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /out of 100/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Faculty CA1")).not.toBeInTheDocument();
  });
});
