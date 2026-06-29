from fastapi import APIRouter, Depends, File, UploadFile

from app.core.security import get_current_admin
from app.models import Admin
from app.services.upload import upload_image, upload_media

router = APIRouter(prefix='/admin/uploads', tags=['uploads'])


@router.post('/media')
async def upload_landing_or_room_media(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin),
):
    return await upload_media(file)


@router.post('/image')
async def upload_landing_or_room_image(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin),
):
    # Backward-compatible alias. Images are converted to webp before Cloudinary upload.
    return await upload_image(file)
