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
