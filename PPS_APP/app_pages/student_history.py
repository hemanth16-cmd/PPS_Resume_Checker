import pandas as pd
import streamlit as st

from ui.common import page_header, scans
from ui.scan_views import render_scan_result
from utils.security import require_permission

require_permission("view_own_report")

page_header(
    "Scan history",
    "Every scan you have run in this session. Persistent history arrives when the submissions API is connected.",
    ":material/history:",
)

records = scans()
if not records:
    with st.container(border=True, horizontal_alignment="center"):
        st.markdown(":material/inbox: **No scans yet**", text_alignment="center")
        st.caption("Upload a resume to get your first analysis.", text_alignment="center")
        st.page_link("app_pages/resume_review.py", label="Go to the ATS scanner", icon=":material/document_scanner:")
    st.stop()

rows = []
for rec in records:
    r = rec.result
    rows.append(
        {
            "When": rec.created_at,
            "File": r.file.name,
            "Result": "Scored" if r.has_scores else f"Rejected: {r.validation.document_type.replace('_', ' ')}",
            "ATS": r.ats.score if r.has_scores and r.ats else None,
            "CA1": r.ca1.total if r.has_scores and r.ca1 else None,
            "Critical": sum(f.severity == "critical" for f in r.findings),
            "Source": "Demo" if r.is_demo else "Live",
        }
    )

st.caption("Select a row to open its full report.")
event = st.dataframe(
    pd.DataFrame(rows),
    hide_index=True,
    on_select="rerun",
    selection_mode="single-row",
    key="history_table",
    column_config={
        "When": st.column_config.DatetimeColumn(format="D MMM YYYY, HH:mm"),
        "ATS": st.column_config.ProgressColumn("ATS (/100)", min_value=0, max_value=100, format="%d"),
        "CA1": st.column_config.NumberColumn("CA1 (/30)", format="%.1f"),
        "Critical": st.column_config.NumberColumn("Critical issues"),
    },
)

selected = event.selection.rows
if selected:
    rec = records[selected[0]]
    st.subheader(rec.result.file.name, icon=":material/description:")
    render_scan_result(
        rec.result,
        key=f"hist_{rec.result.scan_id}",
        file_name=rec.uploaded_name,
        file_bytes=rec.uploaded_bytes,
        done_items=rec.done_items,
    )
