from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.media import asset_assignments
from app.models import Admin, MediaAsset
from app.schemas import MediaAssetAdminOut
from app.services.upload import (
    delete_local_asset,
    ensure_media_root,
    inspect_existing_media,
    local_asset_exists,
    media_url_for_storage,
)

router = APIRouter(tags=['media assets'])


@router.get('/admin/media-assets', response_model=list[MediaAssetAdminOut])
def list_media_assets(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    assignment_map = asset_assignments(db)
    assets = db.query(MediaAsset).order_by(MediaAsset.created_at.desc()).all()
    return [
        {
            'id': asset.id,
            'url': asset.url,
            'storage_path': asset.storage_path,
            'type': asset.type,
            'width': asset.width,
            'height': asset.height,
            'format': asset.format,
            'original_filename': asset.original_filename,
            'source': asset.source,
            'created_at': asset.created_at,
            'file_exists': local_asset_exists(asset.storage_path),
            'assignments': assignment_map.get(asset.id, []),
        }
        for asset in assets
    ]


@router.post('/admin/media-assets/scan')
def scan_media_folder(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Register supported media already present in MEDIA_ROOT.

    This never copies, moves, converts, or deletes files. It only creates
    media_assets rows for supported files that are not already registered.
    """
    root = ensure_media_root()
    existing_assets = db.query(MediaAsset).all()
    existing_paths = {
        Path(asset.storage_path).as_posix().lstrip('/')
        for asset in existing_assets
        if asset.storage_path
    }
    existing_urls = {asset.url for asset in existing_assets}

    total_files = 0
    supported_files = 0
    imported = 0
    skipped_existing = 0
    skipped_unsupported = 0
    skipped_hidden = 0
    errors: list[dict[str, str]] = []

    for path in sorted(root.rglob('*')):
        if not path.is_file():
            continue
        total_files += 1
        if path.is_symlink():
            skipped_unsupported += 1
            continue
        relative = path.relative_to(root)
        if any(part.startswith('.') for part in relative.parts) or path.name.endswith('.tmp'):
            skipped_hidden += 1
            continue

        storage_path = relative.as_posix()
        try:
            metadata = inspect_existing_media(path)
        except Exception as exc:
            errors.append({'path': storage_path, 'error': str(exc)})
            continue

        if metadata is None:
            skipped_unsupported += 1
            continue

        supported_files += 1
        url = media_url_for_storage(storage_path)
        if storage_path in existing_paths or url in existing_urls:
            skipped_existing += 1
            continue

        db.add(MediaAsset(
            url=url,
            storage_path=storage_path,
            type=metadata['type'],
            width=metadata.get('width'),
            height=metadata.get('height'),
            format=metadata.get('format'),
            original_filename=path.name,
            source='imported',
        ))
        existing_paths.add(storage_path)
        existing_urls.add(url)
        imported += 1

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        'root': str(root),
        'total_files': total_files,
        'supported_files': supported_files,
        'imported': imported,
        'skipped_existing': skipped_existing,
        'skipped_unsupported': skipped_unsupported,
        'skipped_hidden': skipped_hidden,
        'errors': errors[:50],
        'error_count': len(errors),
    }


@router.delete('/admin/media-assets/{asset_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_media_asset(
    asset_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    asset = db.get(MediaAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Media asset not found')
    assignments = asset_assignments(db).get(asset.id, [])
    if assignments:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Media is still assigned. Remove it from landing, rooms or tours first.')

    storage_path = asset.storage_path
    db.delete(asset)
    db.commit()
    if storage_path:
        delete_local_asset(storage_path)
    return None
