# app/api/v1/endpoints/prompts.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, Path, Request, Security
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from app.core.database import get_db
from app.models.user import User
from app.models.prompt import TemplateType, VisibilityType
from app.schemas.prompt import (
    PromptCreate,
    PromptUpdate,
    Prompt as PromptSchema,
    PromptWithStats,
    PromptTemplateValidation,
    PromptTemplateValidationResponse
)
from app.core.auth import (
    get_current_active_user, 
    get_optional_current_user,
    public_route_optional_auth,
    is_public_path
)
from app.services.prompt import PromptService
from app.config.settings import get_settings

settings = get_settings()
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_prompt_service(db: Session = Depends(get_db)) -> PromptService:
    """Standard dependency for authenticated routes."""
    return PromptService(db)

def get_prompt_service_public(db: Session = Depends(get_db)) -> PromptService:
    """Dependency for public routes that don't require auth."""
    return PromptService(db)

# Public Routes (No Auth Required)
@router.get(
    "/public",
    response_model=List[PromptSchema],
    summary="List Public Prompts",
    description="Get list of public prompts. No authentication required.",
    include_in_schema=True
)
async def list_public_prompts(
    request: Request,
    prompt_service: PromptService = Depends(get_prompt_service_public),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
    search: Optional[str] = Query(None, min_length=1)
) -> Any:
    """Get list of public prompts. No authentication required."""
    try:
        if not is_public_path(request.url.path):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden"
            )
        prompts = prompt_service.get_public_prompts(
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

@router.get(
    "/by-path/{username}/{slug}",
    response_model=PromptWithStats,
    summary="Get Prompt by Path",
    description="Get prompt by username and slug. Public prompts are accessible without authentication."
)
async def get_prompt_by_path(
    username: str = Path(..., description="Username of the prompt owner"),
    slug: str = Path(..., description="Slug of the prompt"),
    prompt_service: PromptService = Depends(get_prompt_service_public),
    current_user: Optional[User] = Depends(public_route_optional_auth)
) -> Any:
    """
    Get prompt by username and slug.
    Public prompts are accessible without authentication.
    Internal prompts require authentication.
    Private prompts require ownership.
    """
    try:
        return prompt_service.get_prompt_by_username_and_slug(
            username=username,
            slug=slug,
            current_user=current_user
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get(
    "/templates",
    response_model=List[str],
    summary="Get Available Templates",
    description="Get list of available template types. No authentication required."
)
async def get_available_templates(
    request: Request,
    prompt_service: PromptService = Depends(get_prompt_service_public)
) -> Any:
    """Get list of available template types. No authentication required."""
    try:
        if not is_public_path(request.url.path):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden"
            )
        return prompt_service.get_template_types()
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Protected Routes (Auth Required)
@router.post(
    "/",
    response_model=PromptSchema,
    dependencies=[Depends(get_current_active_user)],
    summary="Create Prompt",
    description="Create new prompt. Requires authentication."
)
async def create_prompt(
    *,
    prompt_service: PromptService = Depends(get_prompt_service),
    prompt_in: PromptCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create new prompt with template support and visibility setting."""
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

@router.get(
    "/",
    response_model=List[PromptSchema],
    dependencies=[Depends(get_current_active_user)],
    summary="List User Prompts",
    description="Get list of prompts for current user. Requires authentication."
)
async def list_prompts(
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
    search: Optional[str] = Query(None, min_length=1),
    include_internal: bool = Query(True, description="Include internal prompts from other users"),
    include_public: bool = Query(True, description="Include public prompts from other users")
) -> Any:
    """Get list of prompts for current user including internal and public prompts based on preferences."""
    try:
        prompts = prompt_service.get_prompts(
            user=current_user,
            skip=skip,
            limit=limit,
            search=search,
            include_internal=include_internal,
            include_public=include_public
        )
        return prompts
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get(
    "/internal",
    response_model=List[PromptSchema],
    dependencies=[Depends(get_current_active_user)],
    summary="List Internal Prompts",
    description="Get list of internal prompts from other users. Requires authentication."
)
async def list_internal_prompts(
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
    search: Optional[str] = Query(None, min_length=1)
) -> Any:
    """Get list of internal prompts from other users."""
    try:
        prompts = prompt_service.get_internal_prompts(
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

@router.get(
    "/{prompt_id}",
    response_model=PromptWithStats,
    summary="Get Prompt by ID",
    description="Get prompt by ID with associated statistics. Public prompts accessible without auth."
)
async def get_prompt(
    prompt_id: int,
    prompt_service: PromptService = Depends(get_prompt_service_public),
    current_user: Optional[User] = Depends(public_route_optional_auth)
) -> Any:
    """
    Get prompt by ID with associated statistics.
    Public prompts accessible without auth.
    Internal prompts require authentication.
    Private prompts require ownership.
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

@router.put(
    "/{prompt_id}",
    response_model=PromptSchema,
    dependencies=[Depends(get_current_active_user)],
    summary="Update Prompt",
    description="Update existing prompt. Only owner can update their prompts."
)
async def update_prompt(
    prompt_id: int,
    prompt_in: PromptUpdate,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update existing prompt."""
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

@router.delete(
    "/{prompt_id}",
    dependencies=[Depends(get_current_active_user)],
    summary="Delete Prompt",
    description="Delete prompt. Only owner can delete their prompts."
)
async def delete_prompt(
    prompt_id: int,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> Response:
    """Delete prompt."""
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

@router.post(
    "/validate-template",
    response_model=PromptTemplateValidationResponse,
    dependencies=[Depends(get_current_active_user)],
    summary="Validate Template",
    description="Validate a prompt template. Requires authentication."
)
async def validate_template(
    template_data: PromptTemplateValidation,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Validate a prompt template."""
    try:
        is_valid = prompt_service.validate_prompt_template(
            template_data.template_type,
            template_data.custom_template
        )
        return {"valid": is_valid, "errors": None}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )