# Riverside Haven — Homestay, Rooms & Ha Giang Loop Tours

Fresh-install repo cho Riverside Haven chạy bằng Docker trên laptop/server riêng. Repo dùng **PostgreSQL làm source of truth** và lưu media runtime trực tiếp trên ổ host tại `./data/uploads`; không dùng Cloudinary và không cần merge database cũ.

## Luồng hệ thống

```text
Admin
  -> FastAPI
  -> PostgreSQL             content / rooms / tours / booking requests / media metadata
  -> ./data/uploads         ảnh + video runtime trên ổ host

Public website
  -> GET /api/site          snapshot landing + rooms + tours
  -> /uploads/...           media local persistent
```

Public FE không fallback business fake/mock. Seed chỉ dùng để tạo nội dung lần đầu khi database trống; sau đó admin sửa gì thì dữ liệu trong DB là dữ liệu thật.

## Public routes

```text
/                    Home / Landing
/rooms               Rooms + room detail
/tours               Ha Giang Loop Tour Overview
/tours/:slug         Tour detail + itinerary
/contact             Một Booking Request chung: room + tour optional
```

Không còn trang `/book-tour`. Tour vẫn có trang giới thiệu và chi tiết riêng, nhưng nút **Book This Tour** đưa khách sang `/contact?tour=<slug>` và preselect tour trong cùng form booking.

## Booking Room + Tour optional

Form `/contact` giữ flow booking phòng, sau đó có khối **Add a Ha Giang Loop tour — Optional**.

Phần phòng:

- Full Name *
- Phone / WhatsApp *
- Email
- Check-in *
- Check-out *
- Number of Guests *
- Room
- Notes

Nếu khách chọn Tour thì form mở thêm:

- Tour Package
- Tour Start Date *
- Riding Option *
- Bus Transfer *
- Add-ons / Upgrades
- Dietary Requirements

Khách có thể **đặt phòng mà không chọn tour**. Khi có tour, booking request snapshot lại package / price / riding / bus / add-ons để sau này admin sửa giá tour không làm mất context của request cũ.

Admin xử lý chung trong **Room Bookings** với status:

```text
NEW -> CONTACTED -> CONFIRMED -> COMPLETED
                         `-----> CANCELLED
```

Trong bảng Room Bookings:

- click số điện thoại -> WhatsApp (`wa.me`)
- click email -> `mailto:`
- nếu request có tour thì hiển thị tour/date/riding/bus/add-ons/dietary ngay trong cùng record.

## Rooms UX

Home `Our Rooms` không đưa khách thẳng tới booking nữa.

```text
Home room card
  -> /rooms?room=<slug>
  -> trang Rooms tự mở detail của đúng phòng đó
```

Từ room detail khách mới chọn gửi booking request.

## Tours seed

Template `booking` tạo sẵn:

- **The Express Loop** — 2D1N — $90
- **The Classic Loop** — 3D2N — $150
- **The Explorer Loop** — 4D3N — $200
- Hero `Ha Giang Loop Motorbike Adventure`
- slogan `Ride. Explore. Connect.`
- What's Included
- itinerary theo ngày
- gallery + reviews
- FAQ / safety
- riding options / bus options / add-ons

Tất cả là dữ liệu seed, không hard-code vào FE.

## Media Library + “Chọn ảnh”

Admin không còn các ô upload file rải rác. Landing, Rooms và Tours dùng chung component **Media Picker**:

1. bấm **Chọn ảnh** / **Chọn media**;
2. popup Media Library mở ra;
3. ảnh đã upload được ưu tiên lên trước ảnh seed;
4. có search theo filename / vị trí đang dùng;
5. có thể chọn asset đã có;
6. hoặc bấm **Upload ảnh mới** ngay trong popup;
7. một `media_asset` có thể tái sử dụng ở nhiều section / room / tour.

Media Library cũng có upload và **Gán nhanh vào...**:

- Brand logo
- Browser favicon
- SEO OpenGraph image
- Landing Hero / Banner / Welcome / Gallery
- Room gallery
- Tours page Hero / Gallery
- Tour Hero / Gallery

Mỗi card media hiển thị asset đang được dùng ở đâu. Asset chỉ xóa được khi không còn assignment.

### Room gallery order

Room dùng bảng `room_media`:

```text
room_id
media_asset_id
sort_order
alt
```

Admin có thể:

- thêm ảnh từ Media Library;
- replace;
- remove;
- move up / move down;
- ảnh `#1` là cover.

Thứ tự public FE nhận chính là `room_media.sort_order` trong DB.

## Local persistent media

Media runtime nằm ngoài container:

```text
./data/uploads
```

Docker bind mount:

```text
./data/uploads -> API /data/uploads          read/write
./data/uploads -> Landing /app/dist/uploads  read-only
```

DB lưu URL tương đối:

```text
/uploads/2026/10/<uuid>.webp
```

Nên đổi domain / IP / máy chủ không cần rewrite URL DB.

Ảnh upload được resize tối đa 1920 px và convert WebP; video được chuẩn hóa MP4. Seed media cũng được copy vào cùng storage local khi first run.

## SEO

Landing Builder có khu **SEO** cho admin chỉnh trực tiếp trong DB:

- Home title + description
- Rooms title + description
- Tours title + description
- Booking title + description
- canonical base URL
- OpenGraph image
- browser/site title
- favicon

Public FE cập nhật theo route:

- `<title>`
- meta description
- canonical
- OpenGraph
- Twitter Card
- dynamic favicon
- JSON-LD `LodgingBusiness`
- JSON-LD `TouristTrip` cho tour detail

Repo cũng có fallback SEO trong `app/index.html`, `robots.txt` và `sitemap.xml`. Default favicon là `RH`; admin có thể chọn favicon khác từ Media Library, không cần sửa source.

> Đây vẫn là Vite SPA. Google có thể render metadata động sau JavaScript; homepage có static fallback ngay trong HTML. Nếu sau này cần social crawler/SEO SSR tuyệt đối theo từng tour thì có thể chuyển public FE sang SSR/prerender, nhưng không bắt buộc cho flow hiện tại.

## WhatsApp + Zalo bubbles

Public site có hai nút tròn floating WhatsApp và Zalo.

Landing Builder chỉnh được:

- WhatsApp number
- WhatsApp URL custom
- Zalo number / ID
- Zalo URL custom

Nếu Zalo chưa nhập riêng, public FE fallback sang số điện thoại của homestay để vẫn hiện đủ hai bubble. Link mở app tương ứng trên điện thoại nếu hệ điều hành/browser hỗ trợ hoặc mở web fallback.

## Landing image ratios

- `welcome-main`: **1 ảnh lớn 3:2**
- `gallery-main`: **1 ảnh lớn 3:2**
- toàn bộ khung ảnh nội dung ở Home / Rooms / Tours / Admin preview dùng cố định **3:2**; ảnh dọc được crop bằng `object-cover`, không còn layout 2:3
- Hero/Banner/Room detail có layout riêng vì không phải “khung ảnh nhỏ” của landing.

## Landing save

Landing vẫn autosave sau khi admin dừng chỉnh khoảng 700 ms, nhưng có thêm nút sticky **Lưu landing** để ép lưu snapshot mới nhất ngay lập tức.

Khi save/upload/assign/delete thành công hoặc lỗi, admin hiện **floating notification** ở góc trang rồi tự ẩn.

## Browser tab & favicon

Trong Landing Builder -> `Brand, liên hệ & browser tab`:

- `Tên browser tab / site title`
- `Favicon / logo nhỏ bên trái tên tab`

Favicon được chọn từ cùng Media Library. Một ảnh favicon vẫn là một `media_asset`, do đó có thể tái sử dụng ở chỗ khác nếu muốn.

## DB tables chính

Fresh DB hiện có:

```text
admins
landing_page_settings
media_assets
rooms
room_media
booking_requests

tour_page_settings
tours
tour_itinerary_days
tour_media
tour_addons
```

Tour request không còn bảng riêng; optional-tour data nằm trong `booking_requests`.

## Admin navigation

```text
Dashboard
Room Bookings
Rooms
Tours
Landing Builder
Media Library
```

### Tours

Admin chỉnh được:

- Tour Overview
- name / slug / tagline
- duration / price / currency
- highlights / included / excluded
- riding options
- bus transfer options
- itinerary từng ngày
- FAQ
- hero/gallery media
- order / featured / active
- global Tour Add-ons

## First run trên máy mới

Yêu cầu: Docker + Docker Compose.

### Chạy nhanh localhost

Không cần `.env`:

```bash
docker compose up -d --build
```

Mặc định:

```env
INITIAL_SITE_TEMPLATE=booking
```

Khi DB hoàn toàn trống, API startup sẽ:

1. tạo schema;
2. tạo admin;
3. copy `backend/seed/assets` -> `./data/uploads/seed`;
4. seed Landing + Rooms;
5. seed Tour Overview + 3 tours + itinerary + add-ons;
6. API healthy;
7. Landing/Admin start.

Các lần restart sau thấy site đã tồn tại thì **skip seed**, không ghi đè dữ liệu admin.

### Chọn website trắng ở first run

Copy `.env.example` -> `.env` rồi đặt:

```env
INITIAL_SITE_TEMPLATE=blank
```

Sau đó:

```bash
docker compose up -d --build
```

`blank` tạo editable shell, không tạo room/tour/gallery demo.

## Deploy domain / Cloudflare Tunnel

Copy:

```text
.env.example -> .env
```

Tối thiểu đổi:

```env
PUBLIC_FRONTEND_URL=https://riversidehavenhagiang.com
PUBLIC_ADMIN_URL=https://admin.your-domain.com
VITE_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api

SECRET_KEY=<strong-random-secret>
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<strong-password>
POSTGRES_PASSWORD=<strong-password>

INITIAL_SITE_TEMPLATE=booking
```

Nếu dùng compose profile Cloudflare Tunnel:

```env
CLOUDFLARE_TUNNEL_TOKEN=<token>
```

```bash
docker compose --profile tunnel up -d --build
```

Các service chỉ bind vào `127.0.0.1` theo mặc định nên phù hợp để expose thông qua tunnel/reverse proxy.

## SMTP Gmail ví dụ

Email là optional. Nếu dùng Gmail:

```env
HOMESTAY_EMAIL=riversidehaven@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=riversidehaven@gmail.com
SMTP_PASSWORD=<GOOGLE_APP_PASSWORD>
SMTP_FROM_EMAIL=riversidehaven@gmail.com
SMTP_FROM_NAME=Riverside Haven
SMTP_USE_TLS=true
```

`SMTP_PASSWORD` phải là Google App Password nếu tài khoản Gmail yêu cầu 2-Step Verification. Không commit `.env`.

## Reset content

### Reset website về booking seed nhưng giữ booking requests

```bash
docker compose exec api python scripts/seed.py --reset-content --template booking
```

Reset:

- landing
- rooms
- tours
- tour page
- add-ons
- media assignments/content

Booking request cũ được giữ; link tới room/tour bị xóa an toàn trước khi reset entity content.

### Reset DB hoàn toàn

```bash
docker compose exec api python scripts/seed.py --reset-db --template booking
```

Lệnh này xóa cả booking requests.

### Fresh Docker volume hoàn toàn

Nếu đúng là máy test và muốn xóa PostgreSQL volume:

```bash
docker compose down -v
```

`./data/uploads` là **bind mount trên host**, nên `down -v` không tự xóa media folder đó. Muốn fresh cả media thì tự xóa nội dung `data/uploads` nhưng giữ `.gitkeep`.

## Backup

Vì laptop/server tự giữ media, backup tối thiểu:

```text
PostgreSQL
+
./data/uploads
```

DB giữ metadata/assignment; filesystem giữ binary thật.

## Notes build

Landing dùng npm lockfile (`npm ci`) và Admin dùng pnpm lockfile (`pnpm install --frozen-lockfile`) trong Docker build. Repo không commit `node_modules`, `.next`, `dist`, runtime uploads hay secrets.

## Quét media có sẵn trên máy

Media Library có nút **Quét ảnh trên máy**. Backend quét recursive thư mục bind mount `./data/uploads`, tự tạo record `media_assets` cho các file ảnh/video được copy thủ công nhưng chưa có trong DB, và không tạo duplicate nếu `storage_path` đã tồn tại. File hidden, `.gitkeep`, file tạm và định dạng không hỗ trợ được bỏ qua.

Có thể copy ảnh vào bất kỳ thư mục con nào, ví dụ:

```text
data/uploads/manual/banner-home.jpg
data/uploads/rooms/room-a.webp
```

Sau đó vào Admin → Media Library → **Quét ảnh trên máy**. Asset import có `source=imported` và dùng/gán lại giống ảnh upload qua Admin. Nếu DB còn asset nhưng file vật lý đã bị xóa, Media Library hiển thị trạng thái **Missing file** thay vì tự xóa record DB.

## Font, Safari/CORS và Display Settings cho ảnh Landing

- Font nội dung/tiêu đề được lưu trong `landing.theme` và public FE áp dụng bằng CSS variables. `font-serif`/`font-sans` của Tailwind được override để không đè font do Admin chọn.
- `Bricolage Grotesque` và `Inter` được preload; các Google Font khác admin nhập sẽ được nạp động khi public site tải cấu hình từ DB.
- Public `GET /api/site` không còn tự gắn `Content-Type: application/json`, tránh tạo CORS preflight không cần thiết trên Safari/WebView.
- Backend CORS nhận cả http/https và www/non-www của `PUBLIC_FRONTEND_URL`, đồng thời cho phép subdomain cùng site thông qua regex. Vẫn nên bật Cloudflare `Always Use HTTPS` ở production.
- Ảnh Landing (Welcome, Gallery, Experience) có `mediaDisplay`: tỉ lệ `3:2 / 1:1 / 4:5 / 16:9`, width 40–100%, align trái/giữa/phải và crop X/Y. Mobile luôn full width.
- Hero/Banner là background full khung nên chỉ expose crop X/Y. Room và Tour card/gallery vẫn cố định 3:2.
- Các thiết lập trên nằm trong JSON landing hiện tại, không cần migration schema và không ảnh hưởng DB/media cũ.
