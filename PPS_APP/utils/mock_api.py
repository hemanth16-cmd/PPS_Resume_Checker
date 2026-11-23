"""SAMPLE DATA for the prototype shell (accounts, course content, calendar,
audit log). Pages that render this data label it as sample data.

Resume-scan data does NOT live here — see services/scanner_client.py and
services/demo_data.py.
"""

from datetime import date

USERS = {
    "student": {
        "id": "stu_014",
        "name": "Aarav Mehta",
        "email": "aarav@example.edu",
        "role": "student",
        "batch": "PPS4027 A",
    },
    "trainer": {
        "id": "trn_007",
        "name": "Dr. Kavya Shah",
        "email": "kavya@example.edu",
        "role": "trainer",
        "batch": "PPS4027 A",
    },
    "admin": {
        "id": "adm_001",
        "name": "System Administrator",
        "email": "admin@example.edu",
        "role": "admin",
        "batch": "All batches",
    },
}


def student_overview(student_id):
    if student_id != USERS["student"]["id"]:
        raise PermissionError("Student access required.")

    return {
        "active_module": "Module 1: Resume building",
        "completion": 62,
        "next_deadline": "CA1 resume review - 24 Sep",
        "reminders": [
            "Tuesday materials are available",
            "Join Wednesday Q&A at 4:00 PM",
            "Submit CA1 before the deadline",
        ],
    }


def content_library():
    return [
        {
            "week": "Week 1",
            "module": "Resume building",
            "title": "ATS-ready resume basics",
            "type": "Reading + worksheet",
            "released": True,
        },
        {
            "week": "Week 2",
            "module": "Resume building",
            "title": "Tailoring a resume to a JD",
            "type": "Video + practice",
            "released": True,
        },
        {
            "week": "Week 3",
            "module": "Resume building",
            "title": "Writing impact-focused projects",
            "type": "Reading",
            "released": False,
        },
    ]


def calendar_events():
    return [
        {
            "date": "22 Sep",
            "event": "Tuesday content drop",
            "location": "Content library",
        },
        {
            "date": "23 Sep",
            "event": "Live Q&A",
            "location": "MS Teams",
        },
        {
            "date": "24 Sep",
            "event": "CA1 resume review due",
            "location": "Assignment area",
        },
        {
            "date": "25 Sep",
            "event": "Weekly MCQ",
            "location": "MS Forms",
        },
    ]


def assignments(student_id):
    if student_id != USERS["student"]["id"]:
        raise PermissionError("Student access required.")

    return [
        {
            "assessment": "CA1",
            "title": "Resume review",
            "due": "24 Sep",
            "status": "Open",
            # CA1 is a faculty mark out of 30 — never the ATS score.
            "score": "— / 30",
        },
        {
            "assessment": "CA2",
            "title": "Group discussion",
            "due": "16 Oct",
            "status": "Not open",
            "score": "—",
        },
        {
            "assessment": "CA3",
            "title": "Personal interview",
            "due": "30 Oct",
            "status": "Not open",
            "score": "—",
        },
    ]


def audit_events(actor):
    if actor["role"] != "admin":
        raise PermissionError("Admin access required.")

    return [
        {
            "time": "19 Sep, 11:20",
            "event": "ATS report viewed",
            "actor": "Aarav Mehta",
            "result": "Allowed",
        },
        {
            "time": "19 Sep, 11:18",
            "event": "Resume analysis completed",
            "actor": "System",
            "result": "Success",
        },
        {
            "time": "19 Sep, 10:55",
            "event": "Consent recorded",
            "actor": "Aarav Mehta",
            "result": "Success",
        },
    ]


def system_configuration():
    return {
        "max_upload_mb": 5,
        "retention_days": 180,
        "ats_weights": {
            "Parseability": 40,
            "Keyword match": 40,
            "Section structure": 20,
        },
        "last_updated": date.today().isoformat(),
    }
