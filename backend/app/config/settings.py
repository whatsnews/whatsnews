# app/config/settings.py
from typing import List, Optional, Dict, Any
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Base Configuration
    PROJECT_NAME: str = "WhatsNews"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Database Configuration
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str
    DATABASE_URL: Optional[str] = None
    
    # JWT Configuration
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    JWT_ALGORITHM: str = "HS256"
    
    # RSS Feed Configuration
    RSS_FETCH_INTERVAL: int = 10  # minutes
    RSS_FEEDS: List[str] = [
        "http://rss.cnn.com/rss/cnn_topstories.rss",
        "http://feeds.bbci.co.uk/news/rss.xml",
        "https://feeds.a.dj.com/rss/RSSWorldNews.xml"
    ]
    
    # LLM Configuration
    LLM_MODEL: str = "gpt-3.5-turbo"
    LLM_API_KEY: str
    LLM_MAX_TOKENS: int = 1000
    LLM_TEMPERATURE: float = 0.7
    
    # Cache Configuration
    REDIS_URL: Optional[str] = None
    CACHE_ENABLED: bool = False
    CACHE_EXPIRE_MINUTES: int = 60
    
    class Config:
        case_sensitive = True
        env_file = ".env"

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    def get_jwt_settings(self) -> Dict[str, Any]:
        return {
            "secret_key": self.SECRET_KEY,
            "algorithm": self.JWT_ALGORITHM,
            "expire_minutes": self.ACCESS_TOKEN_EXPIRE_MINUTES
        }

@lru_cache()
def get_settings() -> Settings:
    return Settings()