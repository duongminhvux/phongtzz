import type { LandingPage, LandingSection, MediaItem, Room } from '../types/api'
import { defaultLandingPage } from '../data/defaultLanding'

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

export function mediaUrl(item: MediaItem | string | null | undefined, fallback = ''): string {
  return asMedia(item)?.url || fallback
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

function oldLandingToSections(source: LandingPage): LandingSection[] {
  const landing = { ...defaultLandingPage, ...source } as LandingPage
  const sections: LandingSection[] = []
  const hero = landing.hero || {}
  sections.push({
    id: 'hero-main', type: 'hero', enabled: true, sort_order: 1,
    title: hero.title, subtitle: hero.subtitle,
    primaryButtonText: hero.primaryButtonText, primaryButtonLink: hero.primaryButtonLink,
    secondaryButtonText: hero.secondaryButtonText, secondaryButtonLink: hero.secondaryButtonLink,
    video: asMedia(hero.videoUrl, 'video'), image: asMedia(hero.imageUrl),
  })
  const welcome = landing.welcome || {}
  sections.push({ id: 'welcome-main', type: 'welcome', enabled: true, sort_order: 2, ...welcome, images: normalizeMediaList(welcome.images) })
  const experiences = landing.experiences || {}
  sections.push({ id: 'experiences-main', type: 'experiences', enabled: true, sort_order: 3, ...experiences, items: (experiences.items || []).map((item: any) => ({ ...item, image: asMedia(item.image) })) })
  const roomsPreview = landing.roomsPreview || {}
  sections.push({ id: 'rooms-main', type: 'rooms', enabled: true, sort_order: 4, ...roomsPreview, buttonLink: '/rooms', limit: 3, roomIds: [] })
  const amenities = landing.amenities || {}
  sections.push({ id: 'amenities-main', type: 'amenities', enabled: true, sort_order: 5, ...amenities })
  const testimonials = landing.testimonials || {}
  sections.push({ id: 'testimonials-main', type: 'testimonials', enabled: true, sort_order: 6, ...testimonials })
  const gallery = landing.gallery || {}
  sections.push({ id: 'gallery-main', type: 'gallery', enabled: true, sort_order: 7, ...gallery, images: normalizeMediaList(gallery.images) })
  const cta = landing.cta || {}
  sections.push({ id: 'cta-main', type: 'cta', enabled: true, sort_order: 8, ...cta })
  return sections
}

export function normalizeLandingPage(source?: LandingPage): LandingPage {
  const merged = { ...defaultLandingPage, ...(source || {}) } as LandingPage
  const sections = Array.isArray(merged.sections) && merged.sections.length ? merged.sections : oldLandingToSections(merged)
  return {
    ...merged,
    brand: { ...(defaultLandingPage as any).brand, ...(merged.brand || {}) },
    theme: {
      fontFamily: 'Inter, Arial, sans-serif',
      headingFont: "'Bricolage Grotesque', sans-serif",
      primaryColor: '#111111',
      backgroundColor: '#f7f5f2',
      ...(merged.theme || {}),
    },
    header: {
      ctaText: 'Book Now', ctaLink: '/contact',
      navItems: [
        { label: 'Home', path: '/' },
        { label: 'Rooms', path: '/rooms' },
        { label: 'Booking Request', path: '/contact' },
      ],
      ...(merged.header || {}),
    },
    footer: { showCta: true, bottomText: 'Booking request website', ...(merged.footer || {}) },
    contact: { ...(defaultLandingPage as any).contact, ...(merged.contact || {}) },
    sections: sections
      .map((section, index) => ({ ...section, id: section.id || `${section.type}-${index}`, sort_order: section.sort_order ?? index }))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  }
}

export function normalizeRoom(room: Room): Room {
  return { ...room, images: normalizeMediaList(room.images as any) }
}
