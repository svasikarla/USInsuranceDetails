from typing import List, Optional, Union
import os
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "US Insurance Details"
    API_PREFIX: str = "/api"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    SECRET_KEY: str = "your_super_secret_key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS - Allow frontend domains
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8000",
        "https://*.vercel.app",  # Vercel deployments
        "https://*.netlify.app", # Netlify deployments
    ]

    # Environment-based CORS (for production)
    FRONTEND_URL: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v, values):
        import json
        # If v is a string (from .env), parse it as JSON
        if isinstance(v, str):
            v = json.loads(v)
        # Add frontend URL from environment if provided
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url and frontend_url not in v:
            v.append(frontend_url)
        return v
    
    # Supabase
    SUPABASE_URL: str = "your_supabase_url"
    SUPABASE_KEY: str = "your_supabase_key"
    SUPABASE_PASSWORD: Optional[str] = None
    
    # Database (derived from Supabase if not provided)
    DATABASE_URL: Optional[str] = None
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v):
        if v is not None:
            return v
        # Use Supabase PostgreSQL connection
        # The connection string should be provided via environment variable
        # For Supabase, we need to use the connection pooler URL with proper credentials
        return None  # Will be set via environment variable
    
    # Document Processing
    UPLOAD_FOLDER: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    OCR_CONFIDENCE_THRESHOLD: float = 0.75

    # AI/LLM Configuration
    GOOGLE_AI_API_KEY: Optional[str] = None
    AI_ANALYSIS_ENABLED: bool = True
    AI_CONFIDENCE_THRESHOLD: float = 0.6
    AI_MAX_RETRIES: int = 3
    AI_RETRY_DELAY: float = 1.0

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "allow"
    }


settings = Settings()
print("[DEBUG] CORS_ORIGINS:", settings.CORS_ORIGINS)
