import feedparser
from typing import List, Dict, Any
import aiohttp
import asyncio
from datetime import datetime, timezone
import logging
from app.config.settings import get_settings
import dateutil.parser

settings = get_settings()
logger = logging.getLogger(__name__)

class RSSService:
    def __init__(self):
        self.feeds = [
            # Top News Sources
            "https://feeds.bbci.co.uk/news/rss.xml",  # BBC News
            "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",  # NYT World
            "http://feeds.bbci.co.uk/news/world/rss.xml",  # BBC World
            "https://www.indiatoday.in/rss/1206578",  # India Today Top Stories
            "https://www.thehindu.com/news/feeder/default.rss",  # The Hindu
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", # TOI Top Stories
            
            # Technology News
            "https://feeds.feedburner.com/TechCrunch",  # TechCrunch
            "https://www.wired.com/feed/rss",  # Wired
            "https://www.theverge.com/rss/index.xml",  # The Verge
            
            # Business News
            "https://feeds.bloomberg.com/markets/news.rss",  # Bloomberg
            "https://www.forbes.com/innovation/feed/",  # Forbes Innovation
            
            # Science News
            "https://www.sciencedaily.com/rss/all.xml",  # Science Daily
            "https://www.livescience.com/feeds/all",  # Live Science

            # Tech News
            "https://rss.slashdot.org/Slashdot/slashdot",
        ]
        
    async def fetch_feed(self, session: aiohttp.ClientSession, url: str) -> Dict[str, Any]:
        try:
            timeout = aiohttp.ClientTimeout(total=30)  # 30 seconds timeout
            async with session.get(url, timeout=timeout) as response:
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)
                    
                    entries = []
                    for entry in feed.entries:
                        try:
                            # Parse and standardize the publication date
                            published = entry.get('published', '')
                            if published:
                                pub_date = dateutil.parser.parse(published)
                                if pub_date.tzinfo is None:
                                    pub_date = pub_date.replace(tzinfo=timezone.utc)
                                published = pub_date.isoformat()
                            
                            entries.append({
                                'title': entry.get('title', '').strip(),
                                'description': entry.get('description', '').strip(),
                                'link': entry.get('link', ''),
                                'published': published,
                                'source': url,
                                'author': entry.get('author', 'Unknown'),
                                'categories': entry.get('tags', [])
                            })
                        except Exception as e:
                            logger.warning(f"Error processing entry from {url}: {str(e)}")
                            continue
                    
                    return {
                        'url': url,
                        'title': getattr(feed.feed, 'title', ''),
                        'description': getattr(feed.feed, 'description', ''),
                        'entries': entries
                    }
                
                logger.warning(f"Failed to fetch {url}: HTTP {response.status}")
                return {'url': url, 'entries': []}
                
        except asyncio.TimeoutError:
            logger.warning(f"Timeout fetching {url}")
            return {'url': url, 'entries': []}
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return {'url': url, 'entries': []}

    async def fetch_feeds(self) -> List[Dict[str, Any]]:
        """
        Fetch all RSS feeds concurrently with improved error handling and logging.
        """
        connector = aiohttp.TCPConnector(limit=10)  # Limit concurrent connections
        timeout = aiohttp.ClientTimeout(total=60)  # Overall timeout for all feeds
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            tasks = [self.fetch_feed(session, url) for url in self.feeds]
            try:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Filter out failed feeds and log errors
                filtered_results = []
                for result in results:
                    if isinstance(result, Exception):
                        logger.error(f"Feed fetch failed: {str(result)}")
                    elif isinstance(result, dict) and result.get('entries'):
                        filtered_results.append(result)
                
                return filtered_results
            
            except Exception as e:
                logger.error(f"Error fetching feeds: {str(e)}")
                return []