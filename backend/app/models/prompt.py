# app/models/prompt.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import TimestampedModel
import enum


class TemplateType(str, enum.Enum):
    SUMMARY = "summary"
    ANALYSIS = "analysis"
    BULLET_POINTS = "bullet_points"
    NARRATIVE = "narrative"


class VisibilityType(str, enum.Enum):
    PRIVATE = "private"
    INTERNAL = "internal"
    PUBLIC = "public"


class Prompt(TimestampedModel):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    template_type = Column(Enum(TemplateType), nullable=False, default=TemplateType.SUMMARY)
    custom_template = Column(Text, nullable=True)  # For custom templates, null means use default template
    visibility = Column(Enum(VisibilityType), nullable=False, default=VisibilityType.PRIVATE)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="prompts")
    news_items = relationship("News", back_populates="prompt", cascade="all, delete-orphan")