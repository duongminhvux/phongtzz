from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Phongtzzz Booking API'
    environment: str = 'development'
    secret_key: str = 'change-this-secret-key'
    access_token_expire_minutes: int = 60 * 24

    database_url: str = 'postgresql+psycopg2://postgres:postgres@localhost:5432/phongtzzz'
    frontend_url: str = 'http://localhost:5173'
    admin_url: str = 'http://localhost:3000'

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
        return [self.frontend_url, self.admin_url, 'http://localhost:5174']


@lru_cache
def get_settings() -> Settings:
    return Settings()
