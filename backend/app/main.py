from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.database import Base, engine
from app.routers import auth, booking_requests, landing_page, media_assets, rooms, site, uploads, tours, tour_booking_requests
from app.services.upload import ensure_media_root

settings = get_settings()
Base.metadata.create_all(bind=engine)
media_root = ensure_media_root()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# The same persistent host folder is also mounted read-only into the landing
# container. Serving it here too keeps /uploads available from the API domain.
app.mount(settings.normalized_media_url_prefix, StaticFiles(directory=str(media_root)), name='uploads')


@app.get('/api/health')
def health():
    return {'status': 'ok', 'app': settings.app_name}


app.include_router(auth.router, prefix='/api')
app.include_router(rooms.router, prefix='/api')
app.include_router(site.router, prefix='/api')
app.include_router(booking_requests.router, prefix='/api')
app.include_router(landing_page.router, prefix='/api')
app.include_router(uploads.router, prefix='/api')
app.include_router(media_assets.router, prefix='/api')
app.include_router(tours.router, prefix='/api')
app.include_router(tour_booking_requests.router, prefix='/api')
