from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.news import UpdateFrequency
from app.models.prompt import VisibilityType
from app.schemas.base import TimestampedSchema


class NewsBase(BaseModel):
    frequency: UpdateFrequency = Field(..., description="Update frequency of the news")


class NewsCreate(NewsBase):
    prompt_id: int = Field(..., description="ID of the prompt used to generate this news")


class NewsUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Title of the news")
    content: Optional[str] = Field(None, description="Content of the news")
    frequency: Optional[UpdateFrequency] = Field(None, description="Update frequency")
    prompt_id: Optional[int] = Field(None, description="ID of the associated prompt")


class NewsResponse(BaseModel):
    id: int
    title: str
    content: str
    frequency: UpdateFrequency
    prompt_id: int
    created_at: datetime
    updated_at: datetime
    visibility: VisibilityType = Field(
        ..., 
        description="Visibility inherited from the parent prompt"
    )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "title": "Daily Update - 2024-03-14 12:00 UTC",
                "content": "Today's summary of important events...",
                "frequency": "daily",
                "prompt_id": 1,
                "created_at": "2024-03-14T12:00:00Z",
                "updated_at": "2024-03-14T12:00:00Z",
                "visibility": "PUBLIC"
            }
        }
    }


class News(NewsBase, TimestampedSchema):
    id: int
    title: str
    content: str
    prompt_id: int
    visibility: VisibilityType

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "title": "Daily Update - 2024-03-14 12:00 UTC",
                "content": "Today's summary of important events...",
                "frequency": "daily",
                "prompt_id": 1,
                "created_at": "2024-03-14T12:00:00Z",
                "updated_at": "2024-03-14T12:00:00Z",
                "visibility": "PUBLIC"
            }
        }
    }


class PublicNewsResponse(NewsResponse):
    prompt_name: str = Field(..., description="Name of the parent prompt")
    prompt_owner: str = Field(..., description="Username of the prompt owner")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "title": "Daily Update - 2024-03-14 12:00 UTC",
                "content": "Today's summary of important events...",
                "frequency": "daily",
                "prompt_id": 1,
                "created_at": "2024-03-14T12:00:00Z",
                "updated_at": "2024-03-14T12:00:00Z",
                "visibility": "PUBLIC",
                "prompt_name": "Daily Tech News",
                "prompt_owner": "techuser"
            }
        }
    }


class NewsListResponse(BaseModel):
    total: int = Field(..., description="Total number of news items")
    items: List[NewsResponse]

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "total": 1,
                "items": [{
                    "id": 1,
                    "title": "Daily Update - 2024-03-14 12:00 UTC",
                    "content": "Today's summary of important events...",
                    "frequency": "daily",
                    "prompt_id": 1,
                    "created_at": "2024-03-14T12:00:00Z",
                    "updated_at": "2024-03-14T12:00:00Z",
                    "visibility": "PUBLIC"
                }]
            }
        }
    }