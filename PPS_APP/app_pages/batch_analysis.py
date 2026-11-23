"""Batch resume analysis (faculty / admin)."""

import pandas as pd
import streamlit as st

from services.demo_data import DEMO_PAYLOADS
from services.file_checks import DEFAULT_MAX_MB, check_file
from services.models import ScanResult
from services.scanner_client import ScannerError, get_scanner_client
from ui.common import mode_badge, page_header
from ui.scan_views import render_scan_result
from utils.security import require_permission

require_permission("batch_analysis")
client = get_scanner_client()
st.session_state.setdefault("batch_results", None)  # {"source": str, "items": [(name, ScanResult|None, error|None)]}

page_header(
    "Batch analysis",
    "Check and analyse several resumes at once, then review the results as a table.",
    ":material/stacks:",
)
mode_badge()

with st.container(border=True):
    files = st.file_uploader(
        "Resumes",
        type=["pdf", "docx"],
        accept_multiple_files=True,
        max_upload_size=DEFAULT_MAX_MB,
        help=f"PDF or DOCX, up to {DEFAULT_MAX_MB} MB each.",
        key="batch_files",
    )

checks = [(f, check_file(f.name, f.getvalue())) for f in files or []]
if checks:
    ok = [c for c in checks if c[1].ok]
    st.markdown(f"**{len(checks)} files** · {len(ok)} ready · {len(checks) - len(ok)} rejected by file checks")
    st.dataframe(
        pd.DataFrame(
            [
                {
                    "File": c.name,
                    "Type": c.extension.upper(),
                    "Size": c.size_label,
                    "File check": "Ready" if c.ok else "Rejected",
                    "Details": "; ".join(c.errors + c.warnings) or "—",
                }
                for _, c in checks
            ]
        ),
        hide_index=True,
    )

if client.mode == "live":
    ready = [(f, c) for f, c in checks if c.ok]
    if st.button("Analyze batch", type="primary", icon=":material/play_arrow:", disabled=not ready):
        items = []
        bar = st.progress(0.0, text="Starting…")
        for i, (f, c) in enumerate(ready, start=1):
            bar.progress((i - 1) / len(ready), text=f"Analyzing {f.name} ({i} of {len(ready)})")
            try:
                items.append((f.name, client.scan(f.name, f.getvalue(), c.mime_type), None))
            except ScannerError as exc:
                items.append((f.name, None, str(exc)))
        bar.progress(1.0, text=f"Done — {len(ready)} files")
        st.session_state.batch_results = {"source": "live", "items": items}
        st.toast(f"Batch complete: {len(ready)} files", icon=":material/check_circle:")
else:
    st.warning(
        "**Batch scanning needs the scanner API**, which is not connected. File checks above are real; "
        "to preview the results interface you can load a labelled sample batch.",
        icon=":material/science:",
    )
    with st.container(horizontal=True, gap="small"):
        st.button("Analyze batch", type="primary", icon=":material/play_arrow:", disabled=True, help="Requires SCANNER_API_URL.")
        if st.button("Load sample batch results", icon=":material/science:"):
            items = []
            for i, (scenario, name) in enumerate(
                [("valid_resume", "student_A"), ("grade_card", "student_B"), ("valid_resume", "student_C"), ("empty_document", "student_D")]
            ):
                payload = {**DEMO_PAYLOADS[scenario], "scan_id": f"demo-batch-{i}"}
                payload["file"] = {**payload["file"], "name": f"{name}_DEMO.pdf"}
                items.append((payload["file"]["name"], ScanResult.from_dict(payload, source="demo"), None))
            st.session_state.batch_results = {"source": "demo", "items": items}

batch = st.session_state.batch_results
if not batch:
    st.stop()

st.subheader("Results", icon=":material/table_chart:")
if batch["source"] == "demo":
    st.badge("Sample batch — demo data", icon=":material/science:", color="orange")

rows = []
for name, res, err in batch["items"]:
    if err:
        status = "Failed"
    elif res.has_scores:
        status = "Scored"
    else:
        status = "Invalid document"
    rows.append(
        {
            "File": name,
            "Status": status,
            "Document": (res.validation.document_type.replace("_", " ") if res else "—"),
            "ATS": res.ats.score if res and res.has_scores and res.ats else None,
            "CA1": res.ca1.total if res and res.has_scores and res.ca1 else None,
            "Critical": sum(f.severity == "critical" for f in res.findings) if res else None,
            "Error": err or "",
        }
    )
df = pd.DataFrame(rows)

with st.container(horizontal=True, vertical_alignment="bottom", gap="medium"):
    q = st.text_input("Search files", key="batch_q", width=260)
    status_pick = st.pills("Status", sorted(df["Status"].unique()), selection_mode="multi", key="batch_status")
    st.download_button(
        "Download CSV",
        df.to_csv(index=False),
        file_name="batch_results" + ("_DEMO" if batch["source"] == "demo" else "") + ".csv",
        mime="text/csv",
        icon=":material/download:",
        on_click="ignore",
    )

view = df
if q:
    view = view[view["File"].str.contains(q, case=False, regex=False)]
if status_pick:
    view = view[view["Status"].isin(status_pick)]

st.caption("Select a row to open the full result.")
event = st.dataframe(
    view,
    hide_index=True,
    on_select="rerun",
    selection_mode="single-row",
    key="batch_table",
    column_config={
        "ATS": st.column_config.ProgressColumn("ATS (/100)", min_value=0, max_value=100, format="%d"),
        "CA1": st.column_config.NumberColumn("CA1 (/30)", format="%.1f", help="Provisional"),
    },
)
if event.selection.rows:
    original_index = view.index[event.selection.rows[0]]
    name, res, err = batch["items"][original_index]
    st.subheader(name, icon=":material/description:")
    if err:
        st.error(err, icon=":material/error:")
    else:
        render_scan_result(res, key=f"batch_{original_index}")
