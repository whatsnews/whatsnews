from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, select
from sqlalchemy.orm import relationship, column_property
from sqlalchemy.ext.hybrid import hybrid_property
from app.models.base import TimestampedModel
from app.models.prompt import VisibilityType
import enum


class UpdateFrequency(str, enum.Enum):
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

    # Hybrid property to get visibility from parent prompt
    @hybrid_property
    def visibility(self):
        return self.prompt.visibility if self.prompt else VisibilityType.PRIVATE

    @visibility.expression
    def visibility(cls):
        from app.models.prompt import Prompt
        return select([Prompt.visibility]).where(Prompt.id == cls.prompt_id).as_scalar()

    @classmethod
    def get_public_news_query(cls, db_query):
        """Add public visibility filter to a query."""
        from app.models.prompt import Prompt
        return db_query.join(Prompt).filter(Prompt.visibility == VisibilityType.PUBLIC)

    @classmethod
    def get_internal_news_query(cls, db_query):
        """Add internal visibility filter to a query."""
        from app.models.prompt import Prompt
        return db_query.join(Prompt).filter(Prompt.visibility == VisibilityType.INTERNAL)

    @classmethod
    def get_private_news_query(cls, db_query, user_id: int):
        """Add private visibility filter to a query for a specific user."""
        from app.models.prompt import Prompt
        return db_query.join(Prompt).filter(
            Prompt.visibility == VisibilityType.PRIVATE,
            Prompt.user_id == user_id
        )

    @classmethod
    def get_visible_news_query(cls, db_query, user_id: int = None):
        """Get query for all news visible to a user (or public if no user)."""
        from app.models.prompt import Prompt
        if user_id is None:
            return cls.get_public_news_query(db_query)
        
        return db_query.join(Prompt).filter(
            (Prompt.visibility == VisibilityType.PUBLIC) |
            (Prompt.visibility == VisibilityType.INTERNAL) |
            ((Prompt.visibility == VisibilityType.PRIVATE) & (Prompt.user_id == user_id))
        )