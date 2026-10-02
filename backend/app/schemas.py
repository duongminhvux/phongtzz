from datetime import date, datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models import BookingStatus, TourBookingStatus

PHONE_PATTERN = r'^[0-9+()\-\.\s]{8,25}$'


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    role: str


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=72)

    @field_validator('email')
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if '@' not in cleaned or cleaned.startswith('@') or cleaned.endswith('@'):
            raise ValueError('Email is invalid')
        return cleaned


class TokenOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    admin: AdminOut


class MediaItem(BaseModel):
    """Canonical media reference shared by landing, rooms and tours."""

    asset_id: str | None = Field(default=None, max_length=36)
    url: str = Field(min_length=1, max_length=2000)
    type: Literal['image', 'video'] = 'image'
    storage_path: str | None = Field(default=None, max_length=1000)
    width: int | None = None
    height: int | None = None
    format: str | None = Field(default=None, max_length=40)
    original_filename: str | None = Field(default=None, max_length=500)
    source: str | None = Field(default=None, max_length=40)
    alt: str | None = Field(default=None, max_length=255)
    sort_order: int = 0


def normalize_media_list(value: Any) -> list[dict[str, Any]]:
    if not value:
        return []
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(value):
        if isinstance(item, str):
            item_type = 'video' if item.lower().split('?')[0].endswith(('.mp4', '.webm', '.mov')) else 'image'
            normalized.append({'url': item, 'type': item_type, 'sort_order': index})
        elif isinstance(item, dict) and item.get('url'):
            copied = dict(item)
            copied.setdefault('type', 'image')
            copied.setdefault('sort_order', index)
            normalized.append(copied)
    return sorted(normalized, key=lambda x: x.get('sort_order', 0))


class RoomBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    type: str = Field(default='private', max_length=50)
    price: int | None = Field(default=None, ge=0)
    original_price: int | None = Field(default=None, ge=0)
    capacity: int | None = Field(default=None, ge=1, le=100)
    beds: int | None = Field(default=None, ge=0, le=100)
    bed_type: str | None = Field(default=None, max_length=255)
    size: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=3000)
    amenities: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    images: list[MediaItem] = Field(default_factory=list)
    is_active: bool = True
    sort_order: int = 0

    @field_validator('amenities', 'highlights')
    @classmethod
    def clean_str_list(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @field_validator('images', mode='before')
    @classmethod
    def clean_media_list(cls, value: Any) -> list[dict[str, Any]]:
        return normalize_media_list(value)


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    type: str | None = Field(default=None, max_length=50)
    price: int | None = Field(default=None, ge=0)
    original_price: int | None = Field(default=None, ge=0)
    capacity: int | None = Field(default=None, ge=1, le=100)
    beds: int | None = Field(default=None, ge=0, le=100)
    bed_type: str | None = Field(default=None, max_length=255)
    size: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=3000)
    amenities: list[str] | None = None
    highlights: list[str] | None = None
    images: list[MediaItem] | None = None
    is_active: bool | None = None
    sort_order: int | None = None

    @field_validator('images', mode='before')
    @classmethod
    def clean_media_list(cls, value: Any) -> list[dict[str, Any]] | None:
        if value is None:
            return None
        return normalize_media_list(value)


class RoomOut(RoomBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    slug: str
    created_at: datetime
    updated_at: datetime


class BookingRequestCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=PHONE_PATTERN)
    email: EmailStr | None = None
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=100)
    room_id: str | None = None
    message: str | None = Field(default=None, max_length=1000)
    source: str | None = Field(default=None, max_length=255)
    page_url: str | None = Field(default=None, max_length=1000)
    utm_source: str | None = Field(default=None, max_length=255)
    utm_medium: str | None = Field(default=None, max_length=255)
    utm_campaign: str | None = Field(default=None, max_length=255)

    @field_validator('full_name', 'phone')
    @classmethod
    def strip_required(cls, value: str) -> str:
        return value.strip()

    @field_validator('message')
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() if value else value

    @model_validator(mode='after')
    def validate_dates(self):
        today = date.today()
        if self.check_in < today:
            raise ValueError('Check-in date cannot be in the past')
        if self.check_out <= self.check_in:
            raise ValueError('Check-out date must be after check-in date')
        return self


class BookingRequestUpdate(BaseModel):
    status: BookingStatus | None = None
    internal_note: str | None = Field(default=None, max_length=2000)


class BookingRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    full_name: str
    phone: str
    email: str | None
    check_in: date | None
    check_out: date | None
    guests: int | None
    message: str | None
    status: BookingStatus
    internal_note: str | None
    source: str | None
    page_url: str | None
    utm_source: str | None
    utm_medium: str | None
    utm_campaign: str | None
    room_id: str | None
    room: RoomOut | None = None
    created_at: datetime
    updated_at: datetime


class LandingPageOut(BaseModel):
    key: str = 'default'
    value: dict[str, Any]
    updated_at: datetime | None = None


class LandingPageUpdate(BaseModel):
    value: dict[str, Any]


class MediaAssignmentOut(BaseModel):
    kind: str
    owner_id: str
    slot: str
    label: str
    sort_order: int = 0


class MediaAssetAdminOut(BaseModel):
    id: str
    url: str
    storage_path: str | None = None
    type: Literal['image', 'video']
    width: int | None = None
    height: int | None = None
    format: str | None = None
    original_filename: str | None = None
    source: str
    created_at: datetime
    assignments: list[MediaAssignmentOut] = Field(default_factory=list)


class TourItineraryDayIn(BaseModel):
    day_number: int = Field(ge=1, le=30)
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    stops: list[str] = Field(default_factory=list)

    @field_validator('stops')
    @classmethod
    def clean_stops(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]


class TourMediaItem(MediaItem):
    role: Literal['hero', 'gallery', 'itinerary'] = 'gallery'


class TourBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    tagline: str | None = Field(default=None, max_length=255)
    short_description: str | None = Field(default=None, max_length=1500)
    description: str | None = Field(default=None, max_length=8000)
    duration_days: int = Field(default=1, ge=1, le=30)
    duration_nights: int = Field(default=0, ge=0, le=29)
    price: int = Field(default=0, ge=0)
    currency: str = Field(default='USD', min_length=2, max_length=12)
    highlights: list[str] = Field(default_factory=list)
    inclusions: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)
    riding_options: list[dict[str, Any]] = Field(default_factory=list)
    bus_options: list[dict[str, Any]] = Field(default_factory=list)
    faq: list[dict[str, Any]] = Field(default_factory=list)
    itinerary: list[TourItineraryDayIn] = Field(default_factory=list)
    media: list[TourMediaItem] = Field(default_factory=list)
    is_featured: bool = False
    is_active: bool = True
    sort_order: int = 0

    @field_validator('highlights', 'inclusions', 'exclusions')
    @classmethod
    def clean_tour_str_list(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @field_validator('media', mode='before')
    @classmethod
    def clean_tour_media(cls, value: Any) -> list[dict[str, Any]]:
        if not value:
            return []
        normalized: list[dict[str, Any]] = []
        for index, item in enumerate(value):
            raw = {'url': item} if isinstance(item, str) else dict(item or {})
            if not raw.get('url'):
                continue
            raw.setdefault('type', 'image')
            raw.setdefault('role', 'gallery')
            raw.setdefault('sort_order', index)
            normalized.append(raw)
        return normalized


class TourCreate(TourBase):
    pass


class TourUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    tagline: str | None = Field(default=None, max_length=255)
    short_description: str | None = Field(default=None, max_length=1500)
    description: str | None = Field(default=None, max_length=8000)
    duration_days: int | None = Field(default=None, ge=1, le=30)
    duration_nights: int | None = Field(default=None, ge=0, le=29)
    price: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=2, max_length=12)
    highlights: list[str] | None = None
    inclusions: list[str] | None = None
    exclusions: list[str] | None = None
    riding_options: list[dict[str, Any]] | None = None
    bus_options: list[dict[str, Any]] | None = None
    faq: list[dict[str, Any]] | None = None
    itinerary: list[TourItineraryDayIn] | None = None
    media: list[TourMediaItem] | None = None
    is_featured: bool | None = None
    is_active: bool | None = None
    sort_order: int | None = None

    @field_validator('media', mode='before')
    @classmethod
    def clean_tour_media(cls, value: Any) -> list[dict[str, Any]] | None:
        if value is None:
            return None
        normalized: list[dict[str, Any]] = []
        for index, item in enumerate(value):
            raw = {'url': item} if isinstance(item, str) else dict(item or {})
            if not raw.get('url'):
                continue
            raw.setdefault('type', 'image')
            raw.setdefault('role', 'gallery')
            raw.setdefault('sort_order', index)
            normalized.append(raw)
        return normalized


class TourItineraryDayOut(TourItineraryDayIn):
    model_config = ConfigDict(from_attributes=True)
    id: str


class TourOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    slug: str
    name: str
    tagline: str | None
    short_description: str | None
    description: str | None
    duration_days: int
    duration_nights: int
    price: int
    currency: str
    highlights: list[str]
    inclusions: list[str]
    exclusions: list[str]
    riding_options: list[dict[str, Any]]
    bus_options: list[dict[str, Any]]
    faq: list[dict[str, Any]]
    itinerary: list[TourItineraryDayOut] = Field(validation_alias='itinerary_days')
    media: list[TourMediaItem]
    is_featured: bool
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class TourAddonBase(BaseModel):
    code: str = Field(min_length=2, max_length=100)
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    price: int = Field(default=0, ge=0)
    currency: str = Field(default='VND', min_length=2, max_length=12)
    unit_label: str | None = Field(default=None, max_length=100)
    is_active: bool = True
    sort_order: int = 0


class TourAddonCreate(TourAddonBase):
    pass


class TourAddonUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=2, max_length=100)
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    price: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=2, max_length=12)
    unit_label: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None
    sort_order: int | None = None


class TourAddonOut(TourAddonBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime


class TourPageOut(BaseModel):
    key: str = 'default'
    value: dict[str, Any]
    updated_at: datetime | None = None


class TourPageUpdate(BaseModel):
    value: dict[str, Any]


class TourBookingCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    whatsapp: str = Field(pattern=PHONE_PATTERN)
    start_date: date
    tour_id: str
    riding_option: str = Field(min_length=2, max_length=80)
    guests: int = Field(ge=1, le=50)
    bus_transfer: str = Field(min_length=2, max_length=80)
    addon_ids: list[str] = Field(default_factory=list)
    dietary_requirements: str | None = Field(default=None, max_length=2000)
    notes: str | None = Field(default=None, max_length=3000)
    source: str | None = Field(default=None, max_length=255)
    page_url: str | None = Field(default=None, max_length=1000)
    utm_source: str | None = Field(default=None, max_length=255)
    utm_medium: str | None = Field(default=None, max_length=255)
    utm_campaign: str | None = Field(default=None, max_length=255)

    @model_validator(mode='after')
    def validate_start_date(self):
        if self.start_date < date.today():
            raise ValueError('Tour start date cannot be in the past')
        return self


class TourBookingUpdate(BaseModel):
    status: TourBookingStatus | None = None
    internal_note: str | None = Field(default=None, max_length=3000)
    quoted_price: int | None = Field(default=None, ge=0)
    quoted_currency: str | None = Field(default=None, max_length=12)


class TourBookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    full_name: str
    email: str
    whatsapp: str
    start_date: date
    riding_option: str
    guests: int
    bus_transfer: str
    addons: list[dict[str, Any]]
    tour_snapshot: dict[str, Any]
    dietary_requirements: str | None
    notes: str | None
    status: TourBookingStatus
    internal_note: str | None
    quoted_price: int | None
    quoted_currency: str | None
    source: str | None
    page_url: str | None
    tour_id: str | None
    tour: TourOut | None = None
    created_at: datetime
    updated_at: datetime

# Final public snapshot schema includes the tour domain as well as rooms/landing.
class PublicSiteOut(BaseModel):
    landing: dict[str, Any]
    rooms: list[RoomOut]
    tours_page: dict[str, Any]
    tours: list[TourOut]
    tour_addons: list[TourAddonOut]
    updated_at: datetime | None = None
