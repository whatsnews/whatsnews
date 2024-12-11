from datetime import datetime, timezone, timedelta
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import dateutil.parser
from app.models.news import News, UpdateFrequency
from app.models.prompt import Prompt, TemplateType
from app.models.user import User
from app.services.llm import LLMService

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMService()

    def _filter_content_by_time(
        self,
        feeds: List[Dict[str, Any]],
        frequency: UpdateFrequency,
        user_timezone: str
    ) -> str:
        """
        Filter feed content based on frequency and user's timezone.
        """
        user_tz = dateutil.tz.gettz(user_timezone)
        now = datetime.now(user_tz)
        
        if frequency == UpdateFrequency.HOURLY:
            cutoff = now - timedelta(hours=1)
        else:  # DAILY
            cutoff = now - timedelta(days=1)
        
        filtered_content = []
        
        for feed in feeds:
            for entry in feed.get('entries', []):
                try:
                    # Parse publication date
                    pub_date = dateutil.parser.parse(entry.get('published', ''))
                    if pub_date.tzinfo is None:
                        pub_date = pub_date.replace(tzinfo=timezone.utc)
                    
                    # Convert to user's timezone
                    pub_date = pub_date.astimezone(user_tz)
                    
                    if pub_date > cutoff:
                        filtered_content.append(
                            f"Title: {entry.get('title', '')}\n"
                            f"Source: {feed.get('url', '')}\n"
                            f"Published: {pub_date.strftime('%Y-%m-%d %H:%M %Z')}\n"
                            f"Description: {entry.get('description', '')}\n"
                            f"Author: {entry.get('author', 'Unknown')}\n"
                        )
                except (ValueError, TypeError, AttributeError) as e:
                    logger.warning(f"Error parsing date for entry: {str(e)}")
                    continue
        
        return "\n\n".join(filtered_content)

    async def generate_news(
        self,
        prompt_id: int,
        frequency: UpdateFrequency,
        feeds: List[Dict[str, Any]]
    ) -> Optional[News]:
        """
        Generate news content based on prompt, frequency, and feeds.
        """
        try:
            # Get prompt and associated user
            prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
            if not prompt:
                logger.error(f"Prompt {prompt_id} not found")
                return None

            user = self.db.query(User).filter(User.id == prompt.user_id).first()
            if not user:
                logger.error(f"User not found for prompt {prompt_id}")
                return None

            # Filter content based on time and user's timezone
            filtered_content = self._filter_content_by_time(
                feeds=feeds,
                frequency=frequency,
                user_timezone=user.timezone
            )

            if not filtered_content:
                logger.info(f"No new content for prompt {prompt_id} at frequency {frequency}")
                return None

            # Generate summary using LLM with template
            summary = await self.llm_service.generate_summary(
                feed_content=filtered_content,
                prompt_content=prompt.content,
                frequency=frequency,
                template_type=prompt.template_type,
                custom_template=prompt.custom_template
            )

            # Create news entry with user's timezone
            user_tz = dateutil.tz.gettz(user.timezone)
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

    def get_latest_news(
        self,
        prompt_id: int,
        frequency: UpdateFrequency,
        user_timezone: str
    ) -> Optional[News]:
        """
        Get the latest news for a specific prompt and frequency in user's timezone.
        """
        try:
            latest_news = (
                self.db.query(News)
                .filter(News.prompt_id == prompt_id, News.frequency == frequency)
                .order_by(News.created_at.desc())
                .first()
            )

            if latest_news:
                # Convert timestamps to user's timezone
                user_tz = dateutil.tz.gettz(user_timezone)
                latest_news.created_at = latest_news.created_at.astimezone(user_tz)
                latest_news.updated_at = latest_news.updated_at.astimezone(user_tz)

            return latest_news

        except Exception as e:
            logger.error(f"Error getting latest news: {str(e)}")
            return None