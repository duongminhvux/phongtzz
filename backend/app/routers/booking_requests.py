from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_admin
from app.database import get_db
from app.models import Admin, BookingRequest, BookingStatus, Room, Tour, TourAddon
from app.schemas import BookingRequestCreate, BookingRequestOut, BookingRequestUpdate
from app.services.mail import send_booking_request_email

router = APIRouter(tags=['booking requests'])


def booking_query(db: Session):
    return db.query(BookingRequest).options(
        joinedload(BookingRequest.room),
        joinedload(BookingRequest.tour),
    )


def build_tour_payload(db: Session, payload: BookingRequestCreate):
    if not payload.tour_id:
        return {
            'tour_id': None,
            'tour_start_date': None,
            'riding_option': None,
            'bus_transfer': None,
            'tour_addons': [],
            'tour_snapshot': {},
            'dietary_requirements': None,
        }

    tour = db.query(Tour).filter(Tour.id == payload.tour_id, Tour.is_active.is_(True)).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Selected tour package is not available')

    riding = next((item for item in (tour.riding_options or []) if item.get('value') == payload.riding_option), None)
    bus = next((item for item in (tour.bus_options or []) if item.get('value') == payload.bus_transfer), None)
    if not riding:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Selected riding option is unavailable')
    if not bus:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Selected bus transfer option is unavailable')

    addons: list[dict] = []
    if payload.addon_ids:
        addon_rows = db.query(TourAddon).filter(TourAddon.id.in_(payload.addon_ids), TourAddon.is_active.is_(True)).all()
        addon_map = {item.id: item for item in addon_rows}
        if any(addon_id not in addon_map for addon_id in payload.addon_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='One or more selected tour add-ons are unavailable')
        for addon_id in payload.addon_ids:
            addon = addon_map[addon_id]
            addons.append({
                'id': addon.id,
                'code': addon.code,
                'name': addon.name,
                'price': addon.price,
                'currency': addon.currency,
                'unit_label': addon.unit_label,
            })

    return {
        'tour_id': tour.id,
        'tour_start_date': payload.tour_start_date,
        'riding_option': payload.riding_option,
        'bus_transfer': payload.bus_transfer,
        'tour_addons': addons,
        'tour_snapshot': {
            'id': tour.id,
            'slug': tour.slug,
            'name': tour.name,
            'duration_days': tour.duration_days,
            'duration_nights': tour.duration_nights,
            'price': tour.price,
            'currency': tour.currency,
            'riding_option_label': riding.get('label') or payload.riding_option,
            'bus_transfer_label': bus.get('label') or payload.bus_transfer,
        },
        'dietary_requirements': (payload.dietary_requirements or '').strip() or None,
    }


@router.post('/booking-requests', response_model=BookingRequestOut, status_code=status.HTTP_201_CREATED)
def create_booking_request(payload: BookingRequestCreate, db: Session = Depends(get_db)):
    if payload.room_id:
        room = db.get(Room, payload.room_id)
        if not room or not room.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Selected room is not available')

    tour_data = build_tour_payload(db, payload)
    base = payload.model_dump(exclude={'addon_ids', 'tour_id', 'tour_start_date', 'riding_option', 'bus_transfer', 'dietary_requirements'})
    booking = BookingRequest(**base, **tour_data)
    db.add(booking)
    db.commit()

    saved = booking_query(db).filter(BookingRequest.id == booking.id).first()
    try:
        send_booking_request_email(saved)
    except Exception:
        # Do not fail a customer request if SMTP is unavailable.
        pass
    return saved


@router.get('/admin/booking-requests', response_model=list[BookingRequestOut])
def list_booking_requests(
    q: str | None = Query(default=None),
    status_filter: BookingStatus | None = Query(default=None, alias='status'),
    room_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = booking_query(db)
    if q:
        like = f'%{q.strip()}%'
        query = query.filter(or_(BookingRequest.full_name.ilike(like), BookingRequest.phone.ilike(like), BookingRequest.email.ilike(like)))
    if status_filter:
        query = query.filter(BookingRequest.status == status_filter)
    if room_id:
        query = query.filter(BookingRequest.room_id == room_id)
    return query.order_by(BookingRequest.created_at.desc()).offset(offset).limit(limit).all()


@router.get('/admin/booking-requests/{booking_id}', response_model=BookingRequestOut)
def get_booking_request(
    booking_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = booking_query(db).filter(BookingRequest.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Booking request not found')
    return booking


@router.patch('/admin/booking-requests/{booking_id}', response_model=BookingRequestOut)
def update_booking_request(
    booking_id: str,
    payload: BookingRequestUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = db.get(BookingRequest, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Booking request not found')
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(booking, key, value)
    db.commit()
    return booking_query(db).filter(BookingRequest.id == booking.id).first()


@router.delete('/admin/booking-requests/{booking_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_booking_request(
    booking_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = db.get(BookingRequest, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Booking request not found')
    db.delete(booking)
    db.commit()
    return None
