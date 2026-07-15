import requests
import logging
from app.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class HFProvider(BaseLLMProvider):
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        url = f"https://api-inference.huggingface.co/models/{settings.MODEL_NAME}"
        headers = {"Authorization": f"Bearer {settings.HF_API_KEY}"}
        payload = {
            "inputs": f"<s>[INST] {system_prompt}\n\n{user_prompt} [/INST]",
            "parameters": {"max_new_tokens": max_tokens, "return_full_text": False}
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            if response.status_code == 200:
                res_json = response.json()
                if isinstance(res_json, list) and len(res_json) > 0:
                    return res_json[0].get("generated_text", "")
                elif isinstance(res_json, dict):
                    return res_json.get("generated_text", "")
                raise ValueError("Unexpected HuggingFace response format")
            else:
                logger.error(f"HuggingFace API returned code {response.status_code}")
                raise RuntimeError(f"HuggingFace API returned code {response.status_code}")
        except Exception as e:
            logger.error(f"HuggingFace execution failed: {e}")
            raise e
