import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Bed, Check, ChevronLeft, ChevronRight, MapPin, Star, Users } from 'lucide-react'
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
  const items = section.items || []
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)

    const children = Array.from(el.children) as HTMLElement[]
    if (children.length > 0) {
      let closestIdx = 0
      let minDistance = Infinity
      const containerCenter = scrollLeft + clientWidth / 2
      children.forEach((child, idx) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2
        const distance = Math.abs(containerCenter - childCenter)
        if (distance < minDistance) {
          minDistance = distance
          closestIdx = idx
        }
      })
      setActiveIndex(closestIdx)
    }
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll, items.length])

  if (!items.length) return null

  const handlePrev = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const cardWidth = (el.children[0] as HTMLElement)?.offsetWidth || el.clientWidth * 0.8
    el.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' })
  }

  const handleNext = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const cardWidth = (el.children[0] as HTMLElement)?.offsetWidth || el.clientWidth * 0.8
    el.scrollBy({ left: cardWidth + 24, behavior: 'smooth' })
  }

  const scrollToIndex = (idx: number) => {
    const el = scrollContainerRef.current
    if (!el) return
    const target = el.children[idx] as HTMLElement
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
  }

  return (
    <section className="py-12 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <h2 className="font-serif" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{section.title}</h2>
            {section.description ? (
              <p className="mt-4 max-w-xl font-sans text-black/60" style={{ lineHeight: '27px' }}>{section.description}</p>
            ) : null}
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canScrollLeft}
                aria-label="Previous review"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-sm transition-all hover:bg-black hover:text-white disabled:opacity-25 disabled:pointer-events-none"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canScrollRight}
                aria-label="Next review"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-sm transition-all hover:bg-black hover:text-white disabled:opacity-25 disabled:pointer-events-none"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal scroll track */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item: any, index: number) => {
            const rating = Math.min(5, Math.max(1, Number(item.rating || 5)))
            return (
              <div
                key={`${item.name}-${index}`}
                className="snap-start shrink-0 flex flex-col justify-between rounded-3xl bg-[#f7f5f2] p-7 md:p-8 transition-shadow duration-300 hover:shadow-md w-[85vw] sm:w-[380px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <div>
                  <div className="mb-4 flex items-center gap-1">
                    {Array.from({ length: rating }).map((_, idx) => (
                      <Star key={idx} size={15} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <p className="font-sans text-black/75 text-sm sm:text-base" style={{ lineHeight: '27px' }}>
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-black/5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10 font-serif font-medium text-black">
                    {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-serif text-lg font-medium leading-tight">{item.name}</p>
                    {item.country && (
                      <p className="font-sans text-xs uppercase tracking-wider text-black/40 mt-0.5">{item.country}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dots indicator */}
        {items.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {items.map((_: any, idx: number) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => scrollToIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? 'w-7 bg-black'
                    : 'w-2 bg-black/20 hover:bg-black/40'
                }`}
              />
            ))}
          </div>
        )}
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