export type LandingMediaDisplay = {
  aspectRatio?: '3:2' | '1:1' | '4:5' | '16:9'
  widthPercent?: number
  align?: 'left' | 'center' | 'right'
  cropX?: number
  cropY?: number
}

export type MediaItem = {
  asset_id?: string | null
  url: string
  type?: 'image' | 'video'
  storage_path?: string | null
  width?: number | null
  height?: number | null
  format?: string | null
  original_filename?: string | null
  source?: string | null
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

export type TourItineraryDay = {
  id: string
  day_number: number
  title: string
  description?: string | null
  stops: string[]
}

export type TourMediaItem = MediaItem & {
  role: 'hero' | 'gallery' | 'itinerary'
}

export type TourOption = {
  value: string
  label: string
  description?: string
  price_modifier?: number
  currency?: string
  recommended?: boolean
}

export type TourFaq = { question: string; answer: string }

export type Tour = {
  id: string
  slug: string
  name: string
  tagline?: string | null
  short_description?: string | null
  description?: string | null
  duration_days: number
  duration_nights: number
  price: number
  currency: string
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  riding_options: TourOption[]
  bus_options: TourOption[]
  faq: TourFaq[]
  itinerary: TourItineraryDay[]
  media: TourMediaItem[]
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type TourAddon = {
  id: string
  code: string
  name: string
  description?: string | null
  price: number
  currency: string
  unit_label?: string | null
  is_active: boolean
  sort_order: number
}

export type TourPage = Record<string, any> & {
  eyebrow?: string
  heroTitle?: string
  heroSlogan?: string
  heroDescription?: string
  heroImage?: MediaItem | null
  packagesTitle?: string
  packagesDescription?: string
  includedTitle?: string
  includedItems?: string[]
  whyTitle?: string
  whyItems?: Array<{ title: string; description?: string }>
  galleryTitle?: string
  gallery?: MediaItem[]
  reviewsTitle?: string
  reviews?: Array<{ name: string; country?: string; rating?: number; text: string }>
  faqTitle?: string
  faq?: TourFaq[]
  bookingTitle?: string
  bookingDescription?: string
  bookingButtonText?: string
}

export type LandingSection = Record<string, any> & {
  id: string
  type: 'hero' | 'welcome' | 'experiences' | 'rooms' | 'amenities' | 'testimonials' | 'gallery' | 'banner' | 'cta'
  enabled?: boolean
  sort_order?: number
}

export type LandingPage = Record<string, any> & {
  brand?: Record<string, any>
  seo?: Record<string, any>
  theme?: Record<string, any>
  header?: Record<string, any>
  footer?: Record<string, any>
  contact?: Record<string, any>
  roomsPage?: Record<string, any>
  sections?: LandingSection[]
}

export type PublicSite = {
  landing: LandingPage
  rooms: Room[]
  tours_page: TourPage
  tours: Tour[]
  tour_addons: TourAddon[]
  updated_at?: string | null
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
  tour_id?: string
  tour_start_date?: string
  riding_option?: string
  bus_transfer?: string
  addon_ids?: string[]
  dietary_requirements?: string
  source?: string
  page_url?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}
