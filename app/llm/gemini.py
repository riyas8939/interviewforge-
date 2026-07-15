import requests
import logging
from app.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiProvider(BaseLLMProvider):
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        # Strip models/ prefix if present
        model_id = settings.MODEL_NAME.replace("models/", "")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={settings.GEMINI_API_KEY}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"System Guidelines:\n{system_prompt}\n\nUser Input:\n{user_prompt}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": max_tokens,
            }
        }
        
        if "json" in system_prompt.lower() or "return" in system_prompt.lower():
            payload["generationConfig"]["responseMimeType"] = "application/json"
            
        try:
            response = requests.post(url, json=payload, timeout=90)
            if response.status_code == 200:
                res_json = response.json()
                return res_json["candidates"][0]["content"]["parts"][0]["text"]
            else:
                logger.error(f"Gemini API error {response.status_code}: {response.text[:200]}")
                raise RuntimeError(f"Gemini API returned code {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch content from Gemini: {e}")
            raise e
