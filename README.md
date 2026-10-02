# Riverside Haven Booking + Ha Giang Loop Tours

Fresh-install repo cho homestay chạy bằng Docker trên laptop/server riêng. Repo này **không cần Cloudinary** và không cần merge DB cũ.

## Kiến trúc

```text
Admin
  -> FastAPI
  -> PostgreSQL             (content, rooms, tours, booking requests, media metadata)
  -> ./data/uploads         (ảnh/video thật trên ổ host)

Public website
  -> GET /api/site          (một snapshot DB: landing + rooms + tours)
  -> /uploads/...           (media local persistent)
```

DB là source of truth. FE không có business fake/mock fallback.

## Chức năng public

```text
/                    Landing page
/rooms               Rooms
/contact             Room Booking Request
/tours               Ha Giang Loop Tour Overview
/tours/:slug         Tour detail + full itinerary
/book-tour           Tour Booking Request
```

### Tour Overview seed

Template `booking` tạo sẵn:

- **The Express Loop** — 2D1N — $90
- **The Classic Loop** — 3D2N — $150
- **The Explorer Loop** — 4D3N — $200
- Hero: `Ha Giang Loop Motorbike Adventure`
- Slogan: `Ride. Explore. Connect.`
- What's Included
- day-by-day itineraries
- gallery + international guest reviews
- safety / practical FAQ
- CTA sang Tour Booking Request

Tất cả chỉ là **seed lần đầu**. Sau khi DB đã được khởi tạo, admin sửa DB và restart không ghi đè lại.

### Tour Booking Request

Form Tour dùng cùng design language/flow với booking phòng nhưng lưu bảng riêng:

- Full Name *
- Email *
- Phone / WhatsApp *
- Tour Start Date *
- Tour Package *
- Riding Option *
- Number of Guests *
- Bus Transfer *
- Add-ons / Upgrades
- Dietary Requirements
- Notes / Special Requests

Submit chỉ tạo **booking request**, không tự coi là booking confirmed. Admin xử lý status:

```text
NEW -> CONTACTED -> CONFIRMED -> COMPLETED
                         `-----> CANCELLED
```

Tour request snapshot lại package + selected add-ons để admin sửa tour/giá sau này không làm mất context request cũ.

## Business rules trong DB

Không hard-code vào FE. Admin sửa được:

- riding options + `price_modifier`
- bus transfer options + `price_modifier`
- add-ons/upgrades + price/currency/unit
- tour price/currency

Seed mặc định hiện tại:

```text
Easy-Rider                modifier 0 USD (recommended)
Self-Driving              modifier 0 USD
Hanoi round-trip VIP bus  modifier 0 USD (included wording)
Self-arranged transport   modifier 0 USD
Private Room Upgrade      +350,000 VND / night
Pre-tour Riverside room   contact for room price
```

Đây là default seed để chạy lần đầu; có thể đổi ngay trong Admin.

## Media local persistent

Ảnh/video runtime nằm ở:

```text
./data/uploads
```

Docker bind mount:

```text
./data/uploads -> API /data/uploads          (read/write)
./data/uploads -> Landing /app/dist/uploads  (read-only)
```

DB lưu URL tương đối:

```text
/uploads/2026/10/<uuid>.webp
```

nên đổi domain/IP/máy không cần rewrite URL DB.

Ảnh upload được resize tối đa 1920px + WebP. Video được ffmpeg chuẩn hóa sang MP4.

### Media DB

```text
media_assets
room_media     -> room + sort_order
tour_media     -> tour + role(hero/gallery/itinerary) + sort_order
```

Media Library trong admin hiển thị asset đang được dùng tại:

- Landing hero/banner/welcome/gallery/experience/logo
- Room nào + thứ tự #1/#2/...
- Tours page hero/gallery
- Tour nào + role + thứ tự

Room gallery có upload / replace / remove / move up / move down; `room_media.sort_order` là thứ tự FE đọc thật.

## DB tables chính

```text
admins
landing_page_settings
rooms
room_media
media_assets
booking_requests

tour_page_settings
tours
tour_itinerary_days
tour_media
tour_addons
tour_booking_requests
```

## Admin

Admin có các khu:

```text
Dashboard
Room Bookings
Tour Bookings
Rooms
Tours
Landing Builder
Media Library
```

`Tours` quản lý:

- Tour Overview `/tours`
- package name / slug / duration / price / currency
- highlights / included / excluded
- riding options
- bus transfer options
- itinerary per day
- FAQ
- hero/gallery media
- featured/public/sort
- global Tour Add-ons

`Tour Bookings` có email + WhatsApp shortcut, tour/date/guests, riding/bus, add-ons, dietary/notes, status, quote và internal note.

## First run trên máy mới

Yêu cầu: Docker + Docker Compose.

Nếu test localhost, không cần `.env`:

```bash
docker compose up -d --build
```

Mặc định:

```env
INITIAL_SITE_TEMPLATE=booking
```

Khi DB trống, API startup sẽ:

1. tạo schema;
2. tạo admin;
3. copy `backend/seed/assets` -> `./data/uploads/seed`;
4. seed landing + 3 rooms;
5. seed Tour Overview + 3 tours + itinerary + add-ons;
6. start API;
7. những lần restart sau thấy site đã tồn tại thì **skip seed**.

### First run trắng

Copy `.env.example` -> `.env`, đặt:

```env
INITIAL_SITE_TEMPLATE=blank
```

rồi:

```bash
docker compose up -d --build
```

Blank tạo shell editable, không tạo demo rooms/tours/reviews/media.

## Nếu chuyển từ project cũ: chạy fresh, không merge

Dùng repo này ở một folder mới. Nếu muốn bỏ hẳn DB/container test cũ:

```bash
docker compose down -v
```

Sau đó trong repo mới:

```bash
docker compose up -d --build
```

`-v` xóa named PostgreSQL volume của compose hiện tại. `./data/uploads` là bind mount nên nếu muốn xóa media cũ thì xóa folder đó có chủ ý.

## Production + domain

```text
.env.example -> .env
```

Sửa tối thiểu:

```env
PUBLIC_FRONTEND_URL=https://your-domain.com
PUBLIC_ADMIN_URL=https://admin.your-domain.com
VITE_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
SECRET_KEY=<strong-random-secret>
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<strong-password>
POSTGRES_PASSWORD=<strong-password>
INITIAL_SITE_TEMPLATE=booking
```

Sau đó:

```bash
docker compose up -d --build
```

Cloudflare Tunnel route gợi ý:

```text
your-domain.com       -> landing:5173
admin.your-domain.com -> admin:3000
api.your-domain.com   -> api:8000
```

Optional container tunnel:

```env
CLOUDFLARE_TUNNEL_TOKEN=...
```

```bash
docker compose --profile tunnel up -d --build
```

## Reset seed có chủ ý

Xóa toàn bộ app tables + booking requests + local media rồi seed booking lại:

```bash
docker compose exec api python scripts/seed.py --reset-db --template booking
```

Reset landing/rooms/tours/media nhưng giữ room + tour booking requests:

```bash
docker compose exec api python scripts/seed.py --reset-content --template booking
```

Blank:

```bash
docker compose exec api python scripts/seed.py --reset-db --template blank
```

## Seed source duy nhất

```text
backend/seed/booking_seed.json
backend/seed/assets/
```

Seed không nằm trong FE. Khi first-run, media seed cũng đi vào hệ media local/DB giống ảnh admin upload.

## Endpoint chính

Public:

```text
GET  /api/site
POST /api/booking-requests
POST /api/tour-booking-requests
GET  /api/health
GET  /uploads/<path>
```

Admin:

```text
POST   /api/auth/login

GET    /api/admin/landing-page
PUT    /api/admin/landing-page

GET    /api/admin/rooms
POST   /api/admin/rooms
PATCH  /api/admin/rooms/{id}
DELETE /api/admin/rooms/{id}

GET    /api/admin/tour-page
PUT    /api/admin/tour-page
GET    /api/admin/tours
POST   /api/admin/tours
PATCH  /api/admin/tours/{id}
DELETE /api/admin/tours/{id}

GET    /api/admin/tour-addons
POST   /api/admin/tour-addons
PATCH  /api/admin/tour-addons/{id}
DELETE /api/admin/tour-addons/{id}

GET    /api/admin/booking-requests
PATCH  /api/admin/booking-requests/{id}
DELETE /api/admin/booking-requests/{id}

GET    /api/admin/tour-booking-requests
PATCH  /api/admin/tour-booking-requests/{id}
DELETE /api/admin/tour-booking-requests/{id}

POST   /api/admin/uploads/media
GET    /api/admin/media-assets
DELETE /api/admin/media-assets/{id}
```

## Backup

Muốn restore đầy đủ cần backup:

```text
PostgreSQL
./data/uploads
```

Rebuild/recreate container không xóa media bind-mounted.
