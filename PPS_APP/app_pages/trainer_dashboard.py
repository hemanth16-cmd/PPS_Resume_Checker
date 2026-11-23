import pandas as pd
import streamlit as st

from services.faculty_queue import get_submission_result, list_submissions, review_status
from ui.common import page_header
from utils.security import require_permission

user = require_permission("view_assigned_students")
store = st.session_state.faculty_reviews

page_header(
    "Faculty dashboard",
    f"Batch {user['batch']} · CA1 resume review progress",
    ":material/monitoring:",
)
st.warning(
    "**Sample queue.** The submissions API is not connected yet, so these students and results are demo data.",
    icon=":material/science:",
)

rows, flags = [], []
for sub in list_submissions():
    result = get_submission_result(sub)
    status = review_status(sub, store)
    saved = store.get(sub["submission_id"])
    if result is None:
        outcome, ats, ca1 = "Not submitted", None, None
    elif not result.has_scores:
        outcome, ats, ca1 = "Invalid document", None, None
    else:
        outcome = "Scored"
        ats = result.ats.score if result.ats else None
        ca1 = saved["total"] if saved and saved.get("total") is not None else (result.ca1.total if result.ca1 else None)
        flags += [(sub["student"], f.message) for f in result.review_flags]
    rows.append(
        {"Student": sub["student"], "Roll": sub["roll"], "Scan": outcome, "ATS": ats, "CA1": ca1, "Review": status}
    )

df = pd.DataFrame(rows)
with st.container(horizontal=True, gap="medium"):
    st.metric("Students", len(df), border=True)
    st.metric("Submitted", int((df["Scan"] != "Not submitted").sum()), border=True)
    st.metric("Awaiting review", int(df["Review"].isin(["Pending review"]).sum()), border=True)
    st.metric("Invalid documents", int((df["Scan"] == "Invalid document").sum()), border=True)
    st.metric("Approved", int((df["Review"] == "Approved").sum()), border=True)

left, right = st.columns([3, 2], gap="medium")
with left.container(border=True):
    st.subheader("CA1 submissions", icon=":material/assignment:")
    st.dataframe(
        df,
        hide_index=True,
        column_config={
            "ATS": st.column_config.ProgressColumn("ATS (/100)", min_value=0, max_value=100, format="%d"),
            "CA1": st.column_config.NumberColumn("CA1 (/30)", format="%.1f", help="Provisional until approved."),
        },
    )
    st.page_link("app_pages/trainer_reviews.py", label="Open review desk", icon=":material/rate_review:")

with right:
    with st.container(border=True):
        st.subheader("Review flags", icon=":material/flag:")
        if not flags:
            st.caption("No flags raised by the scanner.")
        for student, message in flags:
            st.markdown(f"**{student}** — {message}")
    with st.container(border=True):
        st.subheader("Quick actions", icon=":material/bolt:")
        st.page_link("app_pages/trainer_reviews.py", label="Review submissions", icon=":material/rate_review:")
        st.page_link("app_pages/batch_analysis.py", label="Batch analysis", icon=":material/stacks:")
        st.page_link("app_pages/methodology.py", label="How evaluation works", icon=":material/menu_book:")
