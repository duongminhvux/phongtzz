import uuid
from enum import Enum
from sqlalchemy import Boolean, Date, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def uuid_str() -> str:
    return str(uuid.uuid4())


class BookingStatus(str, Enum):
    NEW = 'NEW'
    CONTACTED = 'CONTACTED'
    CONFIRMED = 'CONFIRMED'
    CANCELLED = 'CANCELLED'


class Admin(Base):
    __tablename__ = 'admins'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default='admin', nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Room(Base):
    __tablename__ = 'rooms'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default='private', nullable=False)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    original_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    beds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bed_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    size: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amenities: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    highlights: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    images: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bookings: Mapped[list['BookingRequest']] = relationship('BookingRequest', back_populates='room')


class BookingRequest(Base):
    __tablename__ = 'booking_requests'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    check_in: Mapped[Date | None] = mapped_column(Date, nullable=True, index=True)
    check_out: Mapped[Date | None] = mapped_column(Date, nullable=True)
    guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[BookingStatus] = mapped_column(SQLEnum(BookingStatus), default=BookingStatus.NEW, nullable=False, index=True)
    internal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    page_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(255), nullable=True)

    room_id: Mapped[str | None] = mapped_column(String(36), ForeignKey('rooms.id', ondelete='SET NULL'), nullable=True)
    room: Mapped[Room | None] = relationship('Room', back_populates='bookings')

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LandingPageSetting(Base):
    __tablename__ = 'landing_page_settings'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, default='default')
    value: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
