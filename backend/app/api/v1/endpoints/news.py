# app/api/v1/endpoints/news.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Path, Request
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.news import News, UpdateFrequency
from app.models.prompt import Prompt, VisibilityType
from app.models.user import User
from app.schemas.news import (
    NewsCreate, 
    NewsUpdate, 
    NewsResponse, 
    PublicNewsResponse,
    NewsListResponse
)
from app.core.auth import (
    get_current_active_user,
    public_route_optional_auth,
    is_public_path
)
from app.services.news import NewsService
from app.services.rss import RSSService

router = APIRouter()

# Public Routes
@router.get(
    "/public",
    response_model=NewsListResponse,
    summary="List Public News",
    description="Get list of news from public prompts. No authentication required."
)
async def list_public_news(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    prompt_id: Optional[int] = None,
    frequency: Optional[UpdateFrequency] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Get list of news from public prompts."""
    try:
        if not is_public_path(request.url.path):
            raise HTTPException(status_code=403, detail="Access forbidden")
        
        news_service = NewsService(db)
        return news_service.get_public_news(
            skip=skip,
            limit=limit,
            prompt_id=prompt_id,
            frequency=frequency
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/by-path/{username}/{prompt_slug}",
    response_model=NewsListResponse,
    summary="Get News by Prompt Path",
    description="Get news by prompt path. Access follows prompt visibility rules."
)
async def get_news_by_prompt_path(
    username: str = Path(..., description="Username of the prompt owner"),
    prompt_slug: str = Path(..., description="Slug of the prompt"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    frequency: Optional[UpdateFrequency] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(public_route_optional_auth)
) -> Any:
    """Get news by prompt path respecting visibility rules."""
    try:
        news_service = NewsService(db)
        return news_service.get_news_by_prompt_path(
            username=username,
            prompt_slug=prompt_slug,
            current_user=current_user,
            skip=skip,
            limit=limit,
            frequency=frequency
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/public/latest",
    response_model=List[PublicNewsResponse],
    summary="Latest Public News",
    description="Get latest news from all public prompts. No authentication required."
)
async def get_latest_public_news(
    request: Request,
    limit: int = Query(10, ge=1, le=50),
    frequency: Optional[UpdateFrequency] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Get latest news from public prompts."""
    try:
        if not is_public_path(request.url.path):
            raise HTTPException(status_code=403, detail="Access forbidden")
        
        news_service = NewsService(db)
        return news_service.get_latest_public_news(
            limit=limit,
            frequency=frequency
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Protected Routes
@router.get(
    "/",
    response_model=NewsListResponse,
    dependencies=[Depends(get_current_active_user)],
    summary="List User's News",
    description="Get list of news items for the current user."
)
async def get_news(
    prompt_id: Optional[int] = None,
    frequency: Optional[UpdateFrequency] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get news items for the current user."""
    try:
        news_service = NewsService(db)
        return news_service.get_user_news(
            user=current_user,
            prompt_id=prompt_id,
            frequency=frequency,
            skip=skip,
            limit=limit
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/",
    response_model=NewsResponse,
    dependencies=[Depends(get_current_active_user)],
    summary="Create News",
    description="Create new news generation task."
)
async def create_news(
    news_in: NewsCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create new news generation task."""
    try:
        news_service = NewsService(db)
        rss_service = RSSService()
        
        # Verify prompt access
        prompt = news_service.verify_prompt_access(news_in.prompt_id, current_user)
        
        feeds = await rss_service.fetch_feeds()
        background_tasks.add_task(
            news_service.generate_news,
            prompt_id=news_in.prompt_id,
            frequency=news_in.frequency,
            feeds=feeds
        )

        return {
            "id": 0,
            "title": f"News generation started for {prompt.name}",
            "content": "Processing...",
            "frequency": news_in.frequency,
            "prompt_id": news_in.prompt_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "visibility": prompt.visibility
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/{news_id}",
    response_model=NewsResponse,
    summary="Get News by ID",
    description="Get specific news item by ID. Access follows visibility rules."
)
async def get_news_by_id(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(public_route_optional_auth)
) -> Any:
    """Get specific news item respecting visibility rules."""
    try:
        news_service = NewsService(db)
        return news_service.get_news_by_id(news_id, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete(
    "/{news_id}",
    status_code=204,
    dependencies=[Depends(get_current_active_user)],
    summary="Delete News",
    description="Delete news item. Only owner can delete."
)
async def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """Delete news item."""
    try:
        news_service = NewsService(db)
        news_service.delete_news(news_id, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))