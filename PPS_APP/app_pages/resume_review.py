"""ATS resume scanner — upload, validate, analyse, review results."""

from datetime import datetime

import streamlit as st

from services.demo_data import DEMO_SCENARIOS
from services.file_checks import DEFAULT_MAX_MB, check_file
from services.scanner_client import ScannerError, get_scanner_client
from ui.common import ScanRecord, add_scan, find_scan, mode_badge, page_header
from ui.scan_views import render_scan_result
from utils.security import require_permission

user = require_permission("submit_resume")
client = get_scanner_client()

page_header(
    "ATS resume scanner",
    "Context-aware, faculty-aligned resume evaluation: document validation, ATS compatibility, "
    "a provisional CA1 mark and prioritised feedback.",
    ":material/document_scanner:",
)
mode_badge()

active = find_scan(st.session_state.active_scan_id)

# ---------------------------------------------------------------- results view
if active:
    with st.container(horizontal=True, vertical_alignment="center"):
        st.subheader("Scan results", icon=":material/analytics:")
        if st.button("New scan", icon=":material/add:", key="new_scan"):
            st.session_state.active_scan_id = None
            st.session_state.uploader_nonce += 1
            st.rerun()
    render_scan_result(
        active.result,
        key=f"scan_{active.result.scan_id}",
        file_name=active.uploaded_name,
        file_bytes=active.uploaded_bytes,
        done_items=active.done_items,
    )
    st.stop()

# ----------------------------------------------------------------- upload view
if client.mode == "demo":
    st.warning(
        "**Demo mode.** No scanner API is connected, so analysis returns a clearly labelled "
        "sample result — it will not describe your file. File checks and the resume preview "
        "below are real.",
        icon=":material/science:",
    )

upload_col, info_col = st.columns([3, 2], gap="large")

with upload_col:
    with st.container(border=True):
        st.markdown("**1 · Upload your resume**")
        uploaded = st.file_uploader(
            "Resume file",
            type=["pdf", "docx"],
            max_upload_size=DEFAULT_MAX_MB,
            help=f"PDF or DOCX, up to {DEFAULT_MAX_MB} MB. Drag and drop, or browse.",
            key=f"resume_upload_{st.session_state.uploader_nonce}",
        )

        check = None
        if uploaded is not None:
            data = uploaded.getvalue()
            check = check_file(uploaded.name, data)
            with st.container(border=True):
                with st.container(horizontal=True, vertical_alignment="center", gap="small"):
                    st.markdown(f":material/description: **{uploaded.name}**")
                    st.badge(check.extension.upper() or "?", color="gray")
                    st.badge(check.size_label, color="gray")
                    if check.ok:
                        st.badge("File check passed", icon=":material/check:", color="green")
                    else:
                        st.badge("File rejected", icon=":material/close:", color="red")
                for err in check.errors:
                    st.error(err, icon=":material/error:")
                for warn in check.warnings:
                    st.warning(warn, icon=":material/warning:")
                st.caption("To replace this file, remove it with ✕ above or drop a new one.")

    with st.container(border=True):
        st.markdown("**2 · Target job description** · optional")
        target_jd = st.text_area(
            "Target job description",
            placeholder="Paste a job description to check role alignment.",
            label_visibility="collapsed",
            key="target_jd",
        )

    scenario = None
    if client.mode == "demo":
        with st.container(border=True):
            st.markdown("**Demo response to display**")
            scenario = st.segmented_control(
                "Demo response",
                list(DEMO_SCENARIOS),
                format_func=DEMO_SCENARIOS.get,
                default="valid_resume",
                required=True,
                label_visibility="collapsed",
                key="demo_scenario",
            )
            st.caption("Choose which sample scanner response to preview, including invalid-document cases.")

    with st.container(border=True):
        st.markdown("**3 · Consent**")
        consent = st.checkbox(
            "I consent to processing my resume and job description for placement-training feedback.",
            value=st.session_state.consent_given,
            key="consent_box",
        )

    file_ready = check is not None and check.ok
    blockers = []
    if not file_ready:
        blockers.append("upload a valid PDF or DOCX")
    if not consent:
        blockers.append("give consent")

    run = st.button(
        "Analyze resume",
        type="primary",
        icon=":material/play_arrow:",
        disabled=bool(blockers),
        width="stretch",
        key="analyze",
    )
    if blockers:
        st.caption("To continue, " + " and ".join(blockers) + ".")

    if run and file_ready and consent:
        st.session_state.consent_given = True
        data = uploaded.getvalue()
        with st.status("Analyzing your resume…", expanded=False) as status:
            try:
                result = client.scan(uploaded.name, data, check.mime_type, target_jd, demo_scenario=scenario)
            except ScannerError as exc:
                status.update(label="Analysis failed", state="error")
                st.error(f"{exc}", icon=":material/error:")
                st.button("Try again", icon=":material/refresh:", key="retry")
                st.stop()
            status.update(label="Analysis complete", state="complete")
        add_scan(
            ScanRecord(
                result=result,
                created_at=datetime.now(),
                uploaded_name=uploaded.name,
                uploaded_bytes=data,
                file_check=check,
                target_jd=target_jd,
            )
        )
        st.toast(
            "Demo result ready — sample data" if result.is_demo else "Analysis complete",
            icon=":material/science:" if result.is_demo else ":material/check_circle:",
        )
        st.rerun()

with info_col:
    with st.container(border=True):
        st.markdown("**What the scanner evaluates**")
        for icon, title, body in [
            (":material/plagiarism:", "Document validation", "Rejects grade cards, unrelated PDFs, empty or image-only files before scoring."),
            (":material/fact_check:", "ATS compatibility", "How reliably applicant-tracking software can read your resume, out of 100."),
            (":material/school:", "Faculty CA1 mark", "A provisional mark out of 30 using the faculty rubric, confirmed by faculty review."),
            (":material/format_align_left:", "Formatting and layout", "Alignment, spacing, columns and consistency — not just keywords."),
            (":material/link_off:", "Placeholders and links", "Template text like “Insert GitHub link here” and broken profile links."),
            (":material/spellcheck:", "Content and language", "Impact of project bullets, grammar and spelling."),
        ]:
            with st.container(horizontal=True, gap="small", vertical_alignment="top"):
                st.markdown(icon)
                with st.container(gap=None):
                    st.markdown(f"**{title}**")
                    st.caption(body)
        st.page_link("app_pages/methodology.py", label="How the evaluation works", icon=":material/arrow_forward:")

    with st.container(border=True):
        st.markdown("**Before you upload**")
        st.markdown(
            "- Export to PDF with selectable text (not a scan)\n"
            "- Keep to a single column where possible\n"
            "- Replace every template placeholder\n"
            "- Check every link opens the right page"
        )
        st.caption("General guidance, not scanner output.")
