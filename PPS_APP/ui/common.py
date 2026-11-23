"""Shared UI helpers: session state, page headers, demo indicators."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

import streamlit as st

from services.file_checks import FileCheck
from services.models import ScanResult
from services.scanner_client import get_scanner_client


@dataclass
class ScanRecord:
    """One scan run in this browser session."""

    result: ScanResult
    created_at: datetime
    uploaded_name: str | None = None
    uploaded_bytes: bytes | None = None
    file_check: FileCheck | None = None
    target_jd: str = ""
    done_items: set[str] = field(default_factory=set)


def init_state() -> None:
    st.session_state.setdefault("consent_given", False)
    st.session_state.setdefault("scans", [])  # list[ScanRecord], newest first
    st.session_state.setdefault("active_scan_id", None)
    st.session_state.setdefault("faculty_reviews", {})  # submission_id -> dict
    st.session_state.setdefault("uploader_nonce", 0)


def scans() -> list[ScanRecord]:
    return st.session_state.scans


def add_scan(record: ScanRecord) -> None:
    st.session_state.scans.insert(0, record)
    st.session_state.active_scan_id = record.result.scan_id


def find_scan(scan_id: str | None) -> ScanRecord | None:
    return next((r for r in scans() if r.result.scan_id == scan_id), None)


def latest_scan() -> ScanRecord | None:
    return scans()[0] if scans() else None


def scanner_mode() -> str:
    return get_scanner_client().mode


def page_header(title: str, subtitle: str, icon: str) -> None:
    st.title(title, icon=icon)
    st.caption(subtitle)


def mode_badge() -> None:
    if scanner_mode() == "live":
        st.badge("Live scanner", icon=":material/cloud_done:", color="green")
    else:
        st.badge(
            "Demo mode",
            icon=":material/science:",
            color="orange",
            help="No scanner API is configured. Results are labelled sample data. "
            "Set SCANNER_API_URL to connect the real scanner.",
        )


def demo_banner(text: str) -> None:
    st.warning(text, icon=":material/science:")


def greeting(now: datetime | None = None) -> str:
    hour = (now or datetime.now()).hour
    if hour < 12:
        return "Good morning"
    if hour < 17:
        return "Good afternoon"
    return "Good evening"


ATS_BANDS = [
    (80, "Strong", "green", "Most applicant-tracking systems should read this resume reliably."),
    (60, "Fair", "orange", "Readable, but the flagged issues may cause parts to be skipped or misread."),
    (0, "Needs work", "red", "Significant parts of this resume may not be read correctly by an ATS."),
]


def ats_band(score: float) -> tuple[str, str, str]:
    for threshold, label, color, meaning in ATS_BANDS:
        if score >= threshold:
            return label, color, meaning
    return ATS_BANDS[-1][1:]
