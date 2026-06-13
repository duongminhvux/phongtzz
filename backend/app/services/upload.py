import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from app.core.config import get_settings

ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
MAX_SIZE_BYTES = 8 * 1024 * 1024


def configure_cloudinary() -> bool:
    settings = get_settings()
    if not all([settings.cloudinary_cloud_name, settings.cloudinary_api_key, settings.cloudinary_api_secret]):
        return False
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    return True


async def upload_image(file: UploadFile) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Only jpg, png, webp, gif images are allowed')

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Image must be <= 8MB')

    if not configure_cloudinary():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Cloudinary is not configured')

    settings = get_settings()
    result = cloudinary.uploader.upload(
        content,
        folder=settings.cloudinary_folder,
        resource_type='image',
        overwrite=False,
    )
    return {
        'url': result.get('secure_url'),
        'public_id': result.get('public_id'),
        'width': result.get('width'),
        'height': result.get('height'),
        'format': result.get('format'),
    }
