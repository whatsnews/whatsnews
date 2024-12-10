# app/services/news.py
from datetime import datetime, timezone, timedelta  # Add timezone here
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import dateutil.parser

from app.models.news import News, UpdateFrequency
from app.models.prompt import Prompt
from app.services.llm import LLMService

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMService()

    def _filter_content_by_time(
        self,
        feeds: List[Dict[str, Any]],
        frequency: UpdateFrequency
    ) -> str:
        now = datetime.now(timezone.utc)
        
        if frequency == UpdateFrequency.TEN_MINUTES:
            cutoff = now - timedelta(minutes=10)
        elif frequency == UpdateFrequency.HOURLY:
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
                    
                    if pub_date > cutoff:
                        filtered_content.append(
                            f"Title: {entry.get('title', '')}\n"
                            f"Source: {feed.get('url', '')}\n"
                            f"Description: {entry.get('description', '')}\n"
                        )
                except (ValueError, TypeError, AttributeError) as e:
                    logger.warning(f"Error parsing date: {str(e)}")
                    continue
        
        return "\n\n".join(filtered_content)

    async def generate_news(
        self,
        prompt_id: int,
        frequency: UpdateFrequency,
        feeds: List[Dict[str, Any]]
    ) -> Optional[News]:
        try:
            # Filter content based on time
            filtered_content = self._filter_content_by_time(feeds, frequency)
            if not filtered_content:
                logger.info(f"No new content for prompt {prompt_id} at frequency {frequency}")
                return None

            # Get prompt
            prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
            if not prompt:
                logger.error(f"Prompt {prompt_id} not found")
                return None

            # Generate summary using LLM
            summary = await self.llm_service.generate_summary(
                feed_content=filtered_content,
                prompt_content=prompt.content,
                frequency=frequency
            )

            # Create news entry
            news = News(
                title=f"{frequency.value} Update - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
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