import requests
import logging
from app.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class LMStudioProvider(BaseLLMProvider):
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        url = f"{settings.LM_STUDIO_BASE_URL}/chat/completions"
        payload = {
            "model": settings.MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                logger.error(f"LM Studio API returned code {response.status_code}")
                raise RuntimeError(f"LM Studio API returned code {response.status_code}")
        except Exception as e:
            logger.error(f"LM Studio execution failed: {e}")
            raise e
