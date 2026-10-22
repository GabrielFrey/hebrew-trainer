"""Weekly permitted-source pipeline. Never auto-publishes."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from biti.config import get_settings
from biti.grading import grade_text
from biti.models import ContentSource, Draft, SyncRun, new_id

ADAPTERS = ("original_frequency", "wiktionary", "hebrew_academy", "ben_yehuda")


def _checksum(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def original_frequency_adapter() -> list[dict[str, Any]]:
    """Original starter list — not a scraped corpus."""
    words = [
        ("שלום", "hello / peace", "CC0-equivalent original"),
        ("תודה", "thank you", "CC0-equivalent original"),
        ("מים", "water", "CC0-equivalent original"),
        ("לחם", "bread", "CC0-equivalent original"),
        ("בית", "house", "CC0-equivalent original"),
    ]
    return [
        {
            "adapter": "original_frequency",
            "url": "https://example.invalid/biti-ivrit/original-frequency",
            "license": "proprietary-original",
            "lemma": he,
            "gloss": gloss,
            "attribution": note,
        }
        for he, gloss, note in words
    ]


async def wiktionary_adapter(term: str = "שלום") -> list[dict[str, Any]]:
    settings = get_settings()
    url = "https://en.wiktionary.org/api/rest_v1/page/summary/" + term
    try:
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": settings.http_user_agent}) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return []
            data = r.json()
    except httpx.HTTPError:
        return []
    extract = (data.get("extract") or "")[:400]
    return [
        {
            "adapter": "wiktionary",
            "url": data.get("content_urls", {}).get("desktop", {}).get("page") or url,
            "license": "CC BY-SA",
            "lemma": term,
            "gloss": extract,
            "attribution": "Source: Wiktionary, CC BY-SA. https://en.wiktionary.org/wiki/Wiktionary:Copyrights",
            "raw": json.dumps(data, ensure_ascii=False)[:2000],
        }
    ]


async def hebrew_academy_adapter() -> list[dict[str, Any]]:
    """Records the public homepage. Editorial must confirm reuse terms."""
    settings = get_settings()
    url = "https://hebrew-academy.org.il/"
    try:
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": settings.http_user_agent}) as client:
            r = await client.get(url)
            body = r.text[:500] if r.status_code == 200 else ""
    except httpx.HTTPError:
        body = ""
    return [
        {
            "adapter": "hebrew_academy",
            "url": url,
            "license": "site-terms-unverified",
            "lemma": "academy-index",
            "gloss": "Academy public index recorded for editorial review. Not learner-facing.",
            "attribution": url,
            "raw": body,
            "flags": ["needs_terms_review"] if body else ["fetch_failed"],
        }
    ]


async def ben_yehuda_adapter() -> list[dict[str, Any]]:
    settings = get_settings()
    url = "https://benyehuda.org/"
    try:
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": settings.http_user_agent}) as client:
            r = await client.get(url)
            ok = r.status_code == 200
            excerpt = r.text[:300] if ok else ""
    except httpx.HTTPError:
        ok = False
        excerpt = ""
    return [
        {
            "adapter": "ben_yehuda",
            "url": url,
            "license": "public-domain-project-terms",
            "lemma": "ben-yehuda-index",
            "gloss": "Project Ben-Yehuda index. Individual works need editorial PD check.",
            "attribution": url,
            "raw": excerpt,
            "flags": [] if ok else ["fetch_failed"],
        }
    ]


def validate_draft_payload(item: dict[str, Any]) -> list[str]:
    errors = []
    if not item.get("license"):
        errors.append("missing_license")
    if item.get("license") in {"unknown", "site-terms-unverified"}:
        errors.append("license_needs_review")
    if item.get("lemma") and item.get("accepted"):
        g = grade_text(item["lemma"], item["accepted"], "relaxed")
        if g.result != "correct":
            errors.append("self_test_failed")
    if any(tok in (item.get("gloss") or "").lower() for tok in ("<script", "ignore previous")):
        errors.append("suspicious")
    return errors


def persist_items(db: Session, items: list[dict[str, Any]], run: SyncRun) -> dict[str, int]:
    stats = {"sources": 0, "drafts": 0, "flagged": 0, "duplicates": 0}
    seen = {row.checksum for row in db.query(ContentSource).all()}
    for item in items:
        raw = item.get("raw") or json.dumps(item, ensure_ascii=False)
        checksum = _checksum(raw)
        if checksum in seen:
            stats["duplicates"] += 1
            continue
        seen.add(checksum)
        src = ContentSource(
            id=new_id(),
            adapter=item["adapter"],
            url=item.get("url") or "",
            license=item.get("license") or "unknown",
            checksum=checksum,
            attribution=item.get("attribution") or "",
            raw_excerpt=(item.get("gloss") or "")[:500],
            fetched_at=datetime.now(timezone.utc),
        )
        db.add(src)
        db.flush()
        stats["sources"] += 1
        flags = list(item.get("flags") or []) + validate_draft_payload(item)
        if "suspicious" in flags:
            stats["flagged"] += 1
        db.add(
            Draft(
                kind="vocab_card",
                payload={
                    "lemma": item.get("lemma"),
                    "gloss": item.get("gloss"),
                    "attribution": item.get("attribution"),
                    "license": item.get("license"),
                },
                status="in_review",
                source_id=src.id,
                flags=flags,
            )
        )
        stats["drafts"] += 1
    run.stats = stats
    return stats


async def run_pipeline(db: Session) -> SyncRun:
    running = db.query(SyncRun).filter(SyncRun.status == "running", SyncRun.lock_name == "weekly").one_or_none()
    if running:
        return running
    run = SyncRun(status="running", lock_name="weekly")
    db.add(run)
    db.commit()
    db.refresh(run)
    items = original_frequency_adapter()
    items += await wiktionary_adapter("שלום")
    items += await hebrew_academy_adapter()
    items += await ben_yehuda_adapter()
    persist_items(db, items, run)
    run.status = "done"
    run.finished_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(run)
    return run
