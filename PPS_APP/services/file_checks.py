"""Client-side upload checks.

These checks run locally before anything is sent to the scanner. They only
confirm that a file is a readable PDF/DOCX of an acceptable size — they do NOT
decide whether the document is a resume. Resume-vs-not-resume validation is
the scanner's job and is reported back in `ScanResult.validation`.
"""

from __future__ import annotations

import io
import re
import zipfile
from dataclasses import dataclass, field
from xml.etree import ElementTree

ALLOWED_EXTENSIONS = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
DEFAULT_MAX_MB = 5
_WORD_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


@dataclass(frozen=True)
class FileCheck:
    ok: bool
    name: str
    extension: str
    mime_type: str
    size_bytes: int
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def size_label(self) -> str:
        return human_size(self.size_bytes)


def human_size(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.0f} KB"
    return f"{size / (1024 * 1024):.1f} MB"


def check_file(name: str, data: bytes, max_mb: int = DEFAULT_MAX_MB) -> FileCheck:
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    mime = ALLOWED_EXTENSIONS.get(ext, "application/octet-stream")
    errors: list[str] = []
    warnings: list[str] = []
    size = len(data)

    if ext not in ALLOWED_EXTENSIONS:
        errors.append("Unsupported file type. Upload a PDF or DOCX file.")
    if size == 0:
        errors.append("The file is empty (0 bytes).")
    elif size > max_mb * 1024 * 1024:
        errors.append(f"The file is {human_size(size)}; the limit is {max_mb} MB.")

    if not errors:
        if ext == "pdf":
            if not data.lstrip()[:5].startswith(b"%PDF-"):
                errors.append("This file has a .pdf extension but is not a valid PDF.")
            elif b"%%EOF" not in data[-2048:]:
                warnings.append("The PDF may be truncated or incomplete.")
            if b"/Encrypt" in data:
                warnings.append("The PDF appears to be password-protected or encrypted; text extraction may fail.")
        elif ext == "docx":
            errors.extend(_check_docx(data))

    return FileCheck(not errors, name, ext, mime, size, errors, warnings)


def _check_docx(data: bytes) -> list[str]:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            if "word/document.xml" not in zf.namelist():
                return ["This .docx file is missing its document body and cannot be read."]
            if zf.testzip() is not None:
                return ["This .docx file is corrupted."]
    except zipfile.BadZipFile:
        return ["This file has a .docx extension but is not a valid Word document."]
    return []


def docx_text(data: bytes) -> list[str]:
    """Return the paragraph text of a DOCX (formatting is not preserved)."""
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        root = ElementTree.fromstring(zf.read("word/document.xml"))
    paragraphs = []
    for para in root.iter(f"{_WORD_NS}p"):
        text = "".join(node.text or "" for node in para.iter(f"{_WORD_NS}t"))
        paragraphs.append(re.sub(r"\s+", " ", text).strip())
    return [p for p in paragraphs if p]
