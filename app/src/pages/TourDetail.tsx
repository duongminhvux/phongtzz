import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { ArrowLeft, Check, MapPin, X } from 'lucide-react'
import type { Tour } from '../types/api'

function priceLabel(value: number, currency: string) { return currency === 'USD' ? `$${value}` : `${new Intl.NumberFormat('vi-VN').format(value)} ${currency}` }

export default function TourDetail({ tours }: { tours: Tour[] }) {
  const { slug } = useParams()
  const tour = tours.find((item) => item.slug === slug)
  useEffect(() => { window.scrollTo(0, 0) }, [slug])
  if (!tour) return <Navigate to="/tours" replace />
  const hero = tour.media.find((item) => item.role === 'hero') || tour.media[0]
  const gallery = tour.media.filter((item) => item.role === 'gallery')

  return <main style={{ backgroundColor: 'var(--page-bg, #f7f5f2)' }}>
    <section className="relative flex min-h-[72vh] items-end overflow-hidden px-6 pb-14 pt-32 text-white">
      {hero ? <img src={hero.url} alt={hero.alt || tour.name} className="absolute inset-0 h-full w-full object-cover" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      <div className="relative z-10 mx-auto w-full max-w-7xl"><Link to="/tours" className="inline-flex items-center gap-2 text-sm text-white/70"><ArrowLeft size={16} />All tours</Link><p className="mt-8 text-xs uppercase tracking-[0.22em] text-white/65">{tour.duration_days} Days / {tour.duration_nights} Nights · from {priceLabel(tour.price, tour.currency)}</p><h1 className="mt-3 max-w-5xl font-serif text-6xl md:text-8xl">{tour.name}</h1><p className="mt-4 text-xl text-white/80">{tour.tagline}</p><p className="mt-6 max-w-2xl leading-7 text-white/70">{tour.description}</p><Link to={`/contact?tour=${tour.slug}`} className="btn-pill mt-8 bg-white text-black">Book This Tour</Link></div>
    </section>

    <section className="px-6 py-10"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_.8fr]"><div><span className="text-xs uppercase tracking-widest text-black/40">Route highlights</span><h2 className="mt-3 font-serif text-5xl">What you’ll experience</h2><div className="mt-8 grid gap-3 sm:grid-cols-2">{tour.highlights.map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm"><MapPin size={17} />{item}</div>)}</div></div><aside className="rounded-[28px] bg-white p-7"><p className="text-xs uppercase tracking-widest text-black/40">Package</p><div className="mt-3 flex items-end justify-between"><div><p className="font-serif text-4xl">{priceLabel(tour.price, tour.currency)}</p><p className="mt-1 text-sm text-black/45">per guest · booking request</p></div><p className="text-sm font-medium">{tour.duration_days}D{tour.duration_nights}N</p></div><Link to={`/contact?tour=${tour.slug}`} className="btn-pill mt-7 w-full bg-black text-white">Request this tour</Link></aside></div></section>

    <section className="bg-white px-6 py-10"><div className="mx-auto max-w-5xl"><span className="text-xs uppercase tracking-widest text-black/40">Day by day</span><h2 className="mt-3 font-serif text-5xl">Full itinerary</h2><div className="mt-10 space-y-3">{tour.itinerary.map((day) => <details key={day.id || day.day_number} className="group rounded-2xl border p-5" open={day.day_number === 1}><summary className="cursor-pointer list-none"><div className="flex items-center justify-between gap-4"><div><span className="text-xs uppercase tracking-widest text-black/40">Day {day.day_number}</span><h3 className="mt-1 font-serif text-2xl">{day.title}</h3></div><span className="text-2xl text-black/30">+</span></div></summary><p className="mt-5 text-sm leading-7 text-black/60">{day.description}</p><div className="mt-4 flex flex-wrap gap-2">{day.stops.map((stop) => <span key={stop} className="rounded-full bg-[#f3f1ee] px-3 py-1 text-xs">{stop}</span>)}</div></details>)}</div></div></section>

    <section className="px-6 py-10"><div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2"><div className="rounded-[28px] bg-[#111] p-7 text-white"><h2 className="font-serif text-4xl">Included</h2><ul className="mt-6 space-y-3">{tour.inclusions.map((item) => <li key={item} className="flex gap-3 text-sm text-white/75"><Check size={17} className="shrink-0 text-white" />{item}</li>)}</ul></div><div className="rounded-[28px] bg-white p-7"><h2 className="font-serif text-4xl">Not included</h2><ul className="mt-6 space-y-3">{tour.exclusions.map((item) => <li key={item} className="flex gap-3 text-sm text-black/55"><X size={17} className="shrink-0" />{item}</li>)}</ul></div></div></section>

    <section className="px-6 pb-20"><div className="mx-auto max-w-7xl"><h2 className="font-serif text-5xl">Riding options</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{tour.riding_options.map((option) => <div key={option.value} className="rounded-2xl bg-white p-6"><div className="flex items-center justify-between"><h3 className="font-serif text-2xl">{option.label}</h3>{option.recommended ? <span className="rounded-full bg-black px-3 py-1 text-xs text-white">Recommended</span> : null}</div><p className="mt-3 text-sm leading-6 text-black/55">{option.description}</p></div>)}</div></div></section>

    {gallery.length ? <section className="px-6 pb-20"><div className="mx-auto max-w-7xl"><h2 className="font-serif text-5xl">Tour gallery</h2><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">{gallery.map((item, index) => <img key={item.asset_id || `${item.url}-${index}`} src={item.url} alt={item.alt || tour.name} className="aspect-[3/2] w-full rounded-2xl object-cover" />)}</div></div></section> : null}

    {tour.faq.length ? <section className="px-6 pb-20"><div className="mx-auto max-w-4xl"><h2 className="font-serif text-5xl">Questions about this tour</h2><div className="mt-8 space-y-3">{tour.faq.map((item) => <details key={item.question} className="rounded-2xl bg-white p-5"><summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-4 text-sm leading-6 text-black/55">{item.answer}</p></details>)}</div></div></section> : null}

    <section className="px-6 pb-28"><div className="mx-auto max-w-7xl rounded-[32px] bg-black px-8 py-14 text-center text-white"><h2 className="font-serif text-5xl">Ready for {tour.name}?</h2><p className="mx-auto mt-4 max-w-xl text-white/60">Send a booking request and our team will confirm the date and logistics with you by email or WhatsApp.</p><Link to={`/contact?tour=${tour.slug}`} className="btn-pill mt-8 bg-white text-black">Book This Tour</Link></div></section>
  </main>
}
