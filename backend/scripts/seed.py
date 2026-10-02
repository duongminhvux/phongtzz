import argparse
import json
import shutil
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.media import canonicalize_landing_media, canonicalize_tour_page_media, set_room_media, set_tour_media
from app.models import Admin, BookingRequest, LandingPageSetting, MediaAsset, Room, RoomMedia, Tour, TourAddon, TourBookingRequest, TourItineraryDay, TourMedia, TourPageSetting

BOOKING_SEED_FILE = ROOT / 'seed' / 'booking_seed.json'
SEED_ASSETS_DIR = ROOT / 'seed' / 'assets'
SUPPORTED_TEMPLATES = {'booking', 'blank'}


def load_booking_seed() -> dict:
    with BOOKING_SEED_FILE.open('r', encoding='utf-8') as f:
        data = json.load(f)
    if not isinstance(data.get('landing'), dict):
        raise RuntimeError('booking_seed.json must contain a landing object')
    if not isinstance(data.get('rooms'), list):
        raise RuntimeError('booking_seed.json must contain a rooms array')
    if not isinstance(data.get('toursPage'), dict):
        raise RuntimeError('booking_seed.json must contain a toursPage object')
    if not isinstance(data.get('tours'), list):
        raise RuntimeError('booking_seed.json must contain a tours array')
    if not isinstance(data.get('tourAddons'), list):
        raise RuntimeError('booking_seed.json must contain a tourAddons array')
    return data


def blank_seed() -> dict:
    # Structural labels only: no fake rooms, reviews, images or property data.
    return {
        'landing': {
            'brand': {
                'name': 'Homestay',
                'logoText': 'Homestay',
                'phone': '',
                'email': '',
                'address': '',
                'facebookUrl': '',
                'instagramUrl': '',
                'mapEmbedUrl': '',
                'logo': None,
            },
            'theme': {
                'fontFamily': 'Inter, sans-serif',
                'headingFont': 'Georgia, serif',
                'primaryColor': '#111111',
                'backgroundColor': '#f7f5f2',
            },
            'header': {
                'ctaText': 'Book now',
                'ctaLink': '/contact',
                'navItems': [
                    {'label': 'Home', 'path': '/'},
                    {'label': 'Rooms', 'path': '/rooms'},
                    {'label': 'Contact', 'path': '/contact'},
                ],
            },
            'footer': {
                'showCta': False,
                'bottomText': '',
                'quickLinksTitle': 'Quick links',
                'contactTitle': 'Contact',
                'socialTitle': 'Social',
                'copyrightText': '',
                'mapEmbedUrl': '',
            },
            'contact': {
                'eyebrow': 'Booking request',
                'title': 'Book your stay',
                'description': '',
                'successTitle': 'Request received',
                'successMessage': 'We will contact you to confirm availability.',
                'infoTitle': 'Contact',
                'infoDescription': '',
                'addressLabel': 'Address',
                'phoneLabel': 'Phone',
                'emailLabel': 'Email',
                'submitText': 'Send booking request',
                'submittingText': 'Sending...',
                'submitNote': '',
                'sendAnotherText': 'Send another request',
            },
            'roomsPage': {
                'eyebrow': 'Stay',
                'title': 'Rooms',
                'description': '',
                'filters': [{'label': 'All rooms', 'value': 'all'}],
                'emptyImageText': 'No image',
                'bookingOnlyText': '',
                'amenitiesTitle': 'Amenities',
                'bookingButtonText': 'Request booking',
                'bookingNote': '',
                'contactPriceText': 'Contact for price',
                'priceSuffix': 'VND / night',
                'guestsSuffix': 'guests',
                'bedFallback': 'bed',
                'noRoomsText': 'No rooms yet.',
            },
            'sections': [],
        },
        'rooms': [],
        'toursPage': {
            'eyebrow': 'Tours',
            'heroTitle': 'Ha Giang Loop Motorbike Adventure',
            'heroSlogan': 'Ride. Explore. Connect.',
            'heroDescription': '',
            'heroImage': None,
            'packagesTitle': 'Tour Packages',
            'packagesDescription': '',
            'includedTitle': "What's Included",
            'includedItems': [],
            'whyTitle': '',
            'whyItems': [],
            'galleryTitle': 'Gallery',
            'gallery': [],
            'reviewsTitle': 'Guest Stories',
            'reviews': [],
            'faqTitle': 'FAQ',
            'faq': [],
            'bookingTitle': 'Book a Tour',
            'bookingDescription': '',
            'bookingButtonText': 'Book a Tour',
        },
        'tours': [],
        'tourAddons': [],
    }


def normalize_template(value: str | None) -> str:
    template = (value or 'booking').strip().lower()
    if template not in SUPPORTED_TEMPLATES:
        raise RuntimeError(f"INITIAL_SITE_TEMPLATE must be one of: {', '.join(sorted(SUPPORTED_TEMPLATES))}")
    return template


def load_template(template: str) -> dict:
    return load_booking_seed() if template == 'booking' else blank_seed()


def copy_booking_seed_assets(settings) -> None:
    destination = settings.media_root_path / 'seed'
    destination.mkdir(parents=True, exist_ok=True)
    for source in SEED_ASSETS_DIR.iterdir():
        if source.is_file():
            shutil.copy2(source, destination / source.name)


def clear_media_root(settings) -> None:
    root = settings.media_root_path
    if root.exists():
        for child in root.iterdir():
            if child.name == '.gitkeep':
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    root.mkdir(parents=True, exist_ok=True)


def ensure_admin(db, settings) -> None:
    email = settings.admin_email.strip().lower()
    admin = db.query(Admin).filter(Admin.email == email).first()
    if admin:
        print(f'Admin already exists: {email}')
        return
    db.add(Admin(email=email, password_hash=hash_password(settings.admin_password)))
    print(f'Created admin: {email}')


def site_is_initialized(db) -> bool:
    return db.query(LandingPageSetting).filter(LandingPageSetting.key == 'default').first() is not None


def insert_site(db, seed: dict, template: str, settings) -> None:
    if template == 'booking':
        copy_booking_seed_assets(settings)
    landing = canonicalize_landing_media(db, seed['landing'])
    db.add(LandingPageSetting(key='default', value=landing))
    db.add(TourPageSetting(key='default', value=canonicalize_tour_page_media(db, seed.get('toursPage') or {})))
    db.flush()
    for room_data in seed['rooms']:
        data = dict(room_data)
        images = data.pop('images', [])
        room = Room(**data)
        db.add(room)
        db.flush()
        set_room_media(db, room, images)
    for tour_data in seed.get('tours') or []:
        data = dict(tour_data)
        itinerary = data.pop('itinerary', [])
        media = data.pop('media', [])
        tour = Tour(**data)
        db.add(tour)
        db.flush()
        for index, day in enumerate(itinerary):
            db.add(TourItineraryDay(
                tour_id=tour.id,
                day_number=int(day.get('day_number') or index + 1),
                title=day.get('title') or f'Day {index + 1}',
                description=day.get('description'),
                stops=day.get('stops') or [],
            ))
        set_tour_media(db, tour, media)
    for addon_data in seed.get('tourAddons') or []:
        db.add(TourAddon(**addon_data))
    print(
        f"Created initial '{template}' site: 1 landing config + {len(seed['rooms'])} rooms + "
        f"{len(seed.get('tours') or [])} tours + {len(seed.get('tourAddons') or [])} tour add-ons"
    )


def reset_site_content(db, seed: dict, template: str, settings, *, clear_media: bool) -> None:
    db.query(BookingRequest).filter(BookingRequest.room_id.is_not(None)).update(
        {BookingRequest.room_id: None}, synchronize_session=False
    )
    db.query(TourBookingRequest).filter(TourBookingRequest.tour_id.is_not(None)).update(
        {TourBookingRequest.tour_id: None}, synchronize_session=False
    )
    db.query(RoomMedia).delete(synchronize_session=False)
    db.query(Room).delete(synchronize_session=False)
    db.query(TourMedia).delete(synchronize_session=False)
    db.query(TourItineraryDay).delete(synchronize_session=False)
    db.query(Tour).delete(synchronize_session=False)
    db.query(TourAddon).delete(synchronize_session=False)
    db.query(TourPageSetting).delete(synchronize_session=False)
    db.query(LandingPageSetting).delete(synchronize_session=False)
    db.query(MediaAsset).delete(synchronize_session=False)
    db.flush()
    if clear_media:
        clear_media_root(settings)
    insert_site(db, seed, template, settings)
    print(f"Reset landing, rooms, tours and media using '{template}' template. Room/tour booking requests were preserved.")


def main() -> None:
    parser = argparse.ArgumentParser(description='Initialize the homestay database for a fresh Docker install.')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--reset-content', action='store_true', help='Reset landing, rooms, tours and media. Preserve booking requests.')
    group.add_argument('--reset-db', action='store_true', help='DROP ALL application tables and clear local media before reinitializing.')
    parser.add_argument('--template', choices=sorted(SUPPORTED_TEMPLATES), help='First-run template. Overrides INITIAL_SITE_TEMPLATE.')
    args = parser.parse_args()

    settings = get_settings()
    template = normalize_template(args.template or settings.initial_site_template)
    seed = load_template(template)

    if args.reset_db:
        Base.metadata.drop_all(bind=engine)
        clear_media_root(settings)
        Base.metadata.create_all(bind=engine)
        print('Dropped and recreated all application tables and cleared local media.')
    else:
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        ensure_admin(db, settings)
        if args.reset_content:
            reset_site_content(db, seed, template, settings, clear_media=True)
        elif site_is_initialized(db):
            print('Site content already exists; first-run template skipped.')
        else:
            insert_site(db, seed, template, settings)
        db.commit()
        print('Seed done')
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
