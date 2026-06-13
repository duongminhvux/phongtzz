from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.defaults import DEFAULT_LANDING_PAGE, DEFAULT_ROOMS
from app.models import Admin, LandingPageSetting, Room


def main():
    settings = get_settings()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.email == settings.admin_email.lower()).first()
        if not admin:
            admin = Admin(email=settings.admin_email.lower(), password_hash=hash_password(settings.admin_password))
            db.add(admin)
            print(f'Created admin: {settings.admin_email}')
        else:
            print(f'Admin already exists: {settings.admin_email}')

        setting = db.query(LandingPageSetting).filter(LandingPageSetting.key == 'default').first()
        if not setting:
            db.add(LandingPageSetting(key='default', value=DEFAULT_LANDING_PAGE))
            print('Created default landing page settings')
        else:
            print('Landing page settings already exist')

        for room_data in DEFAULT_ROOMS:
            exists = db.query(Room).filter(Room.slug == room_data['slug']).first()
            if not exists:
                db.add(Room(**room_data))
                print(f"Created room: {room_data['name']}")

        db.commit()
        print('Seed done')
    finally:
        db.close()


if __name__ == '__main__':
    main()
