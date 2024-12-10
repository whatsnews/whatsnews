# app/api/v1/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_active_user
from app.config.settings import get_settings
from typing import Any

settings = get_settings()

# Create the main API router
api_router = APIRouter()

# Import endpoint modules after router creation
from app.api.v1.endpoints import auth, users, prompts, news

# Include auth router (no authentication required)
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
        422: {"description": "Validation Error"}
    }
)

# Include users router (mixed authentication)
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"],
    responses={
        400: {"description": "Bad Request"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
        422: {"description": "Validation Error"}
    }
)

# Include prompts router (authentication required)
api_router.include_router(
    prompts.router,
    prefix="/prompts",
    tags=["prompts"],
    dependencies=[Depends(get_current_active_user)],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
        422: {"description": "Validation Error"}
    }
)

# Include news router (authentication required)
api_router.include_router(
    news.router,
    prefix="/news",
    tags=["news"],
    dependencies=[Depends(get_current_active_user)],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
        422: {"description": "Validation Error"}
    }
)

@api_router.get("/health", tags=["health"])
async def health_check() -> Any:
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "api_v1_str": settings.API_V1_STR
    }