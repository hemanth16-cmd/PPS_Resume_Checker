import pandas as pd
import streamlit as st

from services.scanner_client import get_scanner_client
from ui.common import page_header
from utils.mock_api import USERS, audit_events, system_configuration
from utils.security import require_permission

user = require_permission("manage_users")

page_header(
    "Administration",
    "Users and roles, system configuration and the compliance audit trail.",
    ":material/admin_panel_settings:",
)

users_tab, config_tab, audit_tab = st.tabs(
    ["Users and roles", "System configuration", "Audit and compliance"]
)

with users_tab:
    require_permission("manage_users")

    users = [
        {
            "Name": item["name"],
            "Email": item["email"],
            "Role": item["role"].title(),
            "Batch": item["batch"],
        }
        for item in USERS.values()
    ]

    st.dataframe(pd.DataFrame(users), hide_index=True)
    st.caption(
        "Role changes will call the identity service in the production version."
    )

with config_tab:
    require_permission("manage_configuration")
    config = system_configuration()
    client = get_scanner_client()

    with st.container(border=True):
        st.markdown("**Resume scanner connection**")
        if client.mode == "live":
            st.success(f"Connected to {client.base_url}", icon=":material/cloud_done:")
        else:
            st.warning(
                "Demo mode — no `SCANNER_API_URL` configured. Scan results across the app are labelled sample data.",
                icon=":material/science:",
            )

    st.caption("Values below are sample configuration until the configuration API is connected.")
    with st.container(horizontal=True):
        st.metric(
            "Maximum upload size",
            f"{config['max_upload_mb']} MB",
            border=True,
        )
        st.metric(
            "Default retention",
            f"{config['retention_days']} days",
            border=True,
        )

    st.write("**ATS score weights**")
    st.dataframe(
        pd.DataFrame(
            config["ats_weights"].items(),
            columns=["Component", "Weight (%)"],
        ),
        hide_index=True,
    )

with audit_tab:
    require_permission("view_audit_log")

    st.dataframe(pd.DataFrame(audit_events(user)), hide_index=True)
    st.caption("Audit records are intentionally restricted to admins.")
