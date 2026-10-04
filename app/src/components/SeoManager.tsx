import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { mediaUrl } from '../lib/media'
import type { PublicSite } from '../types/api'

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value))
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
  if (rel === 'icon') el.removeAttribute('type')
}

export default function SeoManager({ site }: { site: PublicSite }) {
  const location = useLocation()

  useEffect(() => {
    const brand = site.landing.brand || {}
    const seo = site.landing.seo || {}
    const base = String(seo.canonicalBaseUrl || window.location.origin).replace(/\/$/, '')
    const path = location.pathname
    const tourSlug = path.startsWith('/tours/') ? decodeURIComponent(path.split('/')[2] || '') : ''
    const tour = tourSlug ? site.tours.find((item) => item.slug === tourSlug) : undefined
    const siteName = brand.siteTitle || brand.name || 'Riverside Haven'

    let title = seo.homeTitle || `${siteName} Homestay | Ha Giang`
    let description = seo.homeDescription || 'Stay at Riverside Haven in Ha Giang and explore comfortable rooms, local experiences and Ha Giang Loop tours.'
    let image = mediaUrl(seo.ogImage || brand.logo)

    if (path === '/rooms') {
      title = seo.roomsTitle || `Rooms | ${siteName}`
      description = seo.roomsDescription || site.landing.roomsPage?.description || description
    } else if (path === '/tours') {
      title = seo.toursTitle || `Ha Giang Loop Tours | ${siteName}`
      description = seo.toursDescription || site.tours_page?.heroDescription || description
      image = mediaUrl(site.tours_page?.heroImage) || image
    } else if (tour) {
      title = `${tour.name} | ${siteName}`
      description = tour.short_description || tour.description || description
      image = mediaUrl(tour.media.find((item) => item.role === 'hero') || tour.media[0]) || image
    } else if (path === '/contact') {
      title = seo.bookingTitle || `Booking Request | ${siteName}`
      description = seo.bookingDescription || site.landing.contact?.description || description
    }

    const canonical = `${base}${path === '/' ? '/' : path}`
    document.title = title
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: brand.name || siteName })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    const absoluteImage = image ? (image.startsWith('http') ? image : `${base}${image.startsWith('/') ? '' : '/'}${image}`) : ''
    if (absoluteImage) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: absoluteImage })
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: absoluteImage })
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove()
      document.head.querySelector('meta[name="twitter:image"]')?.remove()
    }
    upsertLink('canonical', canonical)

    const favicon = mediaUrl(brand.favicon)
    if (favicon) upsertLink('icon', favicon)

    const schemaId = 'riverside-seo-schema'
    document.getElementById(schemaId)?.remove()
    const schema = document.createElement('script')
    schema.id = schemaId
    schema.type = 'application/ld+json'
    const lodging = {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      name: brand.name || siteName,
      url: base,
      email: brand.email || undefined,
      telephone: brand.phone || undefined,
      address: brand.address ? { '@type': 'PostalAddress', streetAddress: brand.address } : undefined,
      image: absoluteImage || undefined,
    }
    const graph: any[] = [lodging]
    if (tour) {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: tour.name,
        description: tour.short_description || tour.description || undefined,
        touristType: 'Adventure travelers',
        provider: { '@type': 'LodgingBusiness', name: brand.name || siteName, url: base },
        offers: { '@type': 'Offer', price: tour.price, priceCurrency: tour.currency, url: canonical },
      })
    }
    schema.textContent = JSON.stringify(graph.length === 1 ? graph[0] : { '@context': 'https://schema.org', '@graph': graph })
    document.head.appendChild(schema)
  }, [location.pathname, site])

  return null
}
