from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.news import UpdateFrequency
from app.schemas.base import TimestampedSchema

class NewsBase(BaseModel):
    frequency: UpdateFrequency

class NewsCreate(NewsBase):
    prompt_id: int

class NewsResponse(BaseModel):
    id: int
    title: str
    content: str
    frequency: UpdateFrequency
    prompt_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    frequency: Optional[UpdateFrequency] = None
    prompt_id: Optional[int] = None

class News(NewsBase, TimestampedSchema):
    id: int
    title: str
    content: str
    prompt_id: int

    model_config = {
        "from_attributes": True
    }