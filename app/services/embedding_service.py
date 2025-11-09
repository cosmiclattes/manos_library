"""
Embedding service using Google Vertex AI
"""

from typing import List, Optional
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
import vertexai
from app.config import settings


class EmbeddingService:
    """Service for generating embeddings using Vertex AI"""

    def __init__(self):
        """Initialize Vertex AI with project and location"""
        self.model_name = "text-embedding-004"
        self.initialized = False

    def _initialize(self):
        """Lazy initialization of Vertex AI"""
        if not self.initialized:
            try:
                vertexai.init(
                    project=settings.GOOGLE_CLOUD_PROJECT,
                    location=settings.GOOGLE_CLOUD_LOCATION
                )
                self.model = TextEmbeddingModel.from_pretrained(self.model_name)
                self.initialized = True
            except Exception as e:
                print(f"Warning: Failed to initialize Vertex AI: {e}")
                print("Embeddings will not be generated. Check your GCP credentials.")
                self.initialized = False

    def generate_embedding(
        self,
        title: str,
        author: str,
        summary: Optional[str] = None,
        genre: Optional[str] = None
    ) -> Optional[List[float]]:
        """
        Generate embedding for a book using title, author, summary, and genre.

        Args:
            title: Book title
            author: Book author
            summary: Book summary (optional)
            genre: Book genre (optional)

        Returns:
            List of floats representing the embedding, or None if generation fails
        """
        self._initialize()

        if not self.initialized:
            return None

        try:
            # Combine book information into a single text
            text_parts = [f"Title: {title}", f"Author: {author}"]

            if genre:
                text_parts.append(f"Genre: {genre}")

            if summary:
                text_parts.append(f"Summary: {summary}")

            text = " | ".join(text_parts)

            # Generate embedding
            embeddings = self.model.get_embeddings([text])

            if embeddings and len(embeddings) > 0:
                return embeddings[0].values

            return None

        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None

    def generate_query_embedding(self, query: str) -> Optional[List[float]]:
        """
        Generate embedding for a search query.

        Args:
            query: Search query text

        Returns:
            List of floats representing the embedding, or None if generation fails
        """
        self._initialize()

        if not self.initialized:
            return None

        try:
            embeddings = self.model.get_embeddings([query])

            if embeddings and len(embeddings) > 0:
                return embeddings[0].values

            return None

        except Exception as e:
            print(f"Error generating query embedding: {e}")
            return None


# Global instance
embedding_service = EmbeddingService()
