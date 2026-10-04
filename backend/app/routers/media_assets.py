from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.media import asset_assignments
from app.models import Admin, MediaAsset
from app.schemas import MediaAssetAdminOut
from app.services.upload import delete_local_asset

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
            'assignments': assignment_map.get(asset.id, []),
        }
        for asset in assets
    ]


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
