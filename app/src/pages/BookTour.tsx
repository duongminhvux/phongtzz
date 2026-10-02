import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Send } from 'lucide-react'
import { createTourBookingRequest, readTrackingParams } from '../lib/api'
import type { Tour, TourAddon, TourPage } from '../types/api'

type FormState = { full_name: string; email: string; whatsapp: string; start_date: string; tour_id: string; riding_option: string; guests: string; bus_transfer: string; addon_ids: string[]; dietary_requirements: string; notes: string }
const emptyForm: FormState = { full_name: '', email: '', whatsapp: '', start_date: '', tour_id: '', riding_option: '', guests: '1', bus_transfer: '', addon_ids: [], dietary_requirements: '', notes: '' }

function validate(form: FormState) {
  if (form.full_name.trim().length < 2) return 'Please enter your full name.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email.'
  if (!/^[0-9+()\-.\s]{8,25}$/.test(form.whatsapp.trim())) return 'Please enter a valid phone / WhatsApp number.'
  if (!form.start_date) return 'Please choose a tour start date.'
  if (!form.tour_id) return 'Please choose a tour package.'
  if (!form.riding_option) return 'Please choose a riding option.'
  if (!form.bus_transfer) return 'Please choose a bus transfer option.'
  if (Number(form.guests) < 1) return 'Number of guests must be at least 1.'
  return ''
}

export default function BookTour({ page, tours, addons }: { page: TourPage; tours: Tour[]; addons: TourAddon[] }) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState('')
  const minDate = useMemo(() => new Date().toISOString().split('T')[0], [])
  const selectedTour = tours.find((item) => item.id === form.tour_id)

  useEffect(() => {
    window.scrollTo(0, 0)
    const slug = new URLSearchParams(window.location.search).get('tour')
    const found = tours.find((item) => item.slug === slug)
    const fallback = found || tours[0]
    if (fallback) setForm((prev) => ({ ...prev, tour_id: fallback.id, riding_option: fallback.riding_options[0]?.value || '', bus_transfer: fallback.bus_options[0]?.value || '' }))
  }, [tours])

  const update = (key: keyof FormState, value: string | string[]) => { setForm((prev) => ({ ...prev, [key]: value })); setError('') }
  const selectTour = (id: string) => {
    const tour = tours.find((item) => item.id === id)
    setForm((prev) => ({ ...prev, tour_id: id, riding_option: tour?.riding_options[0]?.value || '', bus_transfer: tour?.bus_options[0]?.value || '' }))
    setError('')
  }
  const toggleAddon = (id: string) => update('addon_ids', form.addon_ids.includes(id) ? form.addon_ids.filter((item) => item !== id) : [...form.addon_ids, id])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const problem = validate(form); if (problem) { setError(problem); return }
    setSubmitting(true); setError('')
    try {
      const created = await createTourBookingRequest({ full_name: form.full_name.trim(), email: form.email.trim(), whatsapp: form.whatsapp.trim(), start_date: form.start_date, tour_id: form.tour_id, riding_option: form.riding_option, guests: Number(form.guests), bus_transfer: form.bus_transfer, addon_ids: form.addon_ids, dietary_requirements: form.dietary_requirements.trim() || undefined, notes: form.notes.trim() || undefined, ...readTrackingParams() })
      setReference(created.id)
      setSubmitted(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send your tour request.') }
    finally { setSubmitting(false) }
  }

  return <main style={{ backgroundColor: 'var(--page-bg, #f7f5f2)' }}>
    <section className="px-6 pb-14 pt-40 text-center"><div className="mx-auto max-w-3xl"><span className="text-xs uppercase tracking-widest text-black/40">Tour Booking Request</span><h1 className="mt-4 font-serif text-6xl">{page.bookingTitle || 'Book your Ha Giang Loop'}</h1><p className="mx-auto mt-5 max-w-2xl text-black/55 leading-7">{page.bookingDescription || 'Choose your tour and send a request. This is not an automatic confirmation — our team will contact you by email or WhatsApp to confirm availability and details.'}</p></div></section>
    <section className="px-6 pb-28"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start"><div className="rounded-[28px] bg-black p-7 text-white"><p className="text-xs uppercase tracking-widest text-white/45">Selected tour</p><h2 className="mt-3 font-serif text-4xl">{selectedTour?.name || 'Choose a package'}</h2>{selectedTour ? <><p className="mt-3 text-white/60">{selectedTour.duration_days} Days / {selectedTour.duration_nights} Nights · {selectedTour.currency === 'USD' ? `$${selectedTour.price}` : `${selectedTour.price} ${selectedTour.currency}`}</p><p className="mt-5 text-sm leading-6 text-white/60">{selectedTour.short_description}</p><div className="mt-6 space-y-2">{selectedTour.highlights.slice(0, 4).map((item) => <p key={item} className="text-sm text-white/75">✓ {item}</p>)}</div></> : null}</div></aside>
      <div className="rounded-[28px] bg-white p-7 lg:p-10">{submitted ? <div className="flex min-h-[560px] flex-col items-center justify-center text-center"><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f0ed]"><CheckCircle size={32} className="text-green-600" /></div><h2 className="font-serif text-4xl">Tour request received</h2><p className="mt-4 max-w-lg text-sm leading-6 text-black/55">Thanks! We received your request for {selectedTour?.name || 'the Ha Giang Loop'}. Our team will contact you by email or WhatsApp to confirm availability, pickup and final details.</p>{reference ? <p className="mt-4 rounded-full bg-[#f2f0ed] px-4 py-2 text-xs text-black/55">Reference: {reference}</p> : null}<button onClick={() => { const fallback = tours[0]; setSubmitted(false); setReference(''); setForm({ ...emptyForm, tour_id: fallback?.id || '', riding_option: fallback?.riding_options[0]?.value || '', bus_transfer: fallback?.bus_options[0]?.value || '' }) }} className="btn-pill mt-8 bg-black text-white">Send another request</button></div> : <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2"><Field label="Full Name *"><input className="input-field" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="John Smith" /></Field><Field label="Email *"><input className="input-field" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" /></Field></div>
        <div className="grid gap-5 md:grid-cols-2"><Field label="Phone / WhatsApp *"><input className="input-field" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+44 7700 900000" /></Field><Field label="Tour Start Date *"><input className="input-field" type="date" min={minDate} value={form.start_date} onChange={(e) => update('start_date', e.target.value)} /></Field></div>
        <div className="grid gap-5 md:grid-cols-2"><Field label="Select Tour Package *"><select className="input-field" value={form.tour_id} onChange={(e) => selectTour(e.target.value)}>{tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name} ({tour.duration_days}D{tour.duration_nights}N)</option>)}</select></Field><Field label="Number of Guests *"><input className="input-field" type="number" min="1" max="50" value={form.guests} onChange={(e) => update('guests', e.target.value)} /></Field></div>
        <Field label="Riding Option *"><div className="grid gap-3 md:grid-cols-2">{(selectedTour?.riding_options || []).map((option) => <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 ${form.riding_option === option.value ? 'border-black bg-black text-white' : 'border-black/10'}`}><div className="flex items-center gap-2"><input type="radio" name="riding" checked={form.riding_option === option.value} onChange={() => update('riding_option', option.value)} /><span className="font-medium">{option.label}</span>{option.recommended ? <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">Recommended</span> : null}</div><p className={`mt-2 text-xs leading-5 ${form.riding_option === option.value ? 'text-white/65' : 'text-black/50'}`}>{option.description}</p></label>)}</div></Field>
        <Field label="Bus Transfer from Hanoi *"><div className="space-y-2">{(selectedTour?.bus_options || []).map((option) => <label key={option.value} className="flex cursor-pointer gap-3 rounded-2xl border border-black/10 p-4"><input type="radio" name="bus" checked={form.bus_transfer === option.value} onChange={() => update('bus_transfer', option.value)} /><div><p className="font-medium">{option.label}</p><p className="mt-1 text-xs text-black/50">{option.description}</p></div></label>)}</div></Field>
        {addons.length ? <Field label="Add-ons / Upgrades"><div className="space-y-2">{addons.map((addon) => <label key={addon.id} className="flex cursor-pointer gap-3 rounded-2xl border border-black/10 p-4"><input type="checkbox" checked={form.addon_ids.includes(addon.id)} onChange={() => toggleAddon(addon.id)} /><div><p className="font-medium">{addon.name}{addon.price ? <span className="ml-2 text-sm text-black/45">+{addon.currency === 'VND' ? new Intl.NumberFormat('vi-VN').format(addon.price) : addon.price} {addon.currency} {addon.unit_label || ''}</span> : null}</p><p className="mt-1 text-xs text-black/50">{addon.description}</p></div></label>)}</div></Field> : null}
        <Field label="Dietary Requirements"><textarea rows={3} className="input-field resize-none" value={form.dietary_requirements} onChange={(e) => update('dietary_requirements', e.target.value)} placeholder="Vegetarian, vegan, allergies..." /></Field>
        <Field label="Notes / Special Requests"><textarea rows={4} className="input-field resize-none" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Anything our team should know?" /></Field>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <button disabled={submitting} type="submit" className="btn-pill flex w-full items-center justify-center gap-2 bg-black py-4 text-sm uppercase tracking-wider text-white disabled:opacity-50"><Send size={15} />{submitting ? 'Sending...' : 'Send Tour Booking Request'}</button><p className="text-center text-xs text-black/40">We will confirm the booking manually by email or WhatsApp.</p>
      </form>}</div>
    </div></section>
  </main>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs uppercase tracking-wider text-black/50">{label}</span>{children}</label> }
