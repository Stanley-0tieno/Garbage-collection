from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Waste2Worth API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./w2w.db"  # swap to postgres in prod

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "175dollarsnow@gmail.com"
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "175dollarsnow@gmail.com"
    EMAIL_FROM_NAME: str = "Waste2Worth"

    # Frontend URL (for confirmation links)
    FRONTEND_URL: str = "http://localhost:4200"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()