from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.news import News, UpdateFrequency
from app.models.prompt import Prompt
from app.schemas.news import NewsCreate, News as NewsSchema, NewsUpdate
from app.core.auth import get_current_active_user
from app.models.user import User
from app.services.news import NewsService
from app.services.rss import RSSService

router = APIRouter()

@router.post("/", response_model=NewsSchema)
async def create_news(
    *,
    db: Session = Depends(get_db),
    news_in: NewsCreate,
    current_user: User = Depends(get_current_active_user),
    background_tasks: BackgroundTasks
) -> Any:
    """
    Create new news generation task.
    """
    # Verify prompt exists and belongs to user
    prompt = db.query(Prompt).filter(
        Prompt.id == news_in.prompt_id,
        Prompt.user_id == current_user.id
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail="Prompt not found or doesn't belong to user"
        )

    news_service = NewsService(db)
    rss_service = RSSService()

    # Fetch RSS feeds
    feeds = await rss_service.fetch_feeds()

    # Generate news in background
    background_tasks.add_task(
        news_service.generate_news,
        prompt_id=news_in.prompt_id,
        frequency=news_in.frequency,
        feeds=feeds
    )

    return {
        "id": 0,  # Placeholder ID
        "title": f"News generation started for {prompt.name}",
        "content": "Processing...",
        "frequency": news_in.frequency,
        "prompt_id": news_in.prompt_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

@router.get("/", response_model=List[NewsSchema])
async def get_news(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    prompt_id: Optional[int] = None,
    frequency: Optional[UpdateFrequency] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
) -> Any:
    """
    Retrieve news items.
    """
    query = db.query(News)

    if prompt_id:
        # Verify prompt belongs to user
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.user_id == current_user.id
        ).first()
        if not prompt:
            raise HTTPException(
                status_code=404,
                detail="Prompt not found or doesn't belong to user"
            )
        query = query.filter(News.prompt_id == prompt_id)

    if frequency:
        query = query.filter(News.frequency == frequency)

    # Join with prompts to filter by user
    query = query.join(Prompt).filter(Prompt.user_id == current_user.id)
    
    # Order by latest first
    query = query.order_by(News.created_at.desc())
    
    news_items = query.offset(skip).limit(limit).all()
    return news_items

@router.get("/{news_id}", response_model=NewsSchema)
async def get_news_by_id(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get news by ID.
    """
    news = db.query(News).join(Prompt).filter(
        News.id == news_id,
        Prompt.user_id == current_user.id
    ).first()
    
    if not news:
        raise HTTPException(
            status_code=404,
            detail="News not found"
        )
    return news

@router.delete("/{news_id}", status_code=204)
async def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Delete news item.
    """
    news = db.query(News).join(Prompt).filter(
        News.id == news_id,
        Prompt.user_id == current_user.id
    ).first()
    
    if not news:
        raise HTTPException(
            status_code=404,
            detail="News not found"
        )
        
    db.delete(news)
    db.commit()

@router.get("/latest/{prompt_id}", response_model=NewsSchema)
async def get_latest_news(
    prompt_id: int,
    frequency: UpdateFrequency,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get latest news for a specific prompt and frequency.
    """
    # Verify prompt belongs to user
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail="Prompt not found or doesn't belong to user"
        )

    news = db.query(News).filter(
        News.prompt_id == prompt_id,
        News.frequency == frequency
    ).order_by(News.created_at.desc()).first()

    if not news:
        raise HTTPException(
            status_code=404,
            detail="No news found for this prompt and frequency"
        )
    return news