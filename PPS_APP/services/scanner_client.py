"""Centralized access to the resume scanner.

Pages never call the network or read demo fixtures directly — they call
`get_scanner_client()` and use the returned client.

* `HttpScannerClient` is used when `SCANNER_API_URL` is set (environment
  variable or `.streamlit/secrets.toml`). See API_INTEGRATION.md.
* `DemoScannerClient` is used otherwise. It returns labelled sample results
  (`source="demo"`) and never pretends to have analysed the uploaded file.
"""

from __future__ import annotations

import os
import uuid
from typing import Protocol

import requests

from services.demo_data import DEMO_PAYLOADS
from services.models import ScanResult

DEFAULT_TIMEOUT_S = 90


class ScannerError(Exception):
    """A user-presentable failure talking to the scanner."""


class ScannerClient(Protocol):
    mode: str  # "live" | "demo"

    def scan(
        self,
        file_name: str,
        data: bytes,
        mime_type: str,
        target_jd: str = "",
        demo_scenario: str | None = None,
    ) -> ScanResult: ...

    def fetch_report(self, url: str) -> bytes: ...


class DemoScannerClient:
    mode = "demo"

    def scan(self, file_name, data, mime_type, target_jd="", demo_scenario=None) -> ScanResult:
        payload = DEMO_PAYLOADS.get(demo_scenario or "valid_resume")
        if payload is None:
            raise ScannerError(f"Unknown demo scenario: {demo_scenario}")
        # Fresh id per run so session history keeps each run distinct.
        payload = {**payload, "scan_id": f"{payload['scan_id']}-{uuid.uuid4().hex[:6]}"}
        return ScanResult.from_dict(payload, source="demo")

    def fetch_report(self, url: str) -> bytes:
        raise ScannerError("Reports are not available in demo mode.")


class HttpScannerClient:
    mode = "live"

    def __init__(self, base_url: str, api_key: str | None = None, timeout: float = DEFAULT_TIMEOUT_S):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        if api_key:
            self.session.headers["Authorization"] = f"Bearer {api_key}"

    def scan(self, file_name, data, mime_type, target_jd="", demo_scenario=None) -> ScanResult:
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/scans",
                files={"file": (file_name, data, mime_type)},
                data={"target_jd": target_jd},
                timeout=self.timeout,
            )
        except requests.Timeout as exc:
            raise ScannerError("The scanner took too long to respond. Try again in a moment.") from exc
        except requests.RequestException as exc:
            raise ScannerError("Could not reach the scanner service. Check your connection and try again.") from exc

        if response.status_code == 413:
            raise ScannerError("The file is larger than the scanner accepts.")
        if response.status_code == 415:
            raise ScannerError("The scanner does not support this file type.")
        if response.status_code >= 400:
            raise ScannerError(_error_message(response))

        try:
            return ScanResult.from_dict(response.json(), source="live")
        except (ValueError, KeyError, TypeError) as exc:
            raise ScannerError("The scanner returned a response the app could not read.") from exc

    def fetch_report(self, url: str) -> bytes:
        full = url if url.startswith("http") else f"{self.base_url}{url}"
        try:
            response = self.session.get(full, timeout=self.timeout)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ScannerError("The report could not be downloaded.") from exc
        return response.content


def _error_message(response: requests.Response) -> str:
    try:
        detail = response.json().get("detail")
        if isinstance(detail, str) and detail:
            return detail
    except ValueError:
        pass
    return f"The scanner returned an error (HTTP {response.status_code})."


def _setting(name: str) -> str | None:
    value = os.environ.get(name)
    if value:
        return value
    try:
        import streamlit as st

        return st.secrets.get(name)
    except Exception:  # no secrets.toml, or not running under Streamlit
        return None


def get_scanner_client() -> ScannerClient:
    base_url = _setting("SCANNER_API_URL")
    if base_url:
        return HttpScannerClient(base_url, api_key=_setting("SCANNER_API_KEY"))
    return DemoScannerClient()
