# Phongtzzz FastAPI Backend

Backend cho landing page + admin quản lý booking request homestay.

Env đã được gom về root repo: `../.env`. Backend cũng vẫn nhận env vars trực tiếp từ Docker Compose.

## Chạy bằng Docker

Từ root repo:

```bash
docker compose up -d --build api postgres
```

API docs: `http://127.0.0.1:8000/docs`

## Chạy dev thủ công

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python scripts/seed.py
python -m uvicorn app.main:app --reload --port 8000
```

Admin mặc định lấy từ root `.env`:

```txt
ADMIN_EMAIL=admin@phongtzzz.local
ADMIN_PASSWORD=admin123456
```

## Upload media

Endpoint admin mới:

- `POST /api/admin/uploads/media`: upload ảnh hoặc video.
- Ảnh được convert sang `.webp` bằng Pillow trước khi đẩy Cloudinary.
- Video được convert sang `.mp4` web/H.264 bằng FFmpeg trước khi đẩy Cloudinary.

Khi chạy Docker, FFmpeg đã được cài trong image backend. Nếu chạy thủ công trên máy local và muốn upload video, cần cài `ffmpeg` trên máy trước.
