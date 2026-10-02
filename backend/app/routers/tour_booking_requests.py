from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_current_admin
from app.database import get_db
from app.models import Admin, Tour, TourAddon, TourBookingRequest, TourBookingStatus, TourMedia
from app.schemas import TourBookingCreate, TourBookingOut, TourBookingUpdate
from app.services.mail import send_tour_booking_request_email

router = APIRouter(tags=['tour booking requests'])


def booking_query(db: Session):
    return db.query(TourBookingRequest).options(
        selectinload(TourBookingRequest.tour).selectinload(Tour.itinerary_days),
        selectinload(TourBookingRequest.tour).selectinload(Tour.media_links).selectinload(TourMedia.asset),
    )


@router.post('/tour-booking-requests', response_model=TourBookingOut, status_code=status.HTTP_201_CREATED)
def create_tour_booking_request(payload: TourBookingCreate, db: Session = Depends(get_db)):
    tour = db.query(Tour).filter(Tour.id == payload.tour_id, Tour.is_active.is_(True)).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Tour package not found')

    riding_values = {str(item.get('value')) for item in (tour.riding_options or []) if item.get('value')}
    bus_values = {str(item.get('value')) for item in (tour.bus_options or []) if item.get('value')}
    if payload.riding_option not in riding_values:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Selected riding option is unavailable')
    if payload.bus_transfer not in bus_values:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Selected bus transfer option is unavailable')

    addons = []
    if payload.addon_ids:
        addon_rows = db.query(TourAddon).filter(TourAddon.id.in_(payload.addon_ids), TourAddon.is_active.is_(True)).all()
        addon_map = {item.id: item for item in addon_rows}
        missing = [item for item in payload.addon_ids if item not in addon_map]
        if missing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='One or more selected add-ons are unavailable')
        for addon_id in payload.addon_ids:
            item = addon_map[addon_id]
            addons.append({
                'id': item.id,
                'code': item.code,
                'name': item.name,
                'price': item.price,
                'currency': item.currency,
                'unit_label': item.unit_label,
            })

    riding = next((item for item in (tour.riding_options or []) if item.get('value') == payload.riding_option), None)
    bus = next((item for item in (tour.bus_options or []) if item.get('value') == payload.bus_transfer), None)
    request = TourBookingRequest(
        tour_id=tour.id,
        tour_snapshot={
            'id': tour.id,
            'slug': tour.slug,
            'name': tour.name,
            'duration_days': tour.duration_days,
            'duration_nights': tour.duration_nights,
            'price': tour.price,
            'currency': tour.currency,
            'riding_option_label': (riding or {}).get('label') or payload.riding_option,
            'bus_transfer_label': (bus or {}).get('label') or payload.bus_transfer,
        },
        full_name=payload.full_name.strip(),
        email=str(payload.email).strip().lower(),
        whatsapp=payload.whatsapp.strip(),
        start_date=payload.start_date,
        riding_option=payload.riding_option.strip(),
        guests=payload.guests,
        bus_transfer=payload.bus_transfer.strip(),
        addons=addons,
        dietary_requirements=(payload.dietary_requirements or '').strip() or None,
        notes=(payload.notes or '').strip() or None,
        source=payload.source,
        page_url=payload.page_url,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
    )
    db.add(request)
    db.commit()
    saved = booking_query(db).filter(TourBookingRequest.id == request.id).first()
    try:
        send_tour_booking_request_email(saved)
    except Exception:
        pass
    return saved


@router.get('/admin/tour-booking-requests', response_model=list[TourBookingOut])
def list_tour_booking_requests(
    q: str | None = Query(default=None),
    status_filter: TourBookingStatus | None = Query(default=None, alias='status'),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = booking_query(db)
    if q:
        like = f'%{q.strip()}%'
        query = query.filter(or_(
            TourBookingRequest.full_name.ilike(like),
            TourBookingRequest.email.ilike(like),
            TourBookingRequest.whatsapp.ilike(like),
        ))
    if status_filter:
        query = query.filter(TourBookingRequest.status == status_filter)
    return query.order_by(TourBookingRequest.created_at.desc()).all()


@router.patch('/admin/tour-booking-requests/{request_id}', response_model=TourBookingOut)
def update_tour_booking_request(
    request_id: str,
    payload: TourBookingUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    request = db.get(TourBookingRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Tour booking request not found')
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(request, key, value)
    db.commit()
    return booking_query(db).filter(TourBookingRequest.id == request.id).first()


@router.delete('/admin/tour-booking-requests/{request_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_tour_booking_request(
    request_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    request = db.get(TourBookingRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Tour booking request not found')
    db.delete(request)
    db.commit()
    return None
