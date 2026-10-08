import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_current_admin
from app.database import get_db
from app.media import canonicalize_tour_page_media, set_tour_media
from app.models import Admin, BookingRequest, Tour, TourAddon, TourItineraryDay, TourMedia, TourPageSetting
from app.schemas import (
    TourAddonCreate,
    TourAddonOut,
    TourAddonUpdate,
    TourCreate,
    TourOut,
    TourPageOut,
    TourPageUpdate,
    TourUpdate,
)

router = APIRouter(tags=['tours'])


def slugify(value: str) -> str:
    value = re.sub(r'[^a-zA-Z0-9\s-]', '', value).strip().lower()
    value = re.sub(r'[\s_-]+', '-', value)
    return value or 'tour'


def ensure_unique_slug(db: Session, slug: str, ignore_id: str | None = None) -> str:
    base = slugify(slug)
    candidate = base
    idx = 2
    while True:
        query = db.query(Tour).filter(Tour.slug == candidate)
        if ignore_id:
            query = query.filter(Tour.id != ignore_id)
        if not query.first():
            return candidate
        candidate = f'{base}-{idx}'
        idx += 1


def tour_query(db: Session):
    return db.query(Tour).options(
        selectinload(Tour.itinerary_days),
        selectinload(Tour.media_links).selectinload(TourMedia.asset),
    )


def replace_itinerary(db: Session, tour: Tour, itinerary: list[dict]) -> None:
    # Flush removals before inserting replacement rows. Without this, PostgreSQL
    # can hit uq_tour_itinerary_day when an edited tour keeps the same day numbers.
    tour.itinerary_days.clear()
    db.flush()
    seen_days: set[int] = set()
    for index, item in enumerate(itinerary):
        day_number = int(item.get('day_number') or index + 1)
        if day_number in seen_days:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f'Duplicate itinerary day: {day_number}',
            )
        seen_days.add(day_number)
        tour.itinerary_days.append(TourItineraryDay(
            day_number=day_number,
            title=item.get('title') or f'Day {index + 1}',
            description=item.get('description'),
            stops=item.get('stops') or [],
        ))


@router.get('/admin/tours', response_model=list[TourOut])
def list_admin_tours(
    q: str | None = Query(default=None),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = tour_query(db)
    if q:
        query = query.filter(Tour.name.ilike(f'%{q}%'))
    return query.order_by(Tour.sort_order.asc(), Tour.created_at.asc()).all()


@router.post('/admin/tours', response_model=TourOut, status_code=status.HTTP_201_CREATED)
def create_tour(
    payload: TourCreate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    itinerary = data.pop('itinerary', [])
    media = data.pop('media', [])
    data['slug'] = ensure_unique_slug(db, data.get('slug') or data['name'])
    tour = Tour(**data)
    db.add(tour)
    db.flush()
    replace_itinerary(db, tour, itinerary)
    set_tour_media(db, tour, media)
    db.commit()
    return tour_query(db).filter(Tour.id == tour.id).first()


@router.patch('/admin/tours/{tour_id}', response_model=TourOut)
@router.post('/admin/tours/{tour_id}/update', response_model=TourOut)
def update_tour(
    tour_id: str,
    payload: TourUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tour = tour_query(db).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Tour not found')
    data = payload.model_dump(exclude_unset=True)
    itinerary = data.pop('itinerary', None)
    media = data.pop('media', None)
    if 'slug' in data or 'name' in data:
        data['slug'] = ensure_unique_slug(db, data.get('slug') or tour.slug or data.get('name') or tour.name, ignore_id=tour.id)
    for key, value in data.items():
        setattr(tour, key, value)
    try:
        if itinerary is not None:
            replace_itinerary(db, tour, itinerary)
        if media is not None:
            set_tour_media(db, tour, media)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Tour could not be saved because itinerary/media data conflicts with an existing row.',
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Could not save tour') from exc
    return tour_query(db).filter(Tour.id == tour.id).first()


@router.delete('/admin/tours/{tour_id}', status_code=status.HTTP_204_NO_CONTENT)
@router.post('/admin/tours/{tour_id}/delete', status_code=status.HTTP_204_NO_CONTENT)
def delete_tour(
    tour_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tour = db.get(Tour, tour_id)
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Tour not found')
    try:
        # Keep historical booking snapshots, but detach the live FK explicitly so
        # deletion does not depend on an older database constraint definition.
        db.query(BookingRequest).filter(BookingRequest.tour_id == tour_id).update(
            {BookingRequest.tour_id: None}, synchronize_session=False
        )
        db.query(TourMedia).filter(TourMedia.tour_id == tour_id).delete(synchronize_session=False)
        db.query(TourItineraryDay).filter(TourItineraryDay.tour_id == tour_id).delete(synchronize_session=False)
        db.delete(tour)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Could not delete tour') from exc
    return None


@router.get('/admin/tour-page', response_model=TourPageOut)
def get_tour_page(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    setting = db.query(TourPageSetting).filter(TourPageSetting.key == 'default').first()
    if not setting:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Tour page is not initialized. Run scripts/seed.py.')
    return TourPageOut(key=setting.key, value=setting.value, updated_at=setting.updated_at)


@router.put('/admin/tour-page', response_model=TourPageOut)
def replace_tour_page(
    payload: TourPageUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    setting = db.query(TourPageSetting).filter(TourPageSetting.key == 'default').first()
    if not setting:
        setting = TourPageSetting(key='default', value=canonicalize_tour_page_media(db, payload.value))
        db.add(setting)
    else:
        setting.value = canonicalize_tour_page_media(db, payload.value)
    db.commit()
    db.refresh(setting)
    return TourPageOut(key=setting.key, value=setting.value, updated_at=setting.updated_at)


@router.get('/admin/tour-addons', response_model=list[TourAddonOut])
def list_tour_addons(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(TourAddon).order_by(TourAddon.sort_order.asc(), TourAddon.created_at.asc()).all()


@router.post('/admin/tour-addons', response_model=TourAddonOut, status_code=status.HTTP_201_CREATED)
def create_tour_addon(
    payload: TourAddonCreate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if db.query(TourAddon).filter(TourAddon.code == payload.code).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Add-on code already exists')
    addon = TourAddon(**payload.model_dump())
    db.add(addon)
    db.commit()
    db.refresh(addon)
    return addon


@router.patch('/admin/tour-addons/{addon_id}', response_model=TourAddonOut)
def update_tour_addon(
    addon_id: str,
    payload: TourAddonUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    addon = db.get(TourAddon, addon_id)
    if not addon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Add-on not found')
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(addon, key, value)
    db.commit()
    db.refresh(addon)
    return addon


@router.delete('/admin/tour-addons/{addon_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_tour_addon(
    addon_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    addon = db.get(TourAddon, addon_id)
    if not addon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Add-on not found')
    db.delete(addon)
    db.commit()
    return None
