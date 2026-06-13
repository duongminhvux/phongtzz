import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.models import Admin, Room
from app.schemas import RoomCreate, RoomOut, RoomUpdate

router = APIRouter(tags=['rooms'])


def slugify(value: str) -> str:
    value = re.sub(r'[^a-zA-Z0-9\s-]', '', value).strip().lower()
    value = re.sub(r'[\s_-]+', '-', value)
    return value or 'room'


def ensure_unique_slug(db: Session, slug: str, ignore_id: str | None = None) -> str:
    base = slugify(slug)
    candidate = base
    idx = 2
    while True:
        query = db.query(Room).filter(Room.slug == candidate)
        if ignore_id:
            query = query.filter(Room.id != ignore_id)
        if not query.first():
            return candidate
        candidate = f'{base}-{idx}'
        idx += 1


@router.get('/rooms', response_model=list[RoomOut])
def list_public_rooms(db: Session = Depends(get_db)):
    return (
        db.query(Room)
        .filter(Room.is_active.is_(True))
        .order_by(Room.sort_order.asc(), Room.created_at.desc())
        .all()
    )


@router.get('/admin/rooms', response_model=list[RoomOut])
def list_admin_rooms(
    q: str | None = Query(default=None),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Room)
    if q:
        like = f'%{q}%'
        query = query.filter(Room.name.ilike(like))
    return query.order_by(Room.sort_order.asc(), Room.created_at.desc()).all()


@router.post('/admin/rooms', response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    data['slug'] = ensure_unique_slug(db, data.get('slug') or data['name'])
    room = Room(**data)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.patch('/admin/rooms/{room_id}', response_model=RoomOut)
def update_room(
    room_id: str,
    payload: RoomUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    data = payload.model_dump(exclude_unset=True)
    if 'slug' in data or 'name' in data:
        new_slug = data.get('slug') or room.slug or data.get('name') or room.name
        data['slug'] = ensure_unique_slug(db, new_slug, ignore_id=room.id)
    for key, value in data.items():
        setattr(room, key, value)
    db.commit()
    db.refresh(room)
    return room


@router.delete('/admin/rooms/{room_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    db.delete(room)
    db.commit()
    return None
