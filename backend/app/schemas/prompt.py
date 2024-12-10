# app/schemas/prompt.py
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PromptBase(BaseModel):
    name: str
    content: str

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None

class Prompt(PromptBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True