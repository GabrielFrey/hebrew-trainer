"""Refuse Python 3.15+ where anyio/FastAPI currently fail to import."""

from __future__ import annotations

import sys

SUPPORTED = "Python 3.12 or 3.13"


def require_supported_python() -> None:
    if sys.version_info >= (3, 15):
        raise SystemExit(
            f"Biti API requires {SUPPORTED}. "
            f"Python {sys.version_info.major}.{sys.version_info.minor} is not supported "
            "(anyio/FastAPI fail to import: NameError: sentinel)."
        )
    if sys.version_info < (3, 12):
        raise SystemExit(f"Biti API requires {SUPPORTED}. Found Python {sys.version.split()[0]}.")
