import json

import streamlit as st

from ui.common import page_header, scans
from utils.security import require_permission

user = require_permission("manage_own_privacy")

page_header(
    "Privacy and data",
    "What is stored about you in this session, and controls to export or clear it.",
    ":material/shield:",
)

with st.container(border=True):
    st.subheader("Your consent", icon=":material/how_to_reg:")
    if st.session_state.get("consent_given"):
        st.success("Consent is recorded for resume analysis in this session.", icon=":material/check_circle:")
    else:
        st.info("Consent will be requested when you submit a resume.", icon=":material/pending:")
    st.caption("Your resume and target job description are used only to create placement-training feedback.")

with st.container(border=True):
    st.subheader("Data held in this session", icon=":material/folder_shared:")
    n = len(scans())
    st.markdown(f"**{n}** scan{'s' if n != 1 else ''} and their uploaded files are held in your browser session.")
    st.caption("Nothing is persisted by this prototype; closing the tab discards it.")

    export = {
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
        "consent_given": bool(st.session_state.get("consent_given")),
        "scans": [
            {
                "created_at": rec.created_at.isoformat(),
                "uploaded_file": rec.uploaded_name,
                "target_jd": rec.target_jd,
                "result": rec.result.to_dict(),
            }
            for rec in scans()
        ],
    }

    with st.container(horizontal=True, gap="small"):
        st.download_button(
            "Download my data",
            json.dumps(export, indent=2, ensure_ascii=False),
            file_name="pps_my_data.json",
            mime="application/json",
            icon=":material/download:",
            on_click="ignore",
        )

        @st.dialog("Delete session data?", icon=":material/delete:")
        def confirm_delete():
            st.markdown(
                f"This removes **{n} scan{'s' if n != 1 else ''}**, the uploaded files and your consent "
                "from this session. It cannot be undone."
            )
            with st.container(horizontal=True, horizontal_alignment="right"):
                if st.button("Cancel"):
                    st.rerun()
                if st.button("Delete", type="primary", icon=":material/delete:"):
                    st.session_state.scans = []
                    st.session_state.active_scan_id = None
                    st.session_state.consent_given = False
                    st.toast("Session data deleted", icon=":material/delete:")
                    st.rerun()

        if st.button("Delete my session data", icon=":material/delete:", disabled=n == 0 and not st.session_state.get("consent_given")):
            confirm_delete()

    st.caption(
        "Formal data-copy and post-grading deletion requests will go through the institution's "
        "privacy service once it is connected."
    )
