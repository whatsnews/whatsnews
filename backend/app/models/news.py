# app/models/news.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import TimestampedModel
import enum


class UpdateFrequency(str, enum.Enum):
    THIRTY_MINUTES = "30_minutes"  # This is how it's stored in DB
    HOURLY = "hourly"
    DAILY = "daily"

class News(TimestampedModel):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    frequency = Column(Enum(UpdateFrequency), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    prompt = relationship("Prompt", back_populates="news_items")