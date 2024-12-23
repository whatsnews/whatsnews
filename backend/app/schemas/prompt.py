# app/schemas/prompt.py
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from app.schemas.base import TimestampedSchema
from app.models.prompt import TemplateType, VisibilityType
from slugify import slugify

class PromptBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the prompt")
    content: str = Field(..., min_length=1, description="Content of the prompt")
    template_type: TemplateType = Field(..., description="Type of template to use")
    custom_template: Optional[str] = Field(None, description="Custom template for narrative type")
    visibility: VisibilityType = Field(default=VisibilityType.PRIVATE, description="Visibility level of the prompt")

    @validator('custom_template')
    def validate_custom_template(cls, v, values):
        if values.get('template_type') == TemplateType.NARRATIVE and not v:
            raise ValueError("Custom template is required for narrative template type")
        return v

    @validator('name')
    def validate_name_for_slug(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty or just whitespace")
        if len(slugify(v)) == 0:
            raise ValueError("Name must contain at least one alphanumeric character")
        return v

class PromptCreate(PromptBase):
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Daily Tech News",
                "content": "Latest developments in AI and technology",
                "template_type": "summary",
                "custom_template": None,
                "visibility": "private"
            }
        }

class PromptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    template_type: Optional[TemplateType] = None
    custom_template: Optional[str] = None
    visibility: Optional[VisibilityType] = None

    @validator('custom_template')
    def validate_custom_template(cls, v, values):
        if values.get('template_type') == TemplateType.NARRATIVE and v is not None and not v:
            raise ValueError("Custom template cannot be empty for narrative template type")
        return v

    @validator('name')
    def validate_name_for_slug(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError("Name cannot be empty or just whitespace")
            if len(slugify(v)) == 0:
                raise ValueError("Name must contain at least one alphanumeric character")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated Tech News",
                "content": "Updated content focus on AI developments",
                "template_type": "analysis",
                "visibility": "internal"
            }
        }

class PromptSlug(BaseModel):
    slug: str = Field(..., description="URL-friendly slug for the prompt")

class Prompt(PromptBase, TimestampedSchema):
    id: int = Field(..., description="Unique identifier of the prompt")
    slug: str = Field(..., description="URL-friendly slug for the prompt")
    user_id: int = Field(..., description="ID of the user who owns this prompt")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Daily Tech News",
                "slug": "daily-tech-news",
                "content": "Latest developments in AI and technology",
                "template_type": "summary",
                "custom_template": None,
                "visibility": "private",
                "user_id": 1,
                "created_at": "2024-03-14T12:00:00Z",
                "updated_at": "2024-03-14T12:00:00Z"
            }
        }

class NewsCount(BaseModel):
    total: int = Field(..., description="Total number of news items for this prompt")
    hourly: int = Field(0, description="Number of hourly news items")
    daily: int = Field(0, description="Number of daily news items")
    last_update: Optional[datetime] = Field(None, description="Timestamp of the last news update")

class PromptWithStats(Prompt):
    news_count: NewsCount = Field(..., description="News statistics for this prompt")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Daily Tech News",
                "slug": "daily-tech-news",
                "content": "Latest developments in AI and technology",
                "template_type": "summary",
                "custom_template": None,
                "visibility": "private",
                "user_id": 1,
                "created_at": "2024-03-14T12:00:00Z",
                "updated_at": "2024-03-14T12:00:00Z",
                "news_count": {
                    "total": 100,
                    "hourly": 24,
                    "daily": 76,
                    "last_update": "2024-03-14T11:00:00Z"
                }
            }
        }

class PromptTemplateValidation(BaseModel):
    template_type: TemplateType
    custom_template: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "template_type": "narrative",
                "custom_template": "Custom template with {placeholder}"
            }
        }

class PromptTemplateValidationResponse(BaseModel):
    valid: bool
    errors: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "errors": None
            }
        }