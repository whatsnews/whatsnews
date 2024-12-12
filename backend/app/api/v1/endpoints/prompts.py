# app/api/v1/endpoints/prompts.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.prompt import TemplateType
from app.schemas.prompt import (
    PromptCreate,
    PromptUpdate,
    Prompt as PromptSchema,
    PromptWithStats
)
from app.core.auth import get_current_active_user
from app.services.prompt import PromptService

router = APIRouter()

def get_prompt_service(db: Session = Depends(get_db)) -> PromptService:
    return PromptService(db)

@router.post("/", response_model=PromptSchema)
async def create_prompt(
    *,
    prompt_service: PromptService = Depends(get_prompt_service),
    prompt_in: PromptCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new prompt with template support.
    """
    try:
        prompt = prompt_service.create_prompt(prompt_in, current_user)
        return prompt
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[PromptSchema])
async def list_prompts(
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
    search: Optional[str] = Query(None, min_length=1)
) -> Any:
    """
    Get list of prompts for current user with optional search.
    """
    try:
        prompts = prompt_service.get_prompts(
            user=current_user,
            skip=skip,
            limit=limit,
            search=search
        )
        return prompts
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{prompt_id}", response_model=PromptWithStats)
async def get_prompt(
    prompt_id: int,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get prompt by ID with associated statistics.
    """
    try:
        prompt_data = prompt_service.get_prompt_with_news_count(prompt_id, current_user)
        return prompt_data
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{prompt_id}", response_model=PromptSchema)
async def update_prompt(
    prompt_id: int,
    prompt_in: PromptUpdate,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update existing prompt.
    """
    try:
        prompt = prompt_service.update_prompt(prompt_id, prompt_in, current_user)
        return prompt
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: int,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> Response:
    """
    Delete prompt.
    """
    try:
        prompt_service.delete_prompt(prompt_id, current_user)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/templates", response_model=List[str])
async def get_available_templates(
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get list of available template types.
    """
    return prompt_service.get_template_types()

@router.post("/validate-template")
async def validate_template(
    template_type: TemplateType,
    custom_template: Optional[str] = None,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """
    Validate a prompt template.
    """
    try:
        is_valid = prompt_service.validate_prompt_template(template_type, custom_template)
        return {"valid": is_valid}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )