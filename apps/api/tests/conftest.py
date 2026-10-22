from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault("BITI_ENV", "development")
os.environ.setdefault("BITI_DEMO_MODE", "true")
os.environ.setdefault("BITI_SECRET_KEY", "test-secret")
tmp = ROOT.parent.parent / "data" / "local"
tmp.mkdir(parents=True, exist_ok=True)
db_file = tmp / "biti-test.sqlite"
if db_file.exists():
    db_file.unlink()
os.environ["BITI_DATABASE_URL"] = f"sqlite:///{db_file}"

from biti.config import get_settings  # noqa: E402

get_settings.cache_clear()
