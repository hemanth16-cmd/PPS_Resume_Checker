from datetime import datetime
from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

from services.demo_data import DEMO_PAYLOADS
from services.models import ScanResult
from ui.common import ScanRecord

ROOT = Path(__file__).resolve().parents[1]
APP = str(ROOT / "streamlit_app.py")

PAGES = {
    "student": [
        "app_pages/student_dashboard.py",
        "app_pages/resume_review.py",
        "app_pages/student_history.py",
        "app_pages/methodology.py",
        "app_pages/student_privacy.py",
    ],
    "trainer": [
        "app_pages/trainer_dashboard.py",
        "app_pages/trainer_reviews.py",
        "app_pages/batch_analysis.py",
        "app_pages/methodology.py",
    ],
    "admin": ["app_pages/admin_console.py", "app_pages/batch_analysis.py", "app_pages/methodology.py"],
}


def app(role="student"):
    at = AppTest.from_file(APP, default_timeout=30).run()
    if role != "student":
        at.selectbox(key="demo_role").select(role).run()
    assert not at.exception
    return at


def all_text(at):
    parts = []
    for kind in ("markdown", "caption", "warning", "error", "info", "success", "title", "subheader"):
        parts += [str(e.value) for e in getattr(at, kind)]
    return "\n".join(parts)


def seed(at, scenario):
    result = ScanResult.from_dict(DEMO_PAYLOADS[scenario], source="demo")
    rec = ScanRecord(result=result, created_at=datetime(2026, 11, 23, 10, 0))
    at.session_state["scans"] = [rec]
    at.session_state["active_scan_id"] = result.scan_id
    return result


@pytest.mark.parametrize("role,page", [(r, p) for r, ps in PAGES.items() for p in ps])
def test_every_page_renders(role, page):
    at = app(role)
    at.switch_page(page).run()
    assert not at.exception, at.exception


def test_scanner_requires_file_and_consent():
    at = app()
    at.switch_page("app_pages/resume_review.py").run()
    assert at.button(key="analyze").disabled
    text = all_text(at)
    assert "Demo mode" in text
    assert "upload a valid PDF or DOCX" in text


def test_valid_demo_result_is_labelled_and_scores_separate():
    at = app()
    seed(at, "valid_resume")
    at.switch_page("app_pages/resume_review.py").run()
    assert not at.exception
    text = all_text(at)
    assert "Demo result — sample data" in text
    assert "Faculty CA1 score" in text and "ATS compatibility" in text
    assert "never added together" in text
    assert "Provisional" in [b.proto.label for b in at.get("badge")] or "Provisional" in text


def test_invalid_document_shows_no_scores():
    at = app()
    seed(at, "grade_card")
    at.switch_page("app_pages/resume_review.py").run()
    assert not at.exception
    text = all_text(at)
    assert "can't be evaluated as a resume" in text
    assert "No ATS or CA1 score" in text
    assert "Faculty CA1 score" not in text


def test_history_empty_state_and_rows():
    at = app()
    at.switch_page("app_pages/student_history.py").run()
    assert "No scans yet" in all_text(at)
    seed(at, "valid_resume")
    at.run()
    assert not at.exception
    assert len(at.dataframe[0].value) == 1


def test_dashboard_reflects_latest_scan():
    at = app()
    seed(at, "valid_resume")
    at.switch_page("app_pages/student_dashboard.py").run()
    values = {m.label: m.value for m in at.metric}
    assert values["Latest ATS score"] == "72 / 100"
    assert values["CA1 resume mark"] == "19.5 / 30"


def test_faculty_change_request_requires_comment_then_saves():
    at = app("trainer")
    at.switch_page("app_pages/trainer_reviews.py").run()
    sub_id = "demo-sub-01"
    at.segmented_control(key=f"rev_decision_{sub_id}").set_value("Request changes").run()
    at.button(key=f"rev_save_{sub_id}").click().run()
    assert any("Add a comment" in e.value for e in at.error)
    at.text_area(key=f"rev_comments_{sub_id}").input("Fix the GitHub link.").run()
    at.button(key=f"rev_save_{sub_id}").click().run()
    assert not at.exception
    saved = at.session_state["faculty_reviews"][sub_id]
    assert saved["decision"] == "Request changes" and saved["persisted"] is False


def test_batch_demo_mode_loads_labelled_sample():
    at = app("trainer")
    at.switch_page("app_pages/batch_analysis.py").run()
    load = next(b for b in at.button if b.label == "Load sample batch results")
    load.click().run()
    assert not at.exception
    df = at.dataframe[-1].value
    assert len(df) == 4 and set(df["Status"]) == {"Scored", "Invalid document"}
    assert df.loc[df["Status"] == "Invalid document", "ATS"].isna().all()
