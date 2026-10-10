import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXUS"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Cryptographic secret key for signing & hashing (must be set in production)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexus-dev-secret-key-change-in-production-min-32-chars")

    # Database: Neon Postgres async connection URL (required)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Clerk Authentication (Entra/Clerk JWT verification)
    CLERK_ISSUER: str = os.getenv("CLERK_ISSUER", "")
    CLERK_JWKS_URL: str = os.getenv("CLERK_JWKS_URL", "")
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")

    # Azure Maps (Entra auth - client id of the Azure Maps account)
    AZURE_MAPS_CLIENT_ID: str = os.getenv("AZURE_MAPS_CLIENT_ID", "")
    DAILY_MAPS_CALL_CAP: int = int(os.getenv("DAILY_MAPS_CALL_CAP", "2000"))

    # Azure Blob Storage (for daily Parquet exports)
    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    AZURE_STORAGE_CONTAINER_NAME: str = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "telemetry-exports")

    # Azure Application Insights / Monitor
    APPLICATIONINSIGHTS_CONNECTION_STRING: str = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING", "")
    AZURE_MONITOR_ENABLED: bool = os.getenv("AZURE_MONITOR_ENABLED", "false").lower() == "true"

    # CORS Allowed Origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Driver tracking & retention settings
    PING_RETENTION_DAYS: int = int(os.getenv("PING_RETENTION_DAYS", "14"))
    MAX_PING_BATCH_SIZE: int = int(os.getenv("MAX_PING_BATCH_SIZE", "100"))
    MAX_OFFLINE_QUEUE_SIZE: int = int(os.getenv("MAX_OFFLINE_QUEUE_SIZE", "5000"))

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

    def validate_runtime_config(self) -> None:
        """Fail fast at startup if critical settings are missing in production."""
        if self.APP_ENV == "production":
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL is required in production environment.")
            if not self.SECRET_KEY or self.SECRET_KEY == "nexus-dev-secret-key-change-in-production-min-32-chars":
                raise ValueError("SECRET_KEY must be securely configured in production.")
            if not self.CLERK_ISSUER and not self.CLERK_JWKS_URL:
                raise ValueError("CLERK_ISSUER or CLERK_JWKS_URL is required in production.")

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
