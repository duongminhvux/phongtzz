import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Mail, MapPin, Phone, Send } from 'lucide-react'
import { createBookingRequest, readTrackingParams } from '../lib/api'
import type { LandingPage, Room, Tour, TourAddon } from '../types/api'

type FormState = {
  full_name: string
  phone: string
  email: string
  check_in: string
  check_out: string
  guests: string
  room_id: string
  message: string
  tour_id: string
  tour_start_date: string
  riding_option: string
  bus_transfer: string
  addon_ids: string[]
  dietary_requirements: string
}

const initialForm: FormState = {
  full_name: '', phone: '', email: '', check_in: '', check_out: '', guests: '1', room_id: '', message: '',
  tour_id: '', tour_start_date: '', riding_option: '', bus_transfer: '', addon_ids: [], dietary_requirements: '',
}

function validateForm(form: FormState) {
  if (form.full_name.trim().length < 2) return 'Please enter your full name.'
  if (!/^[0-9+()\-.\s]{8,25}$/.test(form.phone.trim())) return 'Please enter a valid phone / WhatsApp number.'
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email address.'
  if (!form.check_in) return 'Please choose a check-in date.'
  if (!form.check_out) return 'Please choose a check-out date.'
  if (new Date(form.check_out) <= new Date(form.check_in)) return 'Check-out must be after check-in.'
  if (Number(form.guests) < 1) return 'Number of guests must be at least 1.'
  if (form.tour_id) {
    if (!form.email) return 'Email is required when adding a tour.'
    if (!form.tour_start_date) return 'Please choose a tour start date.'
    if (!form.riding_option) return 'Please choose a riding option.'
    if (!form.bus_transfer) return 'Please choose a bus transfer option.'
  }
  if (form.message.length > 1000) return 'Notes are limited to 1000 characters.'
  return ''
}

export default function Contact({ landing, rooms, tours, addons }: { landing: LandingPage; rooms: Room[]; tours: Tour[]; addons: TourAddon[] }) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const minDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    window.scrollTo(0, 0)
    const params = new URLSearchParams(window.location.search)
    const roomId = params.get('roomId')
    const tourSlug = params.get('tour')
    const selectedTour = tours.find((tour) => tour.slug === tourSlug)
    setForm((prev) => ({
      ...prev,
      room_id: roomId && rooms.some((room) => room.id === roomId) ? roomId : prev.room_id,
      tour_id: selectedTour?.id || prev.tour_id,
      riding_option: selectedTour?.riding_options?.[0]?.value || prev.riding_option,
      bus_transfer: selectedTour?.bus_options?.[0]?.value || prev.bus_transfer,
    }))
  }, [rooms, tours])

  const brand = (landing.brand || {}) as Record<string, any>
  const contact = (landing.contact || {}) as Record<string, any>
  const selectedTour = tours.find((tour) => tour.id === form.tour_id)

  const update = (key: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const changeTour = (tourId: string) => {
    const tour = tours.find((item) => item.id === tourId)
    setForm((prev) => ({
      ...prev,
      tour_id: tourId,
      tour_start_date: tourId ? prev.tour_start_date : '',
      riding_option: tour?.riding_options?.[0]?.value || '',
      bus_transfer: tour?.bus_options?.[0]?.value || '',
      addon_ids: tourId ? prev.addon_ids : [],
      dietary_requirements: tourId ? prev.dietary_requirements : '',
    }))
    setError('')
  }

  const toggleAddon = (id: string) => update('addon_ids', form.addon_ids.includes(id) ? form.addon_ids.filter((item) => item !== id) : [...form.addon_ids, id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validateForm(form)
    if (validationError) { setError(validationError); return }
    setSubmitting(true); setError('')
    try {
      await createBookingRequest({
        full_name: form.full_name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined,
        check_in: form.check_in, check_out: form.check_out, guests: Number(form.guests), room_id: form.room_id || undefined,
        message: form.message.trim() || undefined,
        tour_id: form.tour_id || undefined,
        tour_start_date: form.tour_id ? form.tour_start_date : undefined,
        riding_option: form.tour_id ? form.riding_option : undefined,
        bus_transfer: form.tour_id ? form.bus_transfer : undefined,
        addon_ids: form.tour_id ? form.addon_ids : [],
        dietary_requirements: form.tour_id ? (form.dietary_requirements.trim() || undefined) : undefined,
        ...readTrackingParams(),
      })
      setSubmitted(true)
      setForm(initialForm)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send your request. Please try again.') }
    finally { setSubmitting(false) }
  }

  return <main style={{ backgroundColor: 'var(--page-bg, #f7f5f2)' }}>
    <section className="px-6 pb-16 pt-40 text-center"><div className="mx-auto max-w-3xl"><span className="font-sans text-xs uppercase tracking-widest text-black/40">{contact.eyebrow || 'Booking Request'}</span><h1 className="mt-4 font-serif" style={{ fontSize: 'clamp(40px, 7vw, 82px)', lineHeight: 1.05 }}>{contact.title}</h1><p className="mx-auto mt-5 max-w-2xl font-sans text-black/60" style={{ lineHeight: '28px' }}>{contact.description}</p></div></section>
    <section className="px-6 pb-28"><div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-5">
      <aside className="lg:col-span-2"><div className="rounded-[28px] bg-white p-7 lg:p-8"><h2 className="font-serif text-3xl">{contact.infoTitle}</h2><p className="mt-3 font-sans text-sm text-black/55" style={{ lineHeight: '24px' }}>{contact.infoDescription}</p><div className="mt-8 space-y-5"><div className="flex gap-4"><MapPin className="mt-0.5 shrink-0 text-black/45" size={18} /><div><p className="font-medium">{contact.addressLabel}</p><p className="text-sm text-black/60">{brand.address}</p></div></div><div className="flex gap-4"><Phone className="mt-0.5 shrink-0 text-black/45" size={18} /><div><p className="font-medium">{contact.phoneLabel}</p><p className="text-sm text-black/60">{brand.phone}</p></div></div><div className="flex gap-4"><Mail className="mt-0.5 shrink-0 text-black/45" size={18} /><div><p className="font-medium">{contact.emailLabel}</p><p className="text-sm text-black/60">{brand.email}</p></div></div></div></div></aside>
      <div className="lg:col-span-3"><div className="rounded-[28px] bg-white p-7 lg:p-10">{submitted ? <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f0ed]"><CheckCircle size={32} className="text-green-600" /></div><h3 className="font-serif text-3xl">{contact.successTitle}</h3><p className="mt-3 max-w-md text-sm text-black/55" style={{ lineHeight: '24px' }}>{contact.successMessage}</p><button onClick={() => setSubmitted(false)} className="btn-pill mt-8 text-xs uppercase tracking-wider text-white" style={{ backgroundColor: 'var(--primary-color, #111)' }}>{contact.sendAnotherText}</button></div> : <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Full Name *"><input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="John Smith" className="input-field" /></Field><Field label="Phone / WhatsApp *"><input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+44 7700 900000" className="input-field" /></Field></div>
        <Field label={form.tour_id ? 'Email *' : 'Email'}><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" className="input-field" /></Field>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Check-in *"><input type="date" min={minDate} value={form.check_in} onChange={(e) => update('check_in', e.target.value)} className="input-field" /></Field><Field label="Check-out *"><input type="date" min={form.check_in || minDate} value={form.check_out} onChange={(e) => update('check_out', e.target.value)} className="input-field" /></Field></div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Number of Guests *"><input type="number" min="1" value={form.guests} onChange={(e) => update('guests', e.target.value)} className="input-field" /></Field><Field label="Room"><select value={form.room_id} onChange={(e) => update('room_id', e.target.value)} className="input-field"><option value="">No specific room selected</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field></div>

        <div className="rounded-2xl border border-black/10 bg-[#faf9f7] p-5"><div className="mb-4"><p className="text-xs uppercase tracking-widest text-black/40">Optional</p><h3 className="mt-1 font-serif text-2xl">Add a Ha Giang Loop tour</h3><p className="mt-1 text-sm text-black/50">You can book a room without a tour. Choose a package only if you want the tour included in the same request.</p></div><Field label="Tour Package"><select value={form.tour_id} onChange={(e) => changeTour(e.target.value)} className="input-field"><option value="">No tour — room request only</option>{tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name} ({tour.duration_days}D{tour.duration_nights}N · {tour.currency === 'USD' ? `$${tour.price}` : `${tour.price} ${tour.currency}`})</option>)}</select></Field>
          {selectedTour ? <div className="mt-5 space-y-5"><div className="grid gap-5 md:grid-cols-2"><Field label="Tour Start Date *"><input type="date" min={minDate} value={form.tour_start_date} onChange={(e) => update('tour_start_date', e.target.value)} className="input-field" /></Field><Field label="Riding Option *"><select value={form.riding_option} onChange={(e) => update('riding_option', e.target.value)} className="input-field">{selectedTour.riding_options.map((option) => <option key={option.value} value={option.value}>{option.label}{option.recommended ? ' — Recommended' : ''}</option>)}</select></Field></div><Field label="Bus Transfer from Hanoi *"><select value={form.bus_transfer} onChange={(e) => update('bus_transfer', e.target.value)} className="input-field">{selectedTour.bus_options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>{addons.length ? <Field label="Add-ons / Upgrades"><div className="space-y-2">{addons.map((addon) => <label key={addon.id} className="flex cursor-pointer gap-3 rounded-xl border border-black/10 bg-white p-3"><input type="checkbox" checked={form.addon_ids.includes(addon.id)} onChange={() => toggleAddon(addon.id)} /><div><p className="text-sm font-medium">{addon.name}{addon.price ? <span className="ml-2 text-xs text-black/45">+{addon.currency === 'VND' ? new Intl.NumberFormat('vi-VN').format(addon.price) : addon.price} {addon.currency} {addon.unit_label || ''}</span> : null}</p><p className="mt-1 text-xs text-black/50">{addon.description}</p></div></label>)}</div></Field> : null}<Field label="Dietary Requirements"><textarea rows={3} className="input-field resize-none" value={form.dietary_requirements} onChange={(e) => update('dietary_requirements', e.target.value)} placeholder="Vegetarian, vegan, food allergies..." /></Field></div> : null}
        </div>

        <Field label="Notes / Special Requests"><textarea value={form.message} onChange={(e) => update('message', e.target.value)} rows={5} placeholder="Early check-in, children, transport, anything else..." className="input-field resize-none" /></Field>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <button disabled={submitting} type="submit" className="btn-pill flex w-full items-center justify-center gap-2 py-4 text-sm font-medium uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: 'var(--primary-color, #111)' }}><Send size={15} />{submitting ? contact.submittingText : contact.submitText}</button><p className="text-center text-xs text-black/45">{contact.submitNote}</p>
      </form>}</div></div>
    </div></section>
  </main>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block font-sans text-xs uppercase tracking-wider text-black/50">{label}</span>{children}</label> }
