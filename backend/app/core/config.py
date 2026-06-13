from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip().rstrip('/') for item in value.split(',') if item.strip()]


class Settings(BaseSettings):
    # Load root .env when running from repo root or from backend/ locally.
    # Docker Compose still injects env vars directly from the root .env.
    model_config = SettingsConfigDict(env_file=('.env', '../.env'), env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Phongtzzz Booking API'
    environment: str = 'development'
    secret_key: str = 'change-this-secret-key'
    access_token_expire_minutes: int = 60 * 24

    database_url: str = 'postgresql+psycopg2://postgres:postgres@localhost:5432/phongtzzz'
    frontend_url: str = 'http://localhost:5173'
    admin_url: str = 'http://localhost:3000'
    cors_extra_origins: str | None = None

    admin_email: str = 'admin@phongtzzz.local'
    admin_password: str = 'admin123456'

    homestay_email: str = 'stayhostelbar@gmail.com'
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = 'noreply@phongtzzz.local'
    smtp_from_name: str = 'Phongtzzz Booking'
    smtp_use_tls: bool = True

    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None
    cloudinary_folder: str = 'phongtzzz'

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
