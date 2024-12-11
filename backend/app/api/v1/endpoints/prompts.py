# app/api/v1/endpoints/prompts.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.prompt import Prompt, TemplateType
from app.schemas.prompt import PromptCreate, Prompt as PromptSchema, PromptUpdate
from app.core.auth import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=PromptSchema)
async def create_prompt(
    *,
    db: Session = Depends(get_db),
    prompt_in: PromptCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create new prompt with template support."""
    prompt = Prompt(
        name=prompt_in.name,
        content=prompt_in.content,
        template_type=prompt_in.template_type,
        custom_template=prompt_in.custom_template,
        user_id=current_user.id
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt

@router.get("/templates", response_model=List[str])
async def get_available_templates(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get list of available template types."""
    return [template.value for template in TemplateType]