import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Mail, MapPin, Phone, Send } from 'lucide-react'
import { createBookingRequest, getLandingPage, getRooms, readTrackingParams } from '../lib/api'
import { defaultLandingPage } from '../data/defaultLanding'
import type { LandingPage, Room } from '../types/api'

type FormState = {
  full_name: string
  phone: string
  email: string
  check_in: string
  check_out: string
  guests: string
  room_id: string
  message: string
}

const initialForm: FormState = {
  full_name: '',
  phone: '',
  email: '',
  check_in: '',
  check_out: '',
  guests: '1',
  room_id: '',
  message: '',
}

function validateForm(form: FormState) {
  if (form.full_name.trim().length < 2) return 'Vui lòng nhập họ tên tối thiểu 2 ký tự.'
  if (!/^[0-9+()\-.\s]{8,25}$/.test(form.phone.trim())) return 'Số điện thoại chưa đúng định dạng.'
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Email chưa đúng định dạng.'
  if (!form.check_in) return 'Vui lòng chọn ngày check-in.'
  if (!form.check_out) return 'Vui lòng chọn ngày check-out.'
  if (new Date(form.check_out) <= new Date(form.check_in)) return 'Ngày check-out phải sau ngày check-in.'
  if (Number(form.guests) < 1) return 'Số khách phải lớn hơn hoặc bằng 1.'
  if (form.message.length > 1000) return 'Ghi chú tối đa 1000 ký tự.'
  return ''
}

export default function Contact() {
  const [landing, setLanding] = useState<LandingPage>(defaultLandingPage)
  const [rooms, setRooms] = useState<Room[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    getLandingPage().then(setLanding)
    getRooms().then((items) => {
      setRooms(items)
      const roomId = new URLSearchParams(window.location.search).get('roomId')
      if (roomId && items.some((room) => room.id === roomId)) {
        setForm((prev) => ({ ...prev, room_id: roomId }))
      }
    })
  }, [])

  const brand = (landing.brand || defaultLandingPage.brand || {}) as Record<string, any>
  const contact = (landing.contact || defaultLandingPage.contact || {}) as Record<string, any>
  const minDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await createBookingRequest({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        check_in: form.check_in,
        check_out: form.check_out,
        guests: Number(form.guests),
        room_id: form.room_id || undefined,
        message: form.message.trim() || undefined,
        ...readTrackingParams(),
      })
      setSubmitted(true)
      setForm(initialForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được yêu cầu. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ backgroundColor: '#f7f5f2' }}>
      <section className="px-6 pb-16 pt-40 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="font-sans text-xs uppercase tracking-widest text-black/40">Booking Request</span>
          <h1 className="mt-4 font-serif" style={{ fontSize: 'clamp(40px, 7vw, 82px)', lineHeight: 1.05 }}>{contact.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-black/60" style={{ lineHeight: '28px' }}>{contact.description}</p>
        </div>
      </section>

      <section className="px-6 pb-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-5">
          <aside className="lg:col-span-2">
            <div className="rounded-[28px] bg-white p-7 lg:p-8">
              <h2 className="font-serif text-3xl">Contact info</h2>
              <p className="mt-3 font-sans text-sm text-black/55" style={{ lineHeight: '24px' }}>
                Web chỉ nhận yêu cầu đặt phòng. Homestay sẽ liên hệ ngoài để xác nhận phòng trống và hoàn tất booking.
              </p>
              <div className="mt-8 space-y-5">
                <div className="flex gap-4">
                  <MapPin className="mt-0.5 shrink-0 text-black/45" size={18} />
                  <div><p className="font-medium">Address</p><p className="text-sm text-black/60">{brand.address}</p></div>
                </div>
                <div className="flex gap-4">
                  <Phone className="mt-0.5 shrink-0 text-black/45" size={18} />
                  <div><p className="font-medium">Phone</p><p className="text-sm text-black/60">{brand.phone}</p></div>
                </div>
                <div className="flex gap-4">
                  <Mail className="mt-0.5 shrink-0 text-black/45" size={18} />
                  <div><p className="font-medium">Email</p><p className="text-sm text-black/60">{brand.email}</p></div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="rounded-[28px] bg-white p-7 lg:p-10">
              {submitted ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f0ed]">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-serif text-3xl">{contact.successTitle || 'Request sent!'}</h3>
                  <p className="mt-3 max-w-md text-sm text-black/55" style={{ lineHeight: '24px' }}>{contact.successMessage}</p>
                  <button onClick={() => setSubmitted(false)} className="btn-pill mt-8 bg-[#111] text-xs uppercase tracking-wider text-white">
                    Send another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Họ và tên *">
                      <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Nguyễn Văn A" className="input-field" />
                    </Field>
                    <Field label="Số điện thoại *">
                      <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0983 393 954" className="input-field" />
                    </Field>
                  </div>

                  <Field label="Email">
                    <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@example.com" className="input-field" />
                  </Field>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Ngày check-in *">
                      <input type="date" min={minDate} value={form.check_in} onChange={(e) => update('check_in', e.target.value)} className="input-field" />
                    </Field>
                    <Field label="Ngày check-out *">
                      <input type="date" min={form.check_in || minDate} value={form.check_out} onChange={(e) => update('check_out', e.target.value)} className="input-field" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Số khách *">
                      <input type="number" min="1" value={form.guests} onChange={(e) => update('guests', e.target.value)} className="input-field" />
                    </Field>
                    <Field label="Phòng quan tâm">
                      <select value={form.room_id} onChange={(e) => update('room_id', e.target.value)} className="input-field">
                        <option value="">Chưa chọn phòng cụ thể</option>
                        {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Ghi chú / yêu cầu đặc biệt">
                    <textarea value={form.message} onChange={(e) => update('message', e.target.value)} rows={5} placeholder="Ví dụ: check-in sớm, đi cùng trẻ em, cần thuê xe..." className="input-field resize-none" />
                  </Field>

                  {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

                  <button disabled={submitting} type="submit" className="btn-pill flex w-full items-center justify-center gap-2 bg-[#111] py-4 text-sm font-medium uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-60">
                    <Send size={15} />
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu đặt phòng'}
                  </button>
                  <p className="text-center text-xs text-black/45">Homestay sẽ liên hệ lại để xác nhận tình trạng phòng và hoàn tất đặt phòng.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans text-xs uppercase tracking-wider text-black/50">{label}</span>
      {children}
    </label>
  )
}
