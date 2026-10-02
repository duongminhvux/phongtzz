from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.media import asset_to_media
from app.models import Admin, MediaAsset
from app.services.upload import delete_local_asset, upload_image, upload_media

router = APIRouter(prefix='/admin/uploads', tags=['uploads'])


async def save_uploaded_asset(file: UploadFile, db: Session, image_only: bool = False) -> dict:
    uploaded = await (upload_image(file) if image_only else upload_media(file))
    asset = MediaAsset(
        url=uploaded['url'],
        storage_path=uploaded.get('storage_path'),
        type=uploaded.get('type') or 'image',
        width=uploaded.get('width'),
        height=uploaded.get('height'),
        format=uploaded.get('format'),
        original_filename=file.filename,
        source='local',
    )
    db.add(asset)
    try:
        db.commit()
        db.refresh(asset)
    except Exception:
        db.rollback()
        delete_local_asset(uploaded.get('storage_path'))
        raise
    return asset_to_media(asset)


@router.post('/media')
async def upload_landing_or_room_media(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return await save_uploaded_asset(file, db)


@router.post('/image')
async def upload_landing_or_room_image(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return await save_uploaded_asset(file, db, image_only=True)
