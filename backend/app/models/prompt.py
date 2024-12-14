# app/models/prompt.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import TimestampedModel
import enum
from slugify import slugify


class TemplateType(str, enum.Enum):
    SUMMARY = "summary"
    ANALYSIS = "analysis"
    BULLET_POINTS = "bullet_points"
    NARRATIVE = "narrative"


# app/models/prompt.py

class VisibilityType(str, enum.Enum):
    PRIVATE = "PRIVATE"
    INTERNAL = "INTERNAL"
    PUBLIC = "PUBLIC"


class Prompt(TimestampedModel):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    template_type = Column(Enum(TemplateType), nullable=False, default=TemplateType.SUMMARY)
    custom_template = Column(Text, nullable=True)  # For custom templates, null means use default template
    visibility = Column(Enum(VisibilityType), nullable=False, default=VisibilityType.PRIVATE)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="prompts")
    news_items = relationship("News", back_populates="prompt", cascade="all, delete-orphan")

    # Unique constraint for user_id + slug combination
    __table_args__ = (
        UniqueConstraint('user_id', 'slug', name='uq_user_prompt_slug'),
    )

    def generate_slug(self) -> str:
        """Generate a URL-friendly slug from the prompt name."""
        base_slug = slugify(self.name)
        return base_slug