from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        # Support multiple environment files
        # Priority: .env.prod > .env.production > .env.staging > .env
        env_file = os.getenv("ENV_FILE", ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()
