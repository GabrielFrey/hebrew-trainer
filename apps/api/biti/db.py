from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from biti.config import get_settings
from biti.models import Base

_settings = get_settings()
connect_args = {}
if _settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    db_path = _settings.database_url.split("///", 1)[-1]
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(_settings.database_url, connect_args=connect_args, future=True)

if _settings.database_url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _sqlite_pragma(dbapi_connection, _connection_record):  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    if _settings.database_url.startswith("sqlite"):
        with engine.begin() as conn:
            existing = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()}
            if "course_id" not in existing:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN course_id VARCHAR(16) DEFAULT 'he-ru'")
            attempts = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(attempts)").fetchall()}
            if "course_id" not in attempts:
                conn.exec_driver_sql("ALTER TABLE attempts ADD COLUMN course_id VARCHAR(16) DEFAULT 'he-ru'")
            if "combo" not in attempts:
                conn.exec_driver_sql("ALTER TABLE attempts ADD COLUMN combo INTEGER DEFAULT 0")
            lessons = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(lessons)").fetchall()}
            if "unit_id" not in lessons:
                conn.exec_driver_sql("ALTER TABLE lessons ADD COLUMN unit_id VARCHAR(40)")
            if "skill_id" not in lessons:
                conn.exec_driver_sql("ALTER TABLE lessons ADD COLUMN skill_id VARCHAR(40)")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
