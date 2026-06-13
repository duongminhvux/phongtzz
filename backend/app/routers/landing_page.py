from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.defaults import DEFAULT_LANDING_PAGE
from app.models import Admin, LandingPageSetting
from app.schemas import LandingPageOut, LandingPageUpdate

router = APIRouter(tags=['landing page'])


def get_or_create_setting(db: Session) -> LandingPageSetting:
    setting = db.query(LandingPageSetting).filter(LandingPageSetting.key == 'default').first()
    if not setting:
        setting = LandingPageSetting(key='default', value=DEFAULT_LANDING_PAGE)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.get('/landing-page', response_model=LandingPageOut)
def get_landing_page(db: Session = Depends(get_db)):
    setting = get_or_create_setting(db)
    return LandingPageOut(key=setting.key, value=setting.value, updated_at=setting.updated_at)


@router.get('/admin/landing-page', response_model=LandingPageOut)
def get_admin_landing_page(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    setting = get_or_create_setting(db)
    return LandingPageOut(key=setting.key, value=setting.value, updated_at=setting.updated_at)


@router.patch('/admin/landing-page', response_model=LandingPageOut)
def update_landing_page(
    payload: LandingPageUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    setting = get_or_create_setting(db)
    setting.value = payload.value
    db.commit()
    db.refresh(setting)
    return LandingPageOut(key=setting.key, value=setting.value, updated_at=setting.updated_at)
