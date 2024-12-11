from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.models.base import TimestampedModel
from datetime import timezone
import pytz


class User(TimestampedModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    timezone = Column(String, nullable=False, default="UTC")  # Store timezone as string (e.g., "America/New_York")
    news_generation_hour_1 = Column(Integer, nullable=False, default=6)  # First daily news generation hour (default 6 AM)
    news_generation_hour_2 = Column(Integer, nullable=False, default=18)  # Second daily news generation hour (default 6 PM)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Relationships
    prompts = relationship("Prompt", back_populates="user", cascade="all, delete-orphan")

    def get_timezone(self):
        """Returns a timezone object for the user's timezone"""
        return pytz.timezone(self.timezone)

    def convert_to_user_time(self, utc_time):
        """Convert UTC time to user's timezone"""
        utc_time = utc_time.replace(tzinfo=timezone.utc)
        return utc_time.astimezone(self.get_timezone())

    def convert_to_utc(self, local_time):
        """Convert user's local time to UTC"""
        local_tz = self.get_timezone()
        local_time = local_tz.localize(local_time)
        return local_time.astimezone(timezone.utc)