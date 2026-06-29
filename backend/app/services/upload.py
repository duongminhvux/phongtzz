import os
import shutil
import subprocess
import tempfile
from io import BytesIO
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

from app.core.config import get_settings

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
ALLOWED_VIDEO_TYPES = {'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg'}
MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024
MAX_VIDEO_SIZE_BYTES = 120 * 1024 * 1024


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


def _ensure_configured():
    if not configure_cloudinary():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Cloudinary is not configured')


def _convert_image_to_webp(content: bytes) -> bytes:
    try:
        image = Image.open(BytesIO(content))
        image = ImageOps.exif_transpose(image)
        if getattr(image, 'is_animated', False):
            image.seek(0)
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        output = BytesIO()
        image.save(output, format='WEBP', quality=86, method=6)
        return output.getvalue()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Cannot convert image to webp: {exc}') from exc


def _convert_video_to_mp4(content: bytes, original_name: str) -> bytes:
    if not shutil.which('ffmpeg'):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='FFmpeg is not installed in API container')

    suffix = Path(original_name or 'upload.mp4').suffix or '.mp4'
    with tempfile.TemporaryDirectory() as tmp_dir:
        input_path = os.path.join(tmp_dir, f'input{suffix}')
        output_path = os.path.join(tmp_dir, 'output.mp4')
        with open(input_path, 'wb') as f:
            f.write(content)
        command = [
            'ffmpeg', '-y', '-i', input_path,
            '-vf', "scale='min(1920,iw)':-2",
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            '-c:a', 'aac', '-b:a', '128k',
            output_path,
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot convert video to web mp4')
        with open(output_path, 'rb') as f:
            return f.read()


async def upload_media(file: UploadFile) -> dict:
    content_type = file.content_type or ''
    content = await file.read()

    if content_type in ALLOWED_IMAGE_TYPES:
        if len(content) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Image must be <= 12MB')
        converted = _convert_image_to_webp(content)
        resource_type = 'image'
        upload_payload = converted
        upload_options = {'format': 'webp'}
    elif content_type in ALLOWED_VIDEO_TYPES:
        if len(content) > MAX_VIDEO_SIZE_BYTES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Video must be <= 120MB')
        converted = _convert_video_to_mp4(content, file.filename or 'video.mp4')
        resource_type = 'video'
        upload_payload = converted
        upload_options = {'format': 'mp4'}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Only jpg, png, webp, gif images and mp4, mov, webm videos are allowed',
        )

    _ensure_configured()
    settings = get_settings()
    result = cloudinary.uploader.upload(
        upload_payload,
        folder=settings.cloudinary_folder,
        resource_type=resource_type,
        overwrite=False,
        **upload_options,
    )
    return {
        'url': result.get('secure_url'),
        'public_id': result.get('public_id'),
        'type': resource_type,
        'width': result.get('width'),
        'height': result.get('height'),
        'format': result.get('format') or upload_options['format'],
    }


async def upload_image(file: UploadFile) -> dict:
    return await upload_media(file)
