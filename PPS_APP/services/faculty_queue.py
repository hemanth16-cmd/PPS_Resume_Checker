"""Faculty review queue.

There is no submissions/review API yet, so this module serves the DEMO queue
from services/demo_data.py. Replace `list_submissions`, `get_submission_result`
and `save_review` with HTTP calls when the endpoints in API_INTEGRATION.md
exist. Reviews are saved to the caller-provided session dict only — nothing is
persisted.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from services.demo_data import DEMO_PAYLOADS, DEMO_SUBMISSIONS
from services.models import ScanResult

IS_DEMO = True
DECISIONS = ["Approve CA1 mark", "Request changes", "Needs resubmission"]


def list_submissions() -> list[dict[str, Any]]:
    return [dict(s) for s in DEMO_SUBMISSIONS]


def get_submission_result(submission: dict[str, Any]) -> ScanResult | None:
    scenario = submission.get("scenario")
    if not scenario:
        return None
    payload = {**DEMO_PAYLOADS[scenario], "scan_id": f"{submission['submission_id']}-scan"}
    payload["file"] = {**payload["file"], "name": f"{submission['student'].replace(' ', '_')}_resume_DEMO.pdf"}
    return ScanResult.from_dict(payload, source="demo")


def save_review(store: dict, submission_id: str, *, decision: str, rubric: dict[str, float], comments: str, reviewer: str) -> dict:
    review = {
        "decision": decision,
        "rubric": dict(rubric),
        "total": round(sum(rubric.values()), 2) if rubric else None,
        "comments": comments,
        "reviewer": reviewer,
        "saved_at": datetime.now(),
        "persisted": False,
    }
    store[submission_id] = review
    return review


def review_status(submission: dict[str, Any], store: dict) -> str:
    saved = store.get(submission["submission_id"])
    if saved:
        return {
            "Approve CA1 mark": "Approved",
            "Request changes": "Changes requested",
            "Needs resubmission": "Needs resubmission",
        }[saved["decision"]]
    return submission["review"]
