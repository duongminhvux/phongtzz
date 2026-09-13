import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Bed, Check, MapPin, Star, Users } from 'lucide-react'
import { getLandingPage, getRooms } from '../lib/api'
import { defaultLandingPage } from '../data/defaultLanding'
import { asMedia, mediaUrl, normalizeLandingPage, normalizeMediaList } from '../lib/media'
import type { LandingPage, LandingSection, Room } from '../types/api'

const formatPrice = (price?: number | null) => {
  if (!price) return 'Contact us'
  return `${new Intl.NumberFormat('vi-VN').format(price)} VND/night`
}

export default function Home() {
  const [landing, setLanding] = useState<LandingPage>(() => normalizeLandingPage(defaultLandingPage))
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
    getLandingPage().then(setLanding)
    getRooms().then(setRooms)
  }, [])

  const sections = useMemo(() => (landing.sections || []).filter((section) => section.enabled !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), [landing])
  const theme = (landing.theme || {}) as Record<string, any>

  return (
    <main style={{ backgroundColor: theme.backgroundColor || '#f7f5f2', fontFamily: theme.fontFamily || undefined, '--body-font': theme.fontFamily, '--heading-font': theme.headingFont } as CSSProperties}>
      {sections.map((section) => <LandingSectionRenderer key={section.id} section={section} rooms={rooms} />)}
    </main>
  )
}

function LandingSectionRenderer({ section, rooms }: { section: LandingSection; rooms: Room[] }) {
  switch (section.type) {
    case 'hero': return <HeroSection section={section} />
    case 'welcome': return <WelcomeSection section={section} />
    case 'experiences': return <ExperiencesSection section={section} />
    case 'rooms': return <RoomsPreviewSection section={section} rooms={rooms} />
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
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {video?.url ? (
        <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
          <source src={video.url} type="video/mp4" />
        </video>
      ) : image?.url ? (
        <img src={image.url} alt={section.title} className="absolute inset-0 h-full w-full object-cover" />
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
  return (
    <section className="py-24 lg:py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
        <div className="grid grid-cols-2 gap-4">
          {images.slice(0, 2).map((image, index) => (
            <div key={`${image.url}-${index}`} className={`overflow-hidden ${index === 1 ? 'mt-12' : ''}`} style={{ borderRadius: 24, aspectRatio: '4/5' }}>
              <img src={image.url} alt={image.alt || section.title} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <div>
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
    <section className="py-24 px-6 bg-white">
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
                {image?.url ? <div className="overflow-hidden mb-5" style={{ borderRadius: 22, aspectRatio: '4/3' }}><img src={image.url} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div> : null}
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

function RoomsPreviewSection({ section, rooms }: { section: LandingSection; rooms: Room[] }) {
  const selectedIds = Array.isArray(section.roomIds) ? section.roomIds : []
  const visibleRooms = (selectedIds.length ? rooms.filter((room) => selectedIds.includes(room.id)) : rooms).slice(0, Number(section.limit || 3))
  return (
    <section className="py-24 lg:py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <h2 className="font-serif" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
            <p className="mt-4 max-w-xl font-sans text-black/60" style={{ lineHeight: '27px' }}>{section.description}</p>
          </div>
          <Link to={section.buttonLink || '/rooms'} className="inline-flex items-center gap-2 font-sans text-sm font-medium group">
            {section.buttonText || 'View all rooms'}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {visibleRooms.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {visibleRooms.map((room) => (
              <Link key={room.id} to={`/contact?roomId=${room.id}`} className="group block">
                <div className="relative overflow-hidden mb-5" style={{ borderRadius: 22, aspectRatio: '4/3' }}>
                  <img src={mediaUrl(room.images?.[0], '/images/room-deluxe.jpg')} alt={room.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium backdrop-blur">{formatPrice(room.price)}</span>
                </div>
                <h3 className="font-serif text-2xl">{room.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-black/50">
                  <span className="flex items-center gap-1"><Users size={14} /> {room.capacity || 1} guests</span>
                  <span className="flex items-center gap-1"><Bed size={14} /> {room.bed_type || `${room.beds || 1} bed`}</span>
                </div>
                <p className="mt-3 font-sans text-sm text-black/60" style={{ lineHeight: '24px' }}>{room.description}</p>
              </Link>
            ))}
          </div>
        ) : <p className="rounded-3xl bg-[#f7f5f2] p-8 text-center text-sm text-black/55">Hiện admin chưa bật phòng nào để hiển thị trên landing page.</p>}
      </div>
    </section>
  )
}

function AmenitiesSection({ section }: { section: LandingSection }) {
  return (
    <section className="py-24 px-6">
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
    <section className="py-24 px-6 bg-white">
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
  const images = normalizeMediaList(section.images)
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif mb-10" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {images.slice(0, 8).map((image, index) => (
            <div key={`${image.url}-${index}`} className={`overflow-hidden ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`} style={{ borderRadius: 20, aspectRatio: index === 0 ? '1/1' : '4/5' }}>
              <img src={image.url} alt={image.alt || section.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BannerSection({ section }: { section: LandingSection }) {
  const image = asMedia(section.image)
  return (
    <section className="px-6 py-20">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-black px-8 py-20 text-white md:px-16">
        {image?.url ? <img src={image.url} alt={section.title} className="absolute inset-0 h-full w-full object-cover opacity-45" /> : null}
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
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl rounded-[32px] p-10 text-center text-white md:p-16" style={{ backgroundColor: 'var(--primary-color, #111)' }}>
        <MapPin className="mx-auto mb-5 text-white/70" size={30} />
        <h2 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 68px)', lineHeight: 1.05 }}>{section.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/70" style={{ lineHeight: '28px' }}>{section.description}</p>
        {section.buttonText ? <Link to={section.buttonLink || '/contact'} className="btn-pill mt-8 bg-white text-xs uppercase tracking-wider" style={{ color: 'var(--primary-color, #111)' }}>{section.buttonText}</Link> : null}
      </div>
    </section>
  )
}
