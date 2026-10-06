import os
import secrets
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXUS Operational Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
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

    # Dual-Provider AI Subsystem (Groq Primary + Gemini Fallback)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

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
    AZURE_IOT_HUB_CONNECTION_STRING: str = ""
    AZURE_IOT_HUB_HOSTNAME: str = ""
    AZURE_SUBSCRIPTION_ID: str = ""
    AZURE_RESOURCE_GROUP: str = ""
    AZURE_LOCATION: str = "austriaeast"
    AZURE_UPN: str = ""
    AZURE_WEBAPP_URL: str = ""
    AZURE_TENANT_ID: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    FABRIC_WORKSPACE_ID: str = ""

    # Azure Monitor / Application Insights
    APPLICATIONINSIGHTS_CONNECTION_STRING: str = ""
    AZURE_MONITOR_ENABLED: bool = True
    
    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_ENABLED: bool = True
    # Azure Event Hub
    EVENT_HUB_ENABLED: bool = False
    # Azure PostgreSQL Flexible Server (Free Tier)
    AZURE_POSTGRESQL_URL: str = os.getenv(
        "AZURE_POSTGRESQL_URL",
        "postgresql+asyncpg://azure_user:azure_password@az-postgres.free-tier.azure.com:5432/azure_nexus_db",
    )
    
    # Azure Key Vault
    AZURE_KEYVAULT_URL: str = os.getenv("AZURE_KEYVAULT_URL", "")

    # Azure Cognitive Search (Free Tier)
    AZURE_COGNITIVE_SEARCH_ENABLED: bool = False
    AZURE_COGNITIVE_SEARCH_ENDPOINT: str = ""
    AZURE_COGNITIVE_SEARCH_API_KEY: str = ""

    # Azure Foundry (Free preview)
    AZURE_FOUNDRY_ENABLED: bool = False
    AZURE_FOUNDRY_ENDPOINT: str = ""
    AZURE_FOUNDRY_API_KEY: str = ""


    # Email & Verification Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.example.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@nexus.platform")
    EMAIL_VERIFICATION_ENABLED: bool = os.getenv("EMAIL_VERIFICATION_ENABLED", "false").lower() == "true"
    ENABLE_DEMO_AUTH: bool = os.getenv("ENABLE_DEMO_AUTH", "false").lower() == "true"

    # Weather Cache Configuration (Redis / Memory)
    WEATHER_CACHE_TTL_SECONDS: int = int(os.getenv("WEATHER_CACHE_TTL_SECONDS", "1800"))

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://nexus-logistics-os.vercel.app")
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://nexus-logistics-os.vercel.app",
        "https://nexus-autonomous-logistics.vercel.app",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if not v:
            return v
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if "sslmode=require" in v and "ssl=" not in v:
            v = v.replace("sslmode=require", "ssl=require")
        if "neon.tech" in v and "ssl=" not in v and "sslmode=" not in v:
            v = f"{v}&ssl=require" if "?" in v else f"{v}?ssl=require"
        return v

    @field_validator("SECRET_KEY", mode="after")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if not v or not v.strip():
            return secrets.token_urlsafe(32)
        return v

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
        env_file=(".env", "backend/.env", "../.env", ".env.azure"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
