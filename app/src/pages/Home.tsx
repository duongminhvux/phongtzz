import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Bed, Check, MapPin, Star, Users } from 'lucide-react'
import { getLandingPage, getRooms } from '../lib/api'
import { defaultLandingPage } from '../data/defaultLanding'
import type { LandingPage, Room } from '../types/api'

const formatPrice = (price?: number | null) => {
  if (!price) return 'Contact us'
  return `${new Intl.NumberFormat('vi-VN').format(price)} VND/night`
}

export default function Home() {
  const [landing, setLanding] = useState<LandingPage>(defaultLandingPage)
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
    getLandingPage().then(setLanding)
    getRooms().then(setRooms)
  }, [])

  const hero = landing.hero || defaultLandingPage.hero
  const welcome = landing.welcome || defaultLandingPage.welcome
  const experiences = landing.experiences || defaultLandingPage.experiences
  const roomsPreview = landing.roomsPreview || defaultLandingPage.roomsPreview
  const amenities = landing.amenities || defaultLandingPage.amenities
  const testimonials = landing.testimonials || defaultLandingPage.testimonials
  const gallery = landing.gallery || defaultLandingPage.gallery
  const cta = landing.cta || defaultLandingPage.cta

  return (
    <main style={{ backgroundColor: '#f7f5f2' }}>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
        {hero.videoUrl ? (
          <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
            <source src={hero.videoUrl} type="video/mp4" />
          </video>
        ) : hero.imageUrl ? (
          <img src={hero.imageUrl} alt={hero.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 max-w-4xl text-center text-white">
          <h1 className="font-serif font-medium" style={{ fontSize: 'clamp(46px, 8vw, 100px)', lineHeight: 1.04 }}>
            {hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-white/85" style={{ fontSize: 17, lineHeight: '29px' }}>
            {hero.subtitle}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link to={hero.primaryButtonLink || '/rooms'} className="btn-pill text-xs uppercase tracking-widest text-white bg-white/20 backdrop-blur-md border border-white/30">
              {hero.primaryButtonText || 'Explore Rooms'}
            </Link>
            <Link to={hero.secondaryButtonLink || '/contact'} className="btn-pill text-xs uppercase tracking-widest bg-white text-black">
              {hero.secondaryButtonText || 'Book Request'}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          <div className="grid grid-cols-2 gap-4">
            {(welcome.images || []).slice(0, 2).map((image: string, index: number) => (
              <div key={image} className={`overflow-hidden ${index === 1 ? 'mt-12' : ''}`} style={{ borderRadius: 24, aspectRatio: '4/5' }}>
                <img src={image} alt={welcome.title} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <div>
            <span className="font-sans text-xs uppercase tracking-widest text-black/40">{welcome.eyebrow}</span>
            <h2 className="font-serif mt-4" style={{ fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08 }}>
              {welcome.title}
            </h2>
            <div className="mt-7 space-y-4">
              {(welcome.paragraphs || []).map((paragraph: string) => (
                <p key={paragraph} className="font-sans text-black/65" style={{ fontSize: 16, lineHeight: '28px' }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <h2 className="font-serif" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{experiences.title}</h2>
            <p className="mt-4 font-sans text-black/60" style={{ lineHeight: '27px' }}>{experiences.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(experiences.items || []).map((item: any) => (
              <article key={item.title} className="group">
                <div className="overflow-hidden mb-5" style={{ borderRadius: 22, aspectRatio: '4/3' }}>
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 font-sans text-sm text-black/60" style={{ lineHeight: '24px' }}>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <h2 className="font-serif" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{roomsPreview.title}</h2>
              <p className="mt-4 max-w-xl font-sans text-black/60" style={{ lineHeight: '27px' }}>{roomsPreview.description}</p>
            </div>
            <Link to="/rooms" className="inline-flex items-center gap-2 font-sans text-sm font-medium group">
              {roomsPreview.buttonText || 'View all rooms'}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rooms.slice(0, 3).map((room) => (
              <Link key={room.id} to="/rooms" className="group block">
                <div className="relative overflow-hidden mb-5" style={{ borderRadius: 22, aspectRatio: '4/3' }}>
                  <img src={room.images?.[0] || '/images/room-deluxe.jpg'} alt={room.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium backdrop-blur">
                    {formatPrice(room.price)}
                  </span>
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
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-center mb-14" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{amenities.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(amenities.items || []).map((item: any) => (
              <div key={item.title} className="rounded-3xl bg-white p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f0ed]"><Check size={17} /></div>
                <h3 className="font-serif text-xl">{item.title}</h3>
                <p className="mt-3 font-sans text-sm text-black/60" style={{ lineHeight: '24px' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-center mb-14" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{testimonials.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(testimonials.items || []).map((item: any) => (
              <div key={`${item.name}-${item.country}`} className="rounded-3xl bg-[#f7f5f2] p-8">
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: item.rating || 5 }).map((_, idx) => <Star key={idx} size={15} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="font-sans text-black/70" style={{ lineHeight: '27px' }}>&ldquo;{item.text}&rdquo;</p>
                <p className="mt-6 font-serif text-lg">{item.name}</p>
                <p className="font-sans text-xs uppercase tracking-wider text-black/40">{item.country}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif mb-10" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{gallery.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(gallery.images || []).slice(0, 5).map((image: string, index: number) => (
              <div key={image} className={`overflow-hidden ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`} style={{ borderRadius: 20, aspectRatio: index === 0 ? '1/1' : '4/5' }}>
                <img src={image} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 bg-white">
        <div className="max-w-5xl mx-auto rounded-[32px] bg-[#111] px-8 py-16 text-center text-white">
          <MapPin className="mx-auto mb-5" />
          <h2 className="font-serif" style={{ fontSize: 'clamp(30px, 4vw, 54px)', lineHeight: 1.08 }}>{cta.title}</h2>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-white/70" style={{ lineHeight: '27px' }}>{cta.description}</p>
          <Link to={cta.buttonLink || '/contact'} className="btn-pill mt-8 inline-flex bg-white text-black text-xs uppercase tracking-widest">
            {cta.buttonText || 'Send Booking Request'}
          </Link>
        </div>
      </section>
    </main>
  )
}
