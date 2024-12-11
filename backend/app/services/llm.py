# app/services/llm.py
import aiohttp
from typing import Dict, Any
from app.config.settings import get_settings
from app.models.news import UpdateFrequency
import logging
from datetime import datetime
from asyncio import sleep
import tiktoken

logger = logging.getLogger(__name__)
settings = get_settings()

class LLMService:
    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.requests_per_minute = 50
        self.tokens_per_minute = 15000  # OpenAI's TPM limit
        self.last_request_time = None
        self.tokens_used = 0
        self.last_token_reset = datetime.now()
        self.encoder = tiktoken.encoding_for_model(self.model)

    def count_tokens(self, text: str) -> int:
        return len(self.encoder.encode(text))

    async def _rate_limit(self, estimated_tokens: int):
        current_time = datetime.now()

        # Reset token counter if a minute has passed
        if (current_time - self.last_token_reset).total_seconds() >= 60:
            self.tokens_used = 0
            self.last_token_reset = current_time

        # Check if adding these tokens would exceed the limit
        if self.tokens_used + estimated_tokens > self.tokens_per_minute:
            # Calculate wait time needed
            wait_time = 60 - (current_time - self.last_token_reset).total_seconds()
            if wait_time > 0:
                logger.info(f"TPM limit reached. Waiting {wait_time:.2f} seconds...")
                await sleep(wait_time)
                self.tokens_used = 0
                self.last_token_reset = datetime.now()

        # Request rate limiting
        if self.last_request_time:
            elapsed = (current_time - self.last_request_time).total_seconds()
            if elapsed < 60 / self.requests_per_minute:
                await sleep((60 / self.requests_per_minute) - elapsed)

        self.last_request_time = datetime.now()
        self.tokens_used += estimated_tokens

    def create_system_prompt(self, frequency: UpdateFrequency) -> str:
        time_window = {
            UpdateFrequency.THIRTY_MINUTES: "the last 30 minutes",
            UpdateFrequency.HOURLY: "the last hour",
            UpdateFrequency.DAILY: "the last 24 hours"
        }[frequency]
        
        return f"""You are a professional news curator and writer. Analyze and summarize news from {time_window} according to the user's prompt.
Follow these guidelines:
1. Focus on the most important and relevant information
2. Maintain objectivity and journalistic standards
3. Report in an entertaining and engaging tone or voice
4. Organize information logically and clearly
5. Include relevant context when necessary
6. Use professional language and tone
7. Follow the user's prompt requirements exactly
8. Select one or two people, places or events in the consolidated news and provide relevant did you know facts about the same"""

    async def generate_summary(
        self,
        feed_content: str,
        prompt_content: str,
        frequency: UpdateFrequency,
        max_retries: int = 3
    ) -> str:
        system_prompt = self.create_system_prompt(frequency)  # Changed from _create_system_prompt
        
        # Estimate total tokens
        total_tokens = (
            self.count_tokens(system_prompt) +
            self.count_tokens(prompt_content) +
            self.count_tokens(feed_content)
        )

        # Apply rate limiting with token consideration
        await self._rate_limit(total_tokens)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Prompt: {prompt_content}\n\nContent to analyze:\n{feed_content}"
                }
            ],
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS
        }
        
        retries = 0
        while retries < max_retries:
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
                            error_data = await response.json()
                            
                            if 'error' in error_data and error_data['error'].get('code') == 'rate_limit_exceeded':
                                retry_after = float(error_data['error']['message'].split('try again in ')[1].split('s')[0])
                                logger.info(f"Rate limit hit. Waiting {retry_after} seconds...")
                                await sleep(retry_after + 1)  # Add 1 second buffer
                                retries += 1
                                continue
                                
                            logger.error(f"LLM API Error: {error_text}")
                            raise Exception(f"LLM API Error: {error_text}")
            except Exception as e:
                if retries == max_retries - 1:
                    logger.error(f"Error in LLM service after {max_retries} retries: {str(e)}")
                    raise
                retries += 1
                await sleep(2 ** retries)  # Exponential backoff