import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Bed, Check, ChevronLeft, ChevronRight, Star, Users, X } from 'lucide-react'
import { getRooms } from '../lib/api'
import type { Room } from '../types/api'

const formatPrice = (price?: number | null) => {
  if (!price) return 'Contact us'
  return `${new Intl.NumberFormat('vi-VN').format(price)} VND/night`
}

function RoomDetailModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const [activeImage, setActiveImage] = useState(0)
  const images = room.images?.length ? room.images : ['/images/room-deluxe.jpg']

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const nextImage = () => setActiveImage((prev) => (prev + 1) % images.length)
  const prevImage = () => setActiveImage((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="relative my-8 w-full max-w-4xl overflow-hidden bg-white" style={{ borderRadius: 24 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur">
          <X size={18} />
        </button>

        <div className="relative" style={{ aspectRatio: '16/9' }}>
          <img src={images[activeImage]} alt={room.name} className="h-full w-full object-cover" />
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90">
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        <div className="p-8 lg:p-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {(room.highlights || []).map((highlight) => (
                  <span key={highlight} className="rounded-full bg-[#f2f0ed] px-2.5 py-1 text-[10px] uppercase tracking-wider text-black/60">
                    {highlight}
                  </span>
                ))}
              </div>
              <h2 className="font-serif text-3xl">{room.name}</h2>
            </div>
            <div className="text-right">
              {room.original_price ? <p className="text-sm text-black/30 line-through">{formatPrice(room.original_price)}</p> : null}
              <p className="text-2xl font-semibold">{formatPrice(room.price)}</p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-6 border-y border-black/10 py-4 text-sm text-black/60">
            <span className="flex items-center gap-1.5"><Users size={15} /> {room.capacity || 1} guests</span>
            <span className="flex items-center gap-1.5"><Bed size={15} /> {room.bed_type || `${room.beds || 1} bed`}</span>
            {room.size ? <span>{room.size}</span> : null}
            <span className="flex items-center gap-1"><Star size={14} fill="#f59e0b" color="#f59e0b" /> Booking request only</span>
          </div>

          <p className="mb-8 font-sans text-black/70" style={{ lineHeight: '27px' }}>{room.description}</p>

          <h3 className="mb-4 font-serif text-xl">Amenities</h3>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(room.amenities || []).map((amenity) => (
              <div key={amenity} className="flex items-center gap-2 py-2 text-xs">
                <Check size={14} className="text-black/40" /> {amenity}
              </div>
            ))}
          </div>

          <Link to={`/contact?roomId=${room.id}`} className="btn-pill flex w-full items-center justify-center bg-[#111] py-4 text-sm font-medium uppercase tracking-wider text-white">
            Send Booking Request
          </Link>
          <p className="mt-3 text-center text-xs text-black/45">Homestay sẽ liên hệ lại để xác nhận tình trạng phòng.</p>
        </div>
      </div>
    </div>
  )
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    window.scrollTo(0, 0)
    getRooms().then(setRooms)
  }, [])

  const filteredRooms = filter === 'all' ? rooms : rooms.filter((room) => room.type === filter)

  return (
    <main style={{ backgroundColor: '#f7f5f2' }}>
      <section className="relative px-6 pb-20 pt-40 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="font-sans text-xs uppercase tracking-widest text-black/40">Booking Request</span>
          <h1 className="mt-4 font-serif" style={{ fontSize: 'clamp(42px, 7vw, 86px)', lineHeight: 1.05 }}>Rooms</h1>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-black/60" style={{ lineHeight: '28px' }}>
            Find your perfect mountain retreat. Send a request and we will contact you to confirm room availability.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-center gap-3">
            {[
              { value: 'all', label: 'All Rooms' },
              { value: 'private', label: 'Private' },
              { value: 'dorm', label: 'Dorms' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className="rounded-full px-5 py-2.5 font-sans text-xs uppercase tracking-wider transition-all"
                style={{ backgroundColor: filter === item.value ? '#111' : '#fff', color: filter === item.value ? '#fff' : 'rgba(17,17,17,.65)' }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {filteredRooms.map((room) => (
              <button key={room.id} onClick={() => setSelectedRoom(room)} className="group text-left">
                <div className="relative mb-5 overflow-hidden" style={{ borderRadius: 22, aspectRatio: '16/10' }}>
                  <img src={room.images?.[0] || '/images/room-deluxe.jpg'} alt={room.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium backdrop-blur">{formatPrice(room.price)}</span>
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {(room.highlights || []).slice(0, 3).map((highlight) => (
                    <span key={highlight} className="rounded-full bg-[#f2f0ed] px-2 py-0.5 text-[10px] uppercase tracking-wider text-black/50">{highlight}</span>
                  ))}
                </div>
                <h3 className="font-serif text-2xl">{room.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-black/50">
                  <span className="flex items-center gap-1"><Users size={13} /> {room.capacity || 1} guests</span>
                  <span className="flex items-center gap-1"><Bed size={13} /> {room.bed_type || `${room.beds || 1} bed`}</span>
                  {room.size ? <span>{room.size}</span> : null}
                </div>
                <p className="mt-3 text-sm text-black/55" style={{ lineHeight: '24px' }}>{room.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedRoom ? <RoomDetailModal room={selectedRoom} onClose={() => setSelectedRoom(null)} /> : null}
    </main>
  )
}
