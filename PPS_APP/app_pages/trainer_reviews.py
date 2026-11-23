import streamlit as st

from services.faculty_queue import DECISIONS, get_submission_result, list_submissions, review_status, save_review
from ui.common import page_header
from ui.scan_views import render_scan_result
from utils.security import require_permission

user = require_permission("view_assigned_reports")
store = st.session_state.faculty_reviews

page_header(
    "Review desk",
    "Check each scan, confirm or adjust the provisional CA1 mark, and leave feedback.",
    ":material/rate_review:",
)
st.warning(
    "**Sample queue.** Submissions are demo data, and reviews are kept in this browser session only — "
    "they are not saved to any server.",
    icon=":material/science:",
)

subs = list_submissions()
statuses = sorted({review_status(s, store) for s in subs})

with st.container(horizontal=True, vertical_alignment="bottom", gap="medium"):
    query = st.text_input("Search students", placeholder="Name or roll number", key="rev_q", width=280)
    status_filter = st.pills("Review status", statuses, selection_mode="multi", key="rev_status")

filtered = [
    s
    for s in subs
    if (not query or query.lower() in s["student"].lower() or query.lower() in s["roll"].lower())
    and (not status_filter or review_status(s, store) in status_filter)
]

if not filtered:
    st.info("No submissions match your filters.", icon=":material/filter_alt_off:")
    st.stop()

sub = st.selectbox(
    "Submission",
    filtered,
    format_func=lambda s: f"{s['student']} · {s['roll']} · {review_status(s, store)}",
    key="rev_sub",
)
result = get_submission_result(sub)
saved = store.get(sub["submission_id"])

if result is None:
    with st.container(border=True):
        st.markdown(f":material/hourglass_empty: **{sub['student']} has not submitted a resume yet.**")
        st.caption("Nothing to review.")
    st.stop()

eval_tab, review_tab = st.tabs(["Evaluation", "Faculty review" + (" · saved" if saved else "")])

with eval_tab:
    render_scan_result(result, key=f"rev_{sub['submission_id']}")

with review_tab:
    if saved:
        st.success(
            f"**{saved['decision']}** saved by {saved['reviewer']} at {saved['saved_at']:%H:%M} "
            "— this session only, not persisted.",
            icon=":material/check_circle:",
        )

    rubric_values: dict[str, float] = {}
    with st.container(border=True):
        if result.has_scores and result.ca1:
            st.markdown("**CA1 rubric** · adjust any criterion to override the provisional mark")
            for item in result.ca1.rubric:
                default = saved["rubric"].get(item.criterion, item.score) if saved else item.score
                with st.container(horizontal=True, vertical_alignment="center", gap="medium"):
                    rubric_values[item.criterion] = st.number_input(
                        f"{item.criterion} (/{item.max_score:g})",
                        min_value=0.0,
                        max_value=float(item.max_score),
                        value=float(default),
                        step=0.5,
                        key=f"rub_{sub['submission_id']}_{item.criterion}",
                        width=260,
                    )
                    changed = rubric_values[item.criterion] != item.score
                    st.caption(
                        f"Provisional {item.score:g}" + (" · :orange[overridden]" if changed else "")
                    )
            total = sum(rubric_values.values())
            provisional = result.ca1.total
            st.metric(
                "Faculty CA1 total",
                f"{total:g} / {result.ca1.max_score:g}",
                delta=f"{total - provisional:+g} vs provisional" if total != provisional else "Matches provisional",
                delta_color="off",
                border=True,
                width="content",
            )
            decisions = DECISIONS
        else:
            st.markdown("**No CA1 mark** — the scanner rejected this document, so there is nothing to grade.")
            decisions = DECISIONS[1:]

        comments = st.text_area(
            "Comments to the student",
            value=saved["comments"] if saved else "",
            placeholder="Constructive feedback the student will see with their results.",
            key=f"rev_comments_{sub['submission_id']}",
        )
        decision = st.segmented_control(
            "Decision",
            decisions,
            default=saved["decision"] if saved and saved["decision"] in decisions else decisions[-1 if not result.has_scores else 0],
            required=True,
            key=f"rev_decision_{sub['submission_id']}",
        )

    @st.dialog("Approve CA1 mark?", icon=":material/verified:")
    def confirm_approve(values: dict[str, float], text: str):
        st.markdown(
            f"Approve **{sum(values.values()):g} / {result.ca1.max_score:g}** for **{sub['student']}**? "
            "In production this finalises the CA1 mark."
        )
        st.caption("Prototype: saved in this session only.")
        with st.container(horizontal=True, horizontal_alignment="right"):
            if st.button("Cancel"):
                st.rerun()
            if st.button("Approve", type="primary", icon=":material/verified:"):
                save_review(store, sub["submission_id"], decision=DECISIONS[0], rubric=values, comments=text, reviewer=user["name"])
                st.toast("Review saved for this session", icon=":material/check_circle:")
                st.rerun()

    if st.button("Save review", type="primary", icon=":material/save:", key=f"rev_save_{sub['submission_id']}"):
        if decision == DECISIONS[0]:
            confirm_approve(rubric_values, comments)
        elif not comments.strip():
            st.error("Add a comment so the student knows what to change.", icon=":material/edit_note:")
        else:
            save_review(store, sub["submission_id"], decision=decision, rubric=rubric_values, comments=comments, reviewer=user["name"])
            st.toast("Review saved for this session", icon=":material/check_circle:")
            st.rerun()
