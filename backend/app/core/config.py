from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip().rstrip('/') for item in value.split(',') if item.strip()]


class Settings(BaseSettings):
    # Load root .env when running from repo root or from backend/ locally.
    # Docker Compose injects the same variables from the root .env.
    model_config = SettingsConfigDict(env_file=('.env', '../.env'), env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Riverside Haven Booking API'
    environment: str = 'development'
    secret_key: str = 'change-this-secret-key'
    access_token_expire_minutes: int = 60 * 24

    database_url: str = 'postgresql+psycopg2://postgres:postgres@localhost:5432/riverside_haven'
    frontend_url: str = 'http://localhost:5173'
    admin_url: str = 'http://localhost:3000'
    cors_extra_origins: str | None = None

    admin_email: str = 'admin@riversidehaven.local'
    admin_password: str = 'admin123456'

    homestay_email: str = 'stayhostelbar@gmail.com'
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = 'noreply@riversidehaven.local'
    smtp_from_name: str = 'Riverside Haven Booking'
    smtp_use_tls: bool = True

    # Persistent local media storage. In Docker this is a bind mount from
    # ./data/uploads on the host, so rebuilding/recreating containers does not
    # delete uploaded files.
    media_root: str = '/data/uploads'
    media_url_prefix: str = '/uploads'

    # Used only when the database is empty. Supported values: booking, blank.
    # Once a site exists, restarts never overwrite admin changes.
    initial_site_template: str = 'booking'

    @property
    def media_root_path(self) -> Path:
        return Path(self.media_root).expanduser().resolve()

    @property
    def normalized_media_url_prefix(self) -> str:
        prefix = '/' + self.media_url_prefix.strip('/')
        return prefix.rstrip('/') or '/uploads'

    @property
    def cors_origins(self) -> list[str]:
        origins = [
            self.frontend_url,
            self.admin_url,
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
        ]
        origins.extend(_split_csv(self.cors_extra_origins))

        cleaned: list[str] = []
        for origin in origins:
            if not origin:
                continue
            normalized = origin.rstrip('/')
            if normalized not in cleaned:
                cleaned.append(normalized)
        return cleaned


@lru_cache
def get_settings() -> Settings:
    return Settings()
