import uuid
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text, UniqueConstraint, func
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


class MediaAsset(Base):
    __tablename__ = 'media_assets'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    # Browser-facing URL. Local media uses /uploads/<storage_path>.
    url: Mapped[str] = mapped_column(String(2000), unique=True, index=True, nullable=False)
    # Relative path inside MEDIA_ROOT. External URLs may leave this null.
    storage_path: Mapped[str | None] = mapped_column(String(1000), unique=True, index=True, nullable=True)
    type: Mapped[str] = mapped_column(String(20), default='image', nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    format: Mapped[str | None] = mapped_column(String(40), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source: Mapped[str] = mapped_column(String(40), default='local', nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    room_links: Mapped[list['RoomMedia']] = relationship('RoomMedia', back_populates='asset')
    tour_links: Mapped[list['TourMedia']] = relationship('TourMedia', back_populates='asset')


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
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    media_links: Mapped[list['RoomMedia']] = relationship(
        'RoomMedia',
        back_populates='room',
        cascade='all, delete-orphan',
        order_by='RoomMedia.sort_order',
    )
    bookings: Mapped[list['BookingRequest']] = relationship('BookingRequest', back_populates='room')

    @property
    def images(self) -> list[dict]:
        output: list[dict] = []
        for link in sorted(self.media_links, key=lambda item: item.sort_order):
            asset = link.asset
            if not asset:
                continue
            output.append({
                'asset_id': asset.id,
                'url': asset.url,
                'storage_path': asset.storage_path,
                'type': asset.type,
                'width': asset.width,
                'height': asset.height,
                'format': asset.format,
                'original_filename': asset.original_filename,
                'source': asset.source,
                'alt': link.alt,
                'sort_order': link.sort_order,
            })
        return output


class RoomMedia(Base):
    __tablename__ = 'room_media'
    __table_args__ = (UniqueConstraint('room_id', 'media_asset_id', name='uq_room_media_asset'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey('rooms.id', ondelete='CASCADE'), nullable=False, index=True)
    media_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey('media_assets.id', ondelete='RESTRICT'), nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    alt: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    room: Mapped[Room] = relationship('Room', back_populates='media_links')
    asset: Mapped[MediaAsset] = relationship('MediaAsset', back_populates='room_links')


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

    # Optional Ha Giang Loop tour attached to the same room booking request.
    tour_id: Mapped[str | None] = mapped_column(String(36), ForeignKey('tours.id', ondelete='SET NULL'), nullable=True, index=True)
    tour_start_date: Mapped[Date | None] = mapped_column(Date, nullable=True, index=True)
    riding_option: Mapped[str | None] = mapped_column(String(80), nullable=True)
    bus_transfer: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tour_addons: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    tour_snapshot: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    dietary_requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    tour: Mapped['Tour | None'] = relationship('Tour', back_populates='bookings')

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LandingPageSetting(Base):
    __tablename__ = 'landing_page_settings'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, default='default')
    value: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TourPageSetting(Base):
    __tablename__ = 'tour_page_settings'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, default='default')
    value: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Tour(Base):
    __tablename__ = 'tours'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    duration_nights: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(12), default='USD', nullable=False)
    highlights: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    inclusions: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    exclusions: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    riding_options: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    bus_options: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    faq: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    itinerary_days: Mapped[list['TourItineraryDay']] = relationship(
        'TourItineraryDay', back_populates='tour', cascade='all, delete-orphan', order_by='TourItineraryDay.day_number'
    )
    media_links: Mapped[list['TourMedia']] = relationship(
        'TourMedia', back_populates='tour', cascade='all, delete-orphan', order_by='TourMedia.sort_order'
    )
    bookings: Mapped[list['BookingRequest']] = relationship('BookingRequest', back_populates='tour')

    @property
    def media(self) -> list[dict]:
        output: list[dict] = []
        for link in sorted(self.media_links, key=lambda item: (item.role, item.sort_order)):
            asset = link.asset
            if not asset:
                continue
            output.append({
                'asset_id': asset.id,
                'url': asset.url,
                'storage_path': asset.storage_path,
                'type': asset.type,
                'width': asset.width,
                'height': asset.height,
                'format': asset.format,
                'original_filename': asset.original_filename,
                'source': asset.source,
                'alt': link.alt,
                'role': link.role,
                'sort_order': link.sort_order,
            })
        return output


class TourItineraryDay(Base):
    __tablename__ = 'tour_itinerary_days'
    __table_args__ = (UniqueConstraint('tour_id', 'day_number', name='uq_tour_itinerary_day'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    tour_id: Mapped[str] = mapped_column(String(36), ForeignKey('tours.id', ondelete='CASCADE'), nullable=False, index=True)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    stops: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tour: Mapped['Tour'] = relationship('Tour', back_populates='itinerary_days')


class TourMedia(Base):
    __tablename__ = 'tour_media'
    __table_args__ = (UniqueConstraint('tour_id', 'media_asset_id', 'role', name='uq_tour_media_asset_role'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    tour_id: Mapped[str] = mapped_column(String(36), ForeignKey('tours.id', ondelete='CASCADE'), nullable=False, index=True)
    media_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey('media_assets.id', ondelete='RESTRICT'), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(30), default='gallery', nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    alt: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tour: Mapped['Tour'] = relationship('Tour', back_populates='media_links')
    asset: Mapped[MediaAsset] = relationship('MediaAsset', back_populates='tour_links')


class TourAddon(Base):
    __tablename__ = 'tour_addons'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(12), default='VND', nullable=False)
    unit_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
