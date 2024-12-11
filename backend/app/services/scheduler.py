from typing import Dict, Set, Optional
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import asyncio
import logging
import pytz
from app.services.news import NewsService
from app.services.rss import RSSService
from app.models.news import UpdateFrequency
from app.models.prompt import Prompt
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsScheduler:
    def __init__(self, db: Session):
        self.db = db
        self.news_service = NewsService(db)
        self.rss_service = RSSService()
        self._tasks: Set[asyncio.Task] = set()
        self.running = False
        self.user_schedules: Dict[int, Dict] = {}  # Store user-specific schedules

    async def _generate_news_for_user(self, user_id: int, frequency: UpdateFrequency):
        """Generate news for a specific user's prompts."""
        try:
            # Get user's prompts
            prompts = self.db.query(Prompt).filter(Prompt.user_id == user_id).all()
            if not prompts:
                return

            # Fetch RSS feeds once for all prompts
            feeds = await self.rss_service.fetch_feeds()
            
            # Generate news for each prompt
            for prompt in prompts:
                try:
                    await self.news_service.generate_news(
                        prompt_id=prompt.id,
                        frequency=frequency,
                        feeds=feeds
                    )
                    logger.info(f"Generated {frequency.value} news for prompt {prompt.id} (user: {user_id})")
                except Exception as e:
                    logger.error(f"Error generating news for prompt {prompt.id}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error in news generation cycle for user {user_id}: {str(e)}")

    def _should_generate_hourly_news(self, user: User, current_time: datetime) -> bool:
        """Check if hourly news should be generated for a user."""
        user_time = current_time.astimezone(pytz.timezone(user.timezone))
        return user_time.hour not in [user.news_generation_hour_1, user.news_generation_hour_2]

    async def _schedule_user_task(self, user: User, frequency: UpdateFrequency):
        """Handle scheduling for a specific user."""
        user_tz = pytz.timezone(user.timezone)
        
        while self.running:
            try:
                current_time = datetime.now(pytz.UTC)
                user_time = current_time.astimezone(user_tz)

                should_generate = False
                if frequency == UpdateFrequency.HOURLY:
                    if self._should_generate_hourly_news(user, current_time):
                        should_generate = user_time.minute < 5  # Generate within first 5 minutes of hour
                else:  # DAILY
                    # Generate at user's specified hours
                    should_generate = user_time.hour in [
                        user.news_generation_hour_1,
                        user.news_generation_hour_2
                    ] and user_time.minute < 5

                if should_generate:
                    await self._generate_news_for_user(user.id, frequency)

                # Calculate next check interval
                next_interval = self._calculate_next_interval(user, frequency, user_time)
                await asyncio.sleep(next_interval)

            except Exception as e:
                logger.error(f"Error in user scheduling task: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying

    def _calculate_next_interval(self, user: User, frequency: UpdateFrequency, current_time: datetime) -> int:
        """Calculate seconds until next run for a user."""
        if frequency == UpdateFrequency.HOURLY:
            # Next hour, but skip daily news hours
            next_time = current_time + timedelta(hours=1)
            next_time = next_time.replace(minute=0, second=0, microsecond=0)
            
            # If next time would be a daily news hour, skip to the hour after
            while next_time.hour in [user.news_generation_hour_1, user.news_generation_hour_2]:
                next_time += timedelta(hours=1)
                
        else:  # DAILY
            # Find next news generation hour
            current_hour = current_time.hour
            if current_hour < user.news_generation_hour_1:
                next_time = current_time.replace(hour=user.news_generation_hour_1)
            elif current_hour < user.news_generation_hour_2:
                next_time = current_time.replace(hour=user.news_generation_hour_2)
            else:
                next_time = current_time.replace(
                    hour=user.news_generation_hour_1,
                    day=current_time.day + 1
                )
            
            next_time = next_time.replace(minute=0, second=0, microsecond=0)

        return int((next_time - current_time).total_seconds())

    def _create_user_tasks(self, user: User) -> Set[asyncio.Task]:
        """Create scheduling tasks for a user."""
        return {
            asyncio.create_task(self._schedule_user_task(user, UpdateFrequency.HOURLY)),
            asyncio.create_task(self._schedule_user_task(user, UpdateFrequency.DAILY))
        }

    async def start(self):
        """Start the scheduler for all users."""
        self.running = True
        
        try:
            # Get all active users
            users = self.db.query(User).filter(User.is_active == True).all()
            
            # Create tasks for each user
            for user in users:
                user_tasks = self._create_user_tasks(user)
                self._tasks.update(user_tasks)
                self.user_schedules[user.id] = {
                    'tasks': user_tasks,
                    'timezone': user.timezone
                }
            
            logger.info(f"News scheduler started for {len(users)} users")
            
        except Exception as e:
            logger.error(f"Error starting scheduler: {str(e)}")
            await self.stop()

    async def stop(self):
        """Stop the scheduler and clean up tasks."""
        self.running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        # Wait for tasks to complete
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        
        self._tasks.clear()
        self.user_schedules.clear()
        logger.info("News scheduler stopped")

    async def update_user_schedule(self, user_id: int):
        """Update scheduling for a specific user."""
        try:
            # Remove existing tasks for the user
            if user_id in self.user_schedules:
                old_tasks = self.user_schedules[user_id]['tasks']
                self._tasks.difference_update(old_tasks)
                for task in old_tasks:
                    task.cancel()

            # Create new tasks if user is active
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.is_active and self.running:
                new_tasks = self._create_user_tasks(user)
                self._tasks.update(new_tasks)
                self.user_schedules[user_id] = {
                    'tasks': new_tasks,
                    'timezone': user.timezone
                }
                logger.info(f"Updated schedule for user {user_id}")
                
        except Exception as e:
            logger.error(f"Error updating user schedule: {str(e)}")