"""Rendering of a ScanResult — shared by the scanner, history and faculty pages."""

from __future__ import annotations

import logging

import streamlit as st

from services.file_checks import docx_text
from services.models import ScanResult
from services.reports import detailed_report_json, feedback_summary_markdown
from services.scanner_client import ScannerError, get_scanner_client
from ui.charts import score_ring
from ui.common import ats_band
from ui.findings import SEVERITY_META, location_label, render_findings_explorer

STATUS_META = {
    "pass": ("Good", ":material/check_circle:", "green"),
    "warn": ("Needs attention", ":material/warning:", "orange"),
    "fail": ("Issue found", ":material/error:", "red"),
    "info": ("Info", ":material/info:", "gray"),
}

INVALID_GUIDANCE = {
    "grade_card": "Upload your resume rather than a grade card or marksheet. Academic results belong in the Education section of your resume.",
    "unrelated": "Upload your resume. The file you submitted does not appear to be one.",
    "empty": "Export your resume from Word or Google Docs as a PDF with selectable text, rather than scanning or photographing it.",
    "unreadable": "Re-export the file and try again. If it keeps failing, save it as a fresh PDF.",
    "unsupported": "Upload a PDF or DOCX file.",
}

DOC_TYPE_LABEL = {
    "grade_card": "Grade card / marksheet",
    "unrelated": "Unrelated document",
    "empty": "No readable text",
    "unreadable": "Unreadable or corrupted",
    "unsupported": "Unsupported file",
    "resume": "Resume",
}


def render_demo_notice(result: ScanResult) -> None:
    if result.is_demo:
        st.warning(
            "**Demo result — sample data.** This is a sample scanner response used to preview the "
            "interface. It is not an analysis of any file you uploaded, and its scores are not real.",
            icon=":material/science:",
        )


def render_file_meta(result: ScanResult) -> None:
    with st.container(horizontal=True, gap="small", vertical_alignment="center"):
        st.badge(result.file.name, icon=":material/description:", color="gray")
        if result.file.pages:
            st.badge(f"{result.file.pages} page{'s' if result.file.pages != 1 else ''}", color="gray")
        st.badge(f"Analysed: {result.analysed_at or '—'}", icon=":material/schedule:", color="gray")
        if result.is_demo:
            st.badge("Demo data", icon=":material/science:", color="orange")
        else:
            st.badge("Live result", icon=":material/cloud_done:", color="green")


def render_invalid(result: ScanResult) -> None:
    v = result.validation
    with st.container(border=True):
        st.error(f"**This document can't be evaluated as a resume.** {v.message}", icon=":material/block:")
        with st.container(horizontal=True, gap="small"):
            st.badge(
                f"Detected: {DOC_TYPE_LABEL.get(v.document_type, v.document_type)}",
                icon=":material/plagiarism:",
                color="red",
            )
            if v.confidence is not None:
                st.badge(f"Confidence {v.confidence:.0%}", color="gray")
        if v.reasons:
            st.markdown("**Why the scanner rejected it**")
            st.markdown("\n".join(f"- {r}" for r in v.reasons))
        st.markdown("**What to do**")
        st.markdown(INVALID_GUIDANCE.get(v.document_type, "Upload your resume as a PDF or DOCX."))
        st.caption("No ATS or CA1 score is given for documents that are not resumes.")


def render_scores(result: ScanResult, key: str) -> None:
    left, right = st.columns(2, gap="medium")

    with left.container(border=True, height="stretch"):
        st.markdown("**ATS compatibility**")
        st.caption("How reliably applicant-tracking software can read this resume. Out of 100.")
        if result.ats:
            label, color, meaning = ats_band(result.ats.score)
            with st.container(horizontal=True, vertical_alignment="center", gap="medium"):
                score_ring(result.ats.score, 100, color, key=f"{key}_ats_ring")
                with st.container(gap="small"):
                    st.badge(label, color=color)
                    st.markdown(meaning)
                    if result.ats.summary:
                        st.caption(result.ats.summary)
            for comp in result.ats.components:
                st.progress(
                    comp.score / comp.max_score if comp.max_score else 0,
                    text=f"{comp.name} — {comp.score:g}/{comp.max_score:g}",
                )
                if comp.summary:
                    st.caption(comp.summary)
        else:
            st.caption("The scanner did not return an ATS score.")

    with right.container(border=True, height="stretch"):
        st.markdown("**Faculty CA1 score**")
        st.caption("Faculty-aligned rubric mark, out of 30. Independent of the ATS score.")
        ca1 = result.ca1
        if ca1:
            reviewed = ca1.status == "faculty_reviewed"
            with st.container(horizontal=True, vertical_alignment="center", gap="medium"):
                score_ring(ca1.total, ca1.max_score, "green" if reviewed else "blue", key=f"{key}_ca1_ring")
                with st.container(gap="small"):
                    if reviewed:
                        st.badge("Faculty reviewed", icon=":material/verified:", color="green")
                        if ca1.reviewed_by:
                            st.caption(f"Reviewed by {ca1.reviewed_by}" + (f" · {ca1.reviewed_at}" if ca1.reviewed_at else ""))
                    else:
                        st.badge("Provisional", icon=":material/hourglass_top:", color="orange")
                        st.markdown("Pending faculty review. This mark may change.")
            for item in ca1.rubric:
                st.progress(
                    item.score / item.max_score if item.max_score else 0,
                    text=f"{item.criterion} — {item.score:g}/{item.max_score:g}",
                )
                if item.comment:
                    st.caption(item.comment)
        else:
            st.caption("No CA1 score was returned for this scan.")


def render_categories(result: ScanResult) -> None:
    if not result.categories:
        st.caption("The scanner did not return a category breakdown.")
        return
    cols = st.columns(3, gap="small")
    for i, cat in enumerate(result.categories):
        label, icon, color = STATUS_META.get(cat.status, STATUS_META["info"])
        with cols[i % 3].container(border=True, height="stretch"):
            with st.container(horizontal=True, vertical_alignment="center", gap="small"):
                st.markdown(f"**{cat.label}**")
                st.badge(label, icon=icon, color=color)
            if cat.score is not None and cat.max_score:
                st.progress(cat.score / cat.max_score, text=f"{cat.score:g}/{cat.max_score:g}")
            if cat.summary:
                st.caption(cat.summary)


def render_overview(result: ScanResult) -> None:
    for flag in result.review_flags:
        st.info(f"**Faculty review flag:** {flag.message}", icon=":material/flag:")
    st.subheader("Category analysis", icon=":material/category:")
    render_categories(result)
    if result.sections_detected:
        st.subheader("Sections detected", icon=":material/segment:")
        st.markdown(" ".join(f":gray-badge[{s}]" for s in result.sections_detected))


def render_preview(result: ScanResult, file_name: str | None, file_bytes: bytes | None, key: str) -> None:
    annotated = next((r for r in result.reports if r.kind == "annotated_pdf" and r.available and r.url), None)
    pdf_bytes = None
    caption = None

    if annotated and not result.is_demo:
        cache_key = f"{key}_annotated"
        if cache_key not in st.session_state:
            if st.button("Load annotated PDF", icon=":material/draw:", key=f"{key}_load_annot"):
                try:
                    st.session_state[cache_key] = get_scanner_client().fetch_report(annotated.url)
                except ScannerError as exc:
                    st.error(str(exc), icon=":material/error:")
        pdf_bytes = st.session_state.get(cache_key)
        if pdf_bytes:
            caption = "Annotated PDF returned by the scanner."

    if pdf_bytes is None and file_bytes and file_name:
        ext = file_name.rsplit(".", 1)[-1].lower()
        if ext == "pdf":
            pdf_bytes = file_bytes
            caption = "Your uploaded PDF. Issue highlights appear here when the scanner returns an annotated PDF."
        elif ext == "docx":
            _render_docx_preview(result, file_bytes)
            return

    if pdf_bytes is None:
        st.info(
            "No document preview is available for this result."
            + (" Sample results are not attached to a document." if result.is_demo else ""),
            icon=":material/visibility_off:",
        )
        _render_location_index(result)
        return

    doc_col, notes_col = st.columns([3, 2], gap="medium")
    with doc_col:
        if caption:
            st.caption(caption)
        try:
            st.pdf(pdf_bytes, height=720, key=f"{key}_pdf")
        except Exception:  # streamlit[pdf] extra missing or unreadable file
            logging.getLogger(__name__).exception("PDF preview failed")
            st.warning(
                "PDF preview is unavailable. Install it with `pip install \"streamlit[pdf]\"`.",
                icon=":material/visibility_off:",
            )
    with notes_col:
        if result.is_demo:
            st.warning(
                "Findings are not shown beside this document because the current result is sample data "
                "and does not describe this file.",
                icon=":material/science:",
            )
        else:
            _render_location_index(result)


def _render_docx_preview(result: ScanResult, file_bytes: bytes) -> None:
    doc_col, notes_col = st.columns([3, 2], gap="medium")
    with doc_col:
        st.caption("Text-only preview of your DOCX. Fonts, spacing and layout are not shown.")
        try:
            paragraphs = docx_text(file_bytes)
        except Exception:
            st.error("This DOCX could not be read for preview.", icon=":material/error:")
            paragraphs = []
        with st.container(border=True, height=640):
            if paragraphs:
                for p in paragraphs:
                    st.text(p)
            else:
                st.caption("No text found in this document.")
    with notes_col:
        if result.is_demo:
            st.warning(
                "Findings are not shown beside this document because the current result is sample data.",
                icon=":material/science:",
            )
        else:
            _render_location_index(result)


def _render_location_index(result: ScanResult) -> None:
    st.markdown("**Findings by location**")
    located = [f for f in result.findings_by_severity() if f.severity != "info"]
    if not located:
        st.caption("No located findings.")
        return
    with st.container(height=640 if len(located) > 6 else "content"):
        for f in located:
            label, icon, color = SEVERITY_META[f.severity]
            with st.container(border=True):
                st.markdown(f"{icon} **{f.title}**")
                st.caption(location_label(f) or "Whole document")
                if f.evidence:
                    st.code(f.evidence, language=None, wrap_lines=True)


def render_next_steps(result: ScanResult, done: set[str], key: str) -> None:
    actionable = [f for f in result.findings_by_severity() if f.severity != "info" and not f.resolved]
    if not actionable:
        st.success("The scanner returned no outstanding issues.", icon=":material/task_alt:")
        return

    formatting_words = ("format", "align", "layout", "ats")
    groups = {
        "Fix these first": [f for f in actionable if f.severity == "critical"],
        "Formatting and layout": [
            f for f in actionable
            if f.severity != "critical" and any(w in f.category.lower() for w in formatting_words)
        ],
    }
    used = {f.id for g in groups.values() for f in g}
    groups["Content and language"] = [f for f in actionable if f.id not in used]

    completed = sum(f.id in done for f in actionable)
    st.progress(completed / len(actionable), text=f"{completed} of {len(actionable)} improvements checked off")
    st.caption("Tick items as you fix them in your resume. Progress is kept for this session only.")

    icons = {"Fix these first": ":material/priority_high:", "Formatting and layout": ":material/format_align_left:", "Content and language": ":material/edit_note:"}
    for title, items in groups.items():
        if not items:
            continue
        with st.container(border=True):
            st.markdown(f"{icons[title]} **{title}**")
            for f in items:
                checked = st.checkbox(
                    f"**{f.title}** — {f.suggestion or f.explanation}",
                    value=f.id in done,
                    key=f"{key}_done_{f.id}",
                )
                (done.add if checked else done.discard)(f.id)


def render_downloads(result: ScanResult, key: str) -> None:
    stem = result.file.name.rsplit(".", 1)[0]
    st.caption(
        "Exports contain only what the scanner returned."
        + (" Demo exports are stamped as sample data." if result.is_demo else "")
    )
    with st.container(border=True):
        st.markdown("**Feedback summary** · Markdown")
        st.caption("Scores and prioritised findings in a readable document.")
        st.download_button(
            "Download summary",
            feedback_summary_markdown(result),
            file_name=f"{stem}_feedback.md",
            mime="text/markdown",
            icon=":material/download:",
            key=f"{key}_dl_md",
            on_click="ignore",
        )
    with st.container(border=True):
        st.markdown("**Detailed analysis** · JSON")
        st.caption("The full scan result, including every finding and rubric line.")
        st.download_button(
            "Download detailed report",
            detailed_report_json(result),
            file_name=f"{stem}_analysis.json",
            mime="application/json",
            icon=":material/data_object:",
            key=f"{key}_dl_json",
            on_click="ignore",
        )
    annotated = next((r for r in result.reports if r.kind == "annotated_pdf"), None)
    with st.container(border=True):
        st.markdown("**Annotated PDF**")
        if annotated and annotated.available and annotated.url and not result.is_demo:
            cache_key = f"{key}_annotated"
            if cache_key in st.session_state:
                st.download_button(
                    "Download annotated PDF",
                    st.session_state[cache_key],
                    file_name=f"{stem}_annotated.pdf",
                    mime="application/pdf",
                    icon=":material/picture_as_pdf:",
                    key=f"{key}_dl_pdf",
                    on_click="ignore",
                )
            elif st.button("Prepare annotated PDF", icon=":material/picture_as_pdf:", key=f"{key}_prep_pdf"):
                try:
                    st.session_state[cache_key] = get_scanner_client().fetch_report(annotated.url)
                    st.rerun()
                except ScannerError as exc:
                    st.error(str(exc), icon=":material/error:")
        else:
            st.caption("Not available for this result. It appears when the scanner returns an annotated document.")
            st.button("Download annotated PDF", icon=":material/picture_as_pdf:", disabled=True, key=f"{key}_pdf_off")


def render_scan_result(
    result: ScanResult,
    *,
    key: str,
    file_name: str | None = None,
    file_bytes: bytes | None = None,
    done_items: set[str] | None = None,
) -> None:
    render_demo_notice(result)
    render_file_meta(result)

    if result.status == "failed":
        st.error(result.error or "The scan failed.", icon=":material/error:")
        return
    if not result.has_scores:
        render_invalid(result)
        render_downloads(result, key)
        return

    render_scores(result, key)
    st.caption(
        ":material/info: ATS and CA1 are separate evaluations. They are never added together or "
        "converted into one mark."
    )

    crit = sum(f.severity == "critical" for f in result.findings)
    tabs = st.tabs(
        [
            "Overview",
            f"Feedback ({len(result.findings)})" + (f" · {crit} critical" if crit else ""),
            "Resume preview",
            "Next steps",
            "Reports",
        ]
    )
    with tabs[0]:
        render_overview(result)
    with tabs[1]:
        render_findings_explorer(result.findings, key=f"{key}_fx")
    with tabs[2]:
        render_preview(result, file_name, file_bytes, key)
    with tabs[3]:
        render_next_steps(result, done_items if done_items is not None else set(), key)
    with tabs[4]:
        render_downloads(result, key)
