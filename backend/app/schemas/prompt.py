from pydantic import BaseModel
from typing import Optional
from app.schemas.base import TimestampedSchema
from app.models.prompt import TemplateType

class PromptBase(BaseModel):
    name: str
    content: str
    template_type: TemplateType
    custom_template: Optional[str] = None

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    template_type: Optional[TemplateType] = None
    custom_template: Optional[str] = None

class Prompt(PromptBase, TimestampedSchema):
    id: int
    user_id: int