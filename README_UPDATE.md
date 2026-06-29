# Update: DB-driven landing + admin builder + media upload

## Những phần đã sửa

- Landing page không dùng room mock khi API lỗi nữa; danh sách phòng lấy từ `/api/rooms` trong DB.
- Landing page render theo `landing_page_settings.value.sections`, admin có thể bật/tắt, thêm section, đổi thứ tự section.
- Admin có form chỉnh Brand/Header/Footer/Theme thay vì bắt sửa JSON thô.
- Admin Rooms đã bỏ ô `Images URL`; ảnh/video được upload bằng file, có preview, xoá, xếp thứ tự.
- Upload media đi qua backend `/api/admin/uploads/media`:
  - ảnh được convert sang WebP trước khi upload Cloudinary;
  - video được convert sang MP4 web/H.264 bằng FFmpeg trước khi upload Cloudinary.
- Backend vẫn tương thích dữ liệu cũ `images: ["url"]`; khi trả API sẽ normalize về object `{ url, type, sort_order }`.

## Chạy lại sau khi thay đổi

```bash
docker compose down
docker compose up -d --build
```

Nếu DB volume cũ đang có landing JSON cũ thì không cần xoá volume; FE/Admin đã tự normalize format cũ. Nếu muốn seed lại dữ liệu mặc định mới hoàn toàn thì mới xoá volume Postgres.

## Cloudinary cần có trong `.env`

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=phongtzzz
```

## Lưu ý Docker backend

Backend Dockerfile đã cài `ffmpeg` để convert video. Khi build lần đầu sẽ lâu hơn trước một chút.

## Fix 2026-06-17: landing TypeScript build

Đã sửa lỗi `docker compose up --build` ở service `landing`:

- `Footer.tsx`: ép kiểu `brand`, `footer`, `cta` để TypeScript không hiểu fallback `{}` là object rỗng không có field.
- `Contact.tsx`: ép kiểu `brand`, `contact` sau khi fallback default để tránh lỗi possibly undefined.
- `Navbar.tsx`, `App.tsx`, `Home.tsx`: ép kiểu theme/header/brand và bỏ prop `landing` không dùng ở renderer.

Lệnh kiểm tra nội bộ: `tsc -p tsconfig.app.json` đã pass sau khi thêm shim tạm cho môi trường sandbox thiếu dependency đầy đủ. Trong Docker thật, dependency được cài bằng `npm ci` nên không cần shim.
