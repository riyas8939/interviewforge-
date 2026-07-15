from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseAgent(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        """
        Builds the agent-specific guidelines context.
        """
        pass
