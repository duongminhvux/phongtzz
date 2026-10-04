import type { LandingPage, LandingSection, MediaItem, PublicSite, Room, Tour, TourMediaItem, TourPage } from '../types/api'

export function asMedia(item: MediaItem | string | null | undefined, fallbackType: 'image' | 'video' = 'image'): MediaItem | null {
  if (!item) return null
  if (typeof item === 'string') {
    const clean = item.split('?')[0].toLowerCase()
    const type = clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') ? 'video' : fallbackType
    return { url: item, type, sort_order: 0 }
  }
  if (!item.url) return null
  return { ...item, type: item.type || fallbackType }
}

export function mediaUrl(item: MediaItem | string | null | undefined): string {
  return asMedia(item)?.url || ''
}

export function mediaAspect(item: MediaItem | string | null | undefined, landscape = '3/2'): string {
  const media = asMedia(item)
  if (media?.width && media?.height && media.height > media.width) return '2/3'
  return landscape
}

export function normalizeMediaList(value: Array<MediaItem | string> | undefined): MediaItem[] {
  return (value || [])
    .map((item, index) => {
      const media = asMedia(item)
      return media ? { ...media, sort_order: media.sort_order ?? index } : null
    })
    .filter(Boolean)
    .sort((a, b) => (a!.sort_order || 0) - (b!.sort_order || 0)) as MediaItem[]
}

export function normalizeLandingPage(source: LandingPage): LandingPage {
  const sections = (Array.isArray(source.sections) ? source.sections : [])
    .map((raw, index) => {
      const section = { ...raw, sort_order: raw.sort_order ?? index } as LandingSection
      if (section.type === 'hero' || section.type === 'banner') section.image = asMedia(section.image)
      if (section.type === 'hero') section.video = asMedia(section.video, 'video')
      if (section.type === 'welcome' || section.type === 'gallery') section.images = normalizeMediaList(section.images)
      if (section.type === 'experiences') section.items = (section.items || []).map((item: any) => ({ ...item, image: asMedia(item.image) }))
      return section
    })
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  return { ...source, brand: { ...(source.brand || {}), logo: asMedia(source.brand?.logo), favicon: asMedia(source.brand?.favicon) }, seo: { ...(source.seo || {}), ogImage: asMedia(source.seo?.ogImage) }, sections }
}

export function normalizeRoom(room: Room): Room {
  return { ...room, images: normalizeMediaList(room.images as any) }
}

export function normalizeTour(tour: Tour): Tour {
  const media = (tour.media || [])
    .map((item, index) => ({ ...item, type: item.type || 'image', role: item.role || 'gallery', sort_order: item.sort_order ?? index }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) as TourMediaItem[]
  return { ...tour, media, itinerary: [...(tour.itinerary || [])].sort((a, b) => a.day_number - b.day_number) }
}

export function normalizeTourPage(page: TourPage): TourPage {
  return {
    ...(page || {}),
    heroImage: asMedia(page?.heroImage),
    gallery: normalizeMediaList(page?.gallery),
  }
}

export function normalizeSite(site: PublicSite): PublicSite {
  return {
    ...site,
    landing: normalizeLandingPage(site.landing || {}),
    rooms: (site.rooms || []).map(normalizeRoom),
    tours_page: normalizeTourPage(site.tours_page || {}),
    tours: (site.tours || []).map(normalizeTour),
    tour_addons: [...(site.tour_addons || [])].sort((a, b) => a.sort_order - b.sort_order),
  }
}
