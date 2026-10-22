from pathlib import Path

from fastapi.testclient import TestClient

from biti.courses import COURSES
from biti import BRAND_NAME

ROOT = Path(__file__).resolve().parents[3]


def test_english_product_name_is_biti_hebrew() -> None:
    assert BRAND_NAME == "Biti Hebrew"
    en = (ROOT / "packages/i18n/src/en.ts").read_text(encoding="utf-8")
    assert 'name: "Biti Hebrew"' in en
    assert "Welcome to Biti Hebrew" in en
    assert "Ivrit" not in en
    assert "ivrit" not in en.lower()


def test_en_locale_user_facing_files_contain_no_ivrit() -> None:
    files = [
        ROOT / "packages/i18n/src/en.ts",
        ROOT / "apps/mobile/locales/en.json",
        ROOT / "apps/mobile/ios-infoplist/en.lproj/InfoPlist.strings",
        ROOT / "store/en/app-store.txt",
        ROOT / "store/en/play-store.txt",
        ROOT / "apps/web/public/manifest.webmanifest",
        ROOT / "apps/web/src/components/BitiMascot.tsx",
        ROOT / "apps/mobile/components/BitiMascot.tsx",
        ROOT / "apps/web/src/app/layout.tsx",
        ROOT / "packages/sdk/openapi.json",
        ROOT / "packages/design-tokens/src/index.ts",
    ]
    missing = [str(path) for path in files if not path.exists()]
    assert missing == []
    hits: list[str] = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        if "ivrit" in text.lower():
            hits.append(str(path.relative_to(ROOT)))
    assert hits == [], hits


def test_health_and_openapi_use_english_product_name(client: TestClient) -> None:
    health = client.get("/health").json()
    assert health["brand"] == "Biti Hebrew"
    spec = client.get("/openapi.json").json()
    assert spec["info"]["title"] == "Biti Hebrew"


def test_english_course_titles_have_no_ivrit() -> None:
    for course in COURSES:
        en = course["title"]["en"]
        assert "ivrit" not in en.lower(), course["id"]
        pair = course["pair"]
        assert "ivrit" not in pair.lower(), course["id"]
    he_en = next(c for c in COURSES if c["id"] == "he-en")
    assert he_en["pair"] == "Hebrew–English"


def test_other_locales_keep_biti_ivrit() -> None:
    ru = (ROOT / "packages/i18n/src/ru.ts").read_text(encoding="utf-8")
    assert "Biti Ivrit" in ru
    uk = (ROOT / "packages/i18n/src/uk.ts").read_text(encoding="utf-8")
    assert "Biti Ivrit" in uk
    locale_en = (ROOT / "apps/mobile/locales/en.json").read_text(encoding="utf-8")
    assert "Biti Hebrew" in locale_en
    locale_ru = (ROOT / "apps/mobile/locales/ru.json").read_text(encoding="utf-8")
    assert "Biti Ivrit" in locale_ru
