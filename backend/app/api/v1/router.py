# app/api/v1/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_active_user
from app.config.settings import get_settings
from typing import Any, Dict

settings = get_settings()

# Create the main API router
api_router = APIRouter()

# Import endpoint modules after router creation
from app.api.v1.endpoints import auth, users, prompts, news

# Standard error responses
common_responses: Dict[int, Dict[str, str]] = {
    400: {"description": "Bad Request - Invalid input or request"},
    401: {"description": "Unauthorized - Authentication required"},
    403: {"description": "Forbidden - Insufficient permissions"},
    404: {"description": "Not Found - Requested resource doesn't exist"},
    422: {"description": "Validation Error - Request validation failed"},
    500: {"description": "Internal Server Error - Server-side error occurred"}
}

# Include auth router (no authentication required)
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"],
    responses={
        **common_responses,
        200: {"description": "Successful authentication"},
        401: {"description": "Invalid credentials"}
    }
)

# Include users router (mixed authentication)
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"],
    responses={
        **common_responses,
        200: {"description": "Successful user operation"},
        409: {"description": "Conflict - User already exists"}
    }
)

# Include prompts router (mixed authentication - removed global dependency)
api_router.include_router(
    prompts.router,
    prefix="/prompts",
    tags=["prompts"],
    responses={
        **common_responses,
        200: {"description": "Successful prompt operation"},
        204: {"description": "Prompt deleted successfully"},
        409: {"description": "Conflict - Resource state conflict"}
    }
)

# Include news router (mixed authentication - removed global dependency)
api_router.include_router(
    news.router,
    prefix="/news",
    tags=["news"],
    responses={
        **common_responses,
        200: {"description": "Successful news operation"},
        204: {"description": "News item deleted successfully"},
        408: {"description": "Request Timeout - News generation timeout"}
    }
)

@api_router.get(
    "/health",
    tags=["health"],
    summary="Health Check",
    description="Returns the current status of the API service",
    responses={
        200: {
            "description": "Service health information",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "version": "0.1.0",
                        "api_v1_str": "/api/v1"
                    }
                }
            }
        },
        503: {
            "description": "Service Unavailable - Health check failed"
        }
    }
)
async def health_check() -> Any:
    """
    Health check endpoint that provides service status and version information
    """
    try:
        return {
            "status": "healthy",
            "version": settings.VERSION,
            "api_v1_str": settings.API_V1_STR
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service health check failed"
        )