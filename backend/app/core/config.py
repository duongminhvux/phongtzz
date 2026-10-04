from functools import lru_cache
from pathlib import Path
import ipaddress
import re
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip().rstrip('/') for item in value.split(',') if item.strip()]


def _origin_variants(origin: str | None) -> list[str]:
    """Return explicit browser-origin variants for the configured site.

    Visitors can arrive through http/https and apex/www depending on browser
    history, HSTS and Cloudflare settings. CORS is based on that page origin,
    not on the visitor device, so accept the safe companion variants too.
    """
    if not origin:
        return []
    normalized = origin.strip().rstrip('/')
    parsed = urlparse(normalized)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname:
        return [normalized] if normalized else []

    host = parsed.hostname
    port = f':{parsed.port}' if parsed.port else ''
    hosts = [host]
    try:
        ipaddress.ip_address(host)
    except ValueError:
        if host != 'localhost':
            if host.startswith('www.'):
                hosts.append(host[4:])
            elif host.count('.') >= 1:
                hosts.append(f'www.{host}')

    schemes = [parsed.scheme]
    if host not in ('localhost', '127.0.0.1'):
        schemes = ['https', 'http']

    values: list[str] = []
    for scheme in schemes:
        for candidate_host in hosts:
            candidate = f'{scheme}://{candidate_host}{port}'
            if candidate not in values:
                values.append(candidate)
    return values


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
    cors_origin_regex_override: str | None = None

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
        origins: list[str] = []
        for configured in (self.frontend_url, self.admin_url):
            origins.extend(_origin_variants(configured))
        origins.extend([
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
        ])
        for extra in _split_csv(self.cors_extra_origins):
            origins.extend(_origin_variants(extra))

        cleaned: list[str] = []
        for origin in origins:
            normalized = origin.rstrip('/')
            if normalized and normalized not in cleaned:
                cleaned.append(normalized)
        return cleaned

    @property
    def cors_origin_regex(self) -> str | None:
        if self.cors_origin_regex_override:
            return self.cors_origin_regex_override

        parsed = urlparse(self.frontend_url.rstrip('/'))
        host = parsed.hostname
        if not host:
            return r'^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$'
        try:
            ipaddress.ip_address(host)
            return r'^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$'
        except ValueError:
            pass
        if host == 'localhost':
            return r'^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$'

        # The public frontend is the trust root. Allow its apex/www/subdomains so
        # browsers that arrive through www, admin, or another same-site hostname
        # receive the same CORS behavior on every device.
        base = host[4:] if host.startswith('www.') else host
        escaped = re.escape(base)
        return rf'^https?://(?:[a-zA-Z0-9-]+\.)*{escaped}(?::\d+)?$'


@lru_cache
def get_settings() -> Settings:
    return Settings()
