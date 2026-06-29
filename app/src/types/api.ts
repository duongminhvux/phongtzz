export type MediaItem = {
  url: string
  type?: 'image' | 'video'
  public_id?: string | null
  width?: number | null
  height?: number | null
  format?: string | null
  alt?: string | null
  sort_order?: number
}

export type Room = {
  id: string
  name: string
  slug: string
  type: string
  price?: number | null
  original_price?: number | null
  capacity?: number | null
  beds?: number | null
  bed_type?: string | null
  size?: string | null
  description?: string | null
  amenities: string[]
  highlights: string[]
  images: MediaItem[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type LandingSection = Record<string, any> & {
  id: string
  type: 'hero' | 'welcome' | 'experiences' | 'rooms' | 'amenities' | 'testimonials' | 'gallery' | 'banner' | 'cta'
  enabled?: boolean
  sort_order?: number
}

export type LandingPage = Record<string, any> & {
  brand?: Record<string, any>
  theme?: Record<string, any>
  header?: Record<string, any>
  footer?: Record<string, any>
  contact?: Record<string, any>
  sections?: LandingSection[]
}

export type BookingRequestPayload = {
  full_name: string
  phone: string
  email?: string
  check_in: string
  check_out: string
  guests: number
  room_id?: string
  message?: string
  source?: string
  page_url?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}
