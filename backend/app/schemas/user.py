from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from app.schemas.base import TimestampedSchema

class UserBase(BaseModel):
    email: EmailStr
    username: str
    timezone: str = "UTC"
    news_generation_hour_1: int = 6
    news_generation_hour_2: int = 18
    is_active: bool = True
    is_superuser: bool = False

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "timezone": "America/New_York",
                "news_generation_hour_1": 6,
                "news_generation_hour_2": 18,
                "is_active": True,
                "is_superuser": False
            }
        }
    )

class UserCreate(UserBase):
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "password": "strongpassword123",
                "timezone": "America/New_York",
                "news_generation_hour_1": 6,
                "news_generation_hour_2": 18
            }
        }
    )

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    timezone: Optional[str] = None
    news_generation_hour_1: Optional[int] = None
    news_generation_hour_2: Optional[int] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "email": "newemail@example.com",
                "timezone": "America/New_York",
                "news_generation_hour_1": 7,
                "news_generation_hour_2": 19
            }
        }
    )

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserInDB(User):
    hashed_password: str

    model_config = ConfigDict(from_attributes=True)