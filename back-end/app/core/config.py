from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Waste2Wealth API"
    DEBUG: bool = False

    # Database — asyncpg driver for PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/waste_to_wealth"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Email — reads EMAIL_USERNAME / EMAIL_PASSWORD from OS environment
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""        # overridden by EMAIL_USERNAME in .env
    SMTP_PASSWORD: str = ""    # overridden by EMAIL_PASSWORD in .env
    EMAIL_FROM: str = ""       # defaults to SMTP_USER if blank
    EMAIL_FROM_NAME: str = "Waste2Wealth"

    # These match your Java / OS env var names exactly
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""

    # Frontend URL (for confirmation links)
    FRONTEND_URL: str = "http://localhost:4200"

    # M-Pesa Daraja Config
    MPESA_CONSUMER_KEY: str = ""
    MPESA_CONSUMER_SECRET: str = ""
    MPESA_SHORTCODE: str = ""
    MPESA_PASSKEY: str = ""
    MPESA_CALLBACK_URL: str = ""
    MPESA_ENV: str = "sandbox"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        # also read directly from OS environment (no .env needed for email)
        env_file_encoding="utf-8",
    )

    def model_post_init(self, __context) -> None:
        # If the Java-style env vars are set, use them for SMTP
        if self.EMAIL_USERNAME and not self.SMTP_USER:
            object.__setattr__(self, "SMTP_USER", self.EMAIL_USERNAME)
        if self.EMAIL_PASSWORD and not self.SMTP_PASSWORD:
            object.__setattr__(self, "SMTP_PASSWORD", self.EMAIL_PASSWORD)
        # Default EMAIL_FROM to the sending account
        if not self.EMAIL_FROM and self.SMTP_USER:
            object.__setattr__(self, "EMAIL_FROM", self.SMTP_USER)


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
