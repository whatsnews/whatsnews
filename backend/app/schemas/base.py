# app/schemas/base.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TimestampedSchema(BaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)