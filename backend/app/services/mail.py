from email.message import EmailMessage
import smtplib
from app.core.config import get_settings
from app.models import BookingRequest


def _format_date(value):
    return value.strftime('%d/%m/%Y') if value else '-'


def send_booking_request_email(booking: BookingRequest) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        # SMTP chưa config thì bỏ qua để local dev không lỗi.
        return

    room_name = booking.room.name if booking.room else 'Chưa chọn phòng cụ thể'
    subject = f'Yêu cầu đặt phòng mới - {booking.full_name}'
    body = f"""
Có yêu cầu đặt phòng mới từ website.

Khách: {booking.full_name}
Số điện thoại: {booking.phone}
Email: {booking.email or '-'}
Check-in: {_format_date(booking.check_in)}
Check-out: {_format_date(booking.check_out)}
Số khách: {booking.guests or '-'}
Phòng quan tâm: {room_name}
Ghi chú khách: {booking.message or '-'}
Nguồn: {booking.source or '-'}
Page URL: {booking.page_url or '-'}

Vào admin panel để cập nhật trạng thái xử lý.
""".strip()

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f'{settings.smtp_from_name} <{settings.smtp_from_email}>'
    msg['To'] = settings.homestay_email
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
