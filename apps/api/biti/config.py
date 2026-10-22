from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BITI_", extra="ignore")

    env: str = "development"
    demo_mode: bool = True
    secret_key: str = "dev-only-change-me"
    access_token_minutes: int = 20
    refresh_token_days: int = 14
    database_url: str = "sqlite:///./data/local/biti.sqlite"
    redis_url: str = ""
    cors_origins: str = "http://127.0.0.1:43181,http://localhost:43181"

    oidc_issuer: str = ""
    oidc_client_id: str = "biti-web"
    oidc_client_secret: str = ""
    oidc_redirect_uri: str = "http://127.0.0.1:43181/auth/callback"

    tts_provider: str = ""
    tts_api_key: str = ""
    tts_base_url: str = ""
    tts_voice: str = "he-IL-standard"

    speech_provider: str = ""
    speech_api_key: str = ""

    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = "gpt-4.1-mini"
    llm_daily_token_budget: int = 80_000
    llm_timeout_seconds: int = 12

    pipeline_cron: str = "0 3 * * 1"
    http_user_agent: str = "BitiIvritBot/0.1 (+https://example.invalid/biti-ivrit)"

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def validate_boot(self) -> None:
        if self.demo_mode and self.is_production:
            raise RuntimeError("BITI_DEMO_MODE cannot be enabled when BITI_ENV=production")
        if self.is_production and self.database_url.startswith("sqlite"):
            raise RuntimeError("SQLite is not allowed when BITI_ENV=production")


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.validate_boot()
    return s
