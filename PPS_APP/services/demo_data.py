"""DEMO DATA — sample scanner responses for visual testing only.

Nothing in this file is produced by the scanner. Every result built from it
has `source="demo"`, and the UI shows a "Demo result" banner on it. The
payloads use the exact JSON shape documented in API_INTEGRATION.md, so they
also act as contract examples.

The CA1 rubric criteria below are placeholders; the real rubric (criteria and
weights) must come from the faculty grading configuration via the API.
"""

from __future__ import annotations

DEMO_SCENARIOS = {
    "valid_resume": "Sample resume with issues",
    "grade_card": "Grade card (not a resume)",
    "empty_document": "Image-only / empty document",
}

_COMMON_REPORTS = [
    {"kind": "annotated_pdf", "label": "Annotated PDF", "url": None, "available": False},
]

VALID_RESUME = {
    "scan_id": "demo-scan-valid-001",
    "status": "completed",
    "analysed_at": "Sample data",
    "file": {"name": "sample_resume_DEMO.pdf", "mime_type": "application/pdf", "size_bytes": 184320, "pages": 1},
    "validation": {
        "is_resume": True,
        "document_type": "resume",
        "message": "Recognised as a student resume.",
        "reasons": ["Contact block, Education, Projects and Skills sections detected."],
        "confidence": 0.96,
    },
    "ats": {
        "score": 72,
        "summary": "Readable by most applicant-tracking systems. Placeholder text and a two-column skills block reduce reliability.",
        "components": [
            {"name": "Text extraction", "score": 88, "max_score": 100, "summary": "All text layers extracted in reading order."},
            {"name": "Section recognition", "score": 74, "max_score": 100, "summary": "Certifications heading not recognised."},
            {"name": "Layout safety", "score": 58, "max_score": 100, "summary": "Two-column block and a text box in the header."},
        ],
    },
    "ca1": {
        "total": 19.5,
        "max_score": 30,
        "status": "provisional",
        "rubric": [
            {"criterion": "Structure and sections", "score": 5, "max_score": 6, "comment": "All core sections present."},
            {"criterion": "Formatting and layout", "score": 3, "max_score": 6, "comment": "Inconsistent spacing and alignment."},
            {"criterion": "Content quality and impact", "score": 4.5, "max_score": 8, "comment": "Project bullets lack measurable outcomes."},
            {"criterion": "Projects and skills", "score": 4, "max_score": 6, "comment": "One project has a placeholder link."},
            {"criterion": "Language and accuracy", "score": 3, "max_score": 4, "comment": "Two spelling errors."},
        ],
        "reviewed_by": None,
        "reviewed_at": None,
    },
    "categories": [
        {"key": "structure", "label": "Resume structure", "status": "pass", "summary": "Contact, Education, Projects, Skills and Experience found in a logical order."},
        {"key": "formatting", "label": "Formatting and alignment", "status": "warn", "summary": "Mixed bullet styles, uneven spacing between sections, right-aligned dates drift."},
        {"key": "contact", "label": "Contact information", "status": "pass", "summary": "Email and phone present and well-formed."},
        {"key": "links", "label": "Links", "status": "fail", "summary": "One placeholder link and one LinkedIn URL that is incomplete."},
        {"key": "projects", "label": "Projects", "status": "warn", "summary": "Two projects described; outcomes are not quantified."},
        {"key": "skills", "label": "Skills", "status": "warn", "summary": "Skills listed without evidence of use for 4 of 9 items."},
        {"key": "education", "label": "Education", "status": "pass", "summary": "Degree, institution, dates and CGPA present."},
        {"key": "grammar", "label": "Grammar and spelling", "status": "warn", "summary": "Two spelling errors and one tense inconsistency."},
        {"key": "ats", "label": "ATS compatibility", "status": "warn", "summary": "Header text box and two-column skills block may be skipped by some parsers."},
    ],
    "findings": [
        {
            "id": "f1", "title": "Placeholder text left in the resume", "category": "Links", "severity": "critical",
            "explanation": "The project entry contains template text instead of a real link.",
            "why_it_matters": "Recruiters and faculty read placeholders as an unfinished resume; an automated keyword checker would have counted this as a valid link.",
            "suggestion": "Replace it with the public GitHub repository URL, or remove the line if the project is private.",
            "evidence": "GitHub: Insert GitHub link here", "location": {"page": 1, "section": "Projects"},
        },
        {
            "id": "f2", "title": "Incomplete LinkedIn URL", "category": "Links", "severity": "critical",
            "explanation": "The LinkedIn link ends at the domain and does not point to a profile.",
            "why_it_matters": "A broken profile link is a missed chance for a recruiter to verify your background.",
            "suggestion": "Use your full profile URL, e.g. linkedin.com/in/your-name.",
            "evidence": "linkedin.com/in/", "location": {"page": 1, "section": "Contact"},
        },
        {
            "id": "f3", "title": "Two-column skills block", "category": "ATS compatibility", "severity": "warning",
            "explanation": "Skills are laid out in two side-by-side columns.",
            "why_it_matters": "Many ATS parsers read across columns, merging unrelated skills into one line.",
            "suggestion": "Use a single column, grouped by type (Languages, Frameworks, Tools).",
            "location": {"page": 1, "section": "Skills"},
        },
        {
            "id": "f4", "title": "Inconsistent spacing between sections", "category": "Formatting and alignment", "severity": "warning",
            "explanation": "Gaps above section headings vary noticeably across the page.",
            "why_it_matters": "Uneven spacing makes a resume look unpolished at a glance — faculty rubrics grade layout explicitly.",
            "suggestion": "Use one paragraph style for headings with the same space before and after.",
            "location": {"page": 1, "section": None},
        },
        {
            "id": "f5", "title": "Dates are not aligned", "category": "Formatting and alignment", "severity": "warning",
            "explanation": "Right-aligned dates in Experience use spaces instead of a tab stop, so they do not line up.",
            "why_it_matters": "Misaligned dates are one of the most visible formatting issues on a one-page resume.",
            "suggestion": "Set a right-aligned tab stop at the margin and use it for every date.",
            "location": {"page": 1, "section": "Experience"},
        },
        {
            "id": "f6", "title": "Project outcomes are not quantified", "category": "Content quality", "severity": "warning",
            "explanation": "Project bullets describe tasks but not results.",
            "why_it_matters": "Measurable outcomes make the impact of your work concrete and comparable.",
            "suggestion": "Add a number where you honestly can: users, accuracy, time saved, dataset size.",
            "evidence": "Worked on a machine learning model for prediction.", "location": {"page": 1, "section": "Projects"},
        },
        {
            "id": "f7", "title": "Spelling errors", "category": "Grammar and spelling", "severity": "suggestion",
            "explanation": "Two words are misspelled.",
            "why_it_matters": "Spelling errors suggest a lack of attention to detail.",
            "suggestion": "Correct “managment” → “management” and “develope” → “develop”.",
            "evidence": "managment · develope", "location": {"page": 1, "section": "Experience"},
        },
        {
            "id": "f8", "title": "Mixed tense in experience bullets", "category": "Grammar and spelling", "severity": "suggestion",
            "explanation": "A completed internship mixes present and past tense.",
            "why_it_matters": "Consistent tense reads more professionally.",
            "suggestion": "Use past tense for completed roles and present tense only for current ones.",
            "location": {"page": 1, "section": "Experience"},
        },
        {
            "id": "f9", "title": "Certifications heading not recognised", "category": "Resume structure", "severity": "suggestion",
            "explanation": "Certifications are listed under a heading styled as body text.",
            "why_it_matters": "Parsers rely on recognisable headings to map content into fields.",
            "suggestion": "Add a clear “Certifications” heading in the same style as other sections.",
            "location": {"page": 1, "section": "Certifications"},
        },
        {
            "id": "f10", "title": "Contact details are complete", "category": "Contact information", "severity": "info",
            "explanation": "Name, email and phone number were found and are well-formed.",
            "location": {"page": 1, "section": "Contact"}, "resolved": True,
        },
    ],
    "sections_detected": ["Contact", "Education", "Experience", "Projects", "Skills", "Certifications"],
    "review_flags": [
        {"code": "placeholder_detected", "message": "Placeholder text found — faculty should confirm the project link before finalising CA1."},
    ],
    "reports": _COMMON_REPORTS,
}

GRADE_CARD = {
    "scan_id": "demo-scan-gradecard-002",
    "status": "invalid_document",
    "analysed_at": "Sample data",
    "file": {"name": "semester_marksheet_DEMO.pdf", "mime_type": "application/pdf", "size_bytes": 96256, "pages": 1},
    "validation": {
        "is_resume": False,
        "document_type": "grade_card",
        "message": "This looks like a grade card or marksheet, not a resume.",
        "reasons": [
            "Tabular course codes, credits and grade points dominate the page.",
            "No resume sections (Projects, Skills, Experience) were found.",
            "Contains SGPA/CGPA summary rows typical of a marksheet.",
        ],
        "confidence": 0.94,
    },
    "reports": [],
}

EMPTY_DOCUMENT = {
    "scan_id": "demo-scan-empty-003",
    "status": "invalid_document",
    "analysed_at": "Sample data",
    "file": {"name": "scanned_resume_DEMO.pdf", "mime_type": "application/pdf", "size_bytes": 412000, "pages": 1},
    "validation": {
        "is_resume": False,
        "document_type": "empty",
        "message": "No readable text was found in this document.",
        "reasons": [
            "The page is a scanned image with no text layer.",
            "Applicant-tracking systems cannot read image-only resumes either.",
        ],
        "confidence": None,
    },
    "reports": [],
}

DEMO_PAYLOADS = {
    "valid_resume": VALID_RESUME,
    "grade_card": GRADE_CARD,
    "empty_document": EMPTY_DOCUMENT,
}

# Faculty review queue — sample students only.
DEMO_SUBMISSIONS = [
    {"submission_id": "demo-sub-01", "student": "Aarav Mehta", "roll": "DEMO-014", "batch": "PPS4027 A", "submitted": "Sample", "scenario": "valid_resume", "review": "Pending review"},
    {"submission_id": "demo-sub-02", "student": "Nisha Rao", "roll": "DEMO-021", "batch": "PPS4027 A", "submitted": "Sample", "scenario": "grade_card", "review": "Needs resubmission"},
    {"submission_id": "demo-sub-03", "student": "Sana Ali", "roll": "DEMO-033", "batch": "PPS4027 A", "submitted": "Sample", "scenario": "empty_document", "review": "Needs resubmission"},
    {"submission_id": "demo-sub-04", "student": "Rohan Iyer", "roll": "DEMO-040", "batch": "PPS4027 A", "submitted": "Sample", "scenario": None, "review": "Not submitted"},
]
