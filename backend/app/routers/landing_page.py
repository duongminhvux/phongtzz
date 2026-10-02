from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.media import canonicalize_landing_media
from app.models import Admin, LandingPageSetting
from app.schemas import LandingPageOut, LandingPageUpdate

router = APIRouter(tags=['landing page'])


def get_setting(db: Session) -> LandingPageSetting | None:
    return db.query(LandingPageSetting).filter(LandingPageSetting.key == 'default').first()


@router.get('/admin/landing-page', response_model=LandingPageOut)
def get_admin_landing_page(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    setting = get_setting(db)
    if not setting:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Site content is not initialized. Run scripts/seed.py.')
    return LandingPageOut(key=setting.key, value=setting.value, updated_at=setting.updated_at)


@router.put('/admin/landing-page', response_model=LandingPageOut)
def replace_landing_page(
    payload: LandingPageUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    value = canonicalize_landing_media(db, payload.value)
    setting = get_setting(db)
    if not setting:
        setting = LandingPageSetting(key='default', value=value)
        db.add(setting)
    else:
        setting.value = value
    db.commit()
    db.refresh(setting)
    return LandingPageOut(key=setting.key, value=setting.value, updated_at=setting.updated_at)
