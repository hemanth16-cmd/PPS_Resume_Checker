import io
import json
import zipfile

import pytest

from services import scanner_client
from services.demo_data import DEMO_PAYLOADS
from services.faculty_queue import get_submission_result, list_submissions, review_status, save_review
from services.file_checks import check_file, docx_text
from services.models import ScanResult
from services.reports import detailed_report_json, feedback_summary_markdown
from services.scanner_client import DemoScannerClient, HttpScannerClient, ScannerError, get_scanner_client

PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def make_docx(paragraphs):
    buf = io.BytesIO()
    body = "".join(f"<w:p><w:r><w:t>{p}</w:t></w:r></w:p>" for p in paragraphs)
    xml = (
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{body}</w:body></w:document>"
    )
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("word/document.xml", xml)
    return buf.getvalue()


# ------------------------------------------------------------------ file checks
def test_valid_pdf_passes():
    c = check_file("cv.pdf", PDF)
    assert c.ok and c.mime_type == "application/pdf" and not c.errors


@pytest.mark.parametrize(
    "name,data,fragment",
    [
        ("cv.pdf", b"", "empty"),
        ("cv.pdf", b"hello", "not a valid PDF"),
        ("cv.txt", b"hello", "Unsupported"),
        ("cv.docx", b"not a zip", "not a valid Word"),
        ("cv.pdf", b"%PDF-" + b"0" * (6 * 1024 * 1024), "limit is 5 MB"),
    ],
)
def test_bad_files_rejected(name, data, fragment):
    c = check_file(name, data)
    assert not c.ok
    assert any(fragment in e for e in c.errors)


def test_docx_missing_body_rejected():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("other.xml", "<x/>")
    assert not check_file("cv.docx", buf.getvalue()).ok


def test_docx_text_extraction():
    data = make_docx(["Aarav Mehta", "Projects", "  Built   a thing "])
    assert check_file("cv.docx", data).ok
    assert docx_text(data) == ["Aarav Mehta", "Projects", "Built a thing"]


# ------------------------------------------------------------------ contracts
@pytest.mark.parametrize("scenario", list(DEMO_PAYLOADS))
def test_demo_payloads_match_contract(scenario):
    r = ScanResult.from_dict(DEMO_PAYLOADS[scenario], source="demo")
    assert r.is_demo
    if r.validation.is_resume:
        assert r.has_scores and 0 <= r.ats.score <= 100 and 0 <= r.ca1.total <= 30
    else:
        assert not r.has_scores


def test_ca1_rubric_sums_to_total():
    r = ScanResult.from_dict(DEMO_PAYLOADS["valid_resume"], source="demo")
    assert sum(i.score for i in r.ca1.rubric) == r.ca1.total
    assert sum(i.max_score for i in r.ca1.rubric) == r.ca1.max_score == 30


def test_out_of_range_scores_rejected():
    bad = json.loads(json.dumps(DEMO_PAYLOADS["valid_resume"]))
    bad["ca1"]["total"] = 76  # an ATS-style number in the CA1 slot
    with pytest.raises(ValueError):
        ScanResult.from_dict(bad, source="live")


def test_findings_sorted_by_severity():
    r = ScanResult.from_dict(DEMO_PAYLOADS["valid_resume"], source="demo")
    order = [f.severity for f in r.findings_by_severity()]
    assert order.index("critical") < order.index("warning") < order.index("suggestion") < order.index("info")


# ------------------------------------------------------------------ clients
def test_demo_client_default_and_unknown():
    c = DemoScannerClient()
    r1, r2 = c.scan("x.pdf", PDF, "application/pdf"), c.scan("x.pdf", PDF, "application/pdf")
    assert r1.source == "demo" and r1.scan_id != r2.scan_id
    # demo results never claim to be the uploaded file
    assert "DEMO" in r1.file.name
    with pytest.raises(ScannerError):
        c.scan("x.pdf", PDF, "application/pdf", demo_scenario="nope")


def test_client_selection(monkeypatch):
    monkeypatch.delenv("SCANNER_API_URL", raising=False)
    assert get_scanner_client().mode == "demo"
    monkeypatch.setenv("SCANNER_API_URL", "http://scanner.test")
    c = get_scanner_client()
    assert c.mode == "live" and c.base_url == "http://scanner.test"


class FakeResponse:
    def __init__(self, status, payload):
        self.status_code = status
        self._payload = payload

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


def test_http_client_parses_live_response(monkeypatch):
    c = HttpScannerClient("http://scanner.test/")
    calls = {}

    def fake_post(url, **kw):
        calls["url"] = url
        calls["files"] = kw["files"]
        return FakeResponse(200, DEMO_PAYLOADS["valid_resume"])

    monkeypatch.setattr(c.session, "post", fake_post)
    r = c.scan("cv.pdf", PDF, "application/pdf", "JD text")
    assert calls["url"] == "http://scanner.test/api/v1/scans"
    assert calls["files"]["file"][0] == "cv.pdf"
    assert r.source == "live" and r.has_scores


@pytest.mark.parametrize(
    "status,payload,fragment",
    [
        (413, {}, "larger"),
        (415, {}, "file type"),
        (422, {"detail": "Bad resume"}, "Bad resume"),
        (500, ValueError("no json"), "HTTP 500"),
        (200, {"unexpected": True}, "could not read"),
    ],
)
def test_http_client_errors(monkeypatch, status, payload, fragment):
    c = HttpScannerClient("http://scanner.test")
    monkeypatch.setattr(c.session, "post", lambda url, **kw: FakeResponse(status, payload))
    with pytest.raises(ScannerError, match=fragment):
        c.scan("cv.pdf", PDF, "application/pdf")


def test_http_client_network_error(monkeypatch):
    c = HttpScannerClient("http://scanner.test")

    def boom(url, **kw):
        raise scanner_client.requests.ConnectionError("down")

    monkeypatch.setattr(c.session, "post", boom)
    with pytest.raises(ScannerError, match="reach"):
        c.scan("cv.pdf", PDF, "application/pdf")


# ------------------------------------------------------------------ reports
def test_reports_stamp_demo_and_skip_scores_for_invalid():
    valid = ScanResult.from_dict(DEMO_PAYLOADS["valid_resume"], source="demo")
    md = feedback_summary_markdown(valid)
    assert "DEMO DATA" in md and "72 / 100" in md and "19.5 / 30" in md
    assert json.loads(detailed_report_json(valid))["_notice"].startswith("DEMO DATA")

    invalid = ScanResult.from_dict(DEMO_PAYLOADS["grade_card"], source="live")
    md = feedback_summary_markdown(invalid)
    assert "/ 100" not in md and "/ 30" not in md and "DEMO DATA" not in md


# ------------------------------------------------------------------ faculty
def test_faculty_review_is_session_only():
    store = {}
    sub = list_submissions()[0]
    assert get_submission_result(sub).is_demo
    review = save_review(store, sub["submission_id"], decision="Approve CA1 mark", rubric={"a": 5, "b": 3.5}, comments="", reviewer="T")
    assert review["total"] == 8.5 and review["persisted"] is False
    assert review_status(sub, store) == "Approved"
    assert get_submission_result(list_submissions()[-1]) is None
