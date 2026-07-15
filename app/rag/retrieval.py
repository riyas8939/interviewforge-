import re
import math
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

class BaseVectorStore:
    def __init__(self):
        self.nodes = [] # List of {"text": str, "vector": dict, "metadata": dict}

    def clear(self):
        self.nodes.clear()

    def add_texts(self, texts: List[str], metadatas: List[Dict[str, Any]]):
        for text, meta in zip(texts, metadatas):
            vector = self._embed_text(text)
            self.nodes.append({
                "text": text,
                "vector": vector,
                "metadata": meta
            })

    def _embed_text(self, text: str) -> Dict[str, float]:
        # TF-IDF / Term Frequency term embedding baseline vectorizer
        words = re.findall(r'\b[a-z0-9\-]+\b', text.lower())
        vector = {}
        for w in words:
            vector[w] = vector.get(w, 0.0) + 1.0
        # Normalize vector magnitudes
        mag = math.sqrt(sum(v**2 for v in vector.values()))
        if mag > 0:
            for w in vector:
                vector[w] /= mag
        return vector

    def search(self, query: str, top_k: int = 3) -> List[Tuple[str, float, Dict[str, Any]]]:
        query_vector = self._embed_text(query)
        results = []
        
        for node in self.nodes:
            # Cosine similarity
            dot_product = sum(query_vector.get(word, 0.0) * val for word, val in node["vector"].items())
            results.append((node["text"], dot_product, node["metadata"]))
            
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

class VectorRetrievalService:
    def __init__(self):
        self.store = BaseVectorStore()

    def clear(self):
        self.store.clear()

    def index_document(self, text: str, doc_type: str = "general"):
        # Split document into overlapping paragraphs
        paragraphs = [p.strip() for p in re.split(r'\n{2,}', text) if p.strip()]
        chunks = []
        metadatas = []
        
        for p in paragraphs:
            words = p.split()
            if len(words) > 150:
                for i in range(0, len(words), 100):
                    chunk = " ".join(words[i:i+150])
                    chunks.append(chunk)
                    metadatas.append({"type": doc_type})
            else:
                chunks.append(p)
                metadatas.append({"type": doc_type})
                
        self.store.add_texts(chunks, metadatas)

    def retrieve_context(self, query: str, doc_type: Optional[str] = None, top_k: int = 2) -> str:
        results = self.store.search(query, top_k=top_k * 2)
        filtered = []
        for text, score, meta in results:
            if doc_type and meta.get("type") != doc_type:
                continue
            filtered.append(text)
            if len(filtered) >= top_k:
                break
                
        return "\n\n".join(filtered)

# Global vector search singleton RAG service
vector_rag = VectorRetrievalService()
