from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from biti.models import CourseProgress, SRSCard, StreakDay, User, XPLedger, new_id, utcnow

SRS_STEPS = (1, 3, 7, 14, 30)
HEARTS_MAX = 5
HEARTS_REGEN_MIN = 30
HINT_XP = (1.0, 0.7, 0.4, 0.2)


def user_today(user: User, now: datetime | None = None) -> str:
    now = now or utcnow()
    try:
        tz = ZoneInfo(user.timezone)
    except Exception:
        tz = ZoneInfo("Asia/Jerusalem")
    return now.astimezone(tz).date().isoformat()


def regen_hearts(user: User, now: datetime | None = None) -> None:
    now = now or utcnow()
    updated = user.hearts_updated_at
    if updated.tzinfo is None:
        updated = updated.replace(tzinfo=now.tzinfo)
    elapsed = max(0, int((now - updated).total_seconds() // 60))
    gained = elapsed // HEARTS_REGEN_MIN
    if gained and user.hearts < HEARTS_MAX:
        user.hearts = min(HEARTS_MAX, user.hearts + gained)
        user.hearts_updated_at = now


def spend_heart(db: Session, user: User) -> bool:
    regen_hearts(user)
    if user.hearts <= 0:
        return False
    user.hearts -= 1
    user.hearts_updated_at = utcnow()
    db.add(user)
    db.flush()
    return True


def award_xp(db: Session, user: User, attempt_id: str, reason: str, amount: int) -> int:
    if amount <= 0:
        return 0
    existing = (
        db.query(XPLedger)
        .filter(XPLedger.user_id == user.id, XPLedger.attempt_id == attempt_id, XPLedger.reason == reason)
        .one_or_none()
    )
    if existing:
        return 0
    row = XPLedger(user_id=user.id, attempt_id=attempt_id, reason=reason, amount=amount)
    db.add(row)
    try:
        db.flush()
    except IntegrityError:
        db.flush()
        return 0
    user.xp_total += amount
    progress = (
        db.query(CourseProgress)
        .filter(CourseProgress.user_id == user.id, CourseProgress.course_id == (user.course_id or "he-ru"))
        .one_or_none()
    )
    if progress is None:
        progress = CourseProgress(id=new_id(), user_id=user.id, course_id=user.course_id or "he-ru")
        db.add(progress)
        db.flush()
    progress.xp_total += amount
    day = user_today(user)
    streak = db.query(StreakDay).filter(StreakDay.user_id == user.id, StreakDay.day == day).one_or_none()
    if streak is None:
        streak = StreakDay(user_id=user.id, day=day, xp=0)
        db.add(streak)
        db.flush()
    streak.xp += amount
    _update_streak(user, day)
    _update_league(user)
    progress.streak_count = user.streak_count
    progress.last_streak_date = user.last_streak_date
    progress.league = user.league
    db.add(user)
    return amount


def _update_streak(user: User, today: str) -> None:
    if user.last_streak_date == today:
        return
    if user.last_streak_date:
        prev = datetime.fromisoformat(user.last_streak_date).date()
        cur = datetime.fromisoformat(today).date()
        if cur - prev == timedelta(days=1):
            user.streak_count += 1
        elif cur - prev > timedelta(days=1):
            if user.freeze_available > 0:
                user.freeze_available -= 1
                user.streak_count += 1
            else:
                user.streak_count = 1
        else:
            user.streak_count = max(1, user.streak_count)
    else:
        user.streak_count = 1
    user.last_streak_date = today


def _update_league(user: User) -> None:
    if user.xp_total >= 400:
        user.league = "pomegranate"
    elif user.xp_total >= 150:
        user.league = "indigo"
    else:
        user.league = "olive"


def xp_for_correct(hint_level: int, base: int = 10) -> int:
    idx = min(max(hint_level, 0), len(HINT_XP) - 1)
    return int(base * HINT_XP[idx])


def schedule_card(
    db: Session,
    user: User,
    kind: str,
    prompt: dict,
    accepted: list[str],
    correct: bool,
    now: datetime | None = None,
) -> SRSCard:
    key = f"{kind}:{prompt.get('id') or prompt.get('lemma') or prompt.get('he')}"
    card = (
        db.query(SRSCard)
        .filter(SRSCard.user_id == user.id, SRSCard.kind == kind, SRSCard.due_prompt == key)
        .one_or_none()
    )
    today = user_today(user, now=now)
    if card is None:
        card = SRSCard(
            user_id=user.id,
            kind=kind,
            prompt=prompt,
            accepted=accepted,
            step=0,
            due_day=today,
            due_prompt=key,
        )
        db.add(card)
        db.flush()
    if correct:
        days = SRS_STEPS[min(card.step, len(SRS_STEPS) - 1)]
        card.step = min(card.step + 1, len(SRS_STEPS) - 1)
    else:
        card.step = 0
        days = SRS_STEPS[0]
    base = datetime.fromisoformat(today).date()
    card.due_day = (base + timedelta(days=days)).isoformat()
    card.accepted = accepted
    return card
