from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Cookie, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from biti.config import get_settings
from biti.db import get_db
from biti.models import User, new_id

ROLES = ("learner", "editor", "content_admin", "system_admin")


def issue_token(user: User, minutes: int | None = None) -> str:
    settings = get_settings()
    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes or settings.access_token_minutes)
    return jwt.encode(
        {
            "sub": user.id,
            "role": user.role,
            "mode": "demo" if settings.demo_mode else "oidc",
            "exp": exp,
        },
        settings.secret_key,
        algorithm="HS256",
    )


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="invalid_token") from exc


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    biti_session: str | None = Cookie(default=None),
) -> User:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    elif biti_session:
        token = biti_session
    if not token:
        raise HTTPException(status_code=401, detail="not_authenticated")
    payload = decode_token(token)
    user = db.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="user_missing")
    return user


def require_role(*roles: str):
    def _inner(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="forbidden")
        return user

    return _inner


def get_optional_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    biti_session: str | None = Cookie(default=None),
) -> User | None:
    try:
        return get_current_user(db=db, authorization=authorization, biti_session=biti_session)
    except HTTPException:
        return None


def demo_user(
    db: Session,
    ui_language: str,
    display_name: str,
    role: str = "learner",
    email: str | None = None,
) -> User:
    settings = get_settings()
    if not settings.demo_mode:
        raise HTTPException(status_code=403, detail="demo_disabled")
    if role not in ROLES:
        role = "learner"
    email = email or f"demo-{role}@biti.local"
    allowed = {"ru", "uk", "en", "es", "fr", "he"}
    user = db.query(User).filter(User.email == email).one_or_none()
    if user is None:
        user = User(
            id=new_id(),
            email=email,
            display_name=display_name or "Biti learner",
            role=role,
            ui_language=ui_language if ui_language in allowed else "ru",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.ui_language = ui_language if ui_language in allowed else user.ui_language
        if display_name:
            user.display_name = display_name
        db.commit()
        db.refresh(user)
    return user
