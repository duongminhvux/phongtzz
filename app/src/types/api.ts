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
  images: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type LandingPage = Record<string, any>

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
