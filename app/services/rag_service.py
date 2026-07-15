import re
import math
from typing import List, Dict, Any, Tuple

class LocalRAG:
    def __init__(self):
        # List of dicts: {"text": str, "source": str}
        self.documents: List[Dict[str, Any]] = []

    def clear(self):
        self.documents.clear()

    def add_document(self, text: str, source: str = "unknown"):
        # Split text into chunks (e.g., paragraphs or sentences of ~150-200 words)
        paragraphs = [p.strip() for p in re.split(r'\n{2,}', text) if p.strip()]
        for p in paragraphs:
            # Further split very long paragraphs
            words = p.split()
            if len(words) > 150:
                for i in range(0, len(words), 120):
                    chunk = " ".join(words[i:i+150])
                    self.documents.append({"text": chunk, "source": source})
            else:
                self.documents.append({"text": p, "source": source})

    def _tokenize(self, text: str) -> List[str]:
        # Simple lower-case word extraction
        return re.findall(r'\b[a-z0-9\-]+\b', text.lower())

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        # Calculate dot product
        dot_product = sum(vec1.get(word, 0) * val for word, val in vec2.items())
        
        # Calculate magnitudes
        mag1 = math.sqrt(sum(val ** 2 for val in vec1.values()))
        mag2 = math.sqrt(sum(val ** 2 for val in vec2.values()))
        
        if mag1 == 0 or mag2 == 0:
            return 0.0
            
        return dot_product / (mag1 * mag2)

    def search(self, query: str, top_k: int = 3) -> List[Tuple[str, float, str]]:
        if not self.documents:
            return []
            
        # Build vector for query
        query_words = self._tokenize(query)
        query_vector = {}
        for word in query_words:
            query_vector[word] = query_vector.get(word, 0) + 1.0
            
        results = []
        for doc in self.documents:
            doc_words = self._tokenize(doc["text"])
            doc_vector = {}
            for word in doc_words:
                # Add word frequencies
                doc_vector[word] = doc_vector.get(word, 0) + 1.0
                
            similarity = self._cosine_similarity(query_vector, doc_vector)
            results.append((doc["text"], similarity, doc["source"]))
            
        # Sort results by similarity score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

# Global singleton RAG instance
rag_system = LocalRAG()
