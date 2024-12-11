# app/services/scheduler.py
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import asyncio
import logging
from app.services.news import NewsService
from app.services.rss import RSSService
from app.models.news import UpdateFrequency
from app.models.prompt import Prompt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsScheduler:
    def __init__(self, db: Session):
        self.db = db
        self.news_service = NewsService(db)
        self.rss_service = RSSService()
        self._tasks = set()
        self.running = False

    async def _generate_news_for_frequency(self, frequency: UpdateFrequency):
        try:
            # Get all prompts
            prompts = self.db.query(Prompt).all()
            
            # Fetch RSS feeds
            feeds = await self.rss_service.fetch_feeds()
            
            # Generate news for each prompt
            for prompt in prompts:
                try:
                    await self.news_service.generate_news(
                        prompt_id=prompt.id,
                        frequency=frequency,
                        feeds=feeds
                    )
                    logger.info(f"Generated {frequency.value} news for prompt {prompt.id}")
                except Exception as e:
                    logger.error(f"Error generating news for prompt {prompt.id}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error in news generation cycle: {str(e)}")

    async def _schedule_task(self, frequency: UpdateFrequency, interval_minutes: int):
        while self.running:
            try:
                await self._generate_news_for_frequency(frequency)
            except Exception as e:
                logger.error(f"Error in scheduled task: {str(e)}")
            
            await asyncio.sleep(interval_minutes * 60)

    async def start(self):
        self.running = True
        
        # Schedule tasks for different frequencies
        tasks = [
        self._schedule_task(UpdateFrequency.THIRTY_MINUTES, 30),  # Changed from 10 to 30
        self._schedule_task(UpdateFrequency.HOURLY, 60),
        self._schedule_task(UpdateFrequency.DAILY, 1440)
        ]
        
        # Store tasks
        self._tasks.update(asyncio.create_task(task) for task in tasks)
        
        logger.info("News scheduler started")

    async def stop(self):
        self.running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        # Wait for tasks to complete
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        
        self._tasks.clear()
        logger.info("News scheduler stopped")