# app/schemas/news.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.news import UpdateFrequency

class NewsBase(BaseModel):
    title: str
    content: str
    frequency: UpdateFrequency

class NewsCreate(NewsBase):
    prompt_id: int

class NewsUpdate(NewsBase):
    title: Optional[str] = None
    content: Optional[str] = None
    frequency: Optional[UpdateFrequency] = None
    prompt_id: Optional[int] = None

class News(NewsBase):
    id: int
    prompt_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True