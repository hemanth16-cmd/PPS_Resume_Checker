import pandas as pd
import streamlit as st

from ui.common import ats_band, greeting, latest_scan, scans
from utils.mock_api import assignments, calendar_events, content_library, student_overview
from utils.security import require_permission

user = require_permission("view_own_profile")
overview = student_overview(user["id"])
latest = latest_scan()

first_name = user["name"].split()[0]
st.title(f"{greeting()}, {first_name}", icon=":material/waving_hand:")
st.caption(f"{overview['active_module']} · Batch {user['batch']}")

# ------------------------------------------------------------ headline metrics
with st.container(horizontal=True, gap="medium"):
    if latest and latest.result.has_scores and latest.result.ats:
        r = latest.result
        st.metric(
            "Latest ATS score",
            f"{r.ats.score:g} / 100",
            delta=ats_band(r.ats.score)[0],
            delta_color="off",
            delta_arrow="off",
            border=True,
            help="From your most recent scan this session." + (" Demo data." if r.is_demo else ""),
        )
    else:
        st.metric("Latest ATS score", "No scan yet", border=True, help="Run the ATS scanner to see a score.")

    if latest and latest.result.has_scores and latest.result.ca1:
        c = latest.result.ca1
        st.metric(
            "CA1 resume mark",
            f"{c.total:g} / {c.max_score:g}",
            delta="Faculty reviewed" if c.status == "faculty_reviewed" else "Provisional",
            delta_color="off",
            delta_arrow="off",
            border=True,
        )
    else:
        st.metric("CA1 resume mark", "Not graded", border=True, help="CA1 is a faculty mark out of 30.")

    st.metric(
        "Course completion",
        f"{overview['completion']}%",
        border=True,
        chart_data=[20, 35, 44, 55, overview["completion"]],
        chart_type="area",
        help="Sample course data.",
    )
    what, _, when = overview["next_deadline"].rpartition(" - ")
    st.metric(
        "Next deadline",
        when or overview["next_deadline"],
        delta=what or None,
        delta_color="off",
        delta_arrow="off",
        border=True,
        help="Sample course data.",
    )

if latest and latest.result.is_demo:
    st.caption(":material/science: Scan figures above come from a demo result (sample data).")

left, right = st.columns([3, 2], gap="medium")

with left:
    # -------------------------------------------------------- scanner card
    with st.container(border=True):
        st.subheader("Resume scanner", icon=":material/document_scanner:")
        if latest is None:
            st.markdown(
                "Check your resume before CA1. The scanner validates the document, measures ATS "
                "compatibility, gives a provisional faculty-rubric mark and lists exactly what to fix."
            )
            st.page_link("app_pages/resume_review.py", label="Scan your resume", icon=":material/upload_file:")
        else:
            r = latest.result
            if r.has_scores:
                crit = sum(f.severity == "critical" for f in r.findings)
                warn = sum(f.severity == "warning" for f in r.findings)
                st.markdown(f"Last scan: **{r.file.name}** · {latest.created_at:%d %b, %H:%M}")
                with st.container(horizontal=True, gap="small"):
                    if r.is_demo:
                        st.badge("Demo data", icon=":material/science:", color="orange")
                    st.badge(f"{crit} critical", color="red" if crit else "gray")
                    st.badge(f"{warn} warnings", color="orange" if warn else "gray")
                    st.badge(f"{len(r.findings)} findings", color="gray")
            else:
                st.error(f"Last upload was not accepted: {r.validation.message}", icon=":material/block:")
            with st.container(horizontal=True, gap="medium"):
                if st.button("Open latest results", icon=":material/analytics:", key="open_latest"):
                    st.session_state.active_scan_id = r.scan_id
                    st.switch_page("app_pages/resume_review.py")
                st.page_link("app_pages/student_history.py", label="All scans", icon=":material/history:")

    # -------------------------------------------------------- recent activity
    with st.container(border=True):
        st.subheader("Recent activity", icon=":material/timeline:")
        if not scans():
            st.caption("Nothing yet this session. Your scans will appear here.")
        for rec in scans()[:4]:
            r = rec.result
            outcome = (
                f"ATS {r.ats.score:g}/100" if r.has_scores and r.ats else f"Rejected — {r.validation.document_type.replace('_', ' ')}"
            )
            st.markdown(
                f":material/description: **{r.file.name}** · {outcome}"
                + (" · :orange-badge[Demo]" if r.is_demo else "")
            )
            st.caption(f"{rec.created_at:%d %b %Y, %H:%M}")

    # -------------------------------------------------------- assignments
    with st.container(border=True):
        st.subheader("Assessments", icon=":material/assignment:")
        st.dataframe(
            pd.DataFrame(assignments(user["id"])),
            hide_index=True,
            column_config={
                "assessment": "Assessment",
                "title": "Title",
                "due": "Due",
                "status": "Status",
                "score": st.column_config.TextColumn("Mark", help="CA marks are awarded by faculty."),
            },
        )
        st.caption("Sample course data.")

    with st.container(border=True):
        st.subheader("Content library", icon=":material/library_books:")
        st.dataframe(
            pd.DataFrame(content_library()),
            hide_index=True,
            column_config={
                "week": "Week",
                "module": "Module",
                "title": "Title",
                "type": "Format",
                "released": st.column_config.CheckboxColumn("Released"),
            },
        )
        st.caption("Sample course data.")

with right:
    with st.container(border=True):
        st.subheader("Quick actions", icon=":material/bolt:")
        st.page_link("app_pages/resume_review.py", label="Scan a resume", icon=":material/document_scanner:")
        st.page_link("app_pages/student_history.py", label="View scan history", icon=":material/history:")
        st.page_link("app_pages/methodology.py", label="How evaluation works", icon=":material/menu_book:")
        st.page_link("app_pages/student_privacy.py", label="Privacy and data", icon=":material/shield:")

    with st.container(border=True):
        st.subheader("Upcoming", icon=":material/calendar_month:")
        for ev in calendar_events():
            with st.container(horizontal=True, gap="small", vertical_alignment="center"):
                st.badge(ev["date"], color="blue")
                st.markdown(f"**{ev['event']}**  \n:gray[{ev['location']}]")
        st.caption("Sample course data.")

    with st.container(border=True):
        st.subheader("Reminders", icon=":material/notifications:")
        for reminder in overview["reminders"]:
            st.markdown(f":material/radio_button_unchecked: {reminder}")
        st.caption("Sample course data.")

    with st.container(border=True):
        st.subheader("Resume tips", icon=":material/tips_and_updates:")
        st.markdown(
            "- Lead each bullet with an action verb\n"
            "- Quantify outcomes where you honestly can\n"
            "- One page, one column, consistent spacing\n"
            "- Link to work recruiters can actually open"
        )
        st.caption("General guidance, not scanner output.")
