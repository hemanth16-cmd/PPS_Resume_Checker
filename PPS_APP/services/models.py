"""Data contracts between the frontend and the resume scanner API.

These dataclasses are the single source of truth for what the UI renders.
`ScanResult.from_dict` accepts the JSON documented in API_INTEGRATION.md, so a
live backend response and a demo fixture go through exactly the same path.

ATS (0-100) and CA1 (0-30) are deliberately separate objects. The UI never
adds, averages or converts one into the other.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

Severity = Literal["critical", "warning", "suggestion", "info"]
CategoryStatus = Literal["pass", "warn", "fail", "info"]
ScanStatus = Literal["completed", "invalid_document", "failed"]
DataSource = Literal["live", "demo"]
Ca1Status = Literal["provisional", "faculty_reviewed"]

SEVERITY_ORDER: dict[str, int] = {"critical": 0, "warning": 1, "suggestion": 2, "info": 3}

ATS_MAX = 100
CA1_MAX = 30


@dataclass(frozen=True)
class FileInfo:
    name: str
    mime_type: str
    size_bytes: int
    pages: int | None = None


@dataclass(frozen=True)
class DocumentValidation:
    is_resume: bool
    document_type: str  # resume | grade_card | unrelated | empty | unreadable | unsupported
    message: str
    reasons: list[str] = field(default_factory=list)
    confidence: float | None = None


@dataclass(frozen=True)
class ScoreComponent:
    name: str
    score: float
    max_score: float
    summary: str = ""


@dataclass(frozen=True)
class AtsScore:
    score: float
    summary: str = ""
    components: list[ScoreComponent] = field(default_factory=list)


@dataclass(frozen=True)
class RubricItem:
    criterion: str
    score: float
    max_score: float
    comment: str = ""


@dataclass(frozen=True)
class Ca1Score:
    total: float
    status: Ca1Status
    rubric: list[RubricItem] = field(default_factory=list)
    reviewed_by: str | None = None
    reviewed_at: str | None = None
    max_score: float = CA1_MAX


@dataclass(frozen=True)
class CategoryResult:
    key: str
    label: str
    status: CategoryStatus
    summary: str = ""
    score: float | None = None
    max_score: float | None = None


@dataclass(frozen=True)
class FindingLocation:
    page: int | None = None
    section: str | None = None


@dataclass(frozen=True)
class Finding:
    id: str
    title: str
    category: str
    severity: Severity
    explanation: str
    why_it_matters: str = ""
    suggestion: str = ""
    evidence: str | None = None
    location: FindingLocation | None = None
    resolved: bool = False


@dataclass(frozen=True)
class ReviewFlag:
    code: str
    message: str


@dataclass(frozen=True)
class ReportArtifact:
    kind: str  # detailed_report | annotated_pdf | feedback_summary
    label: str
    url: str | None = None
    available: bool = False


@dataclass(frozen=True)
class ScanResult:
    scan_id: str
    status: ScanStatus
    source: DataSource
    analysed_at: str
    file: FileInfo
    validation: DocumentValidation
    ats: AtsScore | None = None
    ca1: Ca1Score | None = None
    categories: list[CategoryResult] = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)
    sections_detected: list[str] = field(default_factory=list)
    review_flags: list[ReviewFlag] = field(default_factory=list)
    reports: list[ReportArtifact] = field(default_factory=list)
    error: str | None = None

    @property
    def is_demo(self) -> bool:
        return self.source == "demo"

    @property
    def has_scores(self) -> bool:
        """Scores are only meaningful for a completed scan of a valid resume."""
        return self.status == "completed" and self.validation.is_resume

    def findings_by_severity(self) -> list[Finding]:
        return sorted(self.findings, key=lambda f: SEVERITY_ORDER.get(f.severity, 9))

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any], source: DataSource) -> ScanResult:
        """Build a result from API JSON. Raises (KeyError/TypeError/ValueError) on bad contracts."""

        def opt(key, builder):
            value = data.get(key)
            return builder(value) if value else None

        ats = opt(
            "ats",
            lambda v: AtsScore(
                score=float(v["score"]),
                summary=v.get("summary", ""),
                components=[ScoreComponent(**c) for c in v.get("components", [])],
            ),
        )
        ca1 = opt(
            "ca1",
            lambda v: Ca1Score(
                total=float(v["total"]),
                status=v["status"],
                rubric=[RubricItem(**r) for r in v.get("rubric", [])],
                reviewed_by=v.get("reviewed_by"),
                reviewed_at=v.get("reviewed_at"),
                max_score=float(v.get("max_score", CA1_MAX)),
            ),
        )
        if ats and not 0 <= ats.score <= ATS_MAX:
            raise ValueError(f"ATS score out of range: {ats.score}")
        if ca1 and not 0 <= ca1.total <= ca1.max_score:
            raise ValueError(f"CA1 score out of range: {ca1.total}")

        findings = []
        for f in data.get("findings", []):
            f = dict(f)
            loc = f.pop("location", None)
            findings.append(Finding(location=FindingLocation(**loc) if loc else None, **f))

        return cls(
            scan_id=data["scan_id"],
            status=data["status"],
            source=source,
            analysed_at=data.get("analysed_at", ""),
            file=FileInfo(**data["file"]),
            validation=DocumentValidation(**data["validation"]),
            ats=ats,
            ca1=ca1,
            categories=[CategoryResult(**c) for c in data.get("categories", [])],
            findings=findings,
            sections_detected=list(data.get("sections_detected", [])),
            review_flags=[ReviewFlag(**r) for r in data.get("review_flags", [])],
            reports=[ReportArtifact(**r) for r in data.get("reports", [])],
            error=data.get("error"),
        )
