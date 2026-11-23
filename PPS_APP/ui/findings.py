"""Findings explorer: filters, grouped expandable findings."""

from __future__ import annotations

from collections import Counter

import streamlit as st

from services.models import Finding

SEVERITY_META = {
    "critical": ("Critical", ":material/error:", "red"),
    "warning": ("Warning", ":material/warning:", "orange"),
    "suggestion": ("Suggestion", ":material/lightbulb:", "blue"),
    "info": ("Passed / info", ":material/check_circle:", "green"),
}
FILTERS = ["all", "critical", "warning", "suggestion", "info"]


def location_label(f: Finding) -> str | None:
    if not f.location:
        return None
    parts = []
    if f.location.page:
        parts.append(f"Page {f.location.page}")
    if f.location.section:
        parts.append(f.location.section)
    return " · ".join(parts) or None


def render_finding(f: Finding, *, expanded: bool = False) -> None:
    label, icon, color = SEVERITY_META.get(f.severity, SEVERITY_META["info"])
    with st.expander(f.title, icon=icon, expanded=expanded):
        with st.container(horizontal=True, gap="small"):
            st.badge(label, color=color)
            st.badge(f.category, color="gray", icon=":material/category:")
            loc = location_label(f)
            if loc:
                st.badge(loc, color="gray", icon=":material/location_on:")
            if f.resolved:
                st.badge("Resolved", color="green", icon=":material/done_all:")
        st.markdown(f.explanation)
        if f.evidence:
            st.caption("Detected text")
            st.code(f.evidence, language=None, wrap_lines=True)
        if f.why_it_matters:
            st.markdown(f"**Why it matters** — {f.why_it_matters}")
        if f.suggestion:
            st.success(f.suggestion, icon=":material/tips_and_updates:")


def render_findings_explorer(findings: list[Finding], *, key: str) -> None:
    if not findings:
        st.info("The scanner returned no detailed findings for this resume.", icon=":material/info:")
        return

    counts = Counter(f.severity for f in findings)
    options = [o for o in FILTERS if o == "all" or counts.get(o)]

    def fmt(option: str) -> str:
        if option == "all":
            return f"All ({len(findings)})"
        return f"{SEVERITY_META[option][0]} ({counts[option]})"

    with st.container(horizontal=True, vertical_alignment="bottom", gap="medium"):
        severity = st.segmented_control(
            "Severity", options, default="all", format_func=fmt, key=f"{key}_sev", required=True
        )
        categories = sorted({f.category for f in findings})
        chosen = st.multiselect(
            "Category", categories, placeholder="All categories", key=f"{key}_cat", width=280
        )

    shown = [
        f
        for f in findings
        if (severity == "all" or f.severity == severity) and (not chosen or f.category in chosen)
    ]
    if not shown:
        st.caption("No findings match these filters.")
        return

    order = ["critical", "warning", "suggestion", "info"]
    for sev in order:
        group = [f for f in shown if f.severity == sev]
        if not group:
            continue
        label, icon, _ = SEVERITY_META[sev]
        st.subheader(f"{label} · {len(group)}", icon=icon)
        for f in group:
            render_finding(f, expanded=(sev == "critical" and severity != "all"))
