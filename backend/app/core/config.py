import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXUS Operational Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexus_super_secret_jwt_signing_key_production_ready_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    APP_ENV: str = os.getenv("APP_ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Clerk Authentication
    CLERK_ISSUER: str = os.getenv("CLERK_ISSUER", "")
    CLERK_JWKS_URL: str = os.getenv("CLERK_JWKS_URL", "")
    CLERK_WEBHOOK_SECRET: str = os.getenv("CLERK_WEBHOOK_SECRET", "")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://nexus_user:nexus_password@localhost:5432/nexus_db"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Groq AI
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Geoapify & Location Provider Subsystem
    GEOAPIFY_API_KEY: str = os.getenv("GEOAPIFY_API_KEY", "")
    GEOAPIFY_BASE_URL: str = os.getenv("GEOAPIFY_BASE_URL", "https://api.geoapify.com/v1")
    LOCATION_PROVIDER: str = os.getenv("LOCATION_PROVIDER", "auto")  # 'geoapify', 'mock', 'auto'
    GEOAPIFY_REQUEST_TIMEOUT_SECONDS: int = 8
    GEOAPIFY_AUTOCOMPLETE_LIMIT: int = 5
    GEOAPIFY_PLACES_LIMIT: int = 20
    GEOAPIFY_MAX_MATRIX_SOURCES: int = 10
    GEOAPIFY_MAX_MATRIX_TARGETS: int = 10

    # Cloud Integrations
    FABRIC_ONELAKE_ENABLED: bool = True
    AZURE_IOT_HUB_ENABLED: bool = True
    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", "")
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "")
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")
    FABRIC_WORKSPACE_ID: str = os.getenv("FABRIC_WORKSPACE_ID", "")

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
