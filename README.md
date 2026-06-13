# Phongtzzz Homestay Booking Request

Repo gồm 3 phần:

```txt
app/      React + Vite landing page
admin/    Next.js admin panel
backend/  FastAPI + PostgreSQL API
```

Luồng chính: khách vào landing page → gửi booking request → backend validate + lưu PostgreSQL → admin thấy request → backend gửi email cho homestay nếu SMTP đã cấu hình. Web không quản lý phòng trống/đã đặt, chỉ nhận yêu cầu đặt phòng.

## 1. Chạy PostgreSQL

```bash
docker compose up -d postgres
```

## 2. Chạy backend FastAPI

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

Admin mặc định trong `.env.example`:

```txt
admin@phongtzzz.local
admin123456
```

## 3. Chạy landing page

```bash
cd app
cp .env.example .env
npm install
npm run dev
```

Mặc định gọi API tại `http://localhost:8000/api`.

## 4. Chạy admin panel

```bash
cd admin
cp .env.example .env.local
pnpm install
pnpm dev
```

Hoặc dùng npm nếu không dùng pnpm:

```bash
npm install
npm run dev
```

## Chức năng đã có

### Public landing page

- Hiển thị nội dung landing page từ API `/api/landing-page`.
- Hiển thị danh sách phòng từ API `/api/rooms`.
- Form booking request gồm: họ tên, SĐT, email, check-in, check-out, số khách, phòng quan tâm, ghi chú.
- Validate form ở frontend và backend.
- Lưu UTM/source/page_url ẩn để tracking nguồn khách.

### Admin panel

- Login bằng JWT.
- Dashboard thống kê booking request/phòng.
- Quản lý booking request: lọc, đổi trạng thái, ghi chú nội bộ, xoá.
- CRUD phòng: tên, giá, sức chứa, amenities, highlights, ảnh, trạng thái hiển thị.
- Upload ảnh Cloudinary.
- Customize toàn bộ landing page qua JSON: brand, hero, welcome, experiences, roomsPreview, amenities, testimonials, gallery, contact, CTA.

### Backend

- FastAPI + SQLAlchemy + PostgreSQL.
- Auth admin JWT.
- Pydantic validation.
- Cloudinary upload.
- SMTP email notification cho homestay.

## API nhanh

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
GET    /api/admin/landing-page
PATCH  /api/admin/landing-page
POST   /api/admin/uploads/image
```
