"""
Embedding service using Google Vertex AI
"""

from typing import List, Optional
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
import vertexai
import base64
import json
import tempfile
import os
from app.config import settings


class EmbeddingService:
    """Service for generating embeddings using Vertex AI"""

    def __init__(self):
        """Initialize Vertex AI with project and location"""
        self.model_name = "text-embedding-004"
        self.initialized = False
        self.temp_creds_file = None

    def _setup_credentials(self):
        """Set up Google Cloud credentials from base64 encoded string if available"""
        # If base64 credentials are provided, decode and set up temp file
        if settings.GOOGLE_APPLICATION_CREDENTIALS_BASE64:
            try:
                # Decode base64 credentials
                credentials_json = base64.b64decode(settings.GOOGLE_APPLICATION_CREDENTIALS_BASE64)

                # Validate it's valid JSON
                json.loads(credentials_json)

                # Create a temporary file for credentials
                with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as temp_file:
                    temp_file.write(credentials_json.decode('utf-8'))
                    self.temp_creds_file = temp_file.name

                # Set environment variable to point to temp file
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = self.temp_creds_file
                print(f"✅ Using base64 encoded credentials (temp file: {self.temp_creds_file})")

            except Exception as e:
                print(f"Error setting up base64 credentials: {e}")
                return False

        # If regular credentials path is provided
        elif settings.GOOGLE_APPLICATION_CREDENTIALS:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.GOOGLE_APPLICATION_CREDENTIALS
            print(f"✅ Using credentials from file: {settings.GOOGLE_APPLICATION_CREDENTIALS}")

        return True

    def _initialize(self):
        """Lazy initialization of Vertex AI"""
        if not self.initialized:
            try:
                # Set up credentials first
                if not self._setup_credentials():
                    print("Warning: Failed to set up credentials")
                    return

                # Initialize Vertex AI
                vertexai.init(
                    project=settings.GOOGLE_CLOUD_PROJECT,
                    location=settings.GOOGLE_CLOUD_LOCATION
                )
                self.model = TextEmbeddingModel.from_pretrained(self.model_name)
                self.initialized = True
                print(f"✅ Vertex AI initialized successfully (project: {settings.GOOGLE_CLOUD_PROJECT}, location: {settings.GOOGLE_CLOUD_LOCATION})")
            except Exception as e:
                print(f"Warning: Failed to initialize Vertex AI: {e}")
                print("Embeddings will not be generated. Check your GCP credentials.")
                self.initialized = False

    def __del__(self):
        """Clean up temporary credentials file if created"""
        if self.temp_creds_file and os.path.exists(self.temp_creds_file):
            try:
                os.unlink(self.temp_creds_file)
            except Exception:
                pass

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
