import logging
from app.core.config import settings
from app.llm.demo import DemoProvider
from app.llm.gemini import GeminiProvider
from app.llm.ollama import OllamaProvider
from app.llm.huggingface import HFProvider
from app.llm.lm_studio import LMStudioProvider

logger = logging.getLogger(__name__)

class LLMProvider:
    @staticmethod
    def generate_response(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        provider_name = settings.MODEL_PROVIDER.lower()
        
        # Instantiate provider dynamically
        if provider_name == "gemini":
            provider = GeminiProvider()
        elif provider_name == "ollama":
            provider = OllamaProvider()
        elif provider_name == "huggingface":
            provider = HFProvider()
        elif provider_name == "lm_studio":
            provider = LMStudioProvider()
        else:
            provider = DemoProvider()
            
        try:
            return provider.generate(system_prompt, user_prompt, max_tokens)
        except Exception as e:
            logger.warning(f"Provider {provider_name} failed with error: {e}. Falling back to Demo Mode.")
            fallback = DemoProvider()
            return fallback.generate(system_prompt, user_prompt, max_tokens)

    @staticmethod
    def get_demo_response(system_prompt: str, user_prompt: str) -> str:
        """
        Backwards compatibility alias for code expecting Demo response directly.
        """
        fallback = DemoProvider()
        return fallback.generate(system_prompt, user_prompt)
