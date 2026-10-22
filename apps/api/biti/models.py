from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str | None] = mapped_column(String(320), unique=True)
    display_name: Mapped[str] = mapped_column(String(120), default="Learner")
    role: Mapped[str] = mapped_column(String(32), default="learner")
    ui_language: Mapped[str] = mapped_column(String(8), default="ru")
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Jerusalem")
    motivation: Mapped[str] = mapped_column(String(32), default="aliyah")
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=50)
    niqqud_default: Mapped[bool] = mapped_column(Boolean, default=True)
    translit_default: Mapped[bool] = mapped_column(Boolean, default=True)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    xp_total: Mapped[int] = mapped_column(Integer, default=0)
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    last_streak_date: Mapped[str | None] = mapped_column(String(16))
    freeze_available: Mapped[int] = mapped_column(Integer, default=1)
    league: Mapped[str] = mapped_column(String(32), default="olive")
    level: Mapped[str] = mapped_column(String(32), default="starter")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    attempts: Mapped[list[Attempt]] = relationship(back_populates="user")


class Track(Base):
    __tablename__ = "tracks"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    title: Mapped[dict[str, str]] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(16), default="published")
    sort: Mapped[int] = mapped_column(Integer, default=0)


class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    track_id: Mapped[str] = mapped_column(ForeignKey("tracks.id"))
    kind: Mapped[str] = mapped_column(String(16), default="lesson")
    level: Mapped[str] = mapped_column(String(32))
    cefr: Mapped[str] = mapped_column(String(16))
    prerequisites: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(16), default="draft")
    sort: Mapped[int] = mapped_column(Integer, default=0)


class LessonVersion(Base):
    __tablename__ = "lesson_versions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    lesson_id: Mapped[str] = mapped_column(ForeignKey("lessons.id"))
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(16), default="draft")
    title: Mapped[dict[str, str]] = mapped_column(JSON)
    objective: Mapped[dict[str, str]] = mapped_column(JSON)
    explanation: Mapped[dict[str, str]] = mapped_column(JSON)
    vocabulary: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    exercises: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    threshold: Mapped[float] = mapped_column(Float, default=0.8)
    editorial: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    license: Mapped[str] = mapped_column(String(80), default="proprietary")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    lesson_version_id: Mapped[str] = mapped_column(ForeignKey("lesson_versions.id"))
    status: Mapped[str] = mapped_column(String(16), default="in_progress")
    results: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    accuracy: Mapped[float] = mapped_column(Float, default=0)
    hint_level: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user: Mapped[User] = relationship(back_populates="attempts")


class AttemptEvent(Base):
    __tablename__ = "attempt_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("attempts.id"))
    exercise_id: Mapped[str] = mapped_column(String(40))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
    grade: Mapped[dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    client_key: Mapped[str] = mapped_column(String(80), default="")
    __table_args__ = (UniqueConstraint("attempt_id", "exercise_id", "client_key", name="uq_event_idem"),)


class XPLedger(Base):
    __tablename__ = "xp_ledger"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    attempt_id: Mapped[str] = mapped_column(String(36))
    reason: Mapped[str] = mapped_column(String(40))
    amount: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    __table_args__ = (UniqueConstraint("user_id", "attempt_id", "reason", name="uq_xp_once"),)


class StreakDay(Base):
    __tablename__ = "streak_days"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    day: Mapped[str] = mapped_column(String(16))
    xp: Mapped[int] = mapped_column(Integer, default=0)
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_streak_day"),)


class SRSCard(Base):
    __tablename__ = "srs_cards"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[str] = mapped_column(String(24))
    prompt: Mapped[dict[str, Any]] = mapped_column(JSON)
    accepted: Mapped[list[str]] = mapped_column(JSON)
    step: Mapped[int] = mapped_column(Integer, default=0)
    due_day: Mapped[str] = mapped_column(String(16))
    __table_args__ = (UniqueConstraint("user_id", "kind", "due_prompt", name="uq_srs_prompt"),)

    due_prompt: Mapped[str] = mapped_column(String(160), default="")


class SRSReview(Base):
    __tablename__ = "srs_reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    card_id: Mapped[str] = mapped_column(ForeignKey("srs_cards.id"))
    result: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ContentSource(Base):
    __tablename__ = "content_sources"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    adapter: Mapped[str] = mapped_column(String(40))
    url: Mapped[str] = mapped_column(Text)
    license: Mapped[str] = mapped_column(String(80))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    checksum: Mapped[str] = mapped_column(String(64))
    attribution: Mapped[str] = mapped_column(Text, default="")
    raw_excerpt: Mapped[str] = mapped_column(Text, default="")


class SyncRun(Base):
    __tablename__ = "sync_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    status: Mapped[str] = mapped_column(String(16), default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    stats: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    lock_name: Mapped[str] = mapped_column(String(40), default="weekly")


class Draft(Base):
    __tablename__ = "drafts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    kind: Mapped[str] = mapped_column(String(24))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(16), default="in_review")
    source_id: Mapped[str | None] = mapped_column(ForeignKey("content_sources.id"))
    flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EditorialReview(Base):
    __tablename__ = "editorial_reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    draft_id: Mapped[str] = mapped_column(ForeignKey("drafts.id"))
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(16))
    comment: Mapped[str] = mapped_column(Text, default="")
    native_speaker: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    actor_id: Mapped[str | None] = mapped_column(String(36))
    action: Mapped[str] = mapped_column(String(40))
    target: Mapped[str] = mapped_column(String(80))
    detail: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Outbox(Base):
    __tablename__ = "outbox"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    topic: Mapped[str] = mapped_column(String(40))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    published: Mapped[bool] = mapped_column(Boolean, default=False)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class PublishedChunk(Base):
    """RAG corpus — published lesson text only."""

    __tablename__ = "published_chunks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    lesson_version_id: Mapped[str] = mapped_column(ForeignKey("lesson_versions.id"))
    lesson_id: Mapped[str] = mapped_column(String(36))
    section: Mapped[str] = mapped_column(String(40))
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)
