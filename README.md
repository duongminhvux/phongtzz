# Phongtzzz Homestay Booking Request

Repo gồm 3 phần và đã được gom chạy bằng Docker Compose:

```txt
app/      React + Vite landing page
admin/    Next.js admin panel
backend/  FastAPI + PostgreSQL API
```

Luồng chính: khách vào landing page → gửi booking request → backend validate + lưu PostgreSQL → admin thấy request → backend gửi email cho homestay nếu SMTP đã cấu hình. Web không quản lý phòng trống/đã đặt, chỉ nhận yêu cầu đặt phòng.

## Stack deploy hiện tại

```txt
Docker Compose
├── landing      React + Vite build static, serve bằng Node package `serve`
├── admin        Next.js standalone server
├── api          FastAPI
├── postgres     PostgreSQL 16
└── cloudflared  Cloudflare Tunnel, bật bằng profile `tunnel`
```

Không dùng Nginx tổng. Cloudflare Tunnel trỏ thẳng vào từng service trong Docker network.

## 1. Cấu hình env

Chỉ dùng **một file `.env` ở root repo**.

Repo đã có sẵn `.env.example`. Nếu chưa có `.env`, chạy:

```bash
cp .env.example .env
```

Các biến quan trọng cần sửa trước khi deploy thật:

```txt
PUBLIC_FRONTEND_URL=https://your-domain.com
PUBLIC_ADMIN_URL=https://admin.your-domain.com
PUBLIC_API_URL=https://api.your-domain.com
VITE_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
SECRET_KEY=change-this-secret-key-before-production
ADMIN_EMAIL=admin@phongtzzz.local
ADMIN_PASSWORD=admin123456
HOMESTAY_EMAIL=stayhostelbar@gmail.com
CLOUDFLARE_TUNNEL_TOKEN=
```

Nếu dùng Cloudinary upload ảnh, điền thêm:

```txt
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Nếu muốn gửi email booking request, điền SMTP:

```txt
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@phongtzzz.local
SMTP_FROM_NAME=Phongtzzz Booking
SMTP_USE_TLS=true
```

## 2. Chạy toàn bộ bằng Docker

Build và chạy app/database/API/admin:

```bash
docker compose up -d --build
```

Mặc định các port chỉ bind vào localhost của server để test nội bộ:

```txt
Landing: http://127.0.0.1:5173
Admin:   http://127.0.0.1:3000
API:     http://127.0.0.1:8000
Docs:    http://127.0.0.1:8000/docs
DB:      127.0.0.1:5432
```

Backend container tự chạy seed admin trước khi start API.

Admin mặc định lấy từ `.env`:

```txt
ADMIN_EMAIL=admin@phongtzzz.local
ADMIN_PASSWORD=admin123456
```

## 3. Chạy kèm Cloudflare Tunnel

Điền token vào root `.env`:

```txt
CLOUDFLARE_TUNNEL_TOKEN=...
```

Sau đó chạy:

```bash
docker compose --profile tunnel up -d --build
```

Trong Cloudflare Zero Trust, public hostname nên trỏ service như sau:

```txt
your-domain.com        -> http://landing:5173
admin.your-domain.com  -> http://admin:3000
api.your-domain.com    -> http://api:8000
```

Vì `cloudflared` chạy cùng Docker network với các service, dùng service name `landing`, `admin`, `api`, không cần trỏ qua IP public của server.

## 4. Lệnh quản lý nhanh

Xem container:

```bash
docker compose ps
```

Xem log API:

```bash
docker compose logs -f api
```

Xem log tunnel:

```bash
docker compose --profile tunnel logs -f cloudflared
```

Restart API:

```bash
docker compose restart api
```

Rebuild sau khi sửa code:

```bash
docker compose up -d --build
```

Dừng toàn bộ:

```bash
docker compose --profile tunnel down
```

Xoá cả database volume nếu muốn reset sạch data:

```bash
docker compose --profile tunnel down -v
```

## 5. Chạy dev không Docker nếu cần

Backend đọc được root `.env` khi chạy từ `backend/`:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python scripts/seed.py
python -m uvicorn app.main:app --reload --port 8000
```

Landing page Vite cũng đọc root `.env`:

```bash
cd app
npm install
npm run dev
```

Admin Next.js cũng đọc root `.env` qua `next.config.mjs`:

```bash
cd admin
pnpm install
pnpm dev
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
