# app/api/v1/endpoints/prompts.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.prompt import Prompt
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
    """
    Create new prompt.
    """
    prompt = Prompt(
        name=prompt_in.name,
        content=prompt_in.content,
        user_id=current_user.id
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt

@router.get("/", response_model=List[PromptSchema])
async def get_prompts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
) -> Any:
    """
    Retrieve prompts.
    """
    prompts = db.query(Prompt).filter(
        Prompt.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return prompts

@router.get("/{prompt_id}", response_model=PromptSchema)
async def get_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get prompt by ID.
    """
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail="Prompt not found"
        )
    return prompt

@router.put("/{prompt_id}", response_model=PromptSchema)
async def update_prompt(
    *,
    prompt_id: int,
    prompt_in: PromptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update prompt.
    """
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail="Prompt not found"
        )

    update_data = prompt_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prompt, field, value)

    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt

@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Delete prompt.
    """
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail="Prompt not found"
        )
    
    db.delete(prompt)
    db.commit()