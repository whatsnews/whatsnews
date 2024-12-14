# app/services/news.py
from datetime import datetime, timezone, timedelta
import logging
from typing import List, Dict, Any, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException
import dateutil.parser
from dateutil.tz import gettz

from app.models.news import News, UpdateFrequency
from app.models.prompt import Prompt, VisibilityType, TemplateType
from app.models.user import User
from app.services.llm import LLMService
from app.schemas.news import NewsListResponse, PublicNewsResponse

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMService()

    def verify_prompt_access(self, prompt_id: int, user: Optional[User] = None) -> Prompt:
        """Verify prompt access based on visibility and user."""
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        if prompt.visibility == VisibilityType.PUBLIC:
            return prompt

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Authentication required for this prompt"
            )

        if prompt.visibility == VisibilityType.PRIVATE and prompt.user_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to access this prompt"
            )

        return prompt

    def _filter_content_by_time(
        self,
        feeds: List[Dict[str, Any]],
        frequency: UpdateFrequency,
        user_timezone: str
    ) -> str:
        """Filter feed content based on frequency and timezone."""
        user_tz = gettz(user_timezone)
        now = datetime.now(user_tz)
        
        if frequency == UpdateFrequency.HOURLY:
            cutoff = now - timedelta(hours=1)
        else:  # DAILY
            cutoff = now - timedelta(days=1)
        
        filtered_content = []
        
        for feed in feeds:
            for entry in feed.get('entries', []):
                try:
                    pub_date = dateutil.parser.parse(entry.get('published', ''))
                    if pub_date.tzinfo is None:
                        pub_date = pub_date.replace(tzinfo=timezone.utc)
                    
                    pub_date = pub_date.astimezone(user_tz)
                    
                    if pub_date > cutoff:
                        filtered_content.append(
                            f"Title: {entry.get('title', '')}\n"
                            f"Source: {feed.get('url', '')}\n"
                            f"Published: {pub_date.strftime('%Y-%m-%d %H:%M %Z')}\n"
                            f"Description: {entry.get('description', '')}\n"
                            f"Author: {entry.get('author', 'Unknown')}\n"
                        )
                except Exception as e:
                    logger.warning(f"Error parsing entry: {str(e)}")
                    continue
        
        return "\n\n".join(filtered_content)

    async def generate_news(
        self,
        prompt_id: int,
        frequency: UpdateFrequency,
        feeds: List[Dict[str, Any]]
    ) -> Optional[News]:
        """Generate news content based on prompt and feeds."""
        try:
            prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
            if not prompt:
                logger.error(f"Prompt {prompt_id} not found")
                return None

            user = self.db.query(User).filter(User.id == prompt.user_id).first()
            if not user:
                logger.error(f"User not found for prompt {prompt_id}")
                return None

            filtered_content = self._filter_content_by_time(
                feeds=feeds,
                frequency=frequency,
                user_timezone=user.timezone
            )

            if not filtered_content:
                logger.info(f"No new content for prompt {prompt_id}")
                return None

            summary = await self.llm_service.generate_summary(
                feed_content=filtered_content,
                prompt_content=prompt.content,
                frequency=frequency,
                template_type=prompt.template_type,
                custom_template=prompt.custom_template
            )

            user_tz = gettz(user.timezone)
            local_time = datetime.now(user_tz)
            
            news = News(
                title=f"{frequency.value} Update - {local_time.strftime('%Y-%m-%d %H:%M %Z')}",
                content=summary,
                frequency=frequency,
                prompt_id=prompt_id
            )
            
            self.db.add(news)
            self.db.commit()
            self.db.refresh(news)
            
            logger.info(f"Generated {frequency.value} news for prompt {prompt_id}")
            return news

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error generating news: {str(e)}")
            raise

    def get_public_news(
        self,
        skip: int = 0,
        limit: int = 100,
        prompt_id: Optional[int] = None,
        frequency: Optional[UpdateFrequency] = None
    ) -> NewsListResponse:
        """Get news from public prompts."""
        query = self.db.query(News).join(Prompt)
        query = query.filter(Prompt.visibility == VisibilityType.PUBLIC)

        if prompt_id:
            query = query.filter(News.prompt_id == prompt_id)
        if frequency:
            query = query.filter(News.frequency == frequency)

        total = query.count()
        items = query.order_by(desc(News.created_at)).offset(skip).limit(limit).all()
        
        return NewsListResponse(total=total, items=items)

    def get_news_by_prompt_path(
        self,
        username: str,
        prompt_slug: str,
        current_user: Optional[User],
        skip: int = 0,
        limit: int = 100,
        frequency: Optional[UpdateFrequency] = None
    ) -> NewsListResponse:
        """Get news by prompt path respecting visibility rules."""
        query = (
            self.db.query(News)
            .join(Prompt)
            .join(User)
            .filter(User.username == username, Prompt.slug == prompt_slug)
        )

        prompt = (
            self.db.query(Prompt)
            .join(User)
            .filter(User.username == username, Prompt.slug == prompt_slug)
            .first()
        )

        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        # Check visibility permissions
        if prompt.visibility == VisibilityType.PRIVATE:
            if not current_user or prompt.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to access this prompt")
        elif prompt.visibility == VisibilityType.INTERNAL:
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required for this prompt")

        if frequency:
            query = query.filter(News.frequency == frequency)

        total = query.count()
        items = query.order_by(desc(News.created_at)).offset(skip).limit(limit).all()
        
        return NewsListResponse(total=total, items=items)

    def get_latest_public_news(
        self,
        limit: int = 10,
        frequency: Optional[UpdateFrequency] = None
    ) -> List[PublicNewsResponse]:
        """Get latest news from public prompts."""
        query = (
            self.db.query(News)
            .join(Prompt)
            .join(User)
            .filter(Prompt.visibility == VisibilityType.PUBLIC)
        )

        if frequency:
            query = query.filter(News.frequency == frequency)

        latest_news = query.order_by(desc(News.created_at)).limit(limit).all()

        return [
            PublicNewsResponse(
                **news.__dict__,
                prompt_name=news.prompt.name,
                prompt_owner=news.prompt.user.username
            ) for news in latest_news
        ]

    def get_user_news(
        self,
        user: User,
        prompt_id: Optional[int] = None,
        frequency: Optional[UpdateFrequency] = None,
        skip: int = 0,
        limit: int = 100
    ) -> NewsListResponse:
        """Get news items visible to a specific user."""
        query = (
            self.db.query(News)
            .join(Prompt)
            .filter(
                # User's own prompts
                ((Prompt.user_id == user.id)) |
                # Internal prompts
                ((Prompt.visibility == VisibilityType.INTERNAL)) |
                # Public prompts
                ((Prompt.visibility == VisibilityType.PUBLIC))
            )
        )

        if prompt_id:
            # If specific prompt requested, verify access
            prompt = self.verify_prompt_access(prompt_id, user)
            query = query.filter(News.prompt_id == prompt_id)

        if frequency:
            query = query.filter(News.frequency == frequency)

        total = query.count()
        items = query.order_by(desc(News.created_at)).offset(skip).limit(limit).all()
        
        return NewsListResponse(total=total, items=items)

    def get_news_by_id(
        self,
        news_id: int,
        current_user: Optional[User]
    ) -> News:
        """Get specific news item respecting visibility rules."""
        news = self.db.query(News).filter(News.id == news_id).first()
        if not news:
            raise HTTPException(status_code=404, detail="News item not found")

        # Verify prompt access
        self.verify_prompt_access(news.prompt_id, current_user)
        return news

    def delete_news(
        self,
        news_id: int,
        current_user: User
    ) -> None:
        """Delete news item."""
        news = self.db.query(News).filter(News.id == news_id).first()
        if not news:
            raise HTTPException(status_code=404, detail="News item not found")

        # Verify ownership
        if news.prompt.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this news item")

        try:
            self.db.delete(news)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting news: {str(e)}")
            raise HTTPException(status_code=500, detail="Error deleting news item")

    def convert_timezone(
        self,
        dt: datetime,
        timezone: str
    ) -> datetime:
        """Convert datetime to specified timezone."""
        try:
            tz = gettz(timezone)
            if not tz:
                logger.warning(f"Invalid timezone {timezone}, using UTC")
                tz = gettz('UTC')
            
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            
            return dt.astimezone(tz)
        except Exception as e:
            logger.error(f"Error converting timezone: {str(e)}")
            return dt