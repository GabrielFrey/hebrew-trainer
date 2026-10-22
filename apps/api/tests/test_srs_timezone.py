from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from biti.db import SessionLocal
from biti.models import User, new_id
from biti.services import SRS_STEPS, schedule_card, user_today


def _user(tz: str) -> tuple[object, User]:
    db = SessionLocal()
    user = User(
        id=new_id(),
        email=f"{new_id()}@tz.local",
        display_name="TZ",
        timezone=tz,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return db, user


def test_user_today_uses_iana_zone_not_utc() -> None:
    db, user = _user("Pacific/Auckland")
    try:
        # 2026-10-21 12:00 UTC is already 2026-10-22 in Auckland (NZDT, UTC+13).
        now = datetime(2026, 10, 21, 12, 0, tzinfo=timezone.utc)
        assert user_today(user, now=now) == "2026-10-22"
        jerusalem = User(
            id=new_id(),
            email=f"{new_id()}@tz.local",
            display_name="IL",
            timezone="Asia/Jerusalem",
        )
        db.add(jerusalem)
        db.commit()
        assert user_today(jerusalem, now=now) == "2026-10-21"
    finally:
        db.close()


def test_dst_spring_forward_israel_2026() -> None:
    """Israel DST 2026 starts Friday 27 March 02:00 IST → 03:00 IDT."""
    db, user = _user("Asia/Jerusalem")
    try:
        before = datetime(2026, 3, 26, 23, 30, tzinfo=timezone.utc)  # 01:30 IST (UTC+2)
        after = datetime(2026, 3, 27, 0, 30, tzinfo=timezone.utc)  # 03:30 IDT (UTC+3)
        assert user_today(user, now=before) == "2026-03-27"
        assert user_today(user, now=after) == "2026-03-27"
        assert before.astimezone(ZoneInfo("Asia/Jerusalem")).utcoffset() == timedelta(hours=2)
        assert after.astimezone(ZoneInfo("Asia/Jerusalem")).utcoffset() == timedelta(hours=3)
    finally:
        db.close()


def test_dst_fall_back_does_not_skip_or_double_due_day() -> None:
    """Israel DST 2026 ends Sunday 25 October 02:00 IDT → 01:00 IST."""
    db, user = _user("Asia/Jerusalem")
    try:
        before = datetime(2026, 10, 24, 22, 30, tzinfo=timezone.utc)  # 01:30 IDT 25 Oct
        after = datetime(2026, 10, 24, 23, 30, tzinfo=timezone.utc)  # 01:30 IST 25 Oct
        assert user_today(user, now=before) == "2026-10-25"
        assert user_today(user, now=after) == "2026-10-25"
        prompt = {"id": "dst-card", "he": "שלום"}
        card = schedule_card(db, user, "vocab", prompt, ["שלום"], True, now=before)
        db.commit()
        assert card.due_day == "2026-10-26"
        card2 = schedule_card(db, user, "vocab", prompt, ["שלום"], True, now=after)
        db.commit()
        assert card2.id == card.id
        assert card2.due_day != card.due_day or card2.step >= 1
    finally:
        db.close()


def test_srs_steps_1_3_7_14_30_and_reset() -> None:
    db, user = _user("America/New_York")
    try:
        now = datetime(2026, 1, 10, 15, 0, tzinfo=timezone.utc)
        prompt = {"id": "steps", "he": "א"}
        dues: list[str] = []
        for _ in SRS_STEPS:
            card = schedule_card(db, user, "vocab", prompt, ["א"], True, now=now)
            db.commit()
            dues.append(card.due_day)
            now = datetime.fromisoformat(f"{card.due_day}T15:00:00+00:00")
        assert dues == ["2026-01-11", "2026-01-14", "2026-01-21", "2026-02-04", "2026-03-06"]
        card = schedule_card(db, user, "vocab", prompt, ["א"], False, now=now)
        db.commit()
        assert card.step == 0
        assert card.due_day == "2026-03-07"
    finally:
        db.close()
