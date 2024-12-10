# app/models/__init__.py
from app.models.base import TimestampedModel, Base
from app.models.user import User
from app.models.prompt import Prompt
from app.models.news import News, UpdateFrequency

__all__ = [
    "Base",
    "TimestampedModel",
    "User",
    "Prompt",
    "News",
    "UpdateFrequency"
]