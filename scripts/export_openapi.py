import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))
os.environ.setdefault("BITI_ENV", "development")
os.environ.setdefault("BITI_DEMO_MODE", "true")

from biti.main import app

out = ROOT / "packages" / "sdk" / "openapi.json"
out.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2))
print(out)
