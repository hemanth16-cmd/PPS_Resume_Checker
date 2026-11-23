# Import heavy libraries first, before any widget exists. If a rerun interrupts
# the very first (slow, cold) import of pandas, later imports can block — see
# README "Troubleshooting".
import altair  # noqa: F401
import pandas  # noqa: F401
import streamlit as st

from ui.common import init_state, mode_badge
from utils.mock_api import USERS

st.set_page_config(
    page_title="PPS · Placement Preparation",
    page_icon="static/icon.svg",
    layout="wide",
)
st.logo("static/logo.svg", icon_image="static/icon.svg", size="large")

init_state()
st.session_state.setdefault("current_user", USERS["student"])

ROLE_LABELS = {"student": "Student", "trainer": "Faculty", "admin": "Admin"}

with st.sidebar:
    selected = st.selectbox(
        "Demo account",
        options=list(USERS),
        format_func=lambda role: f"{USERS[role]['name']} · {ROLE_LABELS[role]}",
        key="demo_role",
        help="Prototype role switcher. Production sign-in will replace this.",
    )

    if st.session_state.current_user["role"] != selected:
        st.session_state.current_user = USERS[selected]
        st.rerun()

    user = st.session_state.current_user
    with st.container(border=True, gap="small"):
        st.markdown(f"**{user['name']}**")
        st.caption(f"{ROLE_LABELS[user['role']]} · {user['batch']}\n\n{user['email']}")
        mode_badge()

role = st.session_state.current_user["role"]

methodology = st.Page(
    "app_pages/methodology.py", title="How evaluation works", icon=":material/menu_book:", url_path="methodology"
)

pages_by_role = {
    "student": {
        "Overview": [
            st.Page("app_pages/student_dashboard.py", title="Dashboard", icon=":material/space_dashboard:", default=True),
        ],
        "Resume": [
            st.Page("app_pages/resume_review.py", title="ATS resume scanner", icon=":material/document_scanner:", url_path="scanner"),
            st.Page("app_pages/student_history.py", title="Scan history", icon=":material/history:", url_path="history"),
        ],
        "Learn": [methodology],
        "Account": [
            st.Page("app_pages/student_privacy.py", title="Privacy and data", icon=":material/shield:", url_path="privacy"),
        ],
    },
    "trainer": {
        "Faculty": [
            st.Page("app_pages/trainer_dashboard.py", title="Faculty dashboard", icon=":material/monitoring:", default=True),
            st.Page("app_pages/trainer_reviews.py", title="Review desk", icon=":material/rate_review:", url_path="review"),
            st.Page("app_pages/batch_analysis.py", title="Batch analysis", icon=":material/stacks:", url_path="batch"),
        ],
        "Learn": [methodology],
    },
    "admin": {
        "Admin": [
            st.Page("app_pages/admin_console.py", title="Administration", icon=":material/admin_panel_settings:", default=True),
            st.Page("app_pages/batch_analysis.py", title="Batch analysis", icon=":material/stacks:", url_path="batch"),
        ],
        "Learn": [methodology],
    },
}

st.navigation(pages_by_role[role], position="sidebar").run()
