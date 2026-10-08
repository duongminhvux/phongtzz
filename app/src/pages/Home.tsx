import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Bed, Check, MapPin, Star, Users } from 'lucide-react'
import { asMedia, mediaUrl, normalizeMediaList } from '../lib/media'
import { mediaFrameClassName, mediaFrameStyle, mediaObjectStyle, normalizeLandingMediaDisplay } from '../lib/landingDisplay'
import type { LandingPage, LandingSection, Room } from '../types/api'

const formatPrice = (price: number | null | undefined, labels: Record<string, any>) => {
  if (!price) return labels.contactPriceText || ''
  const suffix = labels.priceSuffix ? ` ${labels.priceSuffix}` : ''
  return `${new Intl.NumberFormat('vi-VN').format(price)}${suffix}`
}

export default function Home({ landing, rooms }: { landing: LandingPage; rooms: Room[] }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const sections = useMemo(() => (landing.sections || []).filter((section) => section.enabled !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), [landing])
  const theme = (landing.theme || {}) as Record<string, any>
  const roomLabels = (landing.roomsPage || {}) as Record<string, any>

  return (
    <main style={{ backgroundColor: theme.backgroundColor || '#f7f5f2' }}>
      {sections.map((section) => <LandingSectionRenderer key={section.id} section={section} rooms={rooms} roomLabels={roomLabels} />)}
    </main>
  )
}

function LandingSectionRenderer({ section, rooms, roomLabels }: { section: LandingSection; rooms: Room[]; roomLabels: Record<string, any> }) {
  switch (section.type) {
    case 'hero': return <HeroSection section={section} />
    case 'welcome': return <WelcomeSection section={section} />
    case 'experiences': return <ExperiencesSection section={section} />
    case 'rooms': return <RoomsPreviewSection section={section} rooms={rooms} labels={roomLabels} />
    case 'amenities': return <AmenitiesSection section={section} />
    case 'testimonials': return <TestimonialsSection section={section} />
    case 'gallery': return <GallerySection section={section} />
    case 'banner': return <BannerSection section={section} />
    case 'cta': return <CtaSection section={section} />
    default: return null
  }
}

function HeroSection({ section }: { section: LandingSection }) {
  const video = asMedia(section.video, 'video')
  const image = asMedia(section.image)
  const objectStyle = mediaObjectStyle(section.mediaDisplay)
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {video?.url ? (
        <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" style={objectStyle}>
          <source src={video.url} type="video/mp4" />
        </video>
      ) : image?.url ? (
        <img src={image.url} alt={section.title} className="absolute inset-0 h-full w-full object-cover" style={objectStyle} />
      ) : null}
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 max-w-4xl text-center text-white">
        <h1 className="font-serif font-medium" style={{ fontSize: 'clamp(46px, 8vw, 100px)', lineHeight: 1.04 }}>{section.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl font-sans text-white/85" style={{ fontSize: 17, lineHeight: '29px' }}>{section.subtitle}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          {section.primaryButtonText ? <Link to={section.primaryButtonLink || '/rooms'} className="btn-pill text-xs uppercase tracking-widest text-white bg-white/20 backdrop-blur-md border border-white/30">{section.primaryButtonText}</Link> : null}
          {section.secondaryButtonText ? <Link to={section.secondaryButtonLink || '/contact'} className="btn-pill text-xs uppercase tracking-widest bg-white text-black">{section.secondaryButtonText}</Link> : null}
        </div>
      </div>
    </section>
  )
}

function WelcomeSection({ section }: { section: LandingSection }) {
  const images = normalizeMediaList(section.images)
  const paragraphs = Array.isArray(section.paragraphs) ? section.paragraphs : String(section.description || '').split('\n').filter(Boolean)
  const display = normalizeLandingMediaDisplay(section.mediaDisplay)
  const showcase = display.displayMode !== 'container'
  return (
    <section className="py-8 lg:py-8 px-6">
      <div className={`max-w-7xl mx-auto grid grid-cols-1 gap-14 items-center ${showcase ? 'lg:gap-12' : 'lg:grid-cols-2 lg:gap-12'}`}>
        <div className={showcase ? 'w-full' : ''}>
          {images[0] ? <div className={mediaFrameClassName(section.mediaDisplay, 'overflow-hidden')} style={{ ...mediaFrameStyle(section.mediaDisplay), borderRadius: 24 }}>
            <img src={images[0].url} alt={images[0].alt || section.title} className="h-full w-full object-cover" style={mediaObjectStyle(section.mediaDisplay)} />
          </div> : null}
        </div>
        <div className={showcase ? 'mx-auto w-full max-w-3xl' : ''}>
          <span className="font-sans text-xs uppercase tracking-widest text-black/40">{section.eyebrow}</span>
          <h2 className="font-serif mt-4" style={{ fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08 }}>{section.title}</h2>
          <div className="mt-7 space-y-4">
            {paragraphs.map((paragraph: string) => <p key={paragraph} className="font-sans text-black/65" style={{ fontSize: 16, lineHeight: '28px' }}>{paragraph}</p>)}
          </div>
        </div>
      </div>
    </section>
  )
}

function ExperiencesSection({ section }: { section: LandingSection }) {
  return (
    <section className="py-8 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-serif" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
          <p className="mt-4 font-sans text-black/60" style={{ lineHeight: '27px' }}>{section.description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(section.items || []).map((item: any, idx: number) => {
            const image = asMedia(item.image)
            return (
              <article key={`${item.title}-${idx}`} className="group">
                {image?.url ? <div className={mediaFrameClassName(item.imageDisplay, "overflow-hidden mb-5")} style={{ ...mediaFrameStyle(item.imageDisplay), borderRadius: 22 }}><img src={image.url} alt={item.title} className="h-full w-full object-cover  " style={mediaObjectStyle(item.imageDisplay)} /></div> : null}
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 font-sans text-sm text-black/60" style={{ lineHeight: '24px' }}>{item.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function RoomsPreviewSection({ section, rooms, labels }: { section: LandingSection; rooms: Room[]; labels: Record<string, any> }) {
  const selectedIds = Array.isArray(section.roomIds) ? section.roomIds : []
  const visibleRooms = (selectedIds.length ? rooms.filter((room) => selectedIds.includes(room.id)) : rooms).slice(0, Number(section.limit || 3))
  return (
    <section className="py-8 lg:py-8 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <h2 className="font-serif" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
            <p className="mt-4 max-w-xl font-sans text-black/60" style={{ lineHeight: '27px' }}>{section.description}</p>
          </div>
          <Link to={section.buttonLink || '/rooms'} className="inline-flex items-center gap-2 font-sans text-sm font-medium group">
            {section.buttonText}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {visibleRooms.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {visibleRooms.map((room) => (
              <Link key={room.id} to={`/rooms?room=${room.slug}`} className="group block">
                <div className="relative overflow-hidden mb-5" style={{ borderRadius: 22, aspectRatio: '3 / 2' }}>
                  {mediaUrl(room.images?.[0]) ? (
                    <img src={mediaUrl(room.images?.[0])} alt={room.name} className="h-full w-full object-cover " />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#eee9e2] text-sm text-black/40">{labels.emptyImageText || ''}</div>
                  )}
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium backdrop-blur">{formatPrice(room.price, labels)}</span>
                </div>
                <h3 className="font-serif text-2xl">{room.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-black/50">
                  <span className="flex items-center gap-1"><Users size={14} /> {room.capacity || 1} {labels.guestsSuffix || ''}</span>
                  <span className="flex items-center gap-1"><Bed size={14} /> {room.bed_type || `${room.beds || 1} ${labels.bedFallback || ''}`.trim()}</span>
                </div>
                <p className="mt-3 font-sans text-sm text-black/60" style={{ lineHeight: '24px' }}>{room.description}</p>
              </Link>
            ))}
          </div>
        ) : <p className="rounded-3xl bg-[#f7f5f2] p-8 text-center text-sm text-black/55">{labels.noRoomsText || ''}</p>}
      </div>
    </section>
  )
}

function AmenitiesSection({ section }: { section: LandingSection }) {
  return (
    <section className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-center mb-14" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(section.items || []).map((item: any, index: number) => (
            <div key={`${item.title}-${index}`} className="rounded-3xl bg-white p-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f0ed]"><Check size={17} /></div>
              <h3 className="font-serif text-xl">{item.title}</h3>
              <p className="mt-3 font-sans text-sm text-black/60" style={{ lineHeight: '24px' }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection({ section }: { section: LandingSection }) {
  return (
    <section className="py-8 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-center mb-14" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(section.items || []).map((item: any, index: number) => (
            <div key={`${item.name}-${index}`} className="rounded-3xl bg-[#f7f5f2] p-8">
              <div className="mb-4 flex items-center gap-1">{Array.from({ length: Number(item.rating || 5) }).map((_, idx) => <Star key={idx} size={15} fill="#f59e0b" color="#f59e0b" />)}</div>
              <p className="font-sans text-black/70" style={{ lineHeight: '27px' }}>&ldquo;{item.text}&rdquo;</p>
              <p className="mt-6 font-serif text-lg">{item.name}</p>
              <p className="font-sans text-xs uppercase tracking-wider text-black/40">{item.country}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ section }: { section: LandingSection }) {
  const image = normalizeMediaList(section.images)[0]
  return (
    <section className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif mb-10" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
        {image ? <div className={mediaFrameClassName(section.mediaDisplay, "overflow-hidden")} style={{ ...mediaFrameStyle(section.mediaDisplay), borderRadius: 24 }}>
          <img src={image.url} alt={image.alt || section.title} className="h-full w-full object-cover" style={mediaObjectStyle(section.mediaDisplay)} />
        </div> : null}
      </div>
    </section>
  )
}

function BannerSection({ section }: { section: LandingSection }) {
  const image = asMedia(section.image)
  return (
    <section className="px-6 py-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-black px-8 py-20 text-white md:px-16">
        {image?.url ? <img src={image.url} alt={section.title} className="absolute inset-0 h-full w-full object-cover opacity-45" style={mediaObjectStyle(section.mediaDisplay)} /> : null}
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 66px)', lineHeight: 1.05 }}>{section.title}</h2>
          <p className="mt-4 text-white/80" style={{ lineHeight: '28px' }}>{section.description || section.subtitle}</p>
          {section.buttonText ? <Link to={section.buttonLink || '/contact'} className="btn-pill mt-8 bg-white text-xs uppercase tracking-wider text-black">{section.buttonText}</Link> : null}
        </div>
      </div>
    </section>
  )
}

function CtaSection({ section }: { section: LandingSection }) {
  return (
    <section className="px-2 py-2">
      {/* Thêm class "hidden" vào đầu className */}
      <div className="hidden mx-auto max-w-5xl rounded-[32px] p-10 text-center text-white md:p-16" style={{ backgroundColor: 'var(--primary-color, #111)' }}>
        <MapPin className="mx-auto mb-5 text-white/70" size={30} />
        <h2 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 68px)', lineHeight: 1.05 }}>{section.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/70" style={{ lineHeight: '28px' }}>{section.description}</p>
        {section.buttonText ? <Link to={section.buttonLink || '/contact'} className="btn-pill mt-8 bg-white text-xs uppercase tracking-wider" style={{ color: 'var(--primary-color, #111)' }}>{section.buttonText}</Link> : null}
      </div>
    </section>
  )
}