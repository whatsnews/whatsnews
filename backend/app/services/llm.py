# app/services/llm.py
import aiohttp
from typing import Dict, Any
from app.config.settings import get_settings
from app.models.news import UpdateFrequency
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class LLMService:
    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        self.api_url = "https://api.openai.com/v1/chat/completions"

    def _create_system_prompt(self, frequency: UpdateFrequency) -> str:
        time_window = {
            UpdateFrequency.THIRTY_MINUTES: "the last 30 minutes",
            UpdateFrequency.HOURLY: "the last hour",
            UpdateFrequency.DAILY: "the last 24 hours"
        }[frequency]
        
        return f"""You are a professional news curator and writer. Analyze and summarize news from {time_window} according to the user's prompt.
Follow these guidelines:
1. Focus on the most important and relevant information
2. Maintain objectivity and journalistic standards
3. Organize information logically and clearly
4. Include relevant context when necessary
5. Use professional language and tone
6. Follow the user's prompt requirements exactly"""

    async def generate_summary(
        self,
        feed_content: str,
        prompt_content: str,
        frequency: UpdateFrequency
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": self._create_system_prompt(frequency)
                },
                {
                    "role": "user",
                    "content": f"Prompt: {prompt_content}\n\nContent to analyze:\n{feed_content}"
                }
            ],
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data['choices'][0]['message']['content']
                    else:
                        error_text = await response.text()
                        logger.error(f"LLM API Error: {error_text}")
                        raise Exception(f"LLM API Error: {error_text}")
        except Exception as e:
            logger.error(f"Error in LLM service: {str(e)}")
            raise