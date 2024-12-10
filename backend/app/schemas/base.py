# app/schemas/base.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TimestampedSchema(BaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.schemas.base import TimestampedSchema

class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase, TimestampedSchema):
    id: int

class UserInDB(User):
    hashed_password: str

# app/schemas/prompt.py
from pydantic import BaseModel
from typing import Optional, List
from app.schemas.base import TimestampedSchema

class PromptBase(BaseModel):
    name: str
    content: str

class PromptCreate(PromptBase):
    pass

class PromptUpdate(PromptBase):
    name: Optional[str] = None
    content: Optional[str] = None

class Prompt(PromptBase, TimestampedSchema):
    id: int
    user_id: int

# app/schemas/news.py
from pydantic import BaseModel
from typing import Optional
from app.models.news import UpdateFrequency
from app.schemas.base import TimestampedSchema

class NewsBase(BaseModel):
    title: str
    content: str
    frequency: UpdateFrequency

class NewsCreate(NewsBase):
    prompt_id: int

class NewsUpdate(NewsBase):
    title: Optional[str] = None
    content: Optional[str] = None
    frequency: Optional[UpdateFrequency] = None

class News(NewsBase, TimestampedSchema):
    id: int
    prompt_id: int