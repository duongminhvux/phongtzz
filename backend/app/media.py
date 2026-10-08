from pathlib import PurePosixPath
from typing import Any

from sqlalchemy.orm import Session
from PIL import Image

from app.core.config import get_settings
from app.models import LandingPageSetting, MediaAsset, Room, RoomMedia, Tour, TourMedia, TourPageSetting


VIDEO_EXTENSIONS = ('.mp4', '.webm', '.mov', '.m4v')


def infer_media_type(url: str, fallback: str = 'image') -> str:
    clean = (url or '').lower().split('?')[0]
    if clean.endswith(VIDEO_EXTENSIONS):
        return 'video'
    return fallback if fallback in ('image', 'video') else 'image'


def storage_path_from_url(url: str) -> str | None:
    settings = get_settings()
    prefix = settings.normalized_media_url_prefix + '/'
    if not url.startswith(prefix):
        return None
    value = url[len(prefix):].strip('/')
    return value or None




def local_image_metadata(storage_path: str | None) -> dict[str, Any]:
    if not storage_path:
        return {}
    settings = get_settings()
    path = (settings.media_root_path / storage_path).resolve()
    root = settings.media_root_path.resolve()
    try:
        path.relative_to(root)
    except ValueError:
        return {}
    if not path.is_file():
        return {}
    try:
        with Image.open(path) as image:
            return {
                'width': int(image.width),
                'height': int(image.height),
                'format': (image.format or path.suffix.lstrip('.')).lower() or None,
            }
    except Exception:
        return {}

def infer_source(url: str, storage_path: str | None) -> str:
    if storage_path:
        return 'seed' if storage_path.startswith('seed/') else 'local'
    if url.startswith('http://') or url.startswith('https://'):
        return 'external'
    return 'local'


def asset_to_media(asset: MediaAsset, sort_order: int = 0, alt: str | None = None) -> dict[str, Any]:
    return {
        'asset_id': asset.id,
        'url': asset.url,
        'storage_path': asset.storage_path,
        'type': asset.type,
        'width': asset.width,
        'height': asset.height,
        'format': asset.format,
        'original_filename': asset.original_filename,
        'source': asset.source,
        'alt': alt,
        'sort_order': sort_order,
    }


def get_or_create_asset(db: Session, value: Any, *, fallback_type: str = 'image') -> MediaAsset | None:
    if not value:
        return None
    if isinstance(value, str):
        raw: dict[str, Any] = {'url': value, 'type': infer_media_type(value, fallback_type)}
    elif isinstance(value, dict):
        raw = dict(value)
    else:
        return None

    asset_id = raw.get('asset_id')
    if asset_id:
        asset = db.get(MediaAsset, asset_id)
        if asset:
            return asset

    storage_path = str(raw.get('storage_path') or '').strip().lstrip('/') or None
    if storage_path:
        asset = db.query(MediaAsset).filter(MediaAsset.storage_path == storage_path).first()
        if asset:
            return asset

    url = str(raw.get('url') or '').strip()
    if not url:
        return None
    asset = db.query(MediaAsset).filter(MediaAsset.url == url).first()
    if asset:
        return asset

    storage_path = storage_path or storage_path_from_url(url)
    original_filename = raw.get('original_filename')
    if not original_filename:
        if storage_path:
            original_filename = PurePosixPath(storage_path).name
        elif url.startswith('/'):
            original_filename = PurePosixPath(url.split('?')[0]).name

    source = raw.get('source') or infer_source(url, storage_path)
    media_type = raw.get('type') or infer_media_type(url, fallback_type)
    metadata = local_image_metadata(storage_path) if media_type == 'image' else {}
    asset = MediaAsset(
        url=url,
        storage_path=storage_path,
        type=media_type,
        width=raw.get('width') or metadata.get('width'),
        height=raw.get('height') or metadata.get('height'),
        format=raw.get('format') or metadata.get('format'),
        original_filename=original_filename,
        source=source,
    )
    db.add(asset)
    db.flush()
    return asset


def canonical_media(db: Session, value: Any, *, sort_order: int = 0, fallback_type: str = 'image') -> dict[str, Any] | None:
    if not value:
        return None
    raw = {'url': value} if isinstance(value, str) else dict(value)
    asset = get_or_create_asset(db, raw, fallback_type=fallback_type)
    if not asset:
        return None
    return asset_to_media(asset, sort_order=sort_order, alt=raw.get('alt'))


def canonical_media_list(db: Session, value: Any, *, fallback_type: str = 'image') -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(value):
        raw_order = item.get('sort_order', index) if isinstance(item, dict) else index
        media = canonical_media(db, item, sort_order=int(raw_order or 0), fallback_type=fallback_type)
        if media:
            normalized.append(media)
    normalized.sort(key=lambda item: item.get('sort_order', 0))
    for index, item in enumerate(normalized):
        item['sort_order'] = index
    return normalized


def canonicalize_landing_media(db: Session, value: dict[str, Any]) -> dict[str, Any]:
    data = dict(value or {})
    brand = dict(data.get('brand') or {})
    if brand.get('logo'):
        brand['logo'] = canonical_media(db, brand.get('logo'))
    if brand.get('favicon'):
        brand['favicon'] = canonical_media(db, brand.get('favicon'))
    data['brand'] = brand

    seo = dict(data.get('seo') or {})
    if seo.get('ogImage'):
        seo['ogImage'] = canonical_media(db, seo.get('ogImage'))
    data['seo'] = seo

    sections: list[dict[str, Any]] = []
    for section_index, section_value in enumerate(data.get('sections') or []):
        section = dict(section_value or {})
        section_type = section.get('type')
        if section_type in ('hero', 'banner') and section.get('image'):
            section['image'] = canonical_media(db, section.get('image'))
        if section_type == 'hero' and section.get('video'):
            section['video'] = canonical_media(db, section.get('video'), fallback_type='video')
        if section_type in ('welcome', 'gallery'):
            section['images'] = canonical_media_list(db, section.get('images'))
        if section_type == 'experiences':
            items = []
            for item_value in section.get('items') or []:
                item = dict(item_value or {})
                if item.get('image'):
                    item['image'] = canonical_media(db, item.get('image'))
                items.append(item)
            section['items'] = items
        section['sort_order'] = section.get('sort_order', section_index + 1)
        sections.append(section)
    data['sections'] = sections
    return data


def set_room_media(db: Session, room: Room, images: Any) -> None:
    canonical = canonical_media_list(db, images)
    room.media_links.clear()
    db.flush()
    for index, item in enumerate(canonical):
        asset = db.get(MediaAsset, item['asset_id'])
        if not asset:
            continue
        room.media_links.append(RoomMedia(asset=asset, sort_order=index, alt=item.get('alt')))
    db.flush()




def canonicalize_tour_page_media(db: Session, value: dict[str, Any]) -> dict[str, Any]:
    data = dict(value or {})
    if data.get('heroImage'):
        data['heroImage'] = canonical_media(db, data.get('heroImage'))

    # Tours overview now uses one configurable showcase image. When an older
    # database still has gallery[], migrate its first image on the next save.
    showcase = data.get('showcaseImage')
    if not showcase and isinstance(data.get('gallery'), list) and data.get('gallery'):
        showcase = data['gallery'][0]
    data['showcaseImage'] = canonical_media(db, showcase) if showcase else None
    data['gallery'] = []
    return data

def set_tour_media(db: Session, tour: Tour, items: Any) -> None:
    raw_items = items if isinstance(items, list) else []
    tour.media_links.clear()
    db.flush()
    for index, raw in enumerate(raw_items):
        if not raw:
            continue
        data = {'url': raw} if isinstance(raw, str) else dict(raw)
        asset = get_or_create_asset(db, data, fallback_type=data.get('type') or 'image')
        if not asset:
            continue
        role = str(data.get('role') or 'gallery')
        sort_order = int(data.get('sort_order', index) or 0)
        tour.media_links.append(TourMedia(asset=asset, role=role, sort_order=sort_order, alt=data.get('alt')))
    db.flush()

def landing_assignments(value: dict[str, Any]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []

    def add(item: Any, slot: str, label: str, sort_order: int = 0) -> None:
        if isinstance(item, dict) and item.get('asset_id'):
            output.append({
                'asset_id': item['asset_id'],
                'kind': 'landing',
                'owner_id': 'default',
                'slot': slot,
                'label': label,
                'sort_order': sort_order,
            })

    brand = value.get('brand') or {}
    add(brand.get('logo'), 'brand.logo', 'Brand logo')
    add(brand.get('favicon'), 'brand.favicon', 'Browser favicon')
    seo = value.get('seo') or {}
    add(seo.get('ogImage'), 'seo.ogImage', 'SEO OpenGraph image')
    for section in value.get('sections') or []:
        section_id = str(section.get('id') or section.get('type') or 'section')
        section_type = str(section.get('type') or 'section')
        section_name = str(section.get('title') or section_type).strip()
        prefix = f'sections.{section_id}'
        add(section.get('image'), f'{prefix}.image', f'Landing · {section_name} · image')
        add(section.get('video'), f'{prefix}.video', f'Landing · {section_name} · video')
        for index, item in enumerate(section.get('images') or []):
            add(item, f'{prefix}.images.{index}', f'Landing · {section_name} · image #{index + 1}', index)
        if section_type == 'experiences':
            for index, item in enumerate(section.get('items') or []):
                add(item.get('image'), f'{prefix}.items.{index}.image', f"Landing · {section_name} · {item.get('title') or ('item ' + str(index + 1))}", index)
    return output



def tour_page_assignments(value: dict[str, Any]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    hero = value.get('heroImage')
    if isinstance(hero, dict) and hero.get('asset_id'):
        output.append({'asset_id': hero['asset_id'], 'kind': 'tour_page', 'owner_id': 'default', 'slot': 'heroImage', 'label': 'Tours page: hero', 'sort_order': 0})
    showcase = value.get('showcaseImage')
    if isinstance(showcase, dict) and showcase.get('asset_id'):
        output.append({'asset_id': showcase['asset_id'], 'kind': 'tour_page', 'owner_id': 'default', 'slot': 'showcaseImage', 'label': 'Tours page: showcase', 'sort_order': 0})
    else:
        # Legacy compatibility until the page is saved once in the new admin.
        for index, item in enumerate((value.get('gallery') or [])[:1]):
            if isinstance(item, dict) and item.get('asset_id'):
                output.append({'asset_id': item['asset_id'], 'kind': 'tour_page', 'owner_id': 'default', 'slot': 'showcaseImage', 'label': 'Tours page: showcase', 'sort_order': index})
    return output

def asset_assignments(db: Session) -> dict[str, list[dict[str, Any]]]:
    assignments: dict[str, list[dict[str, Any]]] = {}
    for room in db.query(Room).all():
        for link in room.media_links:
            assignments.setdefault(link.media_asset_id, []).append({
                'kind': 'room',
                'owner_id': room.id,
                'slot': 'room.images',
                'label': f'Room: {room.name}',
                'sort_order': link.sort_order,
            })
    setting = db.query(LandingPageSetting).filter(LandingPageSetting.key == 'default').first()
    if setting:
        for assignment in landing_assignments(setting.value or {}):
            assignments.setdefault(assignment.pop('asset_id'), []).append(assignment)
    tour_setting = db.query(TourPageSetting).filter(TourPageSetting.key == 'default').first()
    if tour_setting:
        for assignment in tour_page_assignments(tour_setting.value or {}):
            assignments.setdefault(assignment.pop('asset_id'), []).append(assignment)
    for tour in db.query(Tour).all():
        for link in tour.media_links:
            assignments.setdefault(link.media_asset_id, []).append({
                'kind': 'tour',
                'owner_id': tour.id,
                'slot': f'tour.media.{link.role}',
                'label': f'Tour · {tour.name} · {link.role}',
                'sort_order': link.sort_order,
            })
    return assignments
