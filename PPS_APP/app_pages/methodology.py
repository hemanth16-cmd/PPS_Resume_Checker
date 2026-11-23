import streamlit as st

from ui.common import page_header

page_header(
    "How evaluation works",
    "PPS evaluates resumes the way faculty do — in context — rather than counting keywords.",
    ":material/menu_book:",
)

with st.container(border=True):
    st.subheader("Why not a keyword checker?", icon=":material/psychology_alt:")
    st.markdown(
        "An earlier prototype combined faculty grading rubrics with feedback gathered from about "
        "120 student resumes. It taught us where rule-based checking breaks down:"
    )
    left, right = st.columns(2, gap="medium")
    with left:
        st.markdown("**Earlier prototype**")
        for item in [
            "Graded a grade card or unrelated PDF as if it were a resume",
            "Accepted placeholders such as “Insert GitHub link here” as real content",
            "Only checked criteria it explicitly recognised",
            "Missed formatting, alignment, spacing and document quality",
            "Had no real contextual understanding",
        ]:
            st.markdown(f":red[:material/close:] {item}")
    with right:
        st.markdown("**Context-aware approach**")
        for item in [
            "Validates the document is a resume before scoring anything",
            "Detects placeholder text, incomplete links and template leftovers",
            "Reads the resume as a whole and reports issues outside a fixed list",
            "Reviews layout, alignment, spacing and consistency",
            "Explains each finding: what, where, why it matters, how to fix it",
        ]:
            st.markdown(f":green[:material/check:] {item}")

st.subheader("The evaluation pipeline", icon=":material/account_tree:")
steps = [
    (":material/plagiarism:", "1 · Validate", "Is this a readable resume? Grade cards, unrelated or image-only files are rejected with a reason — and no score."),
    (":material/text_snippet:", "2 · Extract", "Text, structure and sections are read from the PDF or DOCX."),
    (":material/fact_check:", "3 · Evaluate", "ATS compatibility, formatting, content quality, links, language and section coverage."),
    (":material/school:", "4 · Grade", "A provisional CA1 mark from the faculty rubric, plus flags for anything a person should check."),
    (":material/verified:", "5 · Review", "Faculty confirm or adjust the CA1 mark. Only then is it final."),
]
cols = st.columns(len(steps), gap="small")
for col, (icon, title, body) in zip(cols, steps, strict=True):
    with col.container(border=True, height="stretch"):
        st.markdown(f"{icon} **{title}**")
        st.caption(body)

left, right = st.columns(2, gap="medium")
with left.container(border=True, height="stretch"):
    st.subheader("ATS compatibility · out of 100", icon=":material/fact_check:")
    st.markdown(
        "How reliably applicant-tracking software can read your resume: text extraction, recognisable "
        "section headings and layout safety (columns, tables, text boxes, headers)."
    )
    st.markdown(":green-badge[80–100 Strong] :orange-badge[60–79 Fair] :red-badge[0–59 Needs work]")
    st.caption("Bands are shown to help interpret the number; the score itself comes from the scanner.")
with right.container(border=True, height="stretch"):
    st.subheader("Faculty CA1 · out of 30", icon=":material/school:")
    st.markdown(
        "Your Continuous Assessment 1 mark, aligned to the faculty rubric. It starts as **provisional** "
        "and becomes **faculty reviewed** once a faculty member confirms or adjusts it."
    )
    st.markdown(":orange-badge[Provisional] :green-badge[Faculty reviewed]")

st.info(
    "**ATS and CA1 are independent.** A resume can be very machine-readable but weak in content, or "
    "excellent in content but hard for an ATS to parse. The two scores are never added together or "
    "converted into each other.",
    icon=":material/balance:",
)

with st.expander("Severity levels", icon=":material/sort:"):
    st.markdown(
        "- :red-badge[Critical] Fix before submitting — e.g. placeholder text, broken links\n"
        "- :orange-badge[Warning] Likely to cost marks or ATS reliability — e.g. misaligned dates, two-column blocks\n"
        "- :blue-badge[Suggestion] Polish — e.g. tense consistency, minor spelling\n"
        "- :green-badge[Passed / info] Checks that passed, for reassurance"
    )

with st.expander("What happens to my resume?", icon=":material/shield:"):
    st.markdown(
        "Your file is used only to produce placement-training feedback. See **Privacy and data** for "
        "what this session holds and how to export or delete it."
    )
