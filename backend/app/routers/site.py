from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import LandingPageSetting, Room, RoomMedia, Tour, TourAddon, TourMedia, TourPageSetting
from app.schemas import PublicSiteOut

router = APIRouter(tags=['public site'])


def no_cache(response: Response) -> None:
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['CDN-Cache-Control'] = 'no-store'
    response.headers['Cloudflare-CDN-Cache-Control'] = 'no-store'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'


@router.get('/site', response_model=PublicSiteOut)
def get_public_site(response: Response, db: Session = Depends(get_db)):
    no_cache(response)
    setting = db.query(LandingPageSetting).filter(LandingPageSetting.key == 'default').first()
    tour_setting = db.query(TourPageSetting).filter(TourPageSetting.key == 'default').first()
    if not setting:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Site content is not initialized. Run scripts/seed.py.')

    rooms = (
        db.query(Room)
        .options(selectinload(Room.media_links).selectinload(RoomMedia.asset))
        .filter(Room.is_active.is_(True))
        .order_by(Room.sort_order.asc(), Room.created_at.asc())
        .all()
    )
    tours = (
        db.query(Tour)
        .options(selectinload(Tour.itinerary_days), selectinload(Tour.media_links).selectinload(TourMedia.asset))
        .filter(Tour.is_active.is_(True))
        .order_by(Tour.sort_order.asc(), Tour.created_at.asc())
        .all()
    )
    addons = (
        db.query(TourAddon)
        .filter(TourAddon.is_active.is_(True))
        .order_by(TourAddon.sort_order.asc(), TourAddon.created_at.asc())
        .all()
    )

    timestamps: list[datetime] = [setting.updated_at] if setting.updated_at else []
    if tour_setting and tour_setting.updated_at:
        timestamps.append(tour_setting.updated_at)
    timestamps.extend(room.updated_at for room in rooms if room.updated_at)
    timestamps.extend(tour.updated_at for tour in tours if tour.updated_at)
    timestamps.extend(addon.updated_at for addon in addons if addon.updated_at)
    updated_at = max(timestamps) if timestamps else None
    return PublicSiteOut(
        landing=setting.value,
        rooms=rooms,
        tours_page=tour_setting.value if tour_setting else {},
        tours=tours,
        tour_addons=addons,
        updated_at=updated_at,
    )
