import requests
import logging
from app.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaProvider(BaseLLMProvider):
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": settings.MODEL_NAME,
            "prompt": f"System: {system_prompt}\nUser: {user_prompt}",
            "stream": False,
            "format": "json",
            "options": {"num_predict": max_tokens}
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json().get("response", "")
            else:
                logger.error(f"Ollama returned code {response.status_code}")
                raise RuntimeError(f"Ollama returned code {response.status_code}")
        except Exception as e:
            logger.error(f"Ollama execution failed: {e}")
            raise e
