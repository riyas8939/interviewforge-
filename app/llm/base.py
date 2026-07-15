from abc import ABC, abstractmethod

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        """
        Generates text response from the model provider.
        """
        pass
