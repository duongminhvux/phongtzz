from email.message import EmailMessage
import smtplib

from app.core.config import get_settings
from app.models import BookingRequest


def _format_date(value):
    return value.strftime('%d/%m/%Y') if value else '-'


def send_booking_request_email(booking: BookingRequest) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        return

    room_name = booking.room.name if booking.room else 'Chưa chọn phòng cụ thể'
    snapshot = booking.tour_snapshot or {}
    tour_name = booking.tour.name if getattr(booking, 'tour', None) else snapshot.get('name')
    addon_text = ', '.join(item.get('name', '') for item in (booking.tour_addons or []) if item.get('name')) or '-'
    tour_block = ''
    if tour_name:
        tour_block = f"""

Tour đi kèm: {tour_name}
Ngày bắt đầu tour: {_format_date(booking.tour_start_date)}
Riding option: {snapshot.get('riding_option_label') or booking.riding_option or '-'}
Bus transfer: {snapshot.get('bus_transfer_label') or booking.bus_transfer or '-'}
Tour add-ons: {addon_text}
Dietary requirements: {booking.dietary_requirements or '-'}
""".rstrip()

    subject = f'Yêu cầu booking mới - {booking.full_name}'
    body = f"""
Có yêu cầu booking mới từ website.

Khách: {booking.full_name}
Số điện thoại / WhatsApp: {booking.phone}
Email: {booking.email or '-'}
Check-in: {_format_date(booking.check_in)}
Check-out: {_format_date(booking.check_out)}
Số khách: {booking.guests or '-'}
Phòng quan tâm: {room_name}{tour_block}
Ghi chú khách: {booking.message or '-'}
Nguồn: {booking.source or '-'}
Page URL: {booking.page_url or '-'}

Vào admin panel > Room Bookings để cập nhật trạng thái xử lý.
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
