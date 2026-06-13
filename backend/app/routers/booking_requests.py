from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_admin
from app.database import get_db
from app.models import Admin, BookingRequest, BookingStatus, Room
from app.schemas import BookingRequestCreate, BookingRequestOut, BookingRequestUpdate
from app.services.mail import send_booking_request_email

router = APIRouter(tags=['booking requests'])


@router.post('/booking-requests', response_model=BookingRequestOut, status_code=status.HTTP_201_CREATED)
def create_booking_request(payload: BookingRequestCreate, db: Session = Depends(get_db)):
    if payload.room_id:
        room = db.get(Room, payload.room_id)
        if not room or not room.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Selected room is not available')

    booking = BookingRequest(**payload.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Load room for email + response.
    booking = (
        db.query(BookingRequest)
        .options(joinedload(BookingRequest.room))
        .filter(BookingRequest.id == booking.id)
        .first()
    )

    try:
        send_booking_request_email(booking)
    except Exception:
        # Không fail request của khách nếu SMTP lỗi.
        pass

    return booking


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
    query = db.query(BookingRequest).options(joinedload(BookingRequest.room))
    if q:
        like = f'%{q}%'
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
    booking = (
        db.query(BookingRequest)
        .options(joinedload(BookingRequest.room))
        .filter(BookingRequest.id == booking_id)
        .first()
    )
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
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(booking, key, value)
    db.commit()
    db.refresh(booking)
    return (
        db.query(BookingRequest)
        .options(joinedload(BookingRequest.room))
        .filter(BookingRequest.id == booking.id)
        .first()
    )


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
