from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_current_admin, verify_password
from app.database import get_db
from app.models import Admin
from app.schemas import AdminOut, LoginIn, TokenOut

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/login', response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email.lower()).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password')
    token = create_access_token(admin.id)
    return TokenOut(access_token=token, admin=admin)


@router.get('/me', response_model=AdminOut)
def me(admin: Admin = Depends(get_current_admin)):
    return admin
