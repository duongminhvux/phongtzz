import { useEffect } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Check, Clock, ShieldCheck, Star } from 'lucide-react'
import { mediaUrl } from '../lib/media'
import { mediaFrameClassName, mediaFrameStyle, mediaObjectStyle } from '../lib/landingDisplay'
import type { Tour, TourAddon, TourPage } from '../types/api'

function priceLabel(value: number, currency: string) {
  return currency === 'USD' ? `$${value}` : `${new Intl.NumberFormat('vi-VN').format(value)} ${currency}`
}

export default function Tours({ page, tours, addons }: { page: TourPage; tours: Tour[]; addons: TourAddon[] }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const hero = mediaUrl(page.heroImage)
  const showcase = page.showcaseImage || (page.gallery || [])[0] || null
  const activeTours = [...tours].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <main style={{ backgroundColor: 'var(--page-bg, #f7f5f2)' }}>
      <section className="relative flex min-h-[82vh] items-end overflow-hidden px-6 pb-16 pt-32 text-white md:pb-24">
        {hero ? <img src={hero} alt={page.heroTitle || 'Ha Giang Loop'} className="absolute inset-0 h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <span className="text-xs uppercase tracking-[0.26em] text-white/70">{page.eyebrow}</span>
          <h1 className="mt-4 max-w-5xl font-serif" style={{ fontSize: 'clamp(48px, 8vw, 104px)', lineHeight: .95 }}>{page.heroTitle}</h1>
          <p className="mt-5 text-lg font-medium uppercase tracking-[0.18em] text-white/90">{page.heroSlogan}</p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 md:text-lg">{page.heroDescription}</p>
          <a href="#packages" className="btn-pill mt-9 bg-white text-black">Explore packages <ArrowRight size={16} className="ml-2" /></a>
        </div>
      </section>

      <section id="packages" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-widest text-black/40">Tour packages</span>
            <h2 className="mt-3 font-serif text-5xl md:text-6xl">{page.packagesTitle}</h2>
            <p className="mt-5 max-w-2xl text-black/55 leading-7">{page.packagesDescription}</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {activeTours.map((tour) => {
              const cover = tour.media.find((item) => item.role === 'hero') || tour.media[0]
              return <article key={tour.id} className={`overflow-hidden rounded-[28px] bg-white ${tour.is_featured ? 'ring-2 ring-black' : ''}`}>
                <div className="relative aspect-[3/2] bg-black/5">
                  {cover ? <img src={cover.url} alt={cover.alt || tour.name} className="h-full w-full object-cover" /> : null}
                  {tour.is_featured ? <span className="absolute left-4 top-4 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">Most popular</span> : null}
                </div>
                <div className="p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-xs uppercase tracking-widest text-black/40">{tour.duration_days} Days / {tour.duration_nights} Nights</p><h3 className="mt-2 font-serif text-3xl">{tour.name}</h3></div>
                    <p className="font-serif text-3xl">{priceLabel(tour.price, tour.currency)}</p>
                  </div>
                  <p className="mt-4 min-h-20 text-sm leading-6 text-black/55">{tour.short_description}</p>
                  <ul className="mt-5 space-y-2">{tour.highlights.slice(0, 4).map((item) => <li key={item} className="flex gap-2 text-sm text-black/70"><Check size={16} className="mt-0.5 shrink-0" />{item}</li>)}</ul>
                  <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link to={`/tours/${tour.slug}`} className="btn-pill border border-black/15 text-center text-xs uppercase tracking-wider">View Full Itinerary</Link>
                    <Link to={`/contact?tour=${tour.slug}`} className="btn-pill bg-black text-center text-xs uppercase tracking-wider text-white">Book This Tour</Link>
                  </div>
                </div>
              </article>
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#111] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div><span className="text-xs uppercase tracking-widest text-white/45">Simple logistics</span><h2 className="mt-3 max-w-xl font-serif text-5xl">{page.includedTitle}</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{(page.includedItems || []).map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-white/10 p-4 text-sm text-white/75"><Check size={18} className="shrink-0 text-white" />{item}</div>)}</div>
          </div>
          {addons.length ? <div className="mt-10 rounded-2xl bg-white/5 p-5 text-sm text-white/60"><strong className="text-white">Optional upgrades:</strong> {addons.map((addon) => `${addon.name}${addon.price ? ` (${priceLabel(addon.price, addon.currency)} ${addon.unit_label || ''})` : ''}`).join(' · ')}</div> : null}
        </div>
      </section>

      <section className="px-6 py-24"><div className="mx-auto max-w-7xl"><h2 className="font-serif text-5xl">{page.whyTitle}</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{(page.whyItems || []).map((item, index) => <div key={item.title} className="rounded-[26px] bg-white p-7"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">{index === 0 ? <ShieldCheck size={20} /> : index === 1 ? <Clock size={20} /> : <Star size={20} />}</div><h3 className="font-serif text-2xl">{item.title}</h3><p className="mt-3 text-sm leading-6 text-black/55">{item.description}</p></div>)}</div></div></section>

      {showcase ? <section className="px-6 pb-24"><div className="mx-auto max-w-7xl"><h2 className="font-serif text-5xl">{page.galleryTitle}</h2><div className="mt-10"><div className={mediaFrameClassName(page.showcaseDisplay, 'overflow-hidden')} style={{ ...mediaFrameStyle(page.showcaseDisplay), borderRadius: 24 }}><img src={mediaUrl(showcase)} alt={showcase.alt || page.galleryTitle || 'Ha Giang Loop'} className="h-full w-full object-cover" style={mediaObjectStyle(page.showcaseDisplay)} /></div></div></div></section> : null}

      <section className="px-6 pb-24"><div className="mx-auto max-w-7xl"><h2 className="font-serif text-5xl">{page.reviewsTitle}</h2><div className="mt-10 grid gap-5 md:grid-cols-2">{(page.reviews || []).map((review) => <blockquote key={`${review.name}-${review.country}`} className="rounded-[26px] bg-white p-7"><div className="flex gap-1">{Array.from({ length: review.rating || 5 }).map((_, i) => <Star key={i} size={15} fill="currentColor" />)}</div><p className="mt-5 font-serif text-2xl leading-9">“{review.text}”</p><footer className="mt-5 text-sm text-black/50">{review.name}{review.country ? ` · ${review.country}` : ''}</footer></blockquote>)}</div></div></section>

      <section className="px-6 pb-24"><div className="mx-auto max-w-4xl"><h2 className="text-center font-serif text-5xl">{page.faqTitle}</h2><div className="mt-10 space-y-3">{(page.faq || []).map((item) => <details key={item.question} className="group rounded-2xl bg-white p-5"><summary className="cursor-pointer list-none font-medium">{item.question}</summary><p className="mt-4 text-sm leading-6 text-black/60">{item.answer}</p></details>)}</div></div></section>

      <section className="px-6 pb-28"><div className="mx-auto max-w-7xl rounded-[32px] bg-black px-7 py-14 text-center text-white md:px-12"><h2 className="font-serif text-5xl">{page.bookingTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-white/60">{page.bookingDescription}</p><Link to="/contact" className="btn-pill mt-8 bg-white text-black">{page.bookingButtonText || 'Book a Tour'}</Link></div></section>
    </main>
  )
}
