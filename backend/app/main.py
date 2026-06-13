from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.database import Base, engine
from app.routers import auth, booking_requests, landing_page, rooms, uploads

settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/api/health')
def health():
    return {'status': 'ok', 'app': settings.app_name}


app.include_router(auth.router, prefix='/api')
app.include_router(rooms.router, prefix='/api')
app.include_router(booking_requests.router, prefix='/api')
app.include_router(landing_page.router, prefix='/api')
app.include_router(uploads.router, prefix='/api')
