import os
import shutil
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

from app.core.config import get_settings

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
ALLOWED_VIDEO_TYPES = {'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg'}
SUPPORTED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
SUPPORTED_VIDEO_EXTENSIONS = {'.mp4', '.mov', '.webm', '.avi', '.mpeg', '.mpg'}
MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024
MAX_VIDEO_SIZE_BYTES = 120 * 1024 * 1024
MAX_IMAGE_DIMENSION = 1920


def ensure_media_root() -> Path:
    root = get_settings().media_root_path
    root.mkdir(parents=True, exist_ok=True)
    return root


def media_url_for_storage(storage_path: str) -> str:
    prefix = get_settings().normalized_media_url_prefix
    return f"{prefix}/{storage_path.lstrip('/')}"


def _new_storage_path(extension: str) -> str:
    now = datetime.now(timezone.utc)
    return f"{now:%Y/%m}/{uuid.uuid4().hex}.{extension.lstrip('.')}"


def _write_atomic(relative_path: str, content: bytes) -> Path:
    root = ensure_media_root()
    destination = (root / relative_path).resolve()
    try:
        destination.relative_to(root)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid media path') from exc
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + '.tmp')
    temporary.write_bytes(content)
    os.replace(temporary, destination)
    return destination


def _convert_image_to_webp(content: bytes) -> tuple[bytes, int, int]:
    try:
        image = Image.open(BytesIO(content))
        image = ImageOps.exif_transpose(image)
        if getattr(image, 'is_animated', False):
            image.seek(0)
        image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        output = BytesIO()
        image.save(output, format='WEBP', quality=84, method=6)
        width, height = image.size
        return output.getvalue(), width, height
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Cannot convert image to webp: {exc}') from exc


def _probe_video(path: str) -> tuple[int | None, int | None]:
    if not shutil.which('ffprobe'):
        return None, None
    result = subprocess.run(
        [
            'ffprobe', '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height', '-of', 'csv=s=x:p=0', path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None, None
    try:
        width, height = result.stdout.strip().split('x', 1)
        return int(width), int(height)
    except Exception:
        return None, None


def _convert_video_to_mp4(content: bytes, original_name: str) -> tuple[bytes, int | None, int | None]:
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
        width, height = _probe_video(output_path)
        with open(output_path, 'rb') as f:
            return f.read(), width, height


async def upload_media(file: UploadFile) -> dict:
    content_type = file.content_type or ''
    content = await file.read()

    if content_type in ALLOWED_IMAGE_TYPES:
        if len(content) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Image must be <= 12MB')
        converted, width, height = _convert_image_to_webp(content)
        resource_type = 'image'
        extension = 'webp'
    elif content_type in ALLOWED_VIDEO_TYPES:
        if len(content) > MAX_VIDEO_SIZE_BYTES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Video must be <= 120MB')
        converted, width, height = _convert_video_to_mp4(content, file.filename or 'video.mp4')
        resource_type = 'video'
        extension = 'mp4'
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Only jpg, png, webp, gif images and mp4, mov, webm videos are allowed',
        )

    storage_path = _new_storage_path(extension)
    _write_atomic(storage_path, converted)
    return {
        'url': media_url_for_storage(storage_path),
        'storage_path': storage_path,
        'type': resource_type,
        'width': width,
        'height': height,
        'format': extension,
        'size_bytes': len(converted),
    }


async def upload_image(file: UploadFile) -> dict:
    return await upload_media(file)


def inspect_existing_media(path: Path) -> dict | None:
    """Read metadata from an existing file without modifying it.

    Used by the Media Library filesystem scanner so files copied manually into
    MEDIA_ROOT can be registered in media_assets and reused like normal uploads.
    """
    suffix = path.suffix.lower()
    if suffix in SUPPORTED_IMAGE_EXTENSIONS:
        try:
            with Image.open(path) as image:
                image = ImageOps.exif_transpose(image)
                width, height = image.size
                detected_format = (image.format or suffix.lstrip('.')).lower()
        except Exception as exc:
            raise ValueError(f'Cannot read image metadata: {exc}') from exc
        return {
            'type': 'image',
            'width': width,
            'height': height,
            'format': detected_format,
            'size_bytes': path.stat().st_size,
        }

    if suffix in SUPPORTED_VIDEO_EXTENSIONS:
        width, height = _probe_video(str(path))
        return {
            'type': 'video',
            'width': width,
            'height': height,
            'format': suffix.lstrip('.'),
            'size_bytes': path.stat().st_size,
        }

    return None


def local_asset_exists(storage_path: str | None) -> bool | None:
    if not storage_path:
        return None
    root = ensure_media_root()
    target = (root / storage_path.lstrip('/')).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return False
    return target.is_file()


def delete_local_asset(storage_path: str | None) -> None:
    if not storage_path:
        return
    root = ensure_media_root()
    target = (root / storage_path.lstrip('/')).resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid media path') from exc
    if target.is_file():
        target.unlink()

    # Remove empty year/month folders, but never remove MEDIA_ROOT itself.
    parent = target.parent
    while parent != root:
        try:
            parent.rmdir()
        except OSError:
            break
        parent = parent.parent
