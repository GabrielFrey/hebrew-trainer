from celery import Celery
from celery.schedules import crontab

from biti.config import get_settings

settings = get_settings()
broker = settings.redis_url or "redis://127.0.0.1:6379/0"
app = Celery("biti", broker=broker, backend=broker)
app.conf.timezone = "UTC"

minute, hour, *_rest, day_of_week = (settings.pipeline_cron.split() + ["0", "3", "*", "*", "1"])[:5]
app.conf.beat_schedule = {
    "weekly-content-pipeline": {
        "task": "biti.celery_app.weekly_pipeline",
        "schedule": crontab(minute=minute, hour=hour, day_of_week=day_of_week),
    }
}


@app.task(name="biti.celery_app.weekly_pipeline")
def weekly_pipeline() -> str:
    import asyncio

    from biti.db import SessionLocal
    from biti.pipeline import run_pipeline

    db = SessionLocal()
    try:
        run = asyncio.get_event_loop().run_until_complete(run_pipeline(db))
        return run.id
    finally:
        db.close()
