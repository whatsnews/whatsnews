# app/services/rss.py
import feedparser
from typing import List, Dict, Any
import aiohttp
import asyncio
from datetime import datetime
from app.config.settings import get_settings

settings = get_settings()

class RSSService:
    def __init__(self):
        # Example RSS feeds - you can extend this list
        self.feeds = [
            # Global News
            "http://rss.cnn.com/rss/cnn_topstories.rss",
            "http://feeds.bbci.co.uk/news/rss.xml",
            "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
            "https://www.npr.org/rss/rss.php?id=1004",  # NPR World News
            "https://www.reuters.com/rssFeed/worldNews",  # Reuters World News
            "https://www.aljazeera.com/xml/rss/all.xml",  # Al Jazeera English
            "https://www.euronews.com/rss?level=theme&name=news",  # Euronews Global

            # India News
            "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",  # Times of India - Top Stories
            "https://www.hindustantimes.com/rss/topnews/rssfeed.xml",  # Hindustan Times - Top News
            "https://www.thehindu.com/news/national/feeder/default.rss",  # The Hindu - National News
            "https://indianexpress.com/section/india/feed/",  # The Indian Express - India News
            "https://www.ndtv.com/rss",  # NDTV News

            # Asia News
            "https://www.scmp.com/rss/318208/feed",  # South China Morning Post - Asia News
            "https://asia.nikkei.com/rss/feed",  # Nikkei Asia
            "https://www.channelnewsasia.com/rssfeeds/8395986",  # Channel News Asia
            "https://www.koreatimes.co.kr/www/rss/nation.xml",  # The Korea Times
            "https://www.japantimes.co.jp/news_category/national/feed/",  # The Japan Times - National News
            "https://vietnamnews.vn/rss/",  # Vietnam News
            "https://www.bangkokpost.com/rss/data",  # Bangkok Post - General News

            # Additional Global News
            "https://www.nytimes.com/services/xml/rss/nyt/World.xml",  # New York Times - World News
            "https://www.washingtonpost.com/rss/world",  # Washington Post - World News

            # Technology News
            "http://rss.slashdot.org/Slashdot/slashdotMain"
        ]

    async def fetch_feed(self, session: aiohttp.ClientSession, url: str) -> Dict[str, Any]:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)
                    return {
                        'url': url,
                        'entries': [
                            {
                                'title': entry.get('title', ''),
                                'description': entry.get('description', ''),
                                'link': entry.get('link', ''),
                                'published': entry.get('published', ''),
                                'source': url
                            }
                            for entry in feed.entries
                        ]
                    }
                return {'url': url, 'entries': []}
        except Exception as e:
            print(f"Error fetching {url}: {str(e)}")
            return {'url': url, 'entries': []}

    async def fetch_feeds(self) -> List[Dict[str, Any]]:
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch_feed(session, url) for url in self.feeds]
            results = await asyncio.gather(*tasks)
            return results

# app/services/news.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.news import News, UpdateFrequency
from app.models.prompt import Prompt
from app.services.llm import LLMService
from datetime import datetime, timedelta

class NewsService:
    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMService()



    def _filter_feeds_by_time(
        self,
        feeds: List[Dict[str, Any]],
        frequency: UpdateFrequency
    ) -> List[Dict[str, Any]]:
        now = datetime.utcnow()
        
        if frequency == UpdateFrequency.THIRTY_MINUTES:  # Changed
            cutoff = now - timedelta(minutes=30)  # Changed
        elif frequency == UpdateFrequency.HOURLY:
            cutoff = now - timedelta(hours=1)
        else:  # DAILY
            cutoff = now - timedelta(days=1)
        
        filtered_feeds = []
        for feed in feeds:
            recent_entries = []
            for entry in feed['entries']:
                try:
                    pub_date = datetime.strptime(entry['published'], '%a, %d %b %Y %H:%M:%S %z')
                    if pub_date > cutoff:
                        recent_entries.append(entry)
                except (ValueError, KeyError):
                    continue
            
            if recent_entries:
                filtered_feed = feed.copy()
                filtered_feed['entries'] = recent_entries
                filtered_feeds.append(filtered_feed)
        
        return filtered_feeds

    async def generate_news(
        self,
        prompt_id: int,
        frequency: UpdateFrequency,
        feeds: List[Dict[str, Any]]
    ) -> News:
        # Get the prompt
        prompt = self.db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            raise ValueError("Prompt not found")
        
        # Filter feeds based on frequency
        filtered_feeds = self._filter_feeds_by_time(feeds, frequency)
        
        if not filtered_feeds:
            return None
        
        # Prepare content for LLM
        feed_content = "\n\n".join([
            "\n".join([
                f"Title: {entry['title']}\nDescription: {entry['description']}"
                for entry in feed['entries']
            ])
            for feed in filtered_feeds
        ])
        
        # Generate summary using LLM
        summary = await self.llm_service.generate_summary(
            feed_content=feed_content,
            prompt_content=prompt.content,
            frequency=frequency
        )
        
        # Create news entry
        news = News(
            title=f"{frequency.value} Update - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            content=summary,
            frequency=frequency,
            prompt_id=prompt_id
        )
        
        self.db.add(news)
        self.db.commit()
        self.db.refresh(news)
        
        return news