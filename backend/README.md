# Phongtzzz FastAPI Backend

Backend cho landing page + admin quản lý booking request homestay.

## Setup nhanh

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
```

Tạo database PostgreSQL `phongtzzz`, sửa `DATABASE_URL` trong `.env`, sau đó:

```bash
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

Admin mặc định lấy từ `.env`:

```txt
ADMIN_EMAIL=admin@phongtzzz.local
ADMIN_PASSWORD=admin123456
```

## API chính

Public:

```txt
GET  /api/health
GET  /api/rooms
GET  /api/landing-page
POST /api/booking-requests
```

Admin:

```txt
POST   /api/auth/login
GET    /api/auth/me
GET    /api/admin/booking-requests
PATCH  /api/admin/booking-requests/{id}
DELETE /api/admin/booking-requests/{id}
GET    /api/admin/rooms
POST   /api/admin/rooms
PATCH  /api/admin/rooms/{id}
DELETE /api/admin/rooms/{id}
PATCH  /api/admin/landing-page
POST   /api/admin/uploads/image
```
