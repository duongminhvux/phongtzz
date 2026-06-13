from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models import BookingStatus

PHONE_PATTERN = r'^[0-9+()\-\.\s]{8,25}$'


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    role: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    admin: AdminOut


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
    images: list[str] = Field(default_factory=list)
    is_active: bool = True
    sort_order: int = 0

    @field_validator('amenities', 'highlights', 'images')
    @classmethod
    def clean_str_list(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]


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
    images: list[str] | None = None
    is_active: bool | None = None
    sort_order: int | None = None


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
